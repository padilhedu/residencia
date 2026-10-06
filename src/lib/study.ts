import { useMemo } from 'react'
import { QMAP, QUESTIONS } from '../data/exams'
import { buildCards, dueCards, effectiveAnswer, reinforcement, topicStats, weakTopics, type Card, type TopicStat } from './srs'
import { keysOf, overridesOf, settingsOf, store, uid, useData, type Data } from './store'
import { go } from './router'
import type { Attempt, ExamId, Letter, Mode, Question, Session, Settings } from './types'
import { DAY, todayISO, toISO } from './dates'

export interface OfficialInfo {
  letter: Letter | '*'
  source: 'banca' | 'importado'
  note?: string
}

export interface Study {
  d: Data
  settings: Settings
  /** Resposta efetiva por questão quando difere de q.answer (gabarito importado ou correção manual) */
  overrides: Record<string, Letter | undefined>
  /** Questões anuladas (gabarito definitivo embutido ou importado) */
  annulled: Set<string>
  /** Gabarito oficial conhecido por questão */
  official: Map<string, OfficialInfo>
  cards: Map<string, Card>
  stats: Map<string, TopicStat>
  stars: Set<string>
  notes: Set<string>
  due: ReturnType<typeof dueCards>
}

/** Gabaritos oficiais importados pelo usuário (ex.: ENARE, quando a FGV divulgar) */
export function importedKeysOf(d: Data): Record<string, string> {
  const out: Record<string, string> = {}
  for (const e of Object.values(d.state)) if (e.kind === 'official' && typeof e.value === 'string') out[e.key] = e.value
  return out
}

export function buildKeyInfo(d: Data) {
  const manual = overridesOf(d)
  const imported = importedKeysOf(d)
  const overrides: Record<string, Letter | undefined> = {}
  const annulled = new Set<string>()
  const official = new Map<string, OfficialInfo>()
  for (const q of QUESTIONS) {
    let info: OfficialInfo | undefined = q.official ? { letter: q.official, source: 'banca', note: q.officialNote } : undefined
    const imp = imported[q.exam]?.[q.n - 1]
    if (imp && /^[A-E*]$/.test(imp)) info = { letter: imp as Letter | '*', source: 'importado' }
    if (info) {
      official.set(q.id, info)
      if (info.letter === '*') annulled.add(q.id)
      else if (info.letter !== q.answer) overrides[q.id] = info.letter
    }
    if (manual[q.id]) overrides[q.id] = manual[q.id]
  }
  return { overrides, annulled, official }
}

export function useStudy(): Study {
  const d = useData()
  return useMemo(() => {
    const { overrides, annulled, official } = buildKeyInfo(d)
    const cards = buildCards(d.attempts, QMAP, overrides, annulled)
    const stats = topicStats(d.attempts, QMAP, overrides, annulled)
    // vence "hoje" = até o fim do dia local
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return {
      d, overrides, annulled, official, cards, stats,
      settings: settingsOf(d),
      stars: keysOf(d, 'star'),
      notes: keysOf(d, 'note'),
      due: dueCards(cards, stats, end.getTime())
    }
  }, [d])
}

export function answerOf(q: Question, overrides: Record<string, Letter | undefined>): Letter {
  return effectiveAnswer(q, overrides)
}

export function startSession(opts: { mode: Mode; title: string; qids: string[]; durationMin?: number; idx?: number }) {
  if (!opts.qids.length) return
  const s: Session = {
    id: uid(), mode: opts.mode, title: opts.title, qids: opts.qids, idx: opts.idx ?? 0, answers: {},
    startedAt: new Date().toISOString(), durationMin: opts.durationMin
  }
  store.setSession(s)
  go('sessao')
}

export function startExamSimulado(exam: ExamId, minutes: number, title: string, range?: [number, number]) {
  const qids = QUESTIONS.filter((q) => q.exam === exam && (!range || (q.n >= range[0] && q.n <= range[1]))).map((q) => q.id)
  const dur = range ? Math.round((minutes * qids.length) / QUESTIONS.filter((q) => q.exam === exam).length) : minutes
  startSession({ mode: 'simulado', title, qids, durationMin: dur })
}

