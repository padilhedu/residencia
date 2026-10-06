// Lembrete diário de revisão (Web Push).
// - Chamada de hora em hora pelo pg_cron (cabeçalho x-cron-secret): para cada inscrição cuja hora local
//   coincide com a escolhida, soma as revisões vencidas (previsão enviada pelo app) e notifica se houver pendências.
// - Chamada pelo app com o JWT do usuário e { test: true }: envia uma notificação de teste para os aparelhos dele.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendPush, type Vapid } from './webpush.ts'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

interface Sub {
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  hour: number
  tz: string
  last_sent_on: string | null
}

/** Previsão enviada pelo app: por dia local, [questões, flashcards] que vencem */
interface Forecast {
  tz?: string
  days?: Record<string, [number, number]>
}

function safeEqual(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

function localNow(tz: string, d = new Date()) {
  try {
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
    const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(d))
    return { date, hour }
  } catch {
    return localNow('America/Sao_Paulo', d)
  }
}

async function pendingFor(userId: string, today: string): Promise<{ q: number; c: number }> {
  const { data } = await admin.from('user_state').select('value').eq('user_id', userId).eq('kind', 'forecast').eq('key', 'due').maybeSingle()
  const f = (data?.value ?? {}) as Forecast
  let q = 0
  let c = 0
  for (const [day, v] of Object.entries(f.days ?? {})) {
    if (day > today || !Array.isArray(v)) continue
    q += Number(v[0]) || 0
    c += Number(v[1]) || 0
  }
  return { q, c }
}

function message(p: { q: number; c: number }, test = false) {
  const parts = []
  if (p.q) parts.push(`${p.q} ${p.q === 1 ? 'questão' : 'questões'}`)
  if (p.c) parts.push(`${p.c} ${p.c === 1 ? 'flashcard' : 'flashcards'}`)
  const what = parts.join(' e ')
  return {
    title: test ? 'Lembretes ativados ✓' : 'Revisão pendente hoje',
    body: test
      ? what ? `Funcionando! Agora você tem ${what} para revisar.` : 'Funcionando! Nada vencido agora — o aviso só chega quando houver revisão pendente.'
      : `Você tem ${what} para revisar. Comece pelos temas mais fracos.`,
    url: p.q || !p.c ? '/#/revisao' : '/#/cards',
    tag: 'revisao-diaria'
  }
}

async function deliver(sub: Sub, msg: unknown, vapid: Vapid) {
  try {
    const r = await sendPush(sub, msg, vapid)
    if (r.gone) await admin.from('push_subscriptions').delete().eq('user_id', sub.user_id).eq('endpoint', sub.endpoint)
    return r
  } catch (e) {
    return { ok: false, status: 0, gone: false, text: String(e) }
  }
}

async function hourly(vapid: Vapid) {
  const { data: subs, error } = await admin.from('push_subscriptions').select('user_id, endpoint, p256dh, auth, hour, tz, last_sent_on')
  if (error) throw error
  const cache = new Map<string, { q: number; c: number }>()
  let sent = 0
  let checked = 0
  for (const sub of (subs ?? []) as Sub[]) {
    const { date, hour } = localNow(sub.tz)
    if (hour !== sub.hour || sub.last_sent_on === date) continue
    checked++
    const key = `${sub.user_id}|${date}`
    if (!cache.has(key)) cache.set(key, await pendingFor(sub.user_id, date))
    const p = cache.get(key)!
    if (p.q + p.c > 0) {
      const r = await deliver(sub, message(p), vapid)
      if (r.ok) sent++
    }
    await admin.from('push_subscriptions').update({ last_sent_on: date }).eq('user_id', sub.user_id).eq('endpoint', sub.endpoint)
  }
  return { checked, sent }
}

async function test(userId: string, vapid: Vapid) {
  const { data: subs } = await admin.from('push_subscriptions').select('user_id, endpoint, p256dh, auth, hour, tz, last_sent_on').eq('user_id', userId)
  const results = []
  for (const sub of (subs ?? []) as Sub[]) {
    const p = await pendingFor(userId, localNow(sub.tz).date)
    const r = await deliver(sub, message(p, true), vapid)
    results.push({ ok: r.ok, status: r.status })
  }
  return { devices: results.length, results }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  const { data: cfg, error } = await admin.rpc('reminder_config').single<{
    vapid_public: string
    vapid_private: string
    vapid_subject: string
    cron_secret: string
  }>()
  if (error || !cfg?.vapid_private) return json({ error: 'reminder config missing' }, 500)
  const vapid: Vapid = { publicKey: cfg.vapid_public, privateKey: cfg.vapid_private, subject: cfg.vapid_subject }

  if (safeEqual(req.headers.get('x-cron-secret') ?? '', cfg.cron_secret)) {
    try {
      return json(await hourly(vapid))
    } catch (e) {
      return json({ error: String(e) }, 500)
    }
  }

  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: u } = jwt ? await admin.auth.getUser(jwt) : { data: { user: null } }
  if (!u?.user) return json({ error: 'unauthorized' }, 401)
  const body = await req.json().catch(() => ({}))
  if (body?.test) return json(await test(u.user.id, vapid))
  return json({ error: 'bad request' }, 400)
})
