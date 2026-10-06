import { supabase, currentUser } from './supabase'

/** Chave pública VAPID (a privada fica no Vault do Supabase) */
export const VAPID_PUBLIC_KEY = 'BKpQEUI1a4z9s29bzVmZys_ubF0XOV56J7T9LGSYXQFkSkE_F9Y4Nx4JdduYE5NONZ0R-bfSY19sujU_lU8ss2U'

export interface ReminderPrefs {
  hour: number
  tz: string
}

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

/** iPhone/iPad só recebem push com o app instalado na tela inicial (iOS 16.4+) */
export const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)
export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)

function keyBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64url.length + 3) % 4)
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration()
  return (await reg?.pushManager.getSubscription()) ?? null
}

export const localTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'

/** Pede permissão, inscreve este aparelho e grava no Supabase */
export async function enableReminders(hour: number): Promise<void> {
  if (!supabase || !currentUser()) throw new Error('Entre na sua conta para ativar os lembretes.')
  if (!pushSupported()) throw new Error('Este navegador não suporta notificações.')
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Permissão de notificação negada. Libere nas configurações do navegador.')
  const reg = await navigator.serviceWorker.ready
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) as BufferSource }))
  const j = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    { endpoint: sub.endpoint, p256dh: j.keys?.p256dh, auth: j.keys?.auth, hour, tz: localTz(), updated_at: new Date().toISOString() },
    { onConflict: 'user_id,endpoint' }
  )
  if (error) throw new Error(error.message)
}

export async function updateReminderHour(hour: number): Promise<void> {
  const sub = await currentSubscription()
  if (!supabase || !sub) return
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ hour, tz: localTz(), last_sent_on: null, updated_at: new Date().toISOString() })
    .eq('endpoint', sub.endpoint)
  if (error) throw new Error(error.message)
}

export async function disableReminders(): Promise<void> {
  const sub = await currentSubscription()
  if (!sub) return
  if (supabase && currentUser()) await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}

/** Hora gravada no servidor para este aparelho (null = não inscrito) */
export async function serverReminder(): Promise<ReminderPrefs | null> {
  const sub = await currentSubscription()
  if (!supabase || !sub || !currentUser()) return null
  const { data } = await supabase.from('push_subscriptions').select('hour, tz').eq('endpoint', sub.endpoint).maybeSingle()
  return data ? { hour: data.hour, tz: data.tz } : null
}

export async function sendTestReminder(): Promise<number> {
  if (!supabase) throw new Error('Supabase não configurado')
  const { data, error } = await supabase.functions.invoke('send-reminders', { body: { test: true } })
  if (error) throw new Error(error.message)
  return (data as { devices?: number })?.devices ?? 0
}
