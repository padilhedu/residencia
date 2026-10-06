import { useMemo, useState } from 'react'
import { EXAMS, QUESTIONS, type ExamMeta } from '../data/exams'
import { OFFICIAL_MAP, parseKey } from '../data/official'
import { topicShort } from '../data/topics'
import { importedKeysOf, startSession, useStudy, type Study } from '../lib/study'
import { store } from '../lib/store'
import { fmtLong } from '../lib/dates'
import { Icon, toast } from '../components/ui'

/** Compara o gabarito de estudo com o oficial e lista divergências, anulações e status por prova */
export function Gabaritos() {
  const study = useStudy()
  return (
    <>
      <div className="card tint">
        <h2>Gabaritos oficiais</h2>
        <p className="muted" style={{ margin: 0 }}>
          Gabaritos definitivos publicados pelas bancas, comparados com a resolução de estudo do app. As correções, a revisão espaçada e o % de acerto usam sempre o gabarito oficial; questões anuladas ficam de fora (a banca deu o ponto a todos).
        </p>
      </div>
      {EXAMS.map((e) => <ExamKey key={e.id} exam={e} study={study} />)}
    </>
  )
}

function ExamKey({ exam, study }: { exam: ExamMeta; study: Study }) {
  const key = OFFICIAL_MAP.get(exam.id)
  const imported = importedKeysOf(study.d)[exam.id]
  const qs = useMemo(() => QUESTIONS.filter((q) => q.exam === exam.id).sort((a, b) => a.n - b.n), [exam.id])
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)

  const rows = qs.map((q) => {
    const off = study.official.get(q.id)
    const mine = q.myAnswer ?? q.answer
    const status = !off ? 'sem' : off.letter === '*' ? 'anulada' : off.letter !== mine ? 'diverge' : 'confere'
    return { q, off, mine, status }
  })
  const hasKey = rows.some((r) => r.off)
  const diverge = rows.filter((r) => r.status === 'diverge')
  const annulled = rows.filter((r) => r.status === 'anulada')
  const agree = rows.filter((r) => r.status === 'confere').length
  const valid = rows.filter((r) => r.off && r.status !== 'anulada').length

  const doImport = () => {
    const k = parseKey(text, qs.length)
    if (!k) {
      toast(`Não reconheci ${qs.length} respostas. Use "1-C 2-A…" ou ${qs.length} letras seguidas (* = anulada).`)
      return
    }
    store.setState('official', exam.id, k)
    setText('')
    setOpen(false)
    toast('Gabarito oficial importado')
  }

  return (
    <div className="card">
      <div className="row between">
        <div>
          <h2 style={{ marginBottom: 2 }}>{exam.name}</h2>
          <div className="faint">{exam.banca}</div>
        </div>
        {hasKey ? (
          <span className={`tag ${diverge.length ? 'gold' : 'ok'}`}>{imported ? 'importado' : 'definitivo'}</span>
        ) : (
          <span className="tag warn">pendente</span>
        )}
      </div>

      {hasKey ? (
        <>
          <div className="grid3" style={{ margin: '12px 0' }}>
            <div className="kpi"><div className="big num">{agree}/{valid}</div><div className="faint">conferem</div></div>
            <div className="kpi"><div className="big num">{diverge.length}</div><div className="faint">divergem</div></div>
            <div className="kpi"><div className="big num">{annulled.length}</div><div className="faint">anuladas</div></div>
          </div>
          {diverge.length > 0 && (
            <>
              <h3>Onde a banca diverge da resolução de estudo</h3>
              <div className="list">
                {diverge.map((r) => (
                  <button key={r.q.id} className="list-item" onClick={() => startSession({ mode: 'treino', title: `${exam.name} · divergências`, qids: diverge.map((x) => x.q.id), idx: diverge.indexOf(r) })}>
                    <span className="q-num">Q{String(r.q.n).padStart(2, '0')}</span>
                    <span className="t">
                      <b>estudo {r.mine} → oficial {r.off!.letter} · {topicShort(r.q.topic)}</b>
                      <span>{r.q.officialNote ?? 'Gabarito oficial importado difere da resolução de estudo.'}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          {annulled.length > 0 && (
            <details className="fold">
              <summary>Questões anuladas ({annulled.map((r) => r.q.n).join(', ')})</summary>
              <div className="list">
                {annulled.map((r) => (
                  <button key={r.q.id} className="list-item" onClick={() => startSession({ mode: 'treino', title: `${exam.name} · anuladas`, qids: annulled.map((x) => x.q.id), idx: annulled.indexOf(r) })}>
                    <span className="q-num">Q{String(r.q.n).padStart(2, '0')}</span>
                    <span className="t"><b>{topicShort(r.q.topic)}</b><span>{r.q.officialNote ?? 'Anulada no gabarito oficial importado.'}</span></span>
                  </button>
                ))}
              </div>
            </details>
          )}
          <details className="fold">
            <summary>Ver gabarito completo</summary>
            <div className="keygrid" style={{ marginTop: 8 }}>
              {rows.map((r) => (
                <span key={r.q.id} className={r.status === 'diverge' ? 'diff' : r.status === 'anulada' ? 'null' : undefined} title={r.status}>
                  {r.q.n}<b>{r.off?.letter === '*' ? '✕' : r.off?.letter ?? r.mine}</b>
                </span>
              ))}
            </div>
          </details>
          <div className="row wrap" style={{ marginTop: 10 }}>
            {key?.pdf && !imported && (
              <a className="btn small ghost" href={key.pdf} target="_blank" rel="noopener noreferrer">Documento oficial <Icon.ext /></a>
            )}
            {imported && (
              <button className="btn small danger" onClick={() => { store.setState('official', exam.id, null); toast('Importação removida') }}>Remover importação</button>
            )}
          </div>
        </>
      ) : (
        <p className="muted" style={{ marginBottom: 6 }}>
          {key?.expected ? `Gabarito definitivo previsto para ${fmtLong(key.expected)}. ` : 'Ainda sem gabarito definitivo no app. '}
          Por enquanto valem as resoluções de estudo.
        </p>
      )}

      {(!hasKey || imported) && (
        <details className="fold" open={open} onToggle={(ev) => setOpen((ev.target as HTMLDetailsElement).open)}>
          <summary>{imported ? 'Substituir gabarito importado' : 'Importar gabarito oficial'}</summary>
          <p className="faint" style={{ margin: '6px 0' }}>
            Cole o gabarito definitivo da sua prova ({qs.length} questões){exam.id === 'enare2026' ? ', do caderno TIPO 2 (o do PDF do app)' : ''}. Aceita “1-C 2-A 3-*…” ou {qs.length} letras seguidas; use * para anulada.
            {key?.source && <> Fonte: <a href={key.source} target="_blank" rel="noopener noreferrer">site da banca</a>.</>}
          </p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="1-C 2-A 3-E 4-E 5-B …" />
          <button className="btn primary small" style={{ marginTop: 8 }} disabled={!text.trim()} onClick={doImport}>Importar e comparar</button>
        </details>
      )}
    </div>
  )
}
