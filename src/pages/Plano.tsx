import { useMemo, useState } from 'react'
import { EXAM_MAP } from '../data/exams'
import { buildPlan, currentWeek, WEEKLY_ROUTINE } from '../data/plan'
import { PLAN_START, keysOf, store } from '../lib/store'
import { startExamSimulado, startReinforcement, startSession, useStudy } from '../lib/study'
import { QUESTIONS } from '../data/exams'
import { fmtRange, fmtShort, todayISO } from '../lib/dates'
import type { PlanItem, PlanWeek } from '../lib/types'
import { Bar, Icon } from '../components/ui'
import type { Study } from '../lib/study'

const KIND_LABEL: Record<PlanItem['kind'], string> = {
  ler: 'Leitura', assistir: 'Aula', questoes: 'Questões', revisao: 'Revisão', simulado: 'Simulado', lei: 'Lei seca'
}

export function usePlan() {
  const study = useStudy()
  const { fdtDate, enareDate } = study.settings
  const weeks = useMemo(() => buildPlan(PLAN_START, fdtDate, enareDate), [fdtDate, enareDate])
  const done = keysOf(study.d, 'plan')
  return { weeks, done, study }
}

export function PlanItemRow({ it, done, study }: { it: PlanItem; done: boolean; study: Study }) {
  return (
    <div className={`item ${done ? 'done' : ''}`}>
      <input type="checkbox" className="check" checked={done} aria-label="Concluído" onChange={(e) => store.setState('plan', it.id, e.target.checked || null)} />
      <div className="t">
        <span className="k">{KIND_LABEL[it.kind]}</span>
        {it.url ? (
          <a href={it.url} target="_blank" rel="noopener noreferrer">{it.text} <Icon.ext /></a>
        ) : (
          it.text
        )}
        {(it.kind === 'questoes' || it.kind === 'simulado' || it.text.startsWith('Revisão espaçada') || it.text.includes('reforço')) && !done && (
          <div className="acts">
            {it.kind === 'questoes' && it.topics && (
              <>
                <button className="btn small primary" onClick={() => {
                  const ids = QUESTIONS.filter((q) => it.topics!.includes(q.topic) && !study.cards.has(q.id)).map((q) => q.id)
                  const all = QUESTIONS.filter((q) => it.topics!.includes(q.topic)).map((q) => q.id)
                  startSession({ mode: 'treino', title: it.text, qids: (ids.length ? ids : all).slice(0, 20) })
                }}>Resolver 20</button>
              </>
            )}
            {it.kind === 'simulado' && it.exam && (
              <button className="btn small primary" onClick={() => {
                const e = EXAM_MAP.get(it.exam!)!
                const geral = it.text.includes('bloco geral')
                startExamSimulado(e.id, e.minutes, it.text, geral ? [1, 20] : undefined)
              }}>Começar simulado</button>
            )}
            {it.text.startsWith('Revisão espaçada') && (
              <button className="btn small" onClick={() => startSession({ mode: 'revisao', title: 'Revisão espaçada de hoje', qids: study.due.slice(0, 40).map((c) => c.qid) })} disabled={!study.due.length}>
                Fila de hoje ({study.due.length})
              </button>
            )}
            {it.text.includes('reforço') && <button className="btn small" onClick={() => startReinforcement(study)}>Reforço</button>}
          </div>
        )}
      </div>
    </div>
  )
}

function WeekCard({ w, open, done, study, current }: { w: PlanWeek; open: boolean; done: Set<string>; study: Study; current: boolean }) {
  const [isOpen, setOpen] = useState(open)
  const n = w.items.filter((i) => done.has(i.id)).length
  const past = w.end < todayISO()
  return (
    <div className={`card week ${current ? 'current' : ''} ${past ? 'past' : ''}`}>
      <button className="row" style={{ background: 'none', border: 0, padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => setOpen((v) => !v)}>
        <div style={{ flex: 1 }}>
          <div className="faint">{fmtRange(w.start, w.end)}{current ? ' · esta semana' : ''}</div>
          <h2 style={{ margin: '2px 0 4px' }}>{w.title}</h2>
        </div>
        <span className="tag num">{n}/{w.items.length}</span>
      </button>
      <Bar value={w.items.length ? n / w.items.length : 0} />
      {isOpen && (
        <div style={{ marginTop: 10 }}>
          <p className="muted" style={{ marginTop: 0 }}>{w.focus}</p>
          {w.items.map((it) => <PlanItemRow key={it.id} it={it} done={done.has(it.id)} study={study} />)}
        </div>
      )}
    </div>
  )
}

export function Plano() {
  const { weeks, done, study } = usePlan()
  const today = todayISO()
  const cur = currentWeek(weeks, today)
  const [phase, setPhase] = useState<'fdt' | 'enare'>(cur?.phase ?? 'fdt')
  const list = weeks.filter((w) => w.phase === phase)
  const { fdtDate, enareDate } = study.settings

  return (
    <>
      <div className="chips" style={{ marginBottom: 12 }}>
        <button className="chip" aria-pressed={phase === 'fdt'} onClick={() => setPhase('fdt')}>FDT · {fmtShort(fdtDate)}</button>
        <button className="chip" aria-pressed={phase === 'enare'} onClick={() => setPhase('enare')}>ENARE · {fmtShort(enareDate)}</button>
      </div>

      <div className="card tint">
        <h2>{phase === 'fdt' ? 'Reta final para a FDT/Fundatec' : 'Preparação ENARE (FGV)'}</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {phase === 'fdt'
            ? '7 semanas priorizando o que mais cai na FDT: legislação/APS/PNH no bloco geral e CTBMF, cirurgia, saúde bucal coletiva e cariologia no específico. Um simulado completo a cada 2 semanas.'
            : 'Ciclo 1 (base, 16 semanas), ciclo 2 (aprofundamento por questões), reforço dirigido pelos seus temas fracos e 4 semanas de reta final. As datas se ajustam à data da prova em Ajustes.'}
        </p>
        <details className="fold">
          <summary>Rotina da semana (~1 h/dia)</summary>
          <div className="list" style={{ marginTop: 6 }}>
            {WEEKLY_ROUTINE.map((r) => (
              <div className="row" key={r.day} style={{ padding: '5px 0', alignItems: 'flex-start' }}>
                <b style={{ width: 36, flexShrink: 0 }}>{r.day}</b>
                <span className="muted">{r.task}</span>
              </div>
            ))}
          </div>
        </details>
      </div>

      {list.length === 0 && <p className="muted">Sem semanas nesta fase com as datas atuais (veja Ajustes).</p>}
      {list.map((w) => (
        <WeekCard key={w.id + w.start} w={w} open={w.id === cur?.id} current={w.id === cur?.id} done={done} study={study} />
      ))}
    </>
  )
}
