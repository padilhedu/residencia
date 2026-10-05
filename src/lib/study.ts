import { useMemo } from 'react'
import { QMAP, QUESTIONS } from '../data/exams'
import { buildCards, dueCards, effectiveAnswer, reinforcement, topicStats, weakTopics, type Card, type TopicStat } from './srs'
import { keysOf, overridesOf, settingsOf, store, uid, useData, type Data } from './store'
import { go } from './router'
import type { Attempt, ExamId, Letter, Mode, Question, Session, Settings } from './types'
import { DAY, todayISO, toISO } from './dates'

export interface Study {
  d: Data
  settings: Settings
  overrides: Record<string, Letter | undefined>
  cards: Map<string, Card>
  stats: Map<string, TopicStat>
  stars: Set<string>
  notes: Set<string>
  due: ReturnType<typeof dueCards>
}

export function useStudy(): Study {
  const d = useData()
  return useMemo(() => {
    const overrides = overridesOf(d)
    const cards = buildCards(d.attempts, QMAP, overrides)
    const stats = topicStats(d.attempts, QMAP, overrides)
    // vence "hoje" = até o fim do dia local
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return {
      d, overrides, cards, stats,
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
    list.push({
      id: uid(), qid, selected: ans.sel, correct: ans.sel === answerOf(q, overrides) && !ans.guessed, guessed: ans.guessed,
      mode: 'simulado', at: new Date(now + i++).toISOString()
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

/** Acerto considerando só a primeira tentativa de cada questão */
export function firstTryAcc(attempts: Attempt[], filter: (q: Question) => boolean, overrides: Record<string, Letter | undefined>) {
  const seen = new Set<string>()
  let total = 0
  let ok = 0
  for (const a of [...attempts].sort((x, y) => (x.at < y.at ? -1 : 1))) {
    if (seen.has(a.qid)) continue
    seen.add(a.qid)
    const q = QMAP.get(a.qid)
    if (!q || !filter(q)) continue
    total++
    if (a.selected === answerOf(q, overrides) && !a.guessed) ok++
  }
  return { total, ok, acc: total ? ok / total : 0 }
}
