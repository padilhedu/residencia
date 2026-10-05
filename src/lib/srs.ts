import type { Attempt, Letter, Question } from './types'
import { DAY } from './dates'

/**
 * Revisão espaçada guiada pelo % de acerto.
 *
 * 1. Errou (ou marcou "chutei") → a questão entra na fila: 1 dia, depois 3, 7, 15, 30 e 60 dias a cada acerto.
 *    Errou de novo na revisão → volta para 1 dia.
 * 2. Os intervalos encolhem nos temas com menor % de acerto (até metade) e esticam nos dominados.
 * 3. Acertou de primeira num tema fraco (< 70%) → a questão volta em 15 dias para confirmar.
 * 4. A fila do dia é ordenada do tema mais fraco para o mais forte.
 */
export const INTERVALS = [1, 3, 7, 15, 30, 60]
export const WEAK = 0.7
export const MIN_ATTEMPTS_FOR_STATS = 3

export interface Card {
  qid: string
  topic: string
  box: number
  reps: number
  lapses: number
  firstAt: number
  lastAt: number
  firstCorrect: boolean
  lastCorrect: boolean
}

export interface TopicStat {
  topic: string
  total: number
  correct: number
  acc: number
  /** Questões distintas já respondidas no tema */
  seen: number
}

export type Overrides = Record<string, Letter | undefined>

export const effectiveAnswer = (q: Question, overrides: Overrides): Letter => overrides[q.id] ?? q.answer

export function isRight(a: Attempt, q: Question | undefined, overrides: Overrides): boolean {
  if (!q) return a.correct && !a.guessed
  return a.selected === effectiveAnswer(q, overrides) && !a.guessed
}

const byTime = (a: Attempt, b: Attempt) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0)

export function buildCards(attempts: Attempt[], qmap: Map<string, Question>, overrides: Overrides): Map<string, Card> {
  const cards = new Map<string, Card>()
  for (const a of [...attempts].sort(byTime)) {
    const q = qmap.get(a.qid)
    if (!q) continue
    const ok = isRight(a, q, overrides)
    const t = Date.parse(a.at)
    const c = cards.get(a.qid)
    if (!c) {
      cards.set(a.qid, { qid: a.qid, topic: q.topic, box: ok ? 3 : 0, reps: 1, lapses: ok ? 0 : 1, firstAt: t, lastAt: t, firstCorrect: ok, lastCorrect: ok })
      continue
    }
    c.reps++
    c.lastAt = t
    c.lastCorrect = ok
    if (ok) c.box = Math.min(c.box + 1, INTERVALS.length - 1)
    else {
      c.box = 0
      c.lapses++
    }
  }
  return cards
}

export function topicStats(attempts: Attempt[], qmap: Map<string, Question>, overrides: Overrides): Map<string, TopicStat> {
  const m = new Map<string, TopicStat & { qs: Set<string> }>()
  for (const a of attempts) {
    const q = qmap.get(a.qid)
    if (!q) continue
    const s = m.get(q.topic) ?? { topic: q.topic, total: 0, correct: 0, acc: 0, seen: 0, qs: new Set<string>() }
    s.total++
    if (isRight(a, q, overrides)) s.correct++
    s.qs.add(a.qid)
    m.set(q.topic, s)
  }
  const out = new Map<string, TopicStat>()
  for (const [k, s] of m) out.set(k, { topic: k, total: s.total, correct: s.correct, acc: s.total ? s.correct / s.total : 0, seen: s.qs.size })
  return out
}

/** Multiplicador do intervalo conforme o % de acerto do tema */
export function factorFor(stat: TopicStat | undefined): number {
  if (!stat || stat.total < MIN_ATTEMPTS_FOR_STATS) return 1
  if (stat.acc < 0.5) return 0.5
  if (stat.acc < WEAK) return 0.75
  if (stat.acc < 0.85) return 1
  return 1.4
}

/** Momento (ms) em que o cartão vence, ou null se não precisa de revisão */
export function dueAt(card: Card, stat: TopicStat | undefined): number | null {
  const f = factorFor(stat)
  if (card.reps === 1 && card.firstCorrect) {
    const weak = stat && stat.total >= MIN_ATTEMPTS_FOR_STATS && stat.acc < WEAK
    return weak ? card.lastAt + 15 * DAY * f : null
  }
  const days = Math.max(0.5, INTERVALS[card.box] * f)
  return card.lastAt + days * DAY
}

export interface DueCard extends Card {
  due: number
  acc: number | null
}

/** Cartões vencidos até `until`, do tema mais fraco para o mais forte */
export function dueCards(cards: Map<string, Card>, stats: Map<string, TopicStat>, until: number): DueCard[] {
  const out: DueCard[] = []
  for (const c of cards.values()) {
    const st = stats.get(c.topic)
    const d = dueAt(c, st)
    if (d !== null && d <= until) out.push({ ...c, due: d, acc: st && st.total >= MIN_ATTEMPTS_FOR_STATS ? st.acc : null })
  }
  return out.sort((a, b) => (a.acc ?? 1) - (b.acc ?? 1) || a.due - b.due)
}

/** Próximas revisões por dia (para o calendário da fila) */
export function upcoming(cards: Map<string, Card>, stats: Map<string, TopicStat>, from: number, days: number): number[] {
  const counts = Array.from({ length: days }, () => 0)
  for (const c of cards.values()) {
    const d = dueAt(c, stats.get(c.topic))
    if (d === null) continue
    const idx = Math.floor((d - from) / DAY)
    if (idx >= 0 && idx < days) counts[idx]++
  }
  return counts
}

/** Temas com dados suficientes, do menor para o maior % de acerto */
export function weakTopics(stats: Map<string, TopicStat>, min = MIN_ATTEMPTS_FOR_STATS): TopicStat[] {
  return [...stats.values()].filter((s) => s.total >= min).sort((a, b) => a.acc - b.acc || b.total - a.total)
}

/**
 * Sessão de reforço: questões dos temas mais fracos, priorizando
 * (1) nunca respondidas, (2) erradas na última tentativa, (3) as demais.
 */
export function reinforcement(topics: string[], questions: Question[], cards: Map<string, Card>, n: number, rand = Math.random): string[] {
  const pool = questions.filter((q) => topics.includes(q.topic))
  const shuffle = <T,>(a: T[]) => {
    const r = [...a]
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[r[i], r[j]] = [r[j], r[i]]
    }
    return r
  }
  const unseen = shuffle(pool.filter((q) => !cards.has(q.id)))
  const wrong = shuffle(pool.filter((q) => cards.get(q.id)?.lastCorrect === false))
  const rest = shuffle(pool.filter((q) => cards.get(q.id)?.lastCorrect === true))
  return [...unseen, ...wrong, ...rest].slice(0, n).map((q) => q.id)
}

/** Prazo da próxima revisão teórica de um tema, em dias, conforme o acerto */
export function theoryInterval(stat: TopicStat | undefined): number {
  if (!stat || stat.total < MIN_ATTEMPTS_FOR_STATS) return 7
  if (stat.acc < 0.5) return 3
  if (stat.acc < WEAK) return 7
  if (stat.acc < 0.85) return 14
  return 30
}

export type QStatus = 'nova' | 'errada' | 'acertada' | 'dominada'

export function questionStatus(card: Card | undefined): QStatus {
  if (!card) return 'nova'
  if (!card.lastCorrect) return 'errada'
  return card.box >= 4 ? 'dominada' : 'acertada'
}
