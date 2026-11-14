// Extração e classificação de concursos/residências para Odontologia.
// Módulo puro (sem APIs do Deno) para ser testado com o vitest: `npm test`.

export type Categoria = 'sc' | 'enare' | 'residencia'

export interface Item {
  id: string
  categoria: Categoria
  titulo: string
  orgao: string | null
  uf: string | null
  url: string
  fonte: string
  resumo: string | null
  vagas: string | null
  salario: string | null
  inscricoes_ate: string | null // AAAA-MM-DD
  publicado_em: string | null // ISO
}

/** Texto bruto encontrado numa fonte, antes da classificação */
export interface Raw {
  titulo: string
  url: string
  fonte: string
  texto?: string
  uf?: string | null
  data?: string | null // prazo informado pela fonte (dd/mm/aaaa)
  publicado_em?: string | null
  /** Fonte dedicada a uma categoria (ex.: página oficial do ENARE) */
  hint?: Categoria
  /** Fonte que só lista vagas de dentista (ex.: página do cargo no PCI) */
  dentista?: boolean
}

// ── utilidades de texto ──
const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ordm: 'º', ordf: 'ª', ccedil: 'ç', atilde: 'ã', otilde: 'õ', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', acirc: 'â', ecirc: 'ê', ocirc: 'ô', agrave: 'à', Ccedil: 'Ç', Atilde: 'Ã', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú' }
export function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n] ?? m)
}
export const stripTags = (html: string) => decode(html.replace(/<br\s*\/?>/gi, ' · ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
/** minúsculas e sem acentos, para comparar */
export const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// ── classificação ──
const DENT = /\b(dentista|odontolog|odontopediatr|endodont|periodont|ortodont|bucomaxilo|buco-maxilo|cirurgi[aã]o.dentista|saude bucal|estomatolog|protesista|implantodont|cd\s*esf|esb\b)/
const RESID = /\bresidencia/
const MULTI = /residencia (multiprofissional|uniprofissional|em area profissional)|area profissional da saude|resmulti/
const ENARE = /\benare\b|exame nacional de residencia/
const SC_CIDADE = /\b(florianopolis|joinville|blumenau|sao jose|chapeco|criciuma|itajai|jaragua do sul|lages|palhoca|balneario camboriu|brusque|tubarao|camboriu|navegantes|concordia|rio do sul|ararangua|gaspar|indaial|cacador|biguacu|itapema|sao bento do sul|mafra|canoinhas|videira|xanxere|joacaba|santo amaro da imperatriz|tijucas|imbituba|laguna|ufsc|udesc|fepese|ses\/sc|ses-sc|hu-ufsc|hospital universitario polydoro)\b/
const UF_RE = /(?:^|[\s(/–-])(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)(?=$|[\s)/,.;:–-])/g
// Cargos de apoio em saúde bucal, exames do concurso ("avaliação médica e odontológica"), benefícios ("plano
// odontológico") e o registro no CRO exigido de auxiliares não são vaga de dentista
const AUX = /auxiliar (de |em )?(saude bucal|consultorio dentario|consultorio odontologico|dentista|odontologia)|auxiliar odontologico|atendente de consultorio (dentario|odontologico)|tecnico (em|de) (saude bucal|higiene dental)|tecnico em protese dentaria|protetico|\b(asb|tsb|thd)\b|(exames?|avaliac(ao|oes)|inspec(ao|oes)|plano|assistencia|convenio|auxilio)[^.;]{0,30}?odontologic[ao]s?|conselho regional de odontologia/g
const NOISE = /\bresultado (final|preliminar)|\bgabarito|\baprovados\b|\bconvoca(cao|dos)|\bhomologa/

export function ufOf(text: string): string | null {
  if (/santa catarina/i.test(norm(text))) return 'SC'
  const found = [...text.matchAll(UF_RE)].map((m) => m[1])
  return found.length ? found[found.length - 1] : null
}

/** Decide se o achado interessa e em qual categoria; null = descartar */
export function classify(r: Raw): { categoria: Categoria; uf: string | null } | null {
  const all = `${r.titulo} ${r.texto ?? ''}`
  const t = norm(all)
  const titleN = norm(r.titulo)
  const uf = r.uf ?? ufOf(all) ?? (SC_CIDADE.test(t) ? 'SC' : null)
  // resultados/gabaritos não ajudam a achar inscrições abertas
  if (NOISE.test(titleN)) return null
  // só auxiliar/técnico em saúde bucal (sem vaga de dentista) não interessa
  const semAux = t.replace(AUX, ' ')
  if (!r.dentista && semAux !== t && !DENT.test(semAux)) return null
  const dent = !!r.dentista || DENT.test(t)
  // vaga de dentista já confirmada: ENARE/residência só se for o assunto (título), não um requisito no texto
  const tr = r.dentista ? titleN : t
  if (r.hint === 'enare' || ENARE.test(tr)) return { categoria: 'enare', uf }
  if (r.hint === 'residencia' && (dent || RESID.test(t) || /edital|processo seletivo/.test(t))) return { categoria: 'residencia', uf }
  if (RESID.test(tr) && (dent || MULTI.test(t))) return { categoria: 'residencia', uf }
  // cidade de SC no texto só decide quando o estado não foi identificado ("São José do Inhacorá-RS" não é SC)
  if (dent && (uf === 'SC' || (!uf && SC_CIDADE.test(t)))) return { categoria: 'sc', uf: 'SC' }
  return null
}

// ── datas ──
const MESES = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const pad = (n: number) => String(n).padStart(2, '0')
function iso(d: number, m: number, y: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  return `${y}-${pad(m)}-${pad(d)}`
}
/** Ano provável de uma data sem ano: a próxima ocorrência a partir de ~2 meses antes da referência */
function guessYear(d: number, m: number, ref: Date): number {
  const y = ref.getUTCFullYear()
  const cand = Date.UTC(y, m - 1, d)
  return cand < ref.getTime() - 60 * 864e5 ? y + 1 : y
}
export function parseBrDate(s: string, ref = new Date()): string | null {
  const m = s.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/)
  if (!m) return null
  const d = Number(m[1]), mo = Number(m[2])
  let y = m[3] ? Number(m[3]) : guessYear(d, mo, ref)
  if (y < 100) y += 2000
  return iso(d, mo, y)
}

/** Procura o prazo de inscrição no texto ("inscrições até 05/12", "até 5 de dezembro de 2026", "de 10/11 a 05/12") */
export function extractDeadline(text: string, ref = new Date()): string | null {
  const t = norm(text)
  const near = /inscri[cç](?:o|oe)es?[^.]{0,60}?(?:ate|encerram(?:-se)? em|terminam em|vao ate|ficam abertas ate|prorrogadas ate|a)\s*(?:o dia\s*)?(\d{1,2}(?:\/\d{1,2}(?:\/\d{2,4})?| de [a-z]+(?: de \d{4})?))/
  const m = t.match(near) ?? t.match(/\bate (?:o dia )?(\d{1,2}(?:\/\d{1,2}(?:\/\d{2,4})?| de [a-z]+(?: de \d{4})?))/)
  if (!m) return null
  const s = m[1]
  if (s.includes('/')) return parseBrDate(s, ref)
  const w = s.match(/(\d{1,2}) de ([a-z]+)(?: de (\d{4}))?/)
  if (!w) return null
  const mo = MESES.indexOf(w[2]) + 1
  if (!mo) return null
  const d = Number(w[1])
  return iso(d, mo, w[3] ? Number(w[3]) : guessYear(d, mo, ref))
}

// ── identificação / deduplicação ──
export function canonicalUrl(u: string): string {
  try {
    const x = new URL(u)
    x.hash = ''
    for (const k of [...x.searchParams.keys()]) if (/^(utm_|fbclid|gclid|oc$)/.test(k)) x.searchParams.delete(k)
    return x.toString()
  } catch {
    return u.trim()
  }
}
/** Hash curto e estável (FNV-1a 64 bits em hex) */
export function hashId(s: string): string {
  let h = 0xcbf29ce484222325n
  for (const c of new TextEncoder().encode(s)) {
    h ^= BigInt(c)
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn
  }
  return h.toString(16).padStart(16, '0')
}
/** Chave para juntar a mesma notícia publicada por vários sites */
export function titleKey(t: string): string {
  return norm(t.replace(/\s+[-–|]\s+[^-–|]{2,40}$/, '')).replace(/[^a-z0-9]+/g, ' ').trim()
}

export function toItem(r: Raw, ref = new Date()): Item | null {
  const c = classify(r)
  if (!c) return null
  const texto = r.texto ? r.texto.slice(0, 600) : null
  const all = `${r.titulo} ${r.texto ?? ''}`
  const vagas = all.match(/(\d+|uma|duas)\s+vagas?\b/i)?.[0] ?? (/cadastro reserva|\bCR\b/i.test(all) ? 'Cadastro reserva' : null)
  const salario = all.match(/R\$\s?[\d.]+(?:,\d{2})?/)?.[0] ?? null
  const orgao = r.titulo.match(/^(Prefeitura (?:Municipal )?de [^-–|,]+|C[aâ]mara (?:Municipal )?de [^-–|,]+|Cons[oó]rcio [^-–|,]+|Hospital [^-–|,]+|UFSC|UDESC|SES\/?SC|Ebserh)/i)?.[1]?.trim() ?? null
  const url = canonicalUrl(r.url)
  return {
    id: hashId(url),
    categoria: c.categoria,
    titulo: r.titulo.trim().slice(0, 300),
    orgao,
    uf: c.uf,
    url,
    fonte: r.fonte,
    resumo: texto,
    vagas,
    salario,
    inscricoes_ate: (r.data ? parseBrDate(r.data, ref) : null) ?? extractDeadline(all, ref),
    publicado_em: r.publicado_em ?? null
  }
}

/** Remove repetidos (mesma URL ou mesma manchete); mantém o primeiro (as fontes vêm em ordem de confiança) */
export function dedupe(items: Item[]): Item[] {
  const seenId = new Set<string>()
  const seenTitle = new Set<string>()
  const out: Item[] = []
  for (const it of items) {
    const k = titleKey(it.titulo)
    if (seenId.has(it.id) || (k.length > 15 && seenTitle.has(k))) continue
    seenId.add(it.id)
    seenTitle.add(k)
    out.push(it)
  }
  return out
}

// ── parsers por tipo de fonte ──

/** Listagens do PCI Concursos (por estado ou por cargo): blocos .ca (órgão+link), .cc (UF), .cd (vagas/cargos), .ce (prazo) */
export function parsePci(html: string, fonte = 'PCI Concursos'): Raw[] {
  const out: Raw[] = []
  const parts = html.split(/<div[^>]+class=["']ca["'][^>]*>/i).slice(1)
  for (const p of parts) {
    const a = p.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i)
    if (!a) continue
    const block = p.split(/<div[^>]+class=["'](?:na|da|ca)["']/i)[0]
    const cell = (cls: string) => {
      const m = block.match(new RegExp(`<div[^>]+class=["']${cls}["'][^>]*>([\\s\\S]*?)</div>`, 'i'))
      return m ? stripTags(m[1]) : ''
    }
    const titulo = stripTags(a[2])
    const uf = cell('cc').match(/\b[A-Z]{2}\b/)?.[0] ?? null
    const cd = cell('cd')
    const ce = cell('ce')
    if (!titulo) continue
    out.push({ titulo, url: decode(a[1]), fonte, texto: cd, uf: uf === 'BR' ? null : uf, data: /\d{1,2}\/\d{1,2}/.test(ce) ? ce : null })
  }
  return out
}

/** RSS 2.0 / Atom (Google Notícias, blogs, sites de bancas) */
export function parseRss(xml: string, fonte = 'RSS'): Raw[] {
  const out: Raw[] = []
  const items = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) ?? []
  for (const it of items) {
    const tag = (n: string) => {
      const m = it.match(new RegExp(`<${n}\\b[^>]*>([\\s\\S]*?)</${n}>`, 'i'))
      return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') : ''
    }
    let titulo = stripTags(tag('title'))
    let link = stripTags(tag('link'))
    if (!link) link = it.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] ?? ''
    const src = stripTags(tag('source'))
    const desc = stripTags(decode(tag('description') || tag('summary') || tag('content')))
    const date = stripTags(tag('pubDate') || tag('published') || tag('updated'))
    if (!titulo || !link) continue
    if (src && titulo.endsWith(` - ${src}`)) titulo = titulo.slice(0, -src.length - 3)
    const d = date ? new Date(date) : null
    out.push({
      titulo,
      url: decode(link),
      fonte: src ? `${src} (via ${fonte})` : fonte,
      texto: desc && norm(desc) !== norm(titulo) ? desc : undefined,
      publicado_em: d && !isNaN(d.getTime()) ? d.toISOString() : null
    })
  }
  return out
}

/** Página qualquer de site de concursos: cada link relevante, com o texto que vem logo depois dele
 *  (cargos, vagas, prazo) até o próximo link de destaque */
export function parseLinks(html: string, baseUrl: string, fonte: string, hint?: Categoria): Raw[] {
  const out: Raw[] = []
  const body = html.replace(/<(script|style|nav|footer|header)\b[\s\S]*?<\/\1>/gi, ' ')
  const re = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi
  const links = [...body.matchAll(re)].map((m) => ({ href: m[1], titulo: stripTags(m[2]), start: m.index!, end: m.index! + m[0].length }))
  const destaque = links.filter((l) => l.titulo.length >= 12 && l.titulo.length <= 300)
  const vistos = new Set<string>()
  destaque.forEach((l, i) => {
    const prox = destaque[i + 1]?.start ?? Math.min(body.length, l.end + 3000)
    const ctx = stripTags(body.slice(l.end, Math.min(prox, l.end + 3000))).slice(0, 400)
    const n = norm(l.titulo)
    const nc = norm(ctx)
    const relevante = DENT.test(n) || ENARE.test(n) || RESID.test(n) || DENT.test(nc) || ENARE.test(nc) || (RESID.test(nc) && MULTI.test(nc)) || (!!hint && /edital|processo seletivo|concurso|inscri/.test(n))
    if (!relevante) return
    let url: string
    try {
      url = new URL(decode(l.href), baseUrl).toString()
    } catch {
      return
    }
    if (!/^https?:/.test(url) || vistos.has(url)) return
    vistos.add(url)
    out.push({ titulo: l.titulo, url, fonte, texto: ctx || undefined, hint })
  })
  return out
}

// ── busca em dois níveis: listagem → página de cada concurso ──

/** Links das páginas de cada concurso numa listagem (HTML) ou feed (RSS), filtrados por um padrão de URL */
export function listLinks(body: string, baseUrl: string, padrao: string, max = 120): string[] {
  let re: RegExp
  try {
    re = new RegExp(padrao, 'i')
  } catch {
    re = /./
  }
  const hrefs = /<(item|entry)\b/i.test(body)
    ? (body.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) ?? []).map((it) => stripTags(it.match(/<link\b[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? it.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] ?? ''))
    : [...body.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)].map((m) => decode(m[1]))
  const out: string[] = []
  const seen = new Set<string>()
  for (const h of hrefs) {
    let u: string
    try {
      u = canonicalUrl(new URL(h.trim(), baseUrl).toString())
    } catch {
      continue
    }
    if (!/^https?:/.test(u) || seen.has(u) || !re.test(new URL(u).pathname)) continue
    seen.add(u)
    out.push(u)
    if (out.length >= max) break
  }
  return out
}

function trecho(text: string, idx: number, antes: number, depois: number): string {
  const ini = Math.max(0, idx - antes)
  const fim = Math.min(text.length, idx + depois)
  return (ini > 0 ? '…' : '') + text.slice(ini, fim).trim() + (fim < text.length ? '…' : '')
}

/** Página de um concurso: título + trechos onde aparecem o cargo e as inscrições; null se não tem a ver com Odontologia */
export function parseDetalhe(html: string, url: string, fonte: string): Raw | null {
  const limpo = html.replace(/<(script|style|noscript|nav|header|footer|aside|form|svg)\b[\s\S]*?<\/\1>/gi, ' ')
  const blocos = limpo.match(/<(article|main)\b[\s\S]*?<\/\1>/gi)
  const conteudo = blocos?.length ? blocos.reduce((a, b) => (b.length > a.length ? b : a)) : limpo
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
  const tt = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  const titulo = stripTags(h1 || tt || '').replace(/\s*[·|–-]\s*(JC Concursos|Ache Concursos|Concursos no Brasil|PCI Concursos)\s*$/i, '').trim()
  if (!titulo) return null
  // texto de links (provas antigas, outros concursos, menus) não conta como cargo do concurso
  const texto = stripTags(conteudo.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, ' '))
  const n = norm(texto)
  // procura o cargo depois de apagar (mantendo as posições) auxiliares/técnicos e exames odontológicos
  const dm = n.replace(AUX, (m) => ' '.repeat(m.length)).search(DENT)
  // residência só quando é o assunto da página (título), não "residência em Ginecologia" exigida de um médico
  const tn = norm(titulo)
  const ehResid = (RESID.test(tn) && (dm >= 0 || MULTI.test(n))) || MULTI.test(tn)
  const ehEnare = ENARE.test(tn)
  if (dm < 0 && !ehResid && !ehEnare) return null
  const partes: string[] = []
  if (dm >= 0) partes.push(trecho(texto, dm, 200, 250))
  const im = n.search(/inscri[cç](?:o|oe)es?[^.]{0,80}?(?:ate|a)\s*(?:o dia\s*)?\d{1,2}(?:\/| de )/)
  if (im >= 0) partes.push(trecho(texto, im, 0, 160))
  return { titulo, url, fonte, texto: partes.join(' '), dentista: dm >= 0 && !ehResid && !ehEnare ? true : undefined }
}
