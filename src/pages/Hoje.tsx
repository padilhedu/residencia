import { useMemo } from 'react'
import { WEEKLY_ROUTINE, currentWeek } from '../data/plan'
import { topicName } from '../data/topics'
import { EXAM_MAP } from '../data/exams'
import { usePlan, PlanItemRow } from './Plano'
import { weakTopics, theoryInterval } from '../lib/srs'
import { dailyCounts, startDueReview, startExamSimulado, startReinforcement, streak } from '../lib/study'
import { go } from '../lib/router'
import { valueOf } from '../lib/store'
import { Bar, accTone, pct } from '../components/ui'
import { addDays, daysUntil, fmtLong, fmtRange, todayISO, toISO } from '../lib/dates'
import { InstallHint } from '../components/InstallHint'

export function Hoje() {
  const { weeks, done, study } = usePlan()
  const { settings, due, stats, d } = study
  const today = todayISO()
  const counts = useMemo(() => dailyCounts(d.attempts), [d.attempts])
  const todayCount = counts.get(today) ?? 0
  const week = currentWeek(weeks, today)
  const weak = weakTopics(stats).slice(0, 3)
  const routine = WEEKLY_ROUTINE[(new Date().getDay() + 6) % 7]
  const theoryDue = useMemo(() => {
    const out: { topic: string; acc: number }[] = []
    for (const s of weakTopics(stats)) {
      const last = valueOf<string>(d, 'topic', s.topic)
      const next = last ? toISO(addDays(new Date(last), theoryInterval(s))) : null
      if ((next && next <= today) || (!last && s.acc < 0.7)) out.push({ topic: s.topic, acc: s.acc })
    }
    return out.slice(0, 4)
  }, [stats, d, today])
  const fdtLeft = daysUntil(settings.fdtDate)
  const enareLeft = daysUntil(settings.enareDate)
  const pendingItems = week ? week.items.filter((i) => !done.has(i.id)) : []

  return (
    <>
      <div className="faint" style={{ margin: '0 2px 10px' }}>{fmtLong(today)}</div>
      <div className="grid2">
        {fdtLeft >= 0 && (
          <div className="kpi">
            <div className="big num">{fdtLeft}</div>
            <div className="faint">dias para a FDT/Fundatec</div>
          </div>
        )}
        {enareLeft >= 0 && (
          <div className="kpi">
            <div className="big num">{enareLeft}</div>
            <div className="faint">dias para o ENARE</div>
          </div>
        )}
      </div>

      {d.attempts.length === 0 && (
        <div className="card gold" style={{ marginTop: 12 }}>
          <h2>Comece por aqui</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Faça um simulado diagnóstico: a FDT 2024 completa (60 questões). O resultado alimenta os temas críticos e a revisão espaçada.
          </p>
          <div className="row wrap">
            <button className="btn gold" onClick={() => startExamSimulado('fdt2024', EXAM_MAP.get('fdt2024')!.minutes, 'Simulado diagnóstico · FDT 2024')}>Simulado diagnóstico</button>
            <button className="btn" onClick={() => startReinforcement(study, undefined, 10)}>10 questões rápidas</button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 12 }}>
        <div className="row between">
          <h2 style={{ margin: 0 }}>Revisão de hoje</h2>
          <span className={`tag ${due.length ? 'no' : 'ok'}`}>{due.length ? `${due.length} pendentes` : 'em dia'}</span>
        </div>
        <p className="muted" style={{ margin: '6px 0 10px' }}>
          {due.length ? 'Comece pelos temas com menor % de acerto — leva cerca de 1 min por questão.' : 'Nada vencido agora. Use o tempo para avançar no plano da semana.'}
        </p>
        <div className="row wrap">
          <button className="btn primary" disabled={!due.length} onClick={() => startDueReview(study)}>Revisar agora</button>
          <button className="btn" onClick={() => startReinforcement(study)}>Reforço em temas fracos</button>
        </div>
      </div>

      <div className="card">
        <div className="row between">
          <h2 style={{ margin: 0 }}>Meta do dia</h2>
          <span className="faint num">🔥 {streak(counts)} dias</span>
        </div>
        <div className="row" style={{ margin: '8px 0' }}>
          <div className="big num">{todayCount}</div>
          <div className="muted">de {settings.dailyGoal} questões</div>
        </div>
        <Bar value={todayCount / Math.max(1, settings.dailyGoal)} />
        <p className="faint" style={{ marginBottom: 0 }}>Hoje ({routine.day}): {routine.task}</p>
      </div>

      {week && (
        <div className="card week current">
          <div className="faint">{fmtRange(week.start, week.end)} · {week.phase === 'fdt' ? 'Fase FDT' : 'Fase ENARE'}</div>
          <h2 style={{ margin: '2px 0 4px' }}>{week.title}</h2>
          <Bar value={(week.items.length - pendingItems.length) / Math.max(1, week.items.length)} />
          <div style={{ marginTop: 8 }}>
            {pendingItems.slice(0, 5).map((it) => <PlanItemRow key={it.id} it={it} done={false} study={study} />)}
            {pendingItems.length === 0 && <p className="muted">Semana concluída ✓</p>}
          </div>
          <button className="btn ghost small" style={{ paddingLeft: 0 }} onClick={() => go('plano')}>Ver cronograma completo ›</button>
        </div>
      )}

      {weak.length > 0 && (
        <div className="card">
          <h2>Temas mais fracos</h2>
          {weak.map((s) => (
            <div className="topic-row" key={s.topic}>
              <div className="row between">
                <b>{topicName(s.topic)}</b>
                <span className={`tag ${accTone(s.acc)}`}>{pct(s.acc)}</span>
              </div>
              <Bar value={s.acc} tone="auto" />
            </div>
          ))}
          <button className="btn ghost small" style={{ paddingLeft: 0 }} onClick={() => go('revisao')}>Ver todos e desempenho ›</button>
        </div>
      )}

      {theoryDue.length > 0 && (
        <div className="card gold">
          <h2>Teoria para revisar</h2>
          <div className="list">
            {theoryDue.map((t) => (
              <button key={t.topic} className="list-item" onClick={() => go('conteudo', t.topic)}>
                <span className="t"><b>{topicName(t.topic)}</b><span>acerto {pct(t.acc)} — abrir leitura e aulas</span></span>
              </button>
            ))}
          </div>
        </div>
      )}

      <InstallHint />
    </>
  )
}
