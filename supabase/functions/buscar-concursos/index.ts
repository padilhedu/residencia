// Radar de concursos: varre as fontes (PCI Concursos, Google Notícias, páginas oficiais), filtra o que interessa a
// cirurgiões-dentistas (concursos em SC, ENARE e residências em Odontologia) e grava na tabela public.concursos.
// - pg_cron chama 2x por dia com o cabeçalho x-cron-secret; avisa por Web Push quem ligou o alerta.
// - O app chama com o JWT do usuário ({ refresh: true }) para atualizar na hora (no máximo a cada 15 min).
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendPush, type Vapid } from '../send-reminders/webpush.ts'
import { dedupe, parseLinks, parsePci, parseRss, toItem, type Categoria, type Item, type Raw } from './parse.ts'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false }
})
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

interface Fonte {
  id: number
  nome: string
  tipo: 'pci' | 'rss' | 'links'
  url: string
  dica: Categoria | null
}

const UA = 'Mozilla/5.0 (compatible; RadarConcursosOdonto/1.0)'

async function baixar(url: string): Promise<string> {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), 20000)
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9' }, signal: ctl.signal, redirect: 'follow' })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const buf = new Uint8Array(await r.arrayBuffer())
    // alguns sites antigos ainda servem ISO-8859-1
    const ct = (r.headers.get('content-type') ?? '').toLowerCase()
    let html = new TextDecoder(ct.includes('8859') || ct.includes('latin1') ? 'iso-8859-1' : 'utf-8').decode(buf)
    if (!ct.includes('charset') && /charset=["']?iso-8859-1/i.test(html.slice(0, 2000))) html = new TextDecoder('iso-8859-1').decode(buf)
    return html
  } finally {
    clearTimeout(t)
  }
}

async function varrerFonte(f: Fonte): Promise<Raw[]> {
  const body = await baixar(f.url)
  const raws = f.tipo === 'pci' ? parsePci(body, f.nome) : f.tipo === 'rss' ? parseRss(body, 'Google Notícias') : parseLinks(body, f.url, f.nome, f.dica ?? undefined)
  return f.dica ? raws.map((r) => ({ ...r, hint: r.hint ?? f.dica! })) : raws
}

async function varrer(origem: 'cron' | 'app') {
  const { data: fontes, error } = await admin.from('concurso_fontes').select('id,nome,tipo,url,dica').eq('ativo', true).order('id')
  if (error) throw error
  const erros: Record<string, string> = {}
  const porFonte = await Promise.all(
    ((fontes ?? []) as Fonte[]).map(async (f) => {
      try {
        const raws = await varrerFonte(f)
        const items = raws.map((r) => toItem(r)).filter((x): x is Item => !!x)
        await admin.from('concurso_fontes').update({ ultimo_status: 'ok', ultimo_total: items.length, atualizado_em: new Date().toISOString() }).eq('id', f.id)
        return items
      } catch (e) {
        erros[f.nome] = String(e instanceof Error ? e.message : e)
        await admin.from('concurso_fontes').update({ ultimo_status: erros[f.nome].slice(0, 200), atualizado_em: new Date().toISOString() }).eq('id', f.id)
        return []
      }
    })
  )
  const items = dedupe(porFonte.flat())

  // o que já existe só ganha "visto_em"; o resto entra como novo
  const ids = items.map((i) => i.id)
  const existentes = new Set<string>()
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await admin.from('concursos').select('id').in('id', ids.slice(i, i + 200))
    for (const r of data ?? []) existentes.add(r.id as string)
  }
  const { count: antes } = await admin.from('concursos').select('id', { count: 'exact', head: true })
  const novos = items.filter((i) => !existentes.has(i.id))
  if (novos.length) {
    const { error: e } = await admin.from('concursos').upsert(novos, { onConflict: 'id', ignoreDuplicates: true })
    if (e) throw e
  }
  const agora = new Date().toISOString()
  const velhos = ids.filter((id) => existentes.has(id))
  for (let i = 0; i < velhos.length; i += 200) await admin.from('concursos').update({ visto_em: agora }).in('id', velhos.slice(i, i + 200))

  await admin.from('concurso_execucoes').insert({ origem, encontrados: items.length, novos: novos.length, erros: Object.keys(erros).length ? erros : null })
  // na primeira varredura tudo é "novo": não dispara alerta
  if (novos.length && (antes ?? 0) > 0) await alertar(novos).catch((e) => (erros['alerta'] = String(e)))
  return { encontrados: items.length, novos: novos.length, erros }
}

const NOME: Record<Categoria, string> = { sc: 'concurso em SC', enare: 'ENARE', residencia: 'residência' }

async function alertar(novos: Item[]) {
  const { data: cfg } = await admin.rpc('reminder_config').single<{ vapid_public: string; vapid_private: string; vapid_subject: string }>()
  if (!cfg?.vapid_private) return
  const vapid: Vapid = { publicKey: cfg.vapid_public, privateKey: cfg.vapid_private, subject: cfg.vapid_subject }
  const { data: users } = await admin.rpc('concurso_alert_users')
  for (const u of (users ?? []) as { user_id: string; categorias: Categoria[] | null }[]) {
    const cats = Array.isArray(u.categorias) && u.categorias.length ? u.categorias : (['sc', 'enare', 'residencia'] as Categoria[])
    const meus = novos.filter((n) => cats.includes(n.categoria))
    if (!meus.length) continue
    const msg = {
      title: meus.length === 1 ? `Novo ${NOME[meus[0].categoria]}` : `${meus.length} novos editais para dentistas`,
      body: meus.slice(0, 3).map((n) => `• ${n.titulo}`).join('\n'),
      url: '/#/concursos',
      tag: 'concursos-novos'
    }
    const { data: subs } = await admin.from('push_subscriptions').select('user_id, endpoint, p256dh, auth').eq('user_id', u.user_id)
    for (const s of subs ?? []) {
      try {
        const r = await sendPush(s, msg, vapid)
        if (r.gone) await admin.from('push_subscriptions').delete().eq('user_id', s.user_id).eq('endpoint', s.endpoint)
      } catch {
        /* um aparelho com problema não impede os outros */
      }
    }
  }
}

function safeEqual(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  try {
    const { data: cfg } = await admin.rpc('reminder_config').single<{ cron_secret: string }>()
    if (cfg?.cron_secret && safeEqual(req.headers.get('x-cron-secret') ?? '', cfg.cron_secret)) return json(await varrer('cron'))

    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const { data: u } = jwt ? await admin.auth.getUser(jwt) : { data: { user: null } }
    if (!u?.user) return json({ error: 'unauthorized' }, 401)
    const { data: last } = await admin.from('concurso_execucoes').select('iniciado_em').order('iniciado_em', { ascending: false }).limit(1).maybeSingle()
    if (last && Date.now() - new Date(last.iniciado_em as string).getTime() < 15 * 60e3) return json({ recente: true, ultima: last.iniciado_em })
    return json(await varrer('app'))
  } catch (e) {
    return json({ error: String(e instanceof Error ? e.message : e) }, 500)
  }
})
