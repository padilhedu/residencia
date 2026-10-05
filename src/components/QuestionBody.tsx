import { useState } from 'react'
import type { Letter, Question } from '../lib/types'
import { examName } from '../data/exams'
import { topicShort } from '../data/topics'
import { Html, Icon, Stem, toast } from './ui'
import { store, useData, valueOf } from '../lib/store'

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

/** Comentário + ferramentas pós-resposta */
export function Explanation({ q, sel, guessed, answer, defaultAnswer }: { q: Question; sel?: Letter; guessed?: boolean; answer: Letter; defaultAnswer: Letter }) {
  const d = useData()
  const ok = sel === answer && !guessed
  const errType = valueOf<string>(d, 'errtype', q.id)
  const note = valueOf<string>(d, 'note', q.id) ?? ''
  const override = valueOf<Letter>(d, 'override', q.id)
  const [draft, setDraft] = useState(note)
  return (
    <>
      {sel && (
        <div className={`feedback ${ok ? 'ok' : 'no'}`}>
          <h3>
            {ok ? '✓ Acertou' : guessed && sel === answer ? '≈ Acertou no chute — vai para a revisão' : `✗ Errou — gabarito ${answer}`}
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
          <summary>O gabarito oficial é outro?</summary>
          <p className="faint" style={{ margin: '6px 0' }}>
            Os gabaritos aqui são resolução de estudo. Se o gabarito definitivo da banca for diferente, marque a letra oficial — as correções e a revisão passam a usá-la.
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
