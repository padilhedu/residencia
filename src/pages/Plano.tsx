import { useMemo, useState } from 'react'
import { EXAM_MAP } from '../data/exams'
import { buildPlan, currentWeek, WEEKLY_ROUTINE } from '../data/plan'
import { PLAN_START, keysOf, store } from '../lib/store'
import { startErrors, startExamSimulado, startGerais, startMixedSimulado, startReinforcement, startSession, startTopicQuestions, useStudy } from '../lib/study'
import { QUESTIONS } from '../data/exams'
import { fmtRange, fmtShort, todayISO } from '../lib/dates'
import type { PlanItem, PlanWeek } from '../lib/types'
import { Bar, Icon, toast } from '../components/ui'
import type { Study } from '../lib/study'
import { go } from '../lib/router'
import { SprintPlan } from './Sprint'
import { SPRINT, sprintActive } from '../data/sprint'

const KIND_LABEL: Record<PlanItem['kind'], string> = {
  ler: 'Leitura', assistir: 'Aula', questoes: 'Questões', revisao: 'Revisão', simulado: 'Simulado', lei: 'Lei seca', teoria: 'Teoria'
}

/** Botões de ação de um item do plano (questões, simulados, revisão, flashcards) */
function ItemActions({ it, study }: { it: PlanItem; study: Study }) {
  const btns: JSX.Element[] = []
  if (it.kind === 'questoes' && it.topics?.length && !it.action) {
    const n = it.n ?? 20
    btns.push(
      <button key="q" className="btn small primary" onClick={() => {
        if (it.n) return startTopicQuestions(study, it.topics!, n, it.text)
        const ids = QUESTIONS.filter((q) => it.topics!.includes(q.topic) && !study.cards.has(q.id)).map((q) => q.id)
        const all = QUESTIONS.filter((q) => it.topics!.includes(q.topic)).map((q) => q.id)
        startSession({ mode: 'treino', title: it.text, qids: (ids.length ? ids : all).slice(0, 20) })
      }}>Resolver {n}</button>
    )
  }
  if (it.kind === 'simulado' && it.exam) {
    btns.push(
      <button key="s" className="btn small primary" onClick={() => {
        const e = EXAM_MAP.get(it.exam!)!
        const range = it.range ?? (it.text.includes('bloco geral') ? ([1, 20] as [number, number]) : undefined)
        startExamSimulado(e.id, e.minutes, it.text, range)
      }}>Começar simulado</button>
    )
  }
  if (it.action === 'misto' || it.action === 'misto-esp') {
    btns.push(<button key="m" className="btn small primary" onClick={() => startMixedSimulado(study, it.action === 'misto')}>Começar simulado</button>)
  }
  if (it.action === 'erros') {
    btns.push(<button key="e" className="btn small primary" onClick={() => { if (!startErrors(study, it.topics)) toast('Nenhum erro registrado nesses temas ainda ✓') }}>Refazer erros</button>)
  }
  if (it.action === 'gerais') btns.push(<button key="g" className="btn small" onClick={() => startGerais(study, it.n ?? 10)}>Resolver {it.n ?? 10}</button>)
  if (it.action === 'reforco') btns.push(<button key="r" className="btn small primary" onClick={() => startReinforcement(study)}>Reforço</button>)
  if (it.action === 'cards') {
    const deck = it.kind === 'lei' || /lei seca/i.test(it.text) ? 'lei' : 'erros'
    btns.push(<button key="c" className="btn small" onClick={() => go('cards', deck)}>Flashcards</button>)
  }
  if (it.action === 'revisao' || (!it.action && it.text.startsWith('Revisão espaçada'))) {
    btns.push(
      <button key="v" className="btn small" disabled={!study.due.length} onClick={() => startSession({ mode: 'revisao', title: 'Revisão espaçada de hoje', qids: study.due.slice(0, 40).map((c) => c.qid) })}>
        Fila de hoje ({study.due.length})
      </button>
    )
    if (it.action === 'revisao') btns.push(<button key="vc" className="btn small ghost" onClick={() => go('cards')}>Flashcards</button>)
  }
  if (!it.action && it.text.includes('reforço')) btns.push(<button key="rf" className="btn small" onClick={() => startReinforcement(study)}>Reforço</button>)
  return btns.length ? <div className="acts">{btns}</div> : null
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
        {it.points && (
          <ul className="points">
            {it.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        )}
        {it.refs && it.refs.length > 0 && (
          <div className="refs">
            {it.refs.map((r) => r.url
              ? <a key={r.t} href={r.url} target="_blank" rel="noopener noreferrer">{r.t} <Icon.ext /></a>
              : <span key={r.t}>{r.t}</span>)}
          </div>
        )}
        {!done && <ItemActions it={it} study={study} />}
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
  const [phase, setPhase] = useState<'sprint' | 'fdt' | 'enare'>(sprintActive(today) ? 'sprint' : cur?.phase ?? 'fdt')
  const list = weeks.filter((w) => w.phase === phase)
  const { enareDate } = study.settings

  return (
    <>
      <div className="chips scroll" style={{ marginBottom: 12 }}>
        <button className="chip" aria-pressed={phase === 'sprint'} onClick={() => setPhase('sprint')}>30 dias · FDT {fmtShort(SPRINT.exam)}</button>
        <button className="chip" aria-pressed={phase === 'fdt'} onClick={() => setPhase('fdt')}>FDT semanal</button>
        <button className="chip" aria-pressed={phase === 'enare'} onClick={() => setPhase('enare')}>ENARE · {fmtShort(enareDate)}</button>
      </div>
      {phase === 'sprint' ? <SprintPlan /> : (
      <>

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
      )}
    </>
  )
}
