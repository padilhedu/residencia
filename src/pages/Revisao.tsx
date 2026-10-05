import { useMemo } from 'react'
import { EXAMS } from '../data/exams'
import { topicName } from '../data/topics'
import { upcoming, weakTopics, MIN_ATTEMPTS_FOR_STATS, theoryInterval } from '../lib/srs'
import { dailyCounts, firstTryAcc, startDueReview, startReinforcement, streak, useStudy } from '../lib/study'
import { go } from '../lib/router'
import { valueOf } from '../lib/store'
import { Bar, accTone, pct } from '../components/ui'
import { addDays, daysUntil, fmtShort, mondayOf, todayISO, toISO, relDays } from '../lib/dates'

const DOW = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']

export function Revisao() {
  const study = useStudy()
  const { stats, cards, due, d } = study
  const weak = weakTopics(stats)
  const next7 = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return upcoming(cards, stats, start.getTime() + 86_400_000, 7)
  }, [cards, stats])
  const counts = useMemo(() => dailyCounts(d.attempts), [d.attempts])
  const last14 = Array.from({ length: 14 }, (_, i) => toISO(addDays(new Date(), i - 13)))
  const max14 = Math.max(1, ...last14.map((k) => counts.get(k) ?? 0))
  const errs = useMemo(() => {
    const m = { C: 0, I: 0, D: 0 }
    for (const e of Object.values(d.state)) if (e.kind === 'errtype' && (e.value === 'C' || e.value === 'I' || e.value === 'D')) m[e.value]++
    return m
  }, [d.state])
  const overall = firstTryAcc(d.attempts, () => true, study.overrides)
  const sus = firstTryAcc(d.attempts, (q) => q.topic.startsWith('sus-'), study.overrides)
  const odo = firstTryAcc(d.attempts, (q) => !q.topic.startsWith('sus-'), study.overrides)
  const today = todayISO()

  return (
    <>
      <div className="card tint">
        <h2>Fila de hoje</h2>
        {due.length ? (
          <>
            <div className="row">
              <div className="big num">{due.length}</div>
              <div className="muted">questões para revisar, começando pelos temas com menor % de acerto</div>
            </div>
            <button className="btn primary block" style={{ marginTop: 12 }} onClick={() => startDueReview(study)}>
              Revisar agora {due.length > 40 ? '(40 primeiras)' : ''}
            </button>
          </>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            {cards.size ? 'Fila zerada ✓ — volte amanhã ou faça um reforço nos temas fracos.' : 'A fila começa quando você errar (ou chutar) a primeira questão.'}
          </p>
        )}
        <div style={{ marginTop: 14 }}>
          <div className="faint" style={{ marginBottom: 6 }}>Próximos 7 dias</div>
          <div className="spark">
            {next7.map((n, i) => (
              <div key={i} title={`${n} revisões`}><i style={{ height: `${(n / Math.max(1, ...next7)) * 100}%` }} /></div>
            ))}
          </div>
          <div className="spark-labels">
            {next7.map((n, i) => {
              const day = addDays(new Date(), i + 1)
              return <span key={i}>{DOW[(day.getDay() + 6) % 7]}<br /><b className="num">{n}</b></span>
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row between">
          <h2 style={{ margin: 0 }}>Temas críticos</h2>
          {weak.length > 0 && <button className="btn small primary" onClick={() => startReinforcement(study)}>Reforço (15)</button>}
        </div>
        <p className="faint" style={{ margin: '4px 0 6px' }}>
          Do menor para o maior % de acerto (mín. {MIN_ATTEMPTS_FOR_STATS} respostas). Temas abaixo de 70% têm intervalos de revisão mais curtos.
        </p>
        {weak.length === 0 && <p className="muted">Responda algumas questões para ver seus temas mais fracos.</p>}
        {weak.map((s) => {
          const last = valueOf<string>(d, 'topic', s.topic)
          const nextTheory = last ? toISO(addDays(new Date(last), theoryInterval(s))) : null
          return (
            <div className="topic-row" key={s.topic}>
              <div className="row between">
                <b>{topicName(s.topic)}</b>
                <span className={`tag ${accTone(s.acc)}`}>{pct(s.acc)}</span>
              </div>
              <Bar value={s.acc} tone="auto" />
              <div className="row wrap" style={{ marginTop: 6 }}>
                <span className="faint num">{s.correct}/{s.total} certas · {s.seen} questões</span>
                <span className="spacer" />
                <button className="btn small" onClick={() => startReinforcement(study, [s.topic], 10)}>Questões</button>
                <button className="btn small ghost" onClick={() => go('conteudo', s.topic)}>
                  Teoria{nextTheory ? ` · ${nextTheory <= today ? 'revisar hoje' : relDays(daysUntil(nextTheory))}` : ''}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="section-title">Desempenho</div>
      <div className="grid2 wide-3">
        <div className="kpi"><div className="big num">{overall.total ? pct(overall.acc) : '—'}</div><div className="faint">acerto na 1ª tentativa ({overall.total})</div></div>
        <div className="kpi"><div className="big num">{sus.total ? pct(sus.acc) : '—'}</div><div className="faint">SUS / gerais</div></div>
        <div className="kpi"><div className="big num">{odo.total ? pct(odo.acc) : '—'}</div><div className="faint">Odontologia</div></div>
        <div className="kpi"><div className="big num">{streak(counts)}</div><div className="faint">dias seguidos</div></div>
        <div className="kpi"><div className="big num">{d.attempts.length}</div><div className="faint">respostas no total</div></div>
        <div className="kpi"><div className="big num">{cards.size}</div><div className="faint">questões diferentes</div></div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2>Últimos 14 dias</h2>
        <div className="spark">
          {last14.map((k) => (
            <div key={k} title={`${fmtShort(k)}: ${counts.get(k) ?? 0}`}><i style={{ height: `${((counts.get(k) ?? 0) / max14) * 100}%` }} /></div>
          ))}
        </div>
        <div className="spark-labels">
          {last14.map((k) => <span key={k}>{k === toISO(mondayOf(new Date(k + 'T12:00'))) ? fmtShort(k) : ''}</span>)}
        </div>
      </div>

      <div className="card">
        <h2>Por prova (1ª tentativa)</h2>
        {EXAMS.map((e) => {
          const a = firstTryAcc(d.attempts, (q) => q.exam === e.id, study.overrides)
          return (
            <div className="topic-row" key={e.id}>
              <div className="row between"><b>{e.name}</b><span className="faint num">{a.total ? `${a.ok}/${a.total} · ${pct(a.acc)}` : 'não iniciada'}</span></div>
              <Bar value={a.acc} tone={a.total ? 'auto' : 'plain'} />
            </div>
          )
        })}
      </div>

      <div className="card">
        <h2>Tipo de erro</h2>
        <p className="faint" style={{ marginTop: 0 }}>Marque após cada erro. Conteúdo = estudar teoria; interpretação = treinar leitura do enunciado; desatenção = mais calma na prova.</p>
        <div className="grid3">
          <div className="kpi"><div className="big num">{errs.C}</div><div className="faint">Conteúdo</div></div>
          <div className="kpi"><div className="big num">{errs.I}</div><div className="faint">Interpretação</div></div>
          <div className="kpi"><div className="big num">{errs.D}</div><div className="faint">Desatenção</div></div>
        </div>
      </div>

      <details className="card fold">
        <summary>Como funciona a revisão espaçada</summary>
        <ol className="muted" style={{ paddingLeft: 18 }}>
          <li>Errou ou marcou “chutei”: a questão volta em <b>1 dia</b>, depois <b>3, 7, 15, 30 e 60 dias</b> a cada acerto. Errou de novo: volta para 1 dia.</li>
          <li>Os intervalos <b>encurtam nos temas com menor % de acerto</b> (até a metade abaixo de 50%) e se alongam nos temas acima de 85%.</li>
          <li>Acertou de primeira num tema fraco (abaixo de 70%): a questão volta em 15 dias para confirmar.</li>
          <li>A fila do dia começa sempre pelo tema mais fraco. O botão Reforço monta sessões com questões inéditas e erradas dos 3 temas de menor acerto.</li>
          <li>Teoria: ao marcar “revisei a teoria” num tema, o app agenda a próxima leitura em 3, 7, 14 ou 30 dias conforme seu acerto.</li>
        </ol>
      </details>
    </>
  )
}
