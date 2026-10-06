import { describe, expect, it } from 'vitest'
import { deckQueue, schedule, type CardState, type Flashcard } from './flash'
import { DAY } from './dates'
import { LEI_SECA } from '../data/leiseca'

const NOW = new Date('2026-10-05T10:00:00').getTime()
const card = (id: string, topic = 'sus-leg'): Flashcard => ({ id, deck: 'lei', group: 'g', topic, f: 'f', b: 'b' })

describe('flashcards', () => {
  it('Errei volta em 10 minutos; Bom no cartão novo vai para 1 dia, depois 3', () => {
    const a = schedule(undefined, 0, NOW)
    expect(a.ivl).toBe(0)
    expect(a.due - NOW).toBe(10 * 60_000)
    const b = schedule(undefined, 2, NOW)
    expect(b.ivl).toBe(1)
    const c = schedule(b, 2, NOW + DAY)
    expect(c.ivl).toBe(3)
    const d = schedule(c, 2, NOW + 4 * DAY)
    expect(d.ivl).toBeGreaterThan(6)
  })

  it('tema fraco encurta o intervalo', () => {
    const base: CardState = { due: NOW, ivl: 10, ease: 2.5, reps: 3, lapses: 0, first: '2026-09-01', last: NOW }
    const strong = schedule(base, 2, NOW)
    const weak = schedule(base, 2, NOW, { topic: 't', total: 10, correct: 3, acc: 0.3, seen: 10 })
    expect(weak.ivl).toBeLessThan(strong.ivl)
  })

  it('fila: vencidos primeiro e limite diário de novos', () => {
    const cards = Array.from({ length: 30 }, (_, i) => card(`c${i}`))
    const states = new Map<string, CardState>([
      ['c0', { due: NOW - DAY, ivl: 1, ease: 2.5, reps: 1, lapses: 0, first: '2026-10-04', last: NOW - DAY }],
      ['c1', { due: NOW + 5 * DAY, ivl: 6, ease: 2.5, reps: 2, lapses: 0, first: '2026-10-01', last: NOW - DAY }]
    ])
    const q = deckQueue(cards, states, new Map(), NOW, 20)
    expect(q.due.map((c) => c.id)).toEqual(['c0'])
    expect(q.fresh).toHaveLength(20)
    expect(q.waiting).toBe(8)
  })

  it('baralho de lei seca tem ids únicos e fonte em todos os cartões', () => {
    const ids = new Set(LEI_SECA.map((c) => c.id))
    expect(ids.size).toBe(LEI_SECA.length)
    expect(LEI_SECA.every((c) => c.src && c.f && c.b)).toBe(true)
    expect(LEI_SECA.length).toBeGreaterThan(60)
  })
})
