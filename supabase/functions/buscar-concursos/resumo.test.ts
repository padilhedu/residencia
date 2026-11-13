import { describe, expect, it } from 'vitest'
import { resumoSemanal } from './resumo'
import type { Item } from './parse'

const item = (titulo: string, categoria: Item['categoria']): Item => ({
  id: titulo, categoria, titulo, orgao: null, uf: null, url: 'u', fonte: 'f', resumo: null, vagas: null, salario: null, inscricoes_ate: null, publicado_em: null
})

describe('resumo semanal', () => {
  it('lista os novos e avisa prazos terminando', () => {
    const m = resumoSemanal({
      novos: [item('Prefeitura de Lages - SC', 'sc'), item('ENARE 2028', 'enare')],
      abertos: [{ id: 'x', categoria: 'sc', titulo: 't', inscricoes_ate: '2026-11-18' }, { id: 'y', categoria: 'sc', titulo: 't', inscricoes_ate: '2026-12-30' }],
      hoje: '2026-11-16',
      categorias: null
    })!
    expect(m.title).toBe('2 editais novos para dentistas')
    expect(m.body).toBe('• Prefeitura de Lages - SC\n• ENARE 2028\n⏰ 1 inscrição encerra em até 7 dias')
  })
  it('respeita as categorias escolhidas e não manda nada se não houver novidade', () => {
    const p = { novos: [item('ENARE 2028', 'enare')], abertos: [], hoje: '2026-11-16', categorias: ['sc' as const] }
    expect(resumoSemanal(p)).toBeNull()
    expect(resumoSemanal({ ...p, primeira: true })?.title).toBe('Radar de concursos ativado')
  })
})
