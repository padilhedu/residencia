import { useMemo, useState } from 'react'
import { EXAMS, QUESTIONS, examName } from '../data/exams'
import { TOPICS, topicShort } from '../data/topics'
import { questionStatus } from '../lib/srs'
import { startExamSimulado, startSession, useStudy, firstTryAcc } from '../lib/study'
import type { ExamId } from '../lib/types'
import { Bar, pct } from '../components/ui'

type StatusFilter = 'todas' | 'nova' | 'errada' | 'star' | 'nota'
const STATUS: { id: StatusFilter; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'nova', label: 'Não respondidas' },
  { id: 'errada', label: 'Erradas' },
  { id: 'star', label: '★ Marcadas' },
  { id: 'nota', label: 'Com anotação' }
]

export function Questoes({ topicParam }: { topicParam?: string }) {
  const study = useStudy()
  const [exams, setExams] = useState<ExamId[]>([])
  const [block, setBlock] = useState<'todos' | 'gerais' | 'especificos'>('todos')
  const [topic, setTopic] = useState<string>(topicParam ?? '')
  const [status, setStatus] = useState<StatusFilter>('todas')
  const [qty, setQty] = useState(20)
  const [shuffle, setShuffle] = useState(true)
  const [showList, setShowList] = useState(false)

  const filtered = useMemo(
    () =>
      QUESTIONS.filter((q) => {
        if (exams.length && !exams.includes(q.exam)) return false
        if (block !== 'todos' && q.block !== block) return false
        if (topic && q.topic !== topic) return false
        const c = study.cards.get(q.id)
        if (status === 'nova' && c) return false
        if (status === 'errada' && questionStatus(c) !== 'errada') return false
        if (status === 'star' && !study.stars.has(q.id)) return false
        if (status === 'nota' && !study.notes.has(q.id)) return false
        return true
      }),
    [exams, block, topic, status, study]
  )

  const start = (mode: 'treino' | 'simulado') => {
    let ids = filtered.map((q) => q.id)
    if (shuffle) ids = ids.map((id) => [Math.random(), id] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1])
    if (qty > 0) ids = ids.slice(0, qty)
    const title = topic ? `Questões · ${topicShort(topic)}` : exams.length === 1 ? `Questões · ${examName(exams[0])}` : 'Questões selecionadas'
    startSession({ mode, title: mode === 'simulado' ? `Simulado · ${ids.length} questões` : title, qids: ids, durationMin: mode === 'simulado' ? Math.ceil(ids.length * 3.5) : undefined })
  }

  const toggleExam = (id: ExamId) => setExams((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]))

  return (
    <>
      <div className="section-title">Provas completas</div>
      {EXAMS.map((e) => {
        const qs = QUESTIONS.filter((q) => q.exam === e.id)
        const seen = qs.filter((q) => study.cards.has(q.id)).length
        const acc = firstTryAcc(study.d.attempts, (q) => q.exam === e.id, study.overrides, study.annulled)
        return (
          <div className="card" key={e.id}>
            <div className="row between">
              <div>
                <h2 style={{ marginBottom: 2 }}>{e.name}</h2>
                <div className="faint">{e.banca} · {e.nq} questões · {e.minutes / 60} h</div>
              </div>
              {acc.total > 0 && <span className={`tag ${acc.acc >= 0.7 ? 'ok' : acc.acc >= 0.5 ? 'gold' : 'no'}`}>{pct(acc.acc)} de acerto</span>}
            </div>
            <div style={{ margin: '10px 0' }}>
              <Bar value={seen / qs.length} />
              <div className="faint" style={{ marginTop: 4 }}>{seen}/{qs.length} respondidas</div>
            </div>
            <div className="row wrap">
              <button className="btn small primary" onClick={() => startSession({ mode: 'treino', title: `${e.name} · treino`, qids: qs.map((q) => q.id) })}>Resolver com comentários</button>
              <button className="btn small" onClick={() => startExamSimulado(e.id, e.minutes, `Simulado ${e.name}`)}>Simulado ⏱ {e.minutes / 60} h</button>
              <a className="btn small ghost" href={`/provas/${e.pdf}`} target="_blank" rel="noopener noreferrer">PDF original</a>
            </div>
          </div>
        )
      })}

      <a className="card list-item" href="#/gabaritos" style={{ textDecoration: 'none' }}>
        <span className="t">
          <b>Gabaritos oficiais e divergências</b>
          <span>Gabaritos definitivos das bancas, questões anuladas e onde a banca diverge da resolução de estudo</span>
        </span>
        <span aria-hidden>›</span>
      </a>

      <div className="section-title">Montar sessão</div>
      <div className="card">
        <label className="field"><span>Provas</span></label>
        <div className="chips scroll" style={{ marginTop: -6, marginBottom: 12 }}>
          <button className="chip" aria-pressed={exams.length === 0} onClick={() => setExams([])}>Todas</button>
          {EXAMS.map((e) => (
            <button key={e.id} className="chip" aria-pressed={exams.includes(e.id)} onClick={() => toggleExam(e.id)}>{e.name}</button>
          ))}
        </div>
        <label className="field"><span>Bloco</span></label>
        <div className="chips" style={{ marginTop: -6, marginBottom: 12 }}>
          {(['todos', 'gerais', 'especificos'] as const).map((b) => (
            <button key={b} className="chip" aria-pressed={block === b} onClick={() => setBlock(b)}>
              {b === 'todos' ? 'Todos' : b === 'gerais' ? 'SUS / gerais' : 'Odontologia'}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Tema</span>
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">Todos os temas</option>
            <optgroup label="SUS e Saúde Coletiva">
              {TOPICS.filter((t) => t.area === 'sus').map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </optgroup>
            <optgroup label="Odontologia">
              {TOPICS.filter((t) => t.area === 'odonto').map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </optgroup>
          </select>
        </label>
        <label className="field"><span>Situação</span></label>
        <div className="chips scroll" style={{ marginTop: -6, marginBottom: 12 }}>
          {STATUS.map((st) => (
            <button key={st.id} className="chip" aria-pressed={status === st.id} onClick={() => setStatus(st.id)}>{st.label}</button>
          ))}
        </div>
        <div className="grid2">
          <label className="field">
            <span>Quantidade</span>
            <select value={qty} onChange={(e) => setQty(Number(e.target.value))}>
              {[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n} questões</option>)}
              <option value={0}>Todas ({filtered.length})</option>
            </select>
          </label>
          <label className="field">
            <span>Ordem</span>
            <select value={shuffle ? '1' : '0'} onChange={(e) => setShuffle(e.target.value === '1')}>
              <option value="1">Aleatória</option>
              <option value="0">Da prova</option>
            </select>
          </label>
        </div>
        <p className="muted" style={{ margin: '0 0 10px' }}><b className="num">{filtered.length}</b> questões encontradas</p>
        <div className="grid2">
          <button className="btn primary" disabled={!filtered.length} onClick={() => start('treino')}>Treino comentado</button>
          <button className="btn" disabled={!filtered.length} onClick={() => start('simulado')}>Simulado ⏱</button>
        </div>
        <details className="fold" open={showList} onToggle={(e) => setShowList((e.target as HTMLDetailsElement).open)}>
          <summary>Ver lista</summary>
          {showList && (
            <div className="list">
              {filtered.map((q, i) => {
                const st = questionStatus(study.cards.get(q.id))
                return (
                  <button key={q.id} className="list-item" onClick={() => startSession({ mode: 'treino', title: 'Questões selecionadas', qids: filtered.map((x) => x.id), idx: i })}>
                    <span className={`dot ${st === 'errada' ? 'no' : st === 'nova' ? '' : 'ok'}`} />
                    <span className="t">
                      <b>{examName(q.exam)} · Q{String(q.n).padStart(2, '0')}{study.stars.has(q.id) ? ' ★' : ''}</b>
                      <span>{topicShort(q.topic)} — {q.stem.slice(0, 80)}…</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </details>
      </div>
    </>
  )
}
