import { useMemo } from 'react'
import { QMAP, examName } from '../data/exams'
import { LEI_SECA } from '../data/leiseca'
import { answerOf, type Study } from './study'
import { deckQueue, questionCard, type CardState, type Deck, type Flashcard, type QueueInfo } from './flash'
import type { Data } from './store'
import { dueAt } from './srs'
import { DAY, toISO } from './dates'

export function cardStatesOf(d: Data): Map<string, CardState> {
  const m = new Map<string, CardState>()
  for (const e of Object.values(d.state)) {
    if (e.kind !== 'card' || !e.value || typeof e.value !== 'object') continue
    const v = e.value as CardState
    if (typeof v.due === 'number') m.set(e.key, v)
  }
  return m
}

/** Um cartão para cada questão que você já errou (ou chutou), exceto anuladas */
export function errorCards(study: Study): Flashcard[] {
  const out: Flashcard[] = []
  for (const c of study.cards.values()) {
    if (c.lapses === 0) continue
    const q = QMAP.get(c.qid)
    if (!q || study.annulled.has(q.id)) continue
    out.push(questionCard(q, answerOf(q, study.overrides), examName(q.exam)))
  }
  return out
}

export interface FlashData {
  states: Map<string, CardState>
  decks: Record<Deck, Flashcard[]>
  queues: Record<Deck, QueueInfo>
  /** Cartões para hoje (vencidos + novos liberados) somando os dois baralhos */
  today: number
}

export function useFlash(study: Study): FlashData {
  return useMemo(() => {
    const states = cardStatesOf(study.d)
    const decks = { erros: errorCards(study), lei: LEI_SECA }
    const now = Date.now()
    const queues = {
      erros: deckQueue(decks.erros, states, study.stats, now),
      lei: deckQueue(decks.lei, states, study.stats, now)
    }
    const today = queues.erros.due.length + queues.erros.fresh.length + queues.lei.due.length + queues.lei.fresh.length
    return { states, decks, queues, today }
  }, [study])
}

/** Previsão de revisões por dia local ([questões, flashcards]) — usada pelo lembrete diário no servidor */
export interface Forecast {
  tz: string
  days: Record<string, [number, number]>
}

export function buildForecast(study: Study, flash: FlashData, now = Date.now(), horizonDays = 60): Forecast {
  const today = toISO(new Date(now))
  const limit = toISO(new Date(now + horizonDays * DAY))
  const days = new Map<string, [number, number]>()
  const add = (ms: number, i: 0 | 1) => {
    let k = toISO(new Date(ms))
    if (k < today) k = today // atrasadas contam como de hoje
    if (k > limit) return
    const v = days.get(k) ?? [0, 0]
    v[i]++
    days.set(k, v)
  }
  for (const c of study.cards.values()) {
    const t = dueAt(c, study.stats.get(c.topic))
    if (t !== null) add(t, 0)
  }
  const ids = new Set([...flash.decks.erros, ...flash.decks.lei].map((c) => c.id))
  for (const [id, s] of flash.states) if (ids.has(id)) add(s.due, 1)
  const sorted = [...days.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))
  return { tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo', days: Object.fromEntries(sorted) }
}

/** Comparação estável (o jsonb do Postgres reordena chaves) */
export function sameForecast(a: Forecast | undefined, b: Forecast): boolean {
  if (!a || a.tz !== b.tz) return false
  const ka = Object.keys(a.days ?? {}).sort()
  const kb = Object.keys(b.days).sort()
  if (ka.length !== kb.length) return false
  return kb.every((k, i) => ka[i] === k && a.days[k]?.[0] === b.days[k][0] && a.days[k]?.[1] === b.days[k][1])
}
