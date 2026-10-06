import { useState } from 'react'
import type { Letter, Question } from '../lib/types'
import { examName } from '../data/exams'
import { topicShort } from '../data/topics'
import { Html, Icon, Stem, toast } from './ui'
import { store, useData, valueOf } from '../lib/store'
import type { OfficialInfo } from '../lib/study'
import { OFFICIAL_MAP } from '../data/official'
import { fmtLong } from '../lib/dates'

const LETTERS: Letter[] = ['A', 'B', 'C', 'D', 'E']

export function QuestionMeta({ q, starred }: { q: Question; starred?: boolean }) {
  return (
    <div className="q-meta">
      <div className="q-tags">
        <span className="q-num">Q{String(q.n).padStart(2, '0')}</span>
        <span className="tag">{examName(q.exam)}</span>
        <span className="tag gold">{topicShort(q.topic)}</span>
      </div>
      <button
        className="btn ghost small"
        aria-pressed={starred}
        aria-label={starred ? 'Remover dos marcados' : 'Marcar questão'}
        style={{ color: starred ? 'var(--gold)' : 'var(--ink-faint)' }}
        onClick={() => {
          store.setState('star', q.id, !starred)
          toast(starred ? 'Desmarcada' : 'Marcada com ★ para revisar')
        }}
      >
        {Icon.star(starred)}
      </button>
    </div>
  )
}

/** Alternativas. `reveal` mostra certa/errada; `answer` é o gabarito efetivo. */
export function Options({ q, sel, reveal, answer, onPick }: { q: Question; sel?: Letter; reveal: boolean; answer: Letter; onPick?: (l: Letter) => void }) {
  return (
    <div className="opts" role="radiogroup">
      {LETTERS.filter((l) => q.opts[l]).map((l) => {
        let state: string | undefined
        if (reveal) state = l === answer ? 'right' : l === sel ? 'wrong' : 'dim'
        else if (l === sel) state = 'sel'
        return (
          <button key={l} className="opt" data-state={state} role="radio" aria-checked={l === sel} disabled={reveal} onClick={() => onPick?.(l)}>
            <span className="key">{l}</span>
            <span className="txt">{q.opts[l]}</span>
          </button>
        )
      })}
    </div>
  )
}

export function QuestionStem({ q }: { q: Question }) {
  return (
    <>
      <Stem text={q.stem} img={q.img} alt={`Figura da questão ${q.n}`} />
    </>
  )
}

const ERR_TYPES = [
  { id: 'C', label: 'Conteúdo' },
  { id: 'I', label: 'Interpretação' },
  { id: 'D', label: 'Desatenção' }
]

/** Selo do gabarito oficial: confere, diverge da resolução de estudo ou anulada */
export function OfficialBadge({ q, official }: { q: Question; official?: OfficialInfo }) {
  if (!official) {
    const key = OFFICIAL_MAP.get(q.exam)
    if (key?.status === 'pendente' && key.expected)
      return <p className="faint" style={{ margin: '10px 0 0' }}>Gabarito definitivo da banca previsto para {fmtLong(key.expected)}. Quando sair, importe em Questões → Gabaritos oficiais.</p>
    return null
  }
  const study = q.myAnswer ?? (official.source === 'importado' && official.letter !== q.answer ? q.answer : undefined)
  const src = official.source === 'importado' ? ' (importado por você)' : ''
  if (official.letter === '*')
    return (
      <div className="official annulled">
        🚫 <b>Questão anulada pela banca</b>{src} — ponto para todos. Fica fora da sua revisão e do % de acerto.
        {official.note && <div className="why">{official.note}</div>}
      </div>
    )
  if (study)
    return (
      <div className="official diverge">
        ⚖️ <b>Gabarito definitivo: {official.letter}</b>{src} — a resolução de estudo original indicava <b>{study}</b>.
        {official.note && <div className="why">Banca: {official.note}</div>}
      </div>
    )
  return (
    <div className="official ok">
      ✓ Confere com o gabarito definitivo da banca{src}.
      {official.note && <div className="why">Banca: {official.note}</div>}
    </div>
  )
}

/** Comentário + ferramentas pós-resposta */
export function Explanation({ q, sel, guessed, answer, defaultAnswer, official }: { q: Question; sel?: Letter; guessed?: boolean; answer: Letter; defaultAnswer: Letter; official?: OfficialInfo }) {
  const d = useData()
  const annulled = official?.letter === '*'
  const ok = annulled || (sel === answer && !guessed)
  const errType = valueOf<string>(d, 'errtype', q.id)
  const note = valueOf<string>(d, 'note', q.id) ?? ''
  const override = valueOf<Letter>(d, 'override', q.id)
  const [draft, setDraft] = useState(note)
  return (
    <>
      {sel && (
        <div className={`feedback ${ok ? 'ok' : 'no'}`}>
          <h3>
            {annulled
              ? `🚫 Questão anulada — ponto para todos${sel === answer ? '' : ` (a melhor resposta seria ${answer})`}`
              : ok ? '✓ Acertou' : guessed && sel === answer ? '≈ Acertou no chute — vai para a revisão' : `✗ Errou — gabarito ${answer}`}
          </h3>
          {!ok && (
            <div className="row wrap" style={{ marginBottom: 8 }}>
              <span className="faint">Tipo do erro:</span>
              {ERR_TYPES.map((t) => (
                <button key={t.id} className="chip" aria-pressed={errType === t.id} onClick={() => store.setState('errtype', q.id, errType === t.id ? null : t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="card" style={{ marginTop: 12 }}>
        <h2>Resolução comentada</h2>
        <Html className="ex" html={q.ex} />
        <OfficialBadge q={q} official={official} />
        {override && override !== defaultAnswer && (
          <div className="alert">Você marcou que o gabarito oficial é {override} (comentário acima considera {defaultAnswer}). Suas estatísticas usam {override}.</div>
        )}
        {q.alert && <div className="alert">⚠️ {q.alert}</div>}
        <details className="fold">
          <summary>Minha anotação</summary>
          <textarea
            value={draft}
            placeholder="O que eu errei / o porquê da certa…"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => draft !== note && store.setState('note', q.id, draft.trim() ? draft : null)}
            style={{ marginTop: 8 }}
          />
        </details>
        <details className="fold">
          <summary>{official ? 'Corrigir a letra desta questão' : 'O gabarito oficial é outro?'}</summary>
          <p className="faint" style={{ margin: '6px 0' }}>
            {official
              ? 'Use só se houver retificação posterior do gabarito. A letra marcada passa a valer nas correções e na revisão.'
              : 'Esta prova ainda não tem gabarito definitivo no app. Se o da banca for diferente, marque a letra oficial — as correções e a revisão passam a usá-la.'}
          </p>
          <div className="chips">
            {LETTERS.filter((l) => q.opts[l]).map((l) => (
              <button key={l} className="chip" aria-pressed={(override ?? defaultAnswer) === l} onClick={() => store.setState('override', q.id, l === defaultAnswer ? null : l)}>
                {l}
              </button>
            ))}
          </div>
        </details>
      </div>
    </>
  )
}
