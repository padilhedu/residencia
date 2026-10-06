import { describe, expect, it } from 'vitest'
import { OFFICIAL, FDT2022_KEY, parseKey } from './official'
import { QUESTIONS } from './exams'

describe('gabaritos oficiais', () => {
  it('cada gabarito definitivo tem uma resposta por questão', () => {
    for (const k of OFFICIAL.filter((o) => o.status === 'definitivo')) {
      const n = QUESTIONS.filter((q) => q.exam === k.exam).length
      expect(k.answers, k.exam).toMatch(new RegExp(`^[A-E*]{${n}}$`))
    }
    expect(FDT2022_KEY.answers).toMatch(/^[A-E]{60}$/)
  })

  it('divergências entre a resolução de estudo e a banca são exatamente as conferidas', () => {
    const diverge = QUESTIONS.filter((q) => q.myAnswer).map((q) => q.id).sort()
    expect(diverge).toEqual(['fdt2023-14', 'fdt2023-26', 'fdt2023-28', 'fdt2023-40', 'fdt2024-17', 'fdt2024-60', 'fdt2025-49'])
  })

  it('aplica o gabarito oficial e marca anuladas', () => {
    const q49 = QUESTIONS.find((q) => q.id === 'fdt2025-49')!
    expect(q49.answer).toBe(q49.official)
    const annulled = QUESTIONS.filter((q) => q.official === '*').map((q) => q.id)
    expect(annulled).toContain('fdt2025-04')
    expect(annulled.every((id) => !QUESTIONS.find((q) => q.id === id)!.myAnswer)).toBe(true)
    // ENARE ainda sem gabarito definitivo
    expect(QUESTIONS.some((q) => q.exam === 'enare2026' && q.official)).toBe(false)
  })

  it('importa gabarito colado em formatos comuns', () => {
    expect(parseKey('1-C 2-A 3-* 4-E', 4)).toBe('CA*E')
    expect(parseKey('1 C\n2 A\n3 X\n4 e', 4)).toBe('CA*E')
    expect(parseKey('cabde', 5)).toBe('CABDE')
    expect(parseKey('CAB', 4)).toBeNull()
  })
})
