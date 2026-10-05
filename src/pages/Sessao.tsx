import { useEffect, useMemo, useRef, useState } from 'react'
import { QMAP } from '../data/exams'
import { topicShort } from '../data/topics'
import { store, useSession } from '../lib/store'
import { answerOf, finishSimulado, recordAnswer, startSession, useStudy, type Study } from '../lib/study'
import { go } from '../lib/router'
import type { Letter, Session } from '../lib/types'
import { Explanation, Options, QuestionMeta, QuestionStem } from '../components/QuestionBody'
import { Bar, pct, toast } from '../components/ui'
import { fmtDuration } from '../lib/dates'

export function Sessao() {
  const s = useSession()
  const study = useStudy()
  if (!s) {
    return (
      <div className="card empty">
        <div className="big">📝</div>
        <p>Nenhuma sessão de questões aberta.</p>
        <button className="btn primary" onClick={() => go('questoes')}>Escolher questões</button>
      </div>
    )
  }
  if (s.mode === 'simulado') return s.finishedAt ? <SimResult s={s} study={study} /> : <SimRunner s={s} study={study} />
  return <PracticeRunner s={s} study={study} />
}

function exit() {
  store.setSession(null)
  history.length > 1 ? history.back() : go('questoes')
}

// ───────────── Treino / Revisão: comentário logo após responder ─────────────
function PracticeRunner({ s, study }: { s: Session; study: Study }) {
  const qid = s.qids[s.idx]
  const q = QMAP.get(qid)
  const done = s.answers[qid]
  const [sel, setSel] = useState<Letter | undefined>(done?.sel)
  const [guessed, setGuessed] = useState(done?.guessed ?? false)
  const shownAt = useRef(Date.now())
  useEffect(() => {
    setSel(s.answers[qid]?.sel)
    setGuessed(s.answers[qid]?.guessed ?? false)
    shownAt.current = Date.now()
  }, [qid])

  const answered = Object.keys(s.answers).length
  const correct = s.qids.filter((id) => {
    const a = s.answers[id]
    const qq = QMAP.get(id)
    return a && qq && a.sel === answerOf(qq, study.overrides) && !a.guessed
  }).length
  const finished = answered === s.qids.length && s.idx >= s.qids.length - 1 && !!done

  if (!q) return null
  const answer = answerOf(q, study.overrides)

  const confirm = () => {
    if (!sel) return
    recordAnswer(q, sel, guessed, s.mode, study.overrides, Date.now() - shownAt.current)
    store.setSession({ ...s, answers: { ...s.answers, [qid]: { sel, guessed } } })
  }
  const move = (d: number) => store.setSession({ ...s, idx: Math.max(0, Math.min(s.qids.length - 1, s.idx + d)) })

  return (
    <>
      <div className="session-bar">
        <div className="row between" style={{ marginBottom: 6 }}>
          <b style={{ fontSize: 14 }}>{s.title}</b>
          <span className="faint num">{s.idx + 1}/{s.qids.length} · {correct}/{answered} certas</span>
        </div>
        <Bar value={answered / s.qids.length} />
      </div>

      <div className="card">
        <QuestionMeta q={q} starred={study.stars.has(q.id)} />
        <QuestionStem q={q} />
        <Options q={q} sel={sel} reveal={!!done} answer={answer} onPick={done ? undefined : setSel} />
        {!done && (
          <div className="row" style={{ marginTop: 14 }}>
            <label className="row" style={{ gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" className="check" checked={guessed} onChange={(e) => setGuessed(e.target.checked)} />
              Chutei
            </label>
            <span className="spacer" />
            <button className="btn primary" disabled={!sel} onClick={confirm}>Responder</button>
          </div>
        )}
      </div>

      {done && <Explanation key={q.id} q={q} sel={done.sel} guessed={done.guessed} answer={answer} defaultAnswer={q.answer} />}

      <div className="row" style={{ marginTop: 4 }}>
        <button className="btn" disabled={s.idx === 0} onClick={() => move(-1)}>‹ Anterior</button>
        <span className="spacer" />
        {s.idx < s.qids.length - 1 ? (
          <button className={`btn ${done ? 'primary' : ''}`} onClick={() => move(1)}>{done ? 'Próxima ›' : 'Pular ›'}</button>
        ) : (
          <button className="btn primary" onClick={exit}>Concluir</button>
        )}
      </div>

      {finished && (
        <div className="card tint" style={{ marginTop: 12 }}>
          <h2>Sessão concluída 🎉</h2>
          <p className="muted">
            {correct} de {s.qids.length} certas ({pct(correct / s.qids.length)}). Os erros e chutes já estão na sua fila de revisão espaçada.
          </p>
          <div className="row wrap">
            <button className="btn primary" onClick={exit}>Fechar</button>
            <button
              className="btn"
              onClick={() => {
                const wrong = s.qids.filter((id) => {
                  const a = s.answers[id]
                  const qq = QMAP.get(id)
                  return a && qq && (a.sel !== answerOf(qq, study.overrides) || a.guessed)
                })
                if (wrong.length) startSession({ mode: 'treino', title: 'Refazer erros da sessão', qids: wrong })
                else toast('Nenhum erro para refazer!')
              }}
            >
              Refazer erros
            </button>
          </div>
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <button className="btn ghost small" onClick={exit}>Sair da sessão</button>
      </div>
    </>
  )
}

// ───────────── Simulado: sem comentário até finalizar ─────────────
function SimRunner({ s, study }: { s: Session; study: Study }) {
  const qid = s.qids[s.idx]
  const q = QMAP.get(qid)
  const cur = s.answers[qid]
  const [now, setNow] = useState(Date.now())
  const [showGrid, setShowGrid] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const elapsed = now - Date.parse(s.startedAt)
  const limit = (s.durationMin ?? 0) * 60_000
  const remaining = limit - elapsed
  const answered = Object.keys(s.answers).length

  useEffect(() => {
    if (limit && remaining <= 0) {
      toast('Tempo esgotado — simulado finalizado')
      finishSimulado(s, study.overrides)
    }
  }, [limit, remaining <= 0])

  if (!q) return null
  const pick = (l: Letter) => store.setSession({ ...s, answers: { ...s.answers, [qid]: { sel: l, guessed: cur?.guessed ?? false } } })
  const setGuess = (g: boolean) => cur && store.setSession({ ...s, answers: { ...s.answers, [qid]: { ...cur, guessed: g } } })
  const goTo = (i: number) => store.setSession({ ...s, idx: Math.max(0, Math.min(s.qids.length - 1, i)) })
  const finish = () => {
    const missing = s.qids.length - answered
    if (!confirm(missing ? `Ainda faltam ${missing} questões. Finalizar mesmo assim?` : 'Finalizar e ver o resultado?')) return
    finishSimulado(s, study.overrides)
  }

  return (
    <>
      <div className="session-bar">
        <div className="row between" style={{ marginBottom: 6 }}>
          <b style={{ fontSize: 14 }}>{s.title}</b>
          {limit > 0 && <span className={`timer ${remaining < 10 * 60_000 ? 'low' : ''}`}>⏱ {fmtDuration(remaining)}</span>}
        </div>
        <div className="row">
          <div style={{ flex: 1 }}><Bar value={answered / s.qids.length} /></div>
          <button className="btn small" onClick={() => setShowGrid((v) => !v)}>{s.idx + 1}/{s.qids.length} ▾</button>
        </div>
        {showGrid && (
          <div className="card" style={{ marginTop: 8, marginBottom: 0 }}>
            <div className="qgrid">
              {s.qids.map((id, i) => (
                <button key={id} className={`${s.answers[id] ? 'answered' : ''} ${i === s.idx ? 'current' : ''}`} onClick={() => { goTo(i); setShowGrid(false) }}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <QuestionMeta q={q} starred={study.stars.has(q.id)} />
        <QuestionStem q={q} />
        <Options q={q} sel={cur?.sel} reveal={false} answer={q.answer} onPick={pick} />
        <label className="row" style={{ gap: 8, fontSize: 14, marginTop: 14, cursor: 'pointer', opacity: cur ? 1 : 0.5 }}>
          <input type="checkbox" className="check" disabled={!cur} checked={cur?.guessed ?? false} onChange={(e) => setGuess(e.target.checked)} />
          Chutei esta
        </label>
      </div>

      <div className="row">
        <button className="btn" disabled={s.idx === 0} onClick={() => goTo(s.idx - 1)}>‹</button>
        <button className="btn" disabled={s.idx === s.qids.length - 1} onClick={() => goTo(s.idx + 1)}>›</button>
        <span className="spacer" />
        <button className="btn gold" onClick={finish}>Finalizar</button>
      </div>
      <p className="faint" style={{ textAlign: 'center', marginTop: 12 }}>
        Seu progresso fica salvo no aparelho: pode fechar o app e voltar depois.{' '}
        <button className="btn ghost small" onClick={() => confirm('Descartar este simulado?') && exit()}>Descartar</button>
      </p>
    </>
  )
}

function SimResult({ s, study }: { s: Session; study: Study }) {
  const [view, setView] = useState<number | null>(null)
  const rows = useMemo(
    () =>
      s.qids.map((id) => {
        const q = QMAP.get(id)!
        const a = s.answers[id]
        const ans = answerOf(q, study.overrides)
        return { q, a, ok: !!a && a.sel === ans && !a.guessed, ans }
      }),
    [s, study.overrides]
  )
  const total = rows.length
  const ok = rows.filter((r) => r.ok).length
  const dur = Date.parse(s.finishedAt!) - Date.parse(s.startedAt)
  const byTopic = new Map<string, { n: number; ok: number }>()
  for (const r of rows) {
    const t = byTopic.get(r.q.topic) ?? { n: 0, ok: 0 }
    t.n++
    if (r.ok) t.ok++
    byTopic.set(r.q.topic, t)
  }
  const topics = [...byTopic.entries()].sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n)

  if (view !== null) {
    const r = rows[view]
    return (
      <>
        <div className="session-bar row between">
          <button className="btn small" onClick={() => setView(null)}>‹ Resultado</button>
          <span className="faint">{view + 1}/{total}</span>
        </div>
        <div className="card">
          <QuestionMeta q={r.q} starred={study.stars.has(r.q.id)} />
          <QuestionStem q={r.q} />
          <Options q={r.q} sel={r.a?.sel} reveal answer={r.ans} />
        </div>
        <Explanation key={r.q.id} q={r.q} sel={r.a?.sel} guessed={r.a?.guessed} answer={r.ans} defaultAnswer={r.q.answer} />
        <div className="row">
          <button className="btn" disabled={view === 0} onClick={() => setView(view - 1)}>‹ Anterior</button>
          <span className="spacer" />
          <button className="btn primary" disabled={view === total - 1} onClick={() => setView(view + 1)}>Próxima ›</button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="card tint">
        <h2>{s.title}</h2>
        <div className="row">
          <div className="big num">{pct(ok / total)}</div>
          <div className="muted">{ok} de {total} certas<br />tempo: {fmtDuration(dur)}</div>
        </div>
      </div>
      <div className="card">
        <h2>Por tema (do mais fraco ao mais forte)</h2>
        {topics.map(([t, v]) => (
          <div key={t} className="topic-row">
            <div className="row between"><b>{topicShort(t)}</b><span className="faint num">{v.ok}/{v.n}</span></div>
            <Bar value={v.ok / v.n} tone="auto" />
          </div>
        ))}
      </div>
      <div className="card">
        <h2>Correção questão a questão</h2>
        <div className="qgrid">
          {rows.map((r, i) => (
            <button key={r.q.id} className={r.a ? (r.ok ? 'ok' : 'no') : ''} onClick={() => setView(i)}>{i + 1}</button>
          ))}
        </div>
        <p className="faint" style={{ marginTop: 8 }}>Toque no número para ver o comentário. Erros e chutes já entraram na revisão espaçada.</p>
      </div>
      <div className="row wrap">
        <button className="btn primary" onClick={exit}>Fechar</button>
        <button className="btn" onClick={() => {
          const wrong = rows.filter((r) => !r.ok).map((r) => r.q.id)
          if (wrong.length) startSession({ mode: 'treino', title: 'Refazer erros do simulado', qids: wrong })
        }}>Refazer erros em treino</button>
      </div>
    </>
  )
}
