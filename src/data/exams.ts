import type { ExamId, Letter, Question } from '../lib/types'
import { OFFICIAL_MAP } from './official'
import fdt2025 from './questions/fdt2025.json'
import fdt2024 from './questions/fdt2024.json'
import fdt2023 from './questions/fdt2023.json'
import enare2026 from './questions/enare2026.json'

export interface ExamMeta {
  id: ExamId
  name: string
  full: string
  banca: string
  /** Duração oficial da prova, em minutos */
  minutes: number
  nq: number
  pdf: string
}

export const EXAMS: ExamMeta[] = [
  { id: 'enare2026', name: 'ENARE 2026/27', full: 'ENARE 2026/2027 — Multiprofissional · Odontologia (Tipo 2)', banca: 'FGV / Ebserh', minutes: 300, nq: 100, pdf: 'ENARE-2026-2027-odontologia-tipo2.pdf' },
  { id: 'fdt2025', name: 'FDT 2025', full: 'Residência Multiprofissional FDT 2025 — Odontologia', banca: 'Fundatec', minutes: 240, nq: 60, pdf: 'FDT-2025-odontologia.pdf' },
  { id: 'fdt2024', name: 'FDT 2024', full: 'Residência Multiprofissional FDT 2024 — Odontologia', banca: 'Fundatec', minutes: 240, nq: 60, pdf: 'FDT-2024-odontologia.pdf' },
  { id: 'fdt2023', name: 'FDT 2023', full: 'Residência Multiprofissional FDT 2023 — Odontologia', banca: 'Fundatec', minutes: 240, nq: 60, pdf: 'FDT-2023-odontologia.pdf' }
]

export const EXAM_MAP = new Map(EXAMS.map((e) => [e.id, e]))

/** Sobrepõe o gabarito definitivo da banca à resolução de estudo */
export function withOfficial(q: Question): Question {
  const key = OFFICIAL_MAP.get(q.exam)
  const off = key?.status === 'definitivo' ? key.answers?.[q.n - 1] : undefined
  if (!off) return q
  const official = off as Letter | '*'
  const { alert: _alert, ...rest } = q
  return {
    ...rest,
    official,
    officialNote: key!.notes[q.n],
    // Anulada: mantém a melhor resposta de estudo; caso contrário vale a letra da banca
    answer: official === '*' ? q.answer : official,
    myAnswer: official !== '*' && official !== q.answer ? q.answer : undefined
  }
}

export const QUESTIONS: Question[] = [
  ...(enare2026 as Question[]),
  ...(fdt2025 as Question[]),
  ...(fdt2024 as Question[]),
  ...(fdt2023 as Question[])
].map(withOfficial)

export const QMAP = new Map(QUESTIONS.map((q) => [q.id, q]))

export const examName = (id: ExamId) => EXAM_MAP.get(id)?.name ?? id

/** Nº de questões de cada tema por banca — usado como "peso" do tema */
export function topicIncidence() {
  const m = new Map<string, { fdt: number; enare: number }>()
  for (const q of QUESTIONS) {
    const cur = m.get(q.topic) ?? { fdt: 0, enare: 0 }
    if (q.exam === 'enare2026') cur.enare++
    else cur.fdt++
    m.set(q.topic, cur)
  }
  return m
}