export function startReinforcement(study: Study, topics?: string[], n = 15) {
  const t = topics ?? weakTopics(study.stats).slice(0, 3).map((s) => s.topic)
  const pool = t.length ? t : [...new Set(QUESTIONS.map((q) => q.topic))]
  const qids = reinforcement(pool, QUESTIONS, study.cards, n)
  startSession({ mode: 'treino', title: t.length ? 'Reforço nos temas mais fracos' : 'Questões mistas', qids })
}

export function startDueReview(study: Study, max = 40) {
  startSession({ mode: 'revisao', title: 'Revisão espaçada de hoje', qids: study.due.slice(0, max).map((c) => c.qid) })
}

export function recordAnswer(q: Question, sel: Letter, guessed: boolean, mode: Mode, overrides: Record<string, Letter | undefined>, timeMs?: number): Attempt {
  const a: Attempt = {
    id: uid(), qid: q.id, selected: sel, correct: sel === answerOf(q, overrides) && !guessed,
    guessed, mode, timeMs, at: new Date().toISOString()
  }
  store.addAttempts([a])
  return a
}

export function finishSimulado(s: Session, overrides: Record<string, Letter | undefined>) {
  const now = Date.now()
  const list: Attempt[] = []
  let i = 0
  for (const qid of s.qids) {
    const ans = s.answers[qid]
    const q = QMAP.get(qid)
    if (!ans || !q) continue
    const ms = s.spent?.[qid]
    list.push({
      id: uid(), qid, selected: ans.sel, correct: ans.sel === answerOf(q, overrides) && !ans.guessed, guessed: ans.guessed,
      mode: 'simulado', timeMs: ms ? Math.round(ms) : undefined, at: new Date(now + i++).toISOString()
    })
  }
  store.addAttempts(list)
  store.setSession({ ...s, finishedAt: new Date(now).toISOString() })
}

/** Questões respondidas por dia (data local) */
export function dailyCounts(attempts: Attempt[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const a of attempts) {
    const k = toISO(new Date(a.at))
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return m
}

export function streak(counts: Map<string, number>): number {
  let n = 0
  let d = new Date()
  if (!counts.get(todayISO())) d = new Date(d.getTime() - DAY)
  while (counts.get(toISO(d))) {
    n++
    d = new Date(d.getTime() - DAY)
  }
  return n
}

/** Acerto considerando só a primeira tentativa de cada questão (anuladas ficam de fora) */
export function firstTryAcc(attempts: Attempt[], filter: (q: Question) => boolean, overrides: Record<string, Letter | undefined>, annulled?: Set<string>) {
  const seen = new Set<string>()
  let total = 0
  let ok = 0
  for (const a of [...attempts].sort((x, y) => (x.at < y.at ? -1 : 1))) {
    if (seen.has(a.qid)) continue
    seen.add(a.qid)
    const q = QMAP.get(a.qid)
    if (!q || !filter(q) || annulled?.has(q.id)) continue
    total++
    if (a.selected === answerOf(q, overrides) && !a.guessed) ok++
  }
  return { total, ok, acc: total ? ok / total : 0 }
}

/** Tempo considerado "ocioso" (app aberto sem responder): fica fora das médias */
export const MAX_QUESTION_MS = 15 * 60_000

export interface TimeStat {
  topic: string
  n: number
  avgMs: number
}

/** Tempo médio por questão em cada tema (só tentativas com tempo registrado) */
export function timeByTopic(attempts: Attempt[]): { overall: { n: number; avgMs: number }; byTopic: TimeStat[] } {
  const m = new Map<string, { n: number; sum: number }>()
  let n = 0
  let sum = 0
  for (const a of attempts) {
    if (!a.timeMs || a.timeMs < 3000 || a.timeMs > MAX_QUESTION_MS) continue
    const q = QMAP.get(a.qid)
    if (!q) continue
    const t = m.get(q.topic) ?? { n: 0, sum: 0 }
    t.n++
    t.sum += a.timeMs
    m.set(q.topic, t)
    n++
    sum += a.timeMs
  }
  const byTopic = [...m.entries()].map(([topic, t]) => ({ topic, n: t.n, avgMs: t.sum / t.n })).sort((a, b) => b.avgMs - a.avgMs)
  return { overall: { n, avgMs: n ? sum / n : 0 }, byTopic }
}
