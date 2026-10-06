import type { Question } from './types'
import { DAY, toISO } from './dates'
import { factorFor, type TopicStat } from './srs'

/**
 * Flashcards com revisão espaçada própria (estilo Anki simplificado).
 *
 * - Baralho "Meus erros": nasce sozinho de cada questão que você errou (ou chutou), com o ponto-chave da questão.
 * - Baralho "Lei seca": trechos literais/quase literais das normas cobradas (CF, Lei 8.080, 8.142, Decreto 7.508...).
 * - Notas: Errei (volta em 10 min), Difícil, Bom e Fácil. O intervalo encurta nos temas com menor % de acerto.
 */
export type Deck = 'erros' | 'lei'

export interface Flashcard {
  /** 'q:<qid>' para cartões de questões; 'lei:<id>' para lei seca */
  id: string
  deck: Deck
  /** Agrupamento exibido (prova ou norma) */
  group: string
  topic: string
  /** Frente e verso (HTML simples: <b>, <i>, <br>) */
  f: string
  b: string
  /** Dispositivo/fonte (ex.: "Lei 8.080/90, art. 7º, IV") */
  src?: string
  url?: string
  qid?: string
}

export interface CardState {
  /** Vence a partir deste instante (ms) */
  due: number
  /** Intervalo atual em dias (0 = reaprendendo) */
  ivl: number
  ease: number
  reps: number
  lapses: number
  /** Dia (ISO) em que o cartão foi estudado pela primeira vez */
  first: string
  last: number
}

export type Grade = 0 | 1 | 2 | 3
export const GRADES: { g: Grade; label: string; tone: string }[] = [
  { g: 0, label: 'Errei', tone: 'no' },
  { g: 1, label: 'Difícil', tone: 'gold' },
  { g: 2, label: 'Bom', tone: 'ok' },
  { g: 3, label: 'Fácil', tone: 'ok' }
]

export const RELEARN_MS = 10 * 60_000
export const MAX_IVL = 180
export const NEW_PER_DAY = 20

const startOfDay = (ms: number) => {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Próximo estado do cartão após a nota `g` */
export function schedule(prev: CardState | undefined, g: Grade, now: number, stat?: TopicStat): CardState {
  const ivl0 = prev?.ivl ?? 0
  let ease = prev?.ease ?? 2.5
  const base = {
    reps: (prev?.reps ?? 0) + 1,
    lapses: prev?.lapses ?? 0,
    first: prev?.first ?? toISO(new Date(now)),
    last: now
  }
  if (g === 0) {
    return { ...base, due: now + RELEARN_MS, ivl: 0, ease: Math.max(1.3, ease - 0.2), lapses: base.lapses + (prev && prev.ivl > 0 ? 1 : 0) }
  }
  let ivl: number
  if (g === 1) {
    ivl = ivl0 < 1 ? 1 : Math.max(ivl0 + 1, ivl0 * 1.2)
    ease = Math.max(1.3, ease - 0.15)
  } else if (g === 2) {
    ivl = ivl0 < 1 ? 1 : ivl0 < 3 ? 3 : ivl0 * ease
  } else {
    ivl = ivl0 < 1 ? 4 : ivl0 * ease * 1.3
    ease = ease + 0.15
  }
  // temas fracos voltam antes; dominados, depois
  ivl = Math.min(MAX_IVL, Math.max(1, Math.round(ivl * factorFor(stat))))
  return { ...base, due: startOfDay(now) + ivl * DAY, ivl, ease }
}

/** Texto curto do intervalo que cada nota daria (mostrado nos botões) */
export function previewLabel(prev: CardState | undefined, g: Grade, now: number, stat?: TopicStat): string {
  const s = schedule(prev, g, now, stat)
  if (s.ivl === 0) return '10 min'
  if (s.ivl < 30) return `${s.ivl} d`
  if (s.ivl < 365) return `${Math.round(s.ivl / 30)} m`
  return `${(s.ivl / 365).toFixed(1)} a`
}

/** Cartão gerado a partir da questão (frente e verso autorais quando existem; senão, o próprio enunciado) */
export function questionCard(q: Question, answer: string, examName: string): Flashcard {
  if (q.card) return { id: `q:${q.id}`, deck: 'erros', group: examName, topic: q.topic, f: q.card.f, b: q.card.b, src: `${examName}, Q${q.n}`, qid: q.id }
  const opt = q.opts[answer as keyof typeof q.opts] ?? ''
  return {
    id: `q:${q.id}`, deck: 'erros', group: examName, topic: q.topic,
    f: escapeHtml(q.stem).replace(/\n/g, '<br>'),
    b: `<b>${answer})</b> ${escapeHtml(opt)}<br><br>${q.ex}`,
    src: `${examName}, Q${q.n}`, qid: q.id
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export interface QueueInfo {
  /** Revisões vencidas (já estudadas antes) */
  due: Flashcard[]
  /** Cartões novos liberados hoje (respeitando o limite diário) */
  fresh: Flashcard[]
  /** Novos que ainda aguardam (além do limite) */
  waiting: number
}

/**
 * Fila de estudo do baralho: vencidos primeiro (do tema mais fraco para o mais forte),
 * depois os novos, até `NEW_PER_DAY` novos por dia e por baralho.
 */
export function deckQueue(cards: Flashcard[], states: Map<string, CardState>, stats: Map<string, TopicStat>, now: number, newPerDay = NEW_PER_DAY): QueueInfo {
  const end = startOfDay(now) + DAY - 1
  const today = toISO(new Date(now))
  const acc = (t: string) => {
    const s = stats.get(t)
    return s && s.total >= 3 ? s.acc : 1
  }
  const due: Flashcard[] = []
  const fresh: Flashcard[] = []
  let startedToday = 0
  for (const c of cards) {
    const st = states.get(c.id)
    if (!st) fresh.push(c)
    else {
      if (st.first === today) startedToday++
      if (st.due <= end) due.push(c)
    }
  }
  due.sort((a, b) => acc(a.topic) - acc(b.topic) || states.get(a.id)!.due - states.get(b.id)!.due)
  fresh.sort((a, b) => acc(a.topic) - acc(b.topic))
  const room = Math.max(0, newPerDay - startedToday)
  return { due, fresh: fresh.slice(0, room), waiting: Math.max(0, fresh.length - room) }
}

/** Instantes (ms) em que cada cartão estudado vence — usados no lembrete diário */
export function cardDueTimes(states: Map<string, CardState>, ids: Set<string>): number[] {
  const out: number[] = []
  for (const [id, s] of states) if (ids.has(id)) out.push(s.due)
  return out
}
