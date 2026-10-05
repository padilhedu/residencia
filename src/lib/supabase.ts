import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null

// Usuário logado como store externa simples
let user: User | null = null
let ready = !supabase
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

if (supabase) {
  supabase.auth.getSession().then(({ data }) => {
    user = data.session?.user ?? null
    ready = true
    emit()
  })
  supabase.auth.onAuthStateChange((_event, s) => {
    user = s?.user ?? null
    ready = true
    emit()
  })
}

const authState = { get user() { return user }, get ready() { return ready } }
let snapshot: { user: User | null; ready: boolean } = { user, ready }
function getSnapshot() {
  if (snapshot.user !== user || snapshot.ready !== ready) snapshot = { user, ready }
  return snapshot
}

export function useAuth() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    getSnapshot
  )
}

export const currentUser = () => authState.user
export function onAuthChange(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
