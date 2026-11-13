// Radar de concursos: varre sites de concursos (listagens → página de cada concurso), filtra o que interessa a
// cirurgiões-dentistas (concursos em SC, ENARE e residências em Odontologia) e grava na tabela public.concursos.
// - pg_cron chama toda segunda-feira (cabeçalho x-cron-secret) e manda o resumo semanal por Web Push
//   para todo aparelho com notificações ativadas (exceto quem desligou o aviso de concursos).
// - O app chama com o JWT do usuário ({ refresh: true }) para atualizar na hora (no máximo a cada 15 min).
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendPush, type Vapid } from '../send-reminders/webpush.ts'
import { dedupe, hashId, listLinks, parseDetalhe, parseLinks, parsePci, parseRss, toItem, ufOf, type Categoria, type Item, type Raw } from './parse.ts'
import { resumoSemanal, type Ativo } from './resumo.ts'

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
  tipo: 'pci' | 'rss' | 'links' | 'lista'
  url: string
  padrao: string | null
  paralelo: number | null
  pausa_ms: number | null
  dica: Categoria | null
  so_dentista: boolean
  uf: string | null
}

const UA = 'Mozilla/5.0 (compatible; RadarConcursosOdonto/1.0)'

async function baixar(url: string, ms = 20000): Promise<string> {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
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

// Todas as páginas de concurso abertas na varredura não podem passar do limite de tempo da Edge Function
const PRAZO_MS = 110_000
let inicio = Date.now()

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Executa fn em cada item com no máximo `n` ao mesmo tempo (e pausa entre pedidos), parando ao estourar o prazo
 *  ou quando fn devolver `parar` (ex.: o site respondeu 429 — volta na próxima execução) */
async function emLotes<T, R>(lista: T[], n: number, pausa: number, fn: (x: T) => Promise<R | 'parar'>): Promise<R[]> {
  const out: R[] = []
  let i = 0
  let parar = false
  await Promise.all(
    Array.from({ length: Math.max(1, n) }, async () => {
      while (!parar && i < lista.length && Date.now() - inicio < PRAZO_MS) {
        const x = lista[i++]
        try {
          const r = await fn(x)
          if (r === 'parar') parar = true
          else out.push(r)
        } catch {
          /* página com erro: segue */
        }
        if (pausa) await dormir(pausa)
      }
    })
  )
  return out
}

/** Diagnóstico por fonte, gravado em concurso_fontes.ultimo_status */
const diag = new Map<number, string>()

/** Listagem → abre cada concurso e procura o cargo de dentista / residência na página */
async function varrerLista(f: Fonte, conhecidos: Set<string>, verificadas: Set<string>): Promise<Raw[]> {
  const body = await baixar(f.url)
  const links = listLinks(body, f.url, f.padrao ?? '.', 150)
  if (!links.length) throw new Error('nenhum link de concurso na listagem (o site mudou?)')
  // já está na base: só marca como ainda listado; já verificada sem Odontologia: não abre de novo
  const vistos: Raw[] = []
  const abrir = links.filter((u) => {
    const id = hashId(u)
    if (conhecidos.has(id)) return vistos.push({ titulo: '', url: u, fonte: f.nome }), false
    return !verificadas.has(id)
  })
  let ok = 0
  let falhas = 0
  let primeiroErro = ''
  const abertas: string[] = []
  const achados = await emLotes(abrir, f.paralelo ?? 4, f.pausa_ms ?? 0, async (u) => {
    try {
      const r = parseDetalhe(await baixar(u, 15000), u, f.nome)
      ok++
      abertas.push(hashId(u))
      return r
    } catch (e) {
      falhas++
      const msg = String(e instanceof Error ? e.message : e).slice(0, 60)
      primeiroErro ||= msg
      return msg.includes('429') ? 'parar' : null
    }
  })
  if (abertas.length) await admin.from('concurso_paginas').upsert(abertas.map((id) => ({ id, fonte_id: f.id })), { onConflict: 'id', ignoreDuplicates: true })
  const faltam = abrir.length - ok - falhas
  diag.set(f.id, `ok · ${links.length} links, ${links.length - abrir.length} já verificados, ${ok} abertos agora${falhas ? `, ${falhas} com erro (${primeiroErro})` : ''}${faltam ? `, ${faltam} ficam para a próxima` : ''}`)
  return [...vistos, ...achados.filter((r): r is Raw => !!r)]
}

async function varrerFonte(f: Fonte, conhecidos: Set<string>, verificadas: Set<string>): Promise<Raw[]> {
  if (f.tipo === 'lista') return (await varrerLista(f, conhecidos, verificadas)).map((r) => ({ ...r, hint: r.hint ?? f.dica ?? undefined, uf: r.uf ?? (r.titulo ? ufOf(r.titulo) : null) ?? f.uf ?? undefined }))
  const body = await baixar(f.url)
  const raws = f.tipo === 'pci' ? parsePci(body, f.nome) : f.tipo === 'rss' ? parseRss(body, f.nome) : parseLinks(body, f.url, f.nome, f.dica ?? undefined)
  return raws.map((r) => ({
    ...r,
    hint: r.hint ?? f.dica ?? undefined,
    dentista: r.dentista || f.so_dentista,
    uf: r.uf ?? f.uf ?? undefined
  }))
}

async function varrer(origem: 'cron' | 'app', avisar = origem === 'cron') {
  inicio = Date.now()
  diag.clear()
  const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10) // data em Brasília
  const { data: fontes, error } = await admin.from('concurso_fontes').select('id,nome,tipo,url,padrao,paralelo,pausa_ms,dica,so_dentista,uf').eq('ativo', true).order('id')
  if (error) throw error
  const { data: base } = await admin.from('concursos').select('id')
  const conhecidos = new Set((base ?? []).map((r) => r.id as string))
  const { data: pags } = await admin.from('concurso_paginas').select('id').gte('aberto_em', new Date(Date.now() - 120 * 864e5).toISOString())
  const verificadas = new Set((pags ?? []).map((r) => r.id as string))
  const erros: Record<string, string> = {}
  const jaVistos: string[] = []
  const porFonte = await Promise.all(
    ((fontes ?? []) as Fonte[]).map(async (f) => {
      try {
        const raws = await varrerFonte(f, conhecidos, verificadas)
        // links já conhecidos (sem título) só renovam o "visto_em"
        for (const r of raws) if (!r.titulo) jaVistos.push(hashId(r.url))
        // inscrições já encerradas não interessam (listagens trazem concursos antigos)
        const items = raws.filter((r) => r.titulo).map((r) => toItem(r)).filter((x): x is Item => !!x && !(x.inscricoes_ate && x.inscricoes_ate < hoje))
        await admin.from('concurso_fontes').update({ ultimo_status: diag.get(f.id) ?? 'ok', ultimo_total: items.length + raws.filter((r) => !r.titulo).length, atualizado_em: new Date().toISOString() }).eq('id', f.id)
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
  const velhos = [...new Set([...ids.filter((id) => existentes.has(id)), ...jaVistos])]
  for (let i = 0; i < velhos.length; i += 200) await admin.from('concursos').update({ visto_em: agora }).in('id', velhos.slice(i, i + 200))

  await admin.from('concurso_execucoes').insert({ origem, encontrados: items.length, novos: novos.length, erros: Object.keys(erros).length ? erros : null })
  let avisados = 0
  if (avisar) avisados = await alertar(novos, (antes ?? 0) === 0).catch((e) => ((erros['alerta'] = String(e)), 0))
  return { encontrados: items.length, novos: novos.length, avisados, erros }
}

/** Resumo semanal: editais novos da semana + os que encerram em 7 dias, por usuário (conforme as categorias escolhidas) */
async function alertar(novos: Item[], primeira: boolean): Promise<number> {
  const { data: cfg } = await admin.rpc('reminder_config').single<{ vapid_public: string; vapid_private: string; vapid_subject: string }>()
  if (!cfg?.vapid_private) return 0
  const vapid: Vapid = { publicKey: cfg.vapid_public, privateKey: cfg.vapid_private, subject: cfg.vapid_subject }
  const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10) // data em Brasília
  const { data: abertos } = await admin.from('concursos').select('id,categoria,titulo,inscricoes_ate').gte('inscricoes_ate', hoje)
  const { data: users } = await admin.rpc('concurso_alert_users')
  let enviados = 0
  for (const u of (users ?? []) as { user_id: string; categorias: Categoria[] | null }[]) {
    const msg = resumoSemanal({ novos, abertos: (abertos ?? []) as Ativo[], hoje, categorias: u.categorias, primeira })
    if (!msg) continue
    enviados++
    await enviarPara(u.user_id, msg, vapid)
  }
  return enviados
}

async function enviarPara(userId: string, msg: unknown, vapid: Vapid): Promise<number> {
  const { data: subs } = await admin.from('push_subscriptions').select('user_id, endpoint, p256dh, auth').eq('user_id', userId)
  let ok = 0
  for (const s of subs ?? []) {
    try {
      const r = await sendPush(s, msg, vapid)
      if (r.ok) ok++
      if (r.gone) await admin.from('push_subscriptions').delete().eq('user_id', s.user_id).eq('endpoint', s.endpoint)
    } catch {
      /* um aparelho com problema não impede os outros */
    }
  }
  return ok
}

/** Botão "Testar aviso": manda agora, só para quem pediu, o resumo com o que entrou nos últimos 7 dias */
async function testar(userId: string) {
  const { data: cfg } = await admin.rpc('reminder_config').single<{ vapid_public: string; vapid_private: string; vapid_subject: string }>()
  if (!cfg?.vapid_private) throw new Error('chaves de notificação ausentes')
  const vapid: Vapid = { publicKey: cfg.vapid_public, privateKey: cfg.vapid_private, subject: cfg.vapid_subject }
  const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10)
  const semana = new Date(Date.now() - 7 * 864e5).toISOString()
  const { data: novos } = await admin.from('concursos').select('*').eq('oculto', false).gte('primeiro_visto', semana).order('primeiro_visto', { ascending: false })
  const { data: abertos } = await admin.from('concursos').select('id,categoria,titulo,inscricoes_ate').gte('inscricoes_ate', hoje)
  const { data: pref } = await admin.from('user_state').select('value').eq('user_id', userId).eq('kind', 'alert').eq('key', 'concursos').maybeSingle()
  const msg = resumoSemanal({ novos: (novos ?? []) as Item[], abertos: (abertos ?? []) as Ativo[], hoje, categorias: (pref?.value as { categorias?: Categoria[] } | null)?.categorias ?? null, primeira: true })!
  return { aparelhos: await enviarPara(userId, { ...msg, title: 'Teste: ' + msg.title }, vapid) }
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
    if (cfg?.cron_secret && safeEqual(req.headers.get('x-cron-secret') ?? '', cfg.cron_secret)) {
      // { "semAviso": true } roda a varredura sem notificar (para conferir as fontes)
      const corpo = await req.json().catch(() => ({}))
      return json(await varrer('cron', !corpo?.semAviso))
    }

    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const { data: u } = jwt ? await admin.auth.getUser(jwt) : { data: { user: null } }
    if (!u?.user) return json({ error: 'unauthorized' }, 401)
    const body = await req.json().catch(() => ({}))
    if (body?.teste) return json(await testar(u.user.id))
    const { data: last } = await admin.from('concurso_execucoes').select('iniciado_em').order('iniciado_em', { ascending: false }).limit(1).maybeSingle()
    if (last && Date.now() - new Date(last.iniciado_em as string).getTime() < 15 * 60e3) return json({ recente: true, ultima: last.iniciado_em })
    return json(await varrer('app'))
  } catch (e) {
    return json({ error: String(e instanceof Error ? e.message : e) }, 500)
  }
})
