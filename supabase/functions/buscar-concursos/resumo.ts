// Texto da notificação semanal do radar de concursos (puro, testado em resumo.test.ts)
import type { Categoria, Item } from './parse.ts'

export interface Ativo {
  id: string
  categoria: Categoria
  titulo: string
  inscricoes_ate: string | null
}

export interface Msg {
  title: string
  body: string
  url: string
  tag: string
}

const TODAS: Categoria[] = ['sc', 'enare', 'residencia']
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

export function resumoSemanal(p: { novos: Item[]; abertos: Ativo[]; hoje: string; categorias: Categoria[] | null; primeira?: boolean }): Msg | null {
  const cats = Array.isArray(p.categorias) && p.categorias.length ? p.categorias : TODAS
  const novos = p.novos.filter((n) => cats.includes(n.categoria))
  const abertos = p.abertos.filter((a) => cats.includes(a.categoria))
  const limite = new Date(Date.parse(p.hoje) + 7 * 864e5).toISOString().slice(0, 10)
  const encerrando = abertos.filter((a) => a.inscricoes_ate && a.inscricoes_ate >= p.hoje && a.inscricoes_ate <= limite)
  if (!novos.length && !encerrando.length && !p.primeira) return null

  const linhas: string[] = []
  for (const n of novos.slice(0, 3)) linhas.push(`• ${n.titulo}`)
  if (novos.length > 3) linhas.push(`…e mais ${novos.length - 3}`)
  if (encerrando.length) linhas.push(`⏰ ${plural(encerrando.length, 'inscrição encerra', 'inscrições encerram')} em até 7 dias`)
  if (!linhas.length) linhas.push('Nenhum edital novo nesta semana. Toque para ver a lista.')

  const title = p.primeira
    ? 'Radar de concursos ativado'
    : novos.length
      ? `${plural(novos.length, 'edital novo', 'editais novos')} para dentistas`
      : 'Concursos: prazos terminando'
  return { title, body: linhas.join('\n'), url: '/#/concursos', tag: 'concursos-semana' }
}
