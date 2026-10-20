import { useMemo, useState } from 'react'
import { QUESTIONS } from '../data/exams'
import { topicName } from '../data/topics'
import { SPRINT, SPRINT_DAYS, sprintDay, type SprintDay } from '../data/sprint'
import { MIN_ATTEMPTS_FOR_STATS } from '../lib/srs'
import { startTopicQuestions, useStudy, type Study } from '../lib/study'
import { keysOf } from '../lib/store'
import { go } from '../lib/router'
import { daysUntil, fmtRange, fmtShort, mondayOf, parseISO, todayISO, toISO } from '../lib/dates'
import { Bar, accTone, pct } from '../components/ui'
import { PlanItemRow } from './Plano'

const DOW = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const KIND_TAG: Record<SprintDay['kind'], { label: string; tone: string } | null> = {
  estudo: null,
  simulado: { label: 'Simulado', tone: 'gold' },
  revisao: { label: 'Revisão', tone: 'ok' },
  descanso: { label: 'Descanso', tone: '' },
  prova: { label: 'Prova', tone: 'no' }
}

/** Incidência por tema nas questões específicas das provas FDT (Fundatec) */
export function useIncidence() {
  return useMemo(() => {
    const esp = QUESTIONS.filter((q) => q.exam.startsWith('fdt') && q.block === 'especificos')
    const m = new Map<string, number>()
    for (const q of esp) m.set(q.topic, (m.get(q.topic) ?? 0) + 1)
    const exams = new Set(esp.map((q) => q.exam)).size
    return { total: esp.length, exams, rows: [...m.entries()].sort((a, b) => b[1] - a[1]).map(([topic, n]) => ({ topic, n })) }
  }, [])
}

function DayCard({ day, done, study, open: open0 }: { day: SprintDay; done: Set<string>; study: Study; open: boolean }) {
  const [open, setOpen] = useState(open0)
  const today = todayISO()
  const n = day.items.filter((i) => done.has(i.id)).length
  const d = parseISO(day.date)
  const tag = KIND_TAG[day.kind]
  return (
    <div className={`card week ${day.date === today ? 'current' : ''} ${day.date < today ? 'past' : ''}`}>
      <button className="row" style={{ background: 'none', border: 0, padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => setOpen((v) => !v)}>
        <div style={{ flex: 1 }}>
          <div className="faint">
            {DOW[d.getDay()]}, {fmtShort(day.date)}{day.date === today ? ' · hoje' : ''}
            {tag && <span className={`tag ${tag.tone}`} style={{ marginLeft: 6 }}>{tag.label}</span>}
          </div>
          <h2 style={{ margin: '2px 0 4px', fontSize: 16 }}>{day.title}</h2>
        </div>
        <span className="tag num">{n}/{day.items.length}</span>
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          {day.focus && <p className="muted" style={{ marginTop: 0 }}>{day.focus}</p>}
          {day.items.map((it) => <PlanItemRow key={it.id} it={it} done={done.has(it.id)} study={study} />)}
        </div>
      )}
    </div>
  )
}

