import { describe, expect, it } from 'vitest'
import { buildCards, dueAt, dueCards, factorFor, reinforcement, topicStats, weakTopics } from './srs'
import type { Attempt, Question } from './types'
import { DAY } from './dates'

const q = (id: string, topic: string, answer: 'A' | 'B' = 'A'): Question => ({
  id, exam: 'fdt2025', n: 1, block: 'especificos', topic, stem: '', opts: { A: 'a', B: 'b' }, answer, ex: ''
})
const QS = [q('q1', 'anest'), q('q2', 'anest'), q('q3', 'anest'), q('q4', 'cir'), q('q5', 'cir')]
const QMAP = new Map(QS.map((x) => [x.id, x]))
const T0 = Date.parse('2026-10-05T12:00:00Z')
let n = 0
const att = (qid: string, selected: 'A' | 'B', dayOffset: number, guessed = false): Attempt => ({
  id: `a${n++}`, qid, selected, correct: selected === 'A', guessed, mode: 'treino', at: new Date(T0 + dayOffset * DAY).toISOString()
})

describe('buildCards', () => {
  it('erro na 1ª tentativa vai para a caixa 0 e acerto posterior avança', () => {
    const cards = buildCards([att('q1', 'B', 0), att('q1', 'A', 1)], QMAP, {})
    const c = cards.get('q1')!
    expect(c.box).toBe(1)
    expect(c.lapses).toBe(1)
    expect(c.lastCorrect).toBe(true)
  })
  it('"chutei" conta como erro', () => {
    const c = buildCards([att('q1', 'A', 0, true)], QMAP, {}).get('q1')!
    expect(c.firstCorrect).toBe(false)
    expect(c.box).toBe(0)
  })
  it('correção de gabarito pelo usuário muda a correção das tentativas', () => {
    const c = buildCards([att('q1', 'B', 0)], QMAP, { q1: 'B' }).get('q1')!
    expect(c.firstCorrect).toBe(true)
  })
})

describe('intervalos guiados pelo % de acerto', () => {
  it('tema fraco encurta o intervalo pela metade', () => {
    const attempts = [att('q1', 'B', 0), att('q2', 'B', 0), att('q3', 'B', 0)]
    const stats = topicStats(attempts, QMAP, {})
    expect(stats.get('anest')!.acc).toBe(0)
    expect(factorFor(stats.get('anest'))).toBe(0.5)
    const c = buildCards(attempts, QMAP, {}).get('q1')!
    expect(dueAt(c, stats.get('anest'))).toBe(c.lastAt + 0.5 * DAY)
  })
  it('acerto de primeira só volta se o tema estiver fraco', () => {
    const strong = [att('q4', 'A', 0), att('q5', 'A', 0), att('q4', 'A', 1)]
    const s = topicStats(strong, QMAP, {})
    const c5 = buildCards(strong, QMAP, {}).get('q5')!
    expect(dueAt(c5, s.get('cir'))).toBeNull()

    const weak = [att('q1', 'A', 0), att('q2', 'B', 0), att('q3', 'B', 0)]
    const sw = topicStats(weak, QMAP, {})
    const c1 = buildCards(weak, QMAP, {}).get('q1')!
    expect(dueAt(c1, sw.get('anest'))).toBe(c1.lastAt + 15 * DAY * 0.5)
  })
  it('fila do dia começa pelo tema mais fraco', () => {
    const attempts = [
      att('q1', 'B', 0), att('q2', 'B', 0), att('q3', 'B', 0), // anest 0%
      att('q4', 'B', 0), att('q5', 'A', 0), att('q4', 'A', 0.1), att('q5', 'A', 0.1) // cir 75%
    ]
    const stats = topicStats(attempts, QMAP, {})
    const cards = buildCards(attempts, QMAP, {})
    const due = dueCards(cards, stats, T0 + 30 * DAY)
    expect(due[0].topic).toBe('anest')
    expect(weakTopics(stats)[0].topic).toBe('anest')
  })
})

describe('reforço', () => {
  it('prioriza não respondidas, depois erradas', () => {
    const cards = buildCards([att('q1', 'B', 0), att('q2', 'A', 0)], QMAP, {})
    const ids = reinforcement(['anest'], QS, cards, 3, () => 0)
    expect(ids).toEqual(['q3', 'q1', 'q2'])
  })
})
