import { useEffect, useSyncExternalStore } from 'react'
import { supabase } from './supabase'
import { store, valueOf, type Data } from './store'
import { todayISO } from './dates'

// Radar de concursos: lê a tabela pública `concursos` (preenchida toda segunda pela Edge Function buscar-concursos)
// e guarda uma cópia no aparelho para abrir sem internet.

export type Categoria = 'sc' | 'enare' | 'residencia'

export interface Concurso {
  id: string
  categoria: Categoria
  titulo: string
  orgao: string | null
  uf: string | null
  url: string
  fonte: string
  resumo: string | null
  vagas: string | null
  salario: string | null
  inscricoes_ate: string | null
  publicado_em: string | null
  primeiro_visto: string
  visto_em: string
}

/** Acompanhamento do usuário (sincroniza como user_state 'concurso') */
export interface Track {
  fav?: boolean
  inscrito?: boolean
  oculto?: boolean
}

export const CATEGORIAS: { id: Categoria; nome: string; desc: string }[] = [
  { id: 'sc', nome: 'Concursos SC', desc: 'Prefeituras, consórcios, estado e autarquias em Santa Catarina' },
  { id: 'enare', nome: 'ENARE', desc: 'Exame Nacional de Residência (Ebserh/FGV)' },
  { id: 'residencia', nome: 'Residências', desc: 'Residências uni e multiprofissionais com vaga para Odontologia no Brasil' }
]

/** Sites para conferir à mão (editais oficiais e principais bancas de SC) */
export const FONTES_MANUAIS: { nome: string; url: string; cat: Categoria | 'todas' }[] = [
  { nome: 'Ebserh — ENARE (página oficial)', url: 'https://www.gov.br/ebserh/pt-br/ensino-e-pesquisa/enare', cat: 'enare' },
  { nome: 'FGV Conhecimento — concursos', url: 'https://conhecimento.fgv.br/concursos', cat: 'enare' },
  { nome: 'PCI Concursos — Santa Catarina', url: 'https://www.pciconcursos.com.br/concursos/sc/', cat: 'sc' },
  { nome: 'FEPESE (banca catarinense)', url: 'https://fepese.org.br/', cat: 'sc' },
  { nome: 'Secretaria de Estado da Saúde de SC', url: 'https://www.saude.sc.gov.br/', cat: 'sc' },
  { nome: 'CRO-SC', url: 'https://www.crosc.org.br/', cat: 'sc' },
  { nome: 'Fundatec (FDT e outras residências)', url: 'https://www.fundatec.org.br/', cat: 'residencia' },
  { nome: 'Concursos no Brasil — SC', url: 'https://concursosnobrasil.com/concursos/sc/', cat: 'sc' },
  { nome: 'JC Concursos — SC', url: 'https://jcconcursos.com.br/concursos/sc', cat: 'sc' },
  { nome: 'PCI Concursos — cargo Dentista (Brasil)', url: 'https://www.pciconcursos.com.br/cargos/dentista', cat: 'residencia' }
]

const CACHE_KEY = 'residencia-odonto:concursos'

interface Snap {
  items: Concurso[]
  loadedAt?: string
  loading: boolean
  error?: string
}

function loadCache(): Snap {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const c = JSON.parse(raw) as { items: Concurso[]; loadedAt: string }
      if (Array.isArray(c.items)) return { items: c.items, loadedAt: c.loadedAt, loading: false }
    }
  } catch {
    /* sem cache */
  }
  return { items: [], loading: false }
}

let snap: Snap = loadCache()
const listeners = new Set<() => void>()
function set(p: Partial<Snap>) {
  snap = { ...snap, ...p }
  listeners.forEach((l) => l())
}

const COLS = 'id,categoria,titulo,orgao,uf,url,fonte,resumo,vagas,salario,inscricoes_ate,publicado_em,primeiro_visto,visto_em'

