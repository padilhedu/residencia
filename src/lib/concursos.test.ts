import { describe, expect, it } from 'vitest'
import { ativo, situacao, type Concurso } from './concursos'

const c = (p: Partial<Concurso>): Concurso => ({
  id: '1', categoria: 'sc', titulo: 't', orgao: null, uf: 'SC', url: 'u', fonte: 'f', resumo: null, vagas: null, salario: null,
  inscricoes_ate: null, publicado_em: null, primeiro_visto: '2026-11-01T00:00:00Z', visto_em: '2026-11-12T00:00:00Z', ...p
})

describe('situação das inscrições', () => {
  it('por prazo', () => {
    expect(situacao(c({ inscricoes_ate: '2026-12-30' }), '2026-11-13')).toBe('aberto')
    expect(situacao(c({ inscricoes_ate: '2026-11-18' }), '2026-11-13')).toBe('encerrando')
    expect(situacao(c({ inscricoes_ate: '2026-11-12' }), '2026-11-13')).toBe('encerrado')
    expect(situacao(c({}), '2026-11-13')).toBe('sem-data')
  })
  it('sem data fica ativo enquanto as fontes ainda listam', () => {
    expect(ativo(c({}), '2026-11-13')).toBe(true)
    expect(ativo(c({ visto_em: '2026-09-01T00:00:00Z' }), '2026-11-13')).toBe(false)
    expect(ativo(c({ inscricoes_ate: '2026-11-01' }), '2026-11-13')).toBe(false)
  })
})
