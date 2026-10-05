import { useSyncExternalStore } from 'react'
import { currentUser, onAuthChange, supabase } from './supabase'
import { store } from './store'
import type { Attempt, Letter, Mode, StateEntry, StateKind } from './types'

export type SyncStatus = 'local' | 'offline' | 'syncing' | 'ok' | 'error'

let status: SyncStatus = 'local'
let lastError = ''
let lastSyncAt: string | undefined
const listeners = new Set<() => void>()
let snap: { status: SyncStatus; lastError: string; lastSyncAt?: string } = { status, lastError, lastSyncAt }
function set(s: SyncStatus, err = '') {
  status = s
  lastError = err
  if (s === 'ok') lastSyncAt = new Date().toISOString()
  snap = { status, lastError, lastSyncAt }
  listeners.forEach((l) => l())
}

export function useSyncStatus() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => snap
  )
}

interface AttemptRow {
  id: string
  question_id: string
  selected: string
  correct: boolean
  guessed: boolean
  mode: string
  time_ms: number | null
  created_at: string
  inserted_at: string
}
interface StateRow {
  kind: string
  key: string
  value: unknown
  updated_at: string
}

const PAGE = 1000
let running: Promise<void> | null = null
let timer: ReturnType<typeof setTimeout> | undefined

export function scheduleSync(delay = 1500) {
  clearTimeout(timer)
  timer = setTimeout(() => void syncNow(), delay)
}

export function syncNow(): Promise<void> {
  if (running) return running
  running = doSync().finally(() => {
    running = null
  })
  return running
}

async function doSync() {
  const user = currentUser()
  if (!supabase || !user) return set('local')
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return set('offline')
  set('syncing')
  try {
    store.resetForOwner(user.id)
    const d = store.get()

    // 1) envia tentativas pendentes
    const pending = d.attempts.filter((a) => !a.synced)
    const sentIds: string[] = []
    for (let i = 0; i < pending.length; i += 500) {
      const batch = pending.slice(i, i + 500)
      const { error } = await supabase.from('attempts').upsert(
        batch.map((a) => ({
          id: a.id, user_id: user.id, question_id: a.qid, selected: a.selected, correct: a.correct,
          guessed: a.guessed, mode: a.mode, time_ms: a.timeMs ?? null, created_at: a.at
        })),
        { onConflict: 'id', ignoreDuplicates: true }
      )
      if (error) throw error
      sentIds.push(...batch.map((a) => a.id))
    }

    // 2) envia estado alterado (favoritos, anotações, plano, ajustes...)
    const dirty = Object.entries(d.state).filter(([, e]) => e.dirty)
    if (dirty.length) {
      const { error } = await supabase.from('user_state').upsert(
        dirty.map(([, e]) => ({ user_id: user.id, kind: e.kind, key: e.key, value: e.value ?? null, updated_at: e.updatedAt })),
        { onConflict: 'user_id,kind,key' }
      )
      if (error) throw error
    }
    store.markSynced(sentIds, dirty.map(([k, e]) => ({ k, updatedAt: e.updatedAt })))

    // 3) recebe tentativas novas de outros aparelhos
    const remote: Attempt[] = []
    let lastPull = store.get().lastPull
    for (let from = 0; ; from += PAGE) {
      let q = supabase
        .from('attempts')
        .select('id,question_id,selected,correct,guessed,mode,time_ms,created_at,inserted_at')
        .order('inserted_at', { ascending: true })
        .range(from, from + PAGE - 1)
      if (store.get().lastPull) q = q.gt('inserted_at', store.get().lastPull!)
      const { data, error } = await q
      if (error) throw error
      const rows = (data ?? []) as AttemptRow[]
      for (const r of rows) {
        remote.push({
          id: r.id, qid: r.question_id, selected: r.selected as Letter, correct: r.correct, guessed: r.guessed,
          mode: r.mode as Mode, timeMs: r.time_ms ?? undefined, at: r.created_at, synced: true
        })
        if (!lastPull || r.inserted_at > lastPull) lastPull = r.inserted_at
      }
      if (rows.length < PAGE) break
    }

    // 4) recebe o estado (pequeno: lê tudo)
    const { data: st, error: e2 } = await supabase.from('user_state').select('kind,key,value,updated_at')
    if (e2) throw e2
    const remoteState: StateEntry[] = ((st ?? []) as StateRow[]).map((r) => ({
      kind: r.kind as StateKind, key: r.key, value: r.value, updatedAt: r.updated_at
    }))

    store.mergeRemote(remote, remoteState, lastPull, user.id)
    set('ok')
  } catch (e) {
    const msg = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : String(e)
    set(navigator.onLine === false ? 'offline' : 'error', msg)
  }
}

/** Apaga as respostas no servidor (o estado local é limpo por quem chama) */
export async function deleteRemoteAttempts() {
  const user = currentUser()
  if (!supabase || !user) return
  const { error } = await supabase.from('attempts').delete().eq('user_id', user.id)
  if (error) throw error
}

export function startSyncLoop() {
  store.setOnChange(() => scheduleSync())
  onAuthChange(() => scheduleSync(100))
  window.addEventListener('online', () => scheduleSync(100))
  window.addEventListener('offline', () => set(currentUser() ? 'offline' : 'local'))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleSync(300)
  })
  setInterval(() => {
    if (document.visibilityState === 'visible') scheduleSync(0)
  }, 120_000)
  scheduleSync(500)
}