export function SprintPlan() {
  const study = useStudy()
  const done = keysOf(study.d, 'plan')
  const today = todayISO()
  const left = daysUntil(SPRINT.exam)
  const inc = useIncidence()
  const allItems = SPRINT_DAYS.flatMap((d) => d.items)
  const doneCount = allItems.filter((i) => done.has(i.id)).length
  const weeks = useMemo(() => {
    const m = new Map<string, SprintDay[]>()
    for (const d of SPRINT_DAYS) {
      const k = toISO(mondayOf(parseISO(d.date)))
      m.set(k, [...(m.get(k) ?? []), d])
    }
    return [...m.values()]
  }, [])
  const [showPast, setShowPast] = useState(false)
  const top = inc.rows.slice(0, 12)
  const topShare = inc.rows.slice(0, 3).reduce((s, r) => s + r.n, 0) / Math.max(1, inc.total)

  return (
    <>
      <div className="card tint">
        <h2>{SPRINT.title}</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Prova em <b>{fmtShort(SPRINT.exam)} (domingo)</b>{left >= 0 ? `, daqui a ${left} dias` : ''}. A SES/SC usa a prova do <b>Processo Seletivo Unificado FDT 2026</b> (aplicada pela ACM, inscrição pela Fundatec):
          nota final = 90% prova + 10% currículo, com mínimo de 50% de acertos.
        </p>
        <p className="muted">
          Pelo padrão das provas FDT 2023–2025: <b>60 questões em 4 h — 20 gerais (SUS) + 40 específicas de Odontologia</b>. As específicas valem 2/3 da prova, então ficam com ~70% do tempo; o bloco geral entra em doses diárias de manutenção.
        </p>
        <details className="fold">
          <summary>Rotina de cada dia (~4 h)</summary>
          <ol className="muted" style={{ paddingLeft: 18, marginBottom: 0 }}>
            <li><b>Questões primeiro (1 h 30):</b> as das provas antigas da Fundatec no tema do dia; o comentário mostra o que estudar.</li>
            <li><b>Teoria dirigida (1 h–1 h 30):</b> só os pontos listados, no livro/documento do Anexo I.</li>
            <li><b>Revisão espaçada + flashcards (30 min):</b> a fila do app começa pelos seus temas mais fracos.</li>
            <li><b>Bloco geral (30 min):</b> 10 questões de SUS ou flashcards de lei seca, alternando.</li>
          </ol>
          <p className="faint" style={{ marginBottom: 0 }}>Com menos tempo, corte a teoria — nunca as questões. Marque “chutei” sempre que não tiver certeza: a questão volta na revisão.</p>
        </details>
        <div style={{ marginTop: 10 }}>
          <Bar value={doneCount / Math.max(1, allItems.length)} />
          <div className="faint num" style={{ marginTop: 4 }}>{doneCount}/{allItems.length} tarefas concluídas</div>
        </div>
      </div>

      <div className="card">
        <h2>O que mais cai nas específicas da Fundatec</h2>
        <p className="faint" style={{ marginTop: 0 }}>
          {inc.total} questões específicas das provas FDT 2023, 2024 e 2025. Os 3 primeiros temas somam {pct(topShare)}. Toque num tema para treinar.
        </p>
        {top.map((r) => {
          const st = study.stats.get(r.topic)
          const has = st && st.total >= MIN_ATTEMPTS_FOR_STATS
          return (
            <button key={r.topic} className="topic-row" style={{ display: 'block', width: '100%', background: 'none', border: 0, textAlign: 'left', cursor: 'pointer', padding: '8px 0' }}
              onClick={() => startTopicQuestions(study, [r.topic], 15, `Treino · ${topicName(r.topic)}`)}>
              <div className="row between">
                <b style={{ fontSize: 14 }}>{topicName(r.topic)}</b>
                <span className="row" style={{ gap: 6 }}>
                  {has && <span className={`tag ${accTone(st!.acc)}`}>{pct(st!.acc)}</span>}
                  <span className="faint num" style={{ whiteSpace: 'nowrap' }}>{(r.n / inc.exams).toFixed(1).replace('.', ',')}/prova</span>
                </span>
              </div>
              <Bar value={r.n / top[0].n} />
            </button>
          )
        })}
      </div>

      {SPRINT_DAYS.some((d) => d.date < today) && (
        <button className="btn small ghost" style={{ paddingLeft: 0 }} onClick={() => setShowPast((v) => !v)}>
          {showPast ? 'Esconder dias anteriores' : 'Mostrar dias anteriores'}
        </button>
      )}
      {weeks.map((w, i) => {
        const days = w.filter((d) => showPast || d.date >= today)
        if (!days.length) return null
        return (
          <div key={w[0].date}>
            <div className="section-title">Semana {i + 1} · {fmtRange(w[0].date, w[w.length - 1].date)}</div>
            {days.map((d) => <DayCard key={d.date} day={d} done={done} study={study} open={d.date === today} />)}
          </div>
        )
      })}
    </>
  )
}

/** Cartão do dia na tela Hoje */
export function SprintToday() {
  const study = useStudy()
  const today = todayISO()
  const day = sprintDay(today)
  if (!day) return null
  const done = keysOf(study.d, 'plan')
  const n = day.items.filter((i) => done.has(i.id)).length
  const left = daysUntil(SPRINT.exam)
  return (
    <div className="card week current" style={{ marginTop: 12 }}>
      <div className="faint">
        Plano de 30 dias · {day.date > today ? `começa em ${fmtShort(day.date)}` : left > 0 ? `faltam ${left} dias para a FDT` : 'hoje é a prova'}
      </div>
      <div className="row between">
        <h2 style={{ margin: '2px 0 4px' }}>{day.title}</h2>
        <span className="tag num">{n}/{day.items.length}</span>
      </div>
      <Bar value={n / Math.max(1, day.items.length)} />
      {day.focus && <p className="muted" style={{ marginBottom: 0 }}>{day.focus}</p>}
      <div style={{ marginTop: 6 }}>
        {day.items.map((it) => <PlanItemRow key={it.id} it={it} done={done.has(it.id)} study={study} />)}
      </div>
      <button className="btn ghost small" style={{ paddingLeft: 0 }} onClick={() => go('plano')}>Ver os 30 dias ›</button>
    </div>
  )
}
