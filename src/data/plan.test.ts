import { describe, expect, it } from 'vitest'
import { buildPlan, currentWeek } from './plan'

describe('cronograma', () => {
  const weeks = buildPlan('2026-10-05', '2026-11-22', '2027-09-12')
  const fdt = weeks.filter((w) => w.phase === 'fdt')
  const enare = weeks.filter((w) => w.phase === 'enare')

  it('fase FDT: 7 semanas de 05/10 até a prova em 22/11', () => {
    expect(fdt).toHaveLength(7)
    expect(fdt[0].start).toBe('2026-10-05')
    expect(fdt[6].title).toBe('Reta final FDT')
    expect(fdt[6].end).toBe('2026-11-22')
  })

  it('fase ENARE começa na segunda após a FDT e termina na semana da prova', () => {
    expect(enare[0].start).toBe('2026-11-23')
    expect(enare[enare.length - 1].title).toBe('Semana da prova ENARE')
    expect(enare[enare.length - 1].end).toBe('2027-09-12')
    expect(enare.some((w) => w.title.startsWith('Semana leve'))).toBe(true)
  })

  it('ids de itens são únicos (o checklist depende disso)', () => {
    const ids = weeks.flatMap((w) => w.items.map((i) => i.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('cobre todos os temas na fase ENARE', () => {
    const topics = new Set(enare.flatMap((w) => w.topics))
    expect(topics.size).toBeGreaterThanOrEqual(30)
  })

  it('comprime as semanas se a prova for antecipada', () => {
    const short = buildPlan('2026-10-05', '2026-10-25', '2027-01-31').filter((w) => w.phase === 'fdt')
    expect(short).toHaveLength(3)
    expect(short[2].title).toBe('Reta final FDT')
    expect(short.flatMap((w) => w.topics)).toContain('sb-col')
  })

  it('identifica a semana atual', () => {
    expect(currentWeek(weeks, '2026-10-07')?.id).toBe('fdt-1')
  })
})