/** Lê do Supabase (últimos 180 dias) e atualiza o cache local */
export async function loadConcursos(): Promise<void> {
  if (!supabase || snap.loading) return
  set({ loading: true, error: undefined })
  try {
    const since = new Date(Date.now() - 180 * 864e5).toISOString()
    const { data, error } = await supabase.from('concursos').select(COLS).gte('visto_em', since).order('primeiro_visto', { ascending: false }).limit(1000)
    if (error) throw error
    const items = (data ?? []) as Concurso[]
    const loadedAt = new Date().toISOString()
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ items, loadedAt }))
    } catch {
      /* cota cheia */
    }
    set({ items, loadedAt, loading: false })
  } catch (e) {
    set({ loading: false, error: e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e) })
  }
}

/** Pede uma varredura nova às fontes (exige login; o servidor limita a uma a cada 15 min) */
export async function refreshConcursos(): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { data, error } = await supabase.functions.invoke('buscar-concursos', { body: { refresh: true } })
  if (error) throw new Error(error.message.includes('401') ? 'Entre na sua conta para buscar agora.' : error.message)
  await loadConcursos()
  if (data?.recente) return 'A busca já rodou há poucos minutos — lista atualizada.'
  return data?.novos ? `${data.novos} ${data.novos === 1 ? 'novo edital encontrado' : 'novos editais encontrados'}` : 'Nada novo nas fontes agora.'
}

let autoLoaded = false
export function useConcursos(): Snap {
  const s = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => snap
  )
  useEffect(() => {
    // recarrega ao abrir se o cache tem mais de 1 hora
    if (autoLoaded) return
    autoLoaded = true
    if (!snap.loadedAt || Date.now() - new Date(snap.loadedAt).getTime() > 3600e3) void loadConcursos()
  }, [])
  return s
}

export const trackOf = (d: Data, id: string): Track => valueOf<Track>(d, 'concurso', id) ?? {}
export function setTrack(d: Data, id: string, patch: Track) {
  const next = { ...trackOf(d, id), ...patch }
  for (const k of Object.keys(next) as (keyof Track)[]) if (!next[k]) delete next[k]
  store.setState('concurso', id, Object.keys(next).length ? next : null)
}

export type Situacao = 'aberto' | 'encerrando' | 'encerrado' | 'sem-data'
export function situacao(c: Concurso, today = todayISO()): Situacao {
  if (!c.inscricoes_ate) return 'sem-data'
  if (c.inscricoes_ate < today) return 'encerrado'
  const dias = (Date.parse(c.inscricoes_ate) - Date.parse(today)) / 864e5
  return dias <= 7 ? 'encerrando' : 'aberto'
}

/** "Ativo": inscrições abertas, ou sem data e ainda listado nas fontes nos últimos 30 dias */
export function ativo(c: Concurso, today = todayISO()): boolean {
  const s = situacao(c, today)
  if (s === 'encerrado') return false
  if (s === 'sem-data') return Date.parse(today) - Date.parse(c.visto_em.slice(0, 10)) <= 30 * 864e5 && Date.parse(today) - Date.parse(c.primeiro_visto.slice(0, 10)) <= 90 * 864e5
  return true
}

export interface AlertPrefs {
  on: boolean
  categorias: Categoria[]
}
/** Aviso semanal: ligado por padrão para quem ativou notificações no aparelho */
export function alertOf(d: Data): AlertPrefs {
  const v = valueOf<Partial<AlertPrefs>>(d, 'alert', 'concursos')
  return { on: v?.on ?? true, categorias: v?.categorias?.length ? v.categorias : ['sc', 'enare', 'residencia'] }
}

/** Manda agora, só para mim, o resumo da semana (para conferir se o aviso chega) */
export async function testarAviso(): Promise<number> {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { data, error } = await supabase.functions.invoke('buscar-concursos', { body: { teste: true } })
  if (error) throw new Error(error.message)
  return Number(data?.aparelhos ?? 0)
}
