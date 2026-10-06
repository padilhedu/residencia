export type ExamId = 'fdt2025' | 'fdt2024' | 'fdt2023' | 'enare2026'
export type Letter = 'A' | 'B' | 'C' | 'D' | 'E'
export type Mode = 'treino' | 'simulado' | 'revisao'
export type Area = 'sus' | 'odonto'

export interface Question {
  id: string
  exam: ExamId
  n: number
  block: 'gerais' | 'especificos'
  topic: string
  stem: string
  opts: Partial<Record<Letter, string>>
  answer: Letter
  /** Comentário da resolução (HTML simples: <b>) */
  ex: string
  /** Aviso de questão controversa / gabarito a conferir */
  alert?: string
  img?: string
  /** Resolução de estudo original, quando difere do gabarito oficial */
  myAnswer?: Letter
  /** Gabarito definitivo da banca ('*' = anulada) */
  official?: Letter | '*'
  /** Resumo da justificativa da banca (anulação/alteração) */
  officialNote?: string
  /** Cartão de memorização (ponto-chave da questão) */
  card?: { f: string; b: string }
}

export interface Attempt {
  id: string
  qid: string
  selected: Letter
  correct: boolean
  guessed: boolean
  mode: Mode
  timeMs?: number
  at: string
  synced?: boolean
}

export type StateKind = 'star' | 'note' | 'override' | 'plan' | 'settings' | 'topic' | 'errtype' | 'card' | 'official' | 'forecast'

export interface StateEntry {
  kind: StateKind
  key: string
  value: unknown
  updatedAt: string
  dirty?: boolean
}

export interface Settings {
  fdtDate: string
  enareDate: string
  dailyGoal: number
  theme: 'auto' | 'light' | 'dark'
}

export interface Ref {
  t: string
  url?: string
}

export interface Topic {
  id: string
  area: Area
  name: string
  short: string
  /** Conteúdo programático: o que estudar dentro do tema */
  items: string[]
  /** Bibliografia (prioriza as referências do edital FDT 2026) */
  refs: Ref[]
  /** Buscas sugeridas de aulas em vídeo */
  videos: string[]
  /** O que a banca costuma cobrar */
  tips?: string
}

export interface PlanItem {
  id: string
  kind: 'ler' | 'assistir' | 'questoes' | 'revisao' | 'simulado' | 'lei'
  text: string
  url?: string
  topics?: string[]
  exam?: ExamId
}

export interface PlanWeek {
  id: string
  phase: 'fdt' | 'enare'
  start: string
  end: string
  title: string
  focus: string
  topics: string[]
  items: PlanItem[]
}

export interface Session {
  id: string
  mode: Mode
  title: string
  qids: string[]
  idx: number
  /** Respostas marcadas no simulado (só viram tentativas ao finalizar) */
  answers: Record<string, { sel: Letter; guessed: boolean }>
  /** Tempo gasto em cada questão (ms), acumulado ao navegar */
  spent?: Record<string, number>
  startedAt: string
  durationMin?: number
  finishedAt?: string
}
