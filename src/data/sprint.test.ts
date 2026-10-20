import { describe, expect, it } from 'vitest'
import { SPRINT, SPRINT_DAYS } from './sprint'
import { QUESTIONS } from './exams'
import { TOPIC_MAP } from './topics'

describe('plano de 30 dias (FDT 2026)', () => {
  it('cobre todos os dias de 20/10 até a prova, sem buracos', () => {
    expect(SPRINT_DAYS[0].date).toBe(SPRINT.start)
    expect(SPRINT_DAYS[SPRINT_DAYS.length - 1].date).toBe(SPRINT.exam)
    for (let i = 1; i < SPRINT_DAYS.length; i++) {
      const a = new Date(SPRINT_DAYS[i - 1].date + 'T12:00')
      const b = new Date(SPRINT_DAYS[i].date + 'T12:00')
      expect(Math.round((b.getTime() - a.getTime()) / 86_400_000)).toBe(1)
    }
  })

  it('ids das tarefas são únicos e os temas existem e têm questões', () => {
    const items = SPRINT_DAYS.flatMap((d) => d.items)
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length)
    for (const it of items) for (const t of it.topics ?? []) {
      expect(TOPIC_MAP.has(t), t).toBe(true)
      expect(QUESTIONS.some((q) => q.topic === t), t).toBe(true)
    }
  })

  it('os 3 temas que mais caem nas específicas da FDT ganham mais dias de questões', () => {
    const days = (t: string) => SPRINT_DAYS.filter((d) => d.items.some((i) => i.topics?.includes(t))).length
    for (const t of ['cir', 'ctbmf', 'sb-col']) expect(days(t)).toBeGreaterThanOrEqual(3)
  })
})
