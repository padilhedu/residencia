import { useSyncExternalStore } from 'react'
import type { Attempt, Letter, Session, Settings, StateEntry, StateKind } from './types'

// Estado local (offline-first). Tudo fica no aparelho e é enviado ao Supabase quando há login + internet.

const LS_KEY = 'residencia-odonto:v1'
const SESSION_KEY = 'residencia-odonto:session'

export interface Data {
  attempts: Attempt[]
  state: Record<string, StateEntry>
  /** Maior inserted_at já recebido do servidor */
  lastPull?: string
  /** Dono dos dados sincronizados neste aparelho */
  owner?: string
}

export const DEFAULT_SETTINGS: Settings = {
  fdtDate: '2026-11-22',
  enareDate: '2027-09-12',
  dailyGoal: 20,
  theme: 'auto'
}
export const PLAN_START = '2026-10-05'

const sk = (kind: StateKind, key: string) => `${kind}:${key}`

function load(): Data {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const d = JSON.parse(raw) as Data
      if (Array.isArray(d.attempts) && d.state) return d
    }
  } catch {
    /* armazenamento indisponível: começa vazio */
  }
  return { attempts: [], state: {} }
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

let data: Data = load()
let session: Session | null = loadSession()
const listeners = new Set<() => void>()
let saveTimer: ReturnType<typeof setTimeout> | undefined
let onChange: (() => void) | undefined

function persist() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data))
    } catch {
      /* cota cheia ou modo privado */
    }
  }, 250)
}

function emit(local = true) {
  persist()
  listeners.forEach((l) => l())
  if (local) onChange?.()
}

export const store = {
  get: () => data,
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  /** Chamado após qualquer alteração local (usado para agendar a sincronização) */
  setOnChange(fn: () => void) {
    onChange = fn
  },

  addAttempts(list: Attempt[]) {
    if (!list.length) return
    data = { ...data, attempts: [...data.attempts, ...list] }
    emit()
  },

  setState(kind: StateKind, key: string, value: unknown) {
    const entry: StateEntry = { kind, key, value, updatedAt: new Date().toISOString(), dirty: true }
    data = { ...data, state: { ...data.state, [sk(kind, key)]: entry } }
    emit()
  },

  getState<T>(kind: StateKind, key: string): T | undefined {
    const v = data.state[sk(kind, key)]?.value
    return v === null ? undefined : (v as T | undefined)
  },

  markSynced(attemptIds: string[], stateKeys: { k: string; updatedAt: string }[]) {
    const ids = new Set(attemptIds)
    const attempts = ids.size ? data.attempts.map((a) => (ids.has(a.id) ? { ...a, synced: true } : a)) : data.attempts
    const state = { ...data.state }
    for (const { k, updatedAt } of stateKeys) {
      const e = state[k]
      if (e && e.updatedAt === updatedAt) state[k] = { ...e, dirty: false }
    }
    data = { ...data, attempts, state }
    emit(false)
  },

  mergeRemote(remoteAttempts: Attempt[], remoteState: StateEntry[], lastPull: string | undefined, owner: string) {
    const have = new Set(data.attempts.map((a) => a.id))
    const add = remoteAttempts.filter((a) => !have.has(a.id))
    const state = { ...data.state }
    for (const r of remoteState) {
      const k = sk(r.kind, r.key)
      const l = state[k]
      if (!l || (!l.dirty && l.updatedAt !== r.updatedAt) || r.updatedAt > l.updatedAt) state[k] = { ...r, dirty: false }
    }
    data = { ...data, attempts: add.length ? [...data.attempts, ...add] : data.attempts, state, lastPull: lastPull ?? data.lastPull, owner }
    emit(false)
  },

  /** Ao entrar com outra conta, o que veio da conta anterior não deve se misturar */
  resetForOwner(owner: string) {
    if (data.owner && data.owner !== owner) {
      data = { attempts: data.attempts.filter((a) => !a.synced), state: Object.fromEntries(Object.entries(data.state).filter(([, e]) => e.dirty)), owner }
      emit(false)
    }
  },

  clearAttempts() {
    data = { ...data, attempts: [], lastPull: undefined }
    emit(false)
  },

  importBackup(d: Data) {
    const have = new Set(data.attempts.map((a) => a.id))
    const attempts = [...data.attempts, ...d.attempts.filter((a) => !have.has(a.id)).map((a) => ({ ...a, synced: false }))]
    const state = { ...data.state }
    for (const [k, e] of Object.entries(d.state)) if (!state[k] || e.updatedAt > state[k].updatedAt) state[k] = { ...e, dirty: true }
    data = { ...data, attempts, state }
    emit()
  },

  // Sessão de questões em andamento (só local)
  getSession: () => session,
  setSession(s: Session | null) {
    session = s
    try {
      if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
      else localStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignora */
    }
    listeners.forEach((l) => l())
  }
}

export function useData(): Data {
  return useSyncExternalStore(store.subscribe, store.get)
}

export function useSession(): Session | null {
  return useSyncExternalStore(store.subscribe, store.getSession)
}

// ── Seletores ──

export function settingsOf(d: Data): Settings {
  const s = d.state[sk('settings', 'main')]?.value as Partial<Settings> | undefined
  return { ...DEFAULT_SETTINGS, ...(s ?? {}) }
}

export function overridesOf(d: Data): Record<string, Letter | undefined> {
  const out: Record<string, Letter | undefined> = {}
  for (const e of Object.values(d.state)) if (e.kind === 'override' && e.value) out[e.key] = e.value as Letter
  return out
}

export function keysOf(d: Data, kind: StateKind): Set<string> {
  const out = new Set<string>()
  for (const e of Object.values(d.state)) if (e.kind === kind && e.value) out.add(e.key)
  return out
}

export function valueOf<T>(d: Data, kind: StateKind, key: string): T | undefined {
  const v = d.state[sk(kind, key)]?.value
  return v === null ? undefined : (v as T | undefined)
}

export function pendingCount(d: Data): number {
  let n = 0
  for (const a of d.attempts) if (!a.synced) n++
  for (const e of Object.values(d.state)) if (e.dirty) n++
  return n
}

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
      })
