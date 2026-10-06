import { useEffect, useMemo, useState } from 'react'
import { LEI_GROUPS } from '../data/leiseca'
import { topicShort } from '../data/topics'
import { GRADES, NEW_PER_DAY, deckQueue, previewLabel, schedule, type Deck, type Flashcard, type Grade } from '../lib/flash'
import { useFlash, type FlashData } from '../lib/decks'
import { startSession, useStudy, type Study } from '../lib/study'
import { go } from '../lib/router'
import { store } from '../lib/store'
import { Bar, Html, Icon } from '../components/ui'

const DECK_INFO: Record<Deck, { title: string; desc: string }> = {
  erros: {
    title: 'Meus erros',
    desc: 'Um cartão para cada questão que você errou ou chutou, com o ponto-chave da resolução. Nasce sozinho a cada erro.'
  },
  lei: {
    title: 'Lei seca',
    desc: 'CF/88, Lei 8.080, Lei 8.142, Decreto 7.508, LC 141, PNAB, saúde bucal e exercício profissional — com as palavras que a banca troca em negrito.'
  }
}

/** Parâmetro da rota: 'erros' | 'lei' | 'lei:<norma>' */
function parseDeck(p?: string): { deck: Deck; group?: string } | null {
  if (!p) return null
  if (p === 'erros' || p === 'lei') return { deck: p }
  if (p.startsWith('lei:')) return { deck: 'lei', group: p.slice(4) }
  return null
}

export function Flashcards({ deckParam }: { deckParam?: string }) {
  const study = useStudy()
  const flash = useFlash(study)
  const sel = parseDeck(deckParam)
  if (sel) return <StudyDeck sel={sel} study={study} flash={flash} />
  return <Overview study={study} flash={flash} />
}

function Overview({ study, flash }: { study: Study; flash: FlashData }) {
  const groupQueues = useMemo(
    () => LEI_GROUPS.map((g) => {
      const cards = flash.decks.lei.filter((c) => c.group === g)
      const q = deckQueue(cards, flash.states, study.stats, Date.now(), Infinity)
      return { g, total: cards.length, due: q.due.length, fresh: q.fresh.length }
    }),
    [flash, study.stats]
  )
  return (
    <>
      <div className="card tint">
        <h2>Flashcards</h2>
        <p className="muted" style={{ margin: 0 }}>
          Leia a frente, tente lembrar, vire o cartão e diga como foi. “Errei” traz o cartão de volta em 10 minutos; os demais espaçam os intervalos (1, 3, 7… dias), mais curtos nos temas com menor % de acerto.
          Até {NEW_PER_DAY} cartões novos por dia em cada baralho.
        </p>
      </div>

      {(['erros', 'lei'] as const).map((deck) => {
        const q = flash.queues[deck]
        const n = q.due.length + q.fresh.length
        const total = flash.decks[deck].length
        const studied = flash.decks[deck].filter((c) => flash.states.has(c.id)).length
        return (
          <div className="card" key={deck}>
            <div className="row between">
              <h2 style={{ margin: 0 }}>{DECK_INFO[deck].title}</h2>
              <span className={`tag ${n ? 'gold' : 'ok'}`}>{n ? `${n} para hoje` : total ? 'em dia' : 'vazio'}</span>
            </div>
            <p className="faint" style={{ margin: '6px 0 10px' }}>{DECK_INFO[deck].desc}</p>
            {total > 0 ? (
              <>
                <Bar value={studied / total} />
                <div className="faint num" style={{ margin: '4px 0 10px' }}>
                  {studied}/{total} cartões já estudados · {q.due.length} revisões · {q.fresh.length} novos{q.waiting ? ` (+${q.waiting} aguardando)` : ''}
                </div>
                <button className="btn primary" disabled={!n} onClick={() => go('cards', deck)}>{n ? `Estudar ${n} cartões` : 'Nada para hoje ✓'}</button>
              </>
            ) : (
              <p className="muted" style={{ margin: 0 }}>Quando você errar (ou marcar “chutei”) uma questão, o cartão dela aparece aqui.</p>
            )}
            {deck === 'lei' && (
              <>
                <div className="faint" style={{ margin: '14px 0 6px' }}>Estudar só uma norma (sem limite de novos):</div>
                <div className="chips">
                  {groupQueues.map((g) => (
                    <button key={g.g} className="chip" onClick={() => go('cards', `lei:${g.g}`)}>
                      {g.g} <span className="faint num">{g.due + g.fresh ? `· ${g.due + g.fresh}` : '✓'}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )
      })}

      <details className="card fold">
        <summary>Ver todos os cartões de lei seca ({flash.decks.lei.length})</summary>
        {LEI_GROUPS.map((g) => (
          <div key={g}>
            <h3 style={{ marginTop: 14 }}>{g}</h3>
            <div className="list">
              {flash.decks.lei.filter((c) => c.group === g).map((c) => (
                <details key={c.id} className="flash-peek">
                  <summary><Html html={c.f} className="inline" /></summary>
                  <Html html={c.b} className="flash-back-text" />
                  <div className="faint">{c.src}</div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </details>
    </>
  )
}

function StudyDeck({ sel, study, flash }: { sel: { deck: Deck; group?: string }; study: Study; flash: FlashData }) {
  const byId = useMemo(() => new Map(flash.decks[sel.deck].map((c) => [c.id, c])), [flash.decks, sel.deck])
  // A fila é congelada ao abrir: as notas dadas não reembaralham a sessão
  const [queue, setQueue] = useState<string[]>(() => {
    const cards = sel.group ? flash.decks.lei.filter((c) => c.group === sel.group) : flash.decks[sel.deck]
    const q = deckQueue(cards, flash.states, study.stats, Date.now(), sel.group ? Infinity : undefined)
    return [...q.due, ...q.fresh].map((c) => c.id)
  })
  const [flipped, setFlipped] = useState(false)
  const [tally, setTally] = useState({ n: 0, again: 0 })
  const card: Flashcard | undefined = byId.get(queue[0])
  const title = sel.group ?? DECK_INFO[sel.deck].title

  const grade = (g: Grade) => {
    if (!card) return
    const next = schedule(flash.states.get(card.id), g, Date.now(), study.stats.get(card.topic))
    store.setState('card', card.id, next)
    setQueue((q) => (g === 0 ? [...q.slice(1), q[0]] : q.slice(1)))
    setTally((t) => ({ n: t.n + 1, again: t.again + (g === 0 ? 1 : 0) }))
    setFlipped(false)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped(true)
      } else if (flipped && /^[1-4]$/.test(e.key)) grade((Number(e.key) - 1) as Grade)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!card) {
    return (
      <div className="card tint">
        <h2>{title}: sessão concluída ✓</h2>
        <p className="muted">
          {tally.n ? `${tally.n} respostas, ${tally.again} “errei”.` : 'Nenhum cartão para hoje neste baralho.'} Os cartões voltam conforme o intervalo de cada um.
        </p>
        <button className="btn primary" onClick={() => go('cards')}>Voltar aos baralhos</button>
      </div>
    )
  }

  const prev = flash.states.get(card.id)
  const stat = study.stats.get(card.topic)
  const now = Date.now()
  return (
    <>
      <div className="row between" style={{ marginBottom: 8 }}>
        <button className="btn small ghost" style={{ paddingLeft: 0 }} onClick={() => go('cards')}><Icon.back /> Baralhos</button>
        <span className="faint num">{queue.length} restantes · {tally.n} feitos</span>
      </div>
      <Bar value={tally.n / Math.max(1, tally.n + queue.length)} />
      <div className="card flash-card" style={{ marginTop: 10 }}>
        <div className="row between faint" style={{ marginBottom: 8 }}>
          <span>{card.group} · {topicShort(card.topic)}</span>
          <span className={`tag ${prev ? '' : 'gold'}`}>{prev ? (prev.ivl ? `a cada ${prev.ivl} d` : 'reaprendendo') : 'novo'}</span>
        </div>
        <Html html={card.f} className="flash-face" />
        {flipped ? (
          <div className="flash-back">
            <Html html={card.b} className="flash-back-text" />
            <div className="row wrap faint" style={{ marginTop: 8 }}>
              {card.src && <span>{card.src}</span>}
              {card.url && <a href={card.url} target="_blank" rel="noopener noreferrer">texto oficial <Icon.ext /></a>}
              {card.qid && (
                <button className="btn small ghost" onClick={() => startSession({ mode: 'treino', title: 'Questão do flashcard', qids: [card.qid!] })}>Ver questão completa</button>
              )}
            </div>
          </div>
        ) : (
          <button className="btn primary block" style={{ marginTop: 16 }} onClick={() => setFlipped(true)}>Mostrar resposta</button>
        )}
      </div>
      {flipped && (
        <div className="grade-row">
          {GRADES.map((g) => (
            <button key={g.g} className={`btn grade ${g.tone}`} onClick={() => grade(g.g)}>
              {g.label}
              <small className="num">{previewLabel(prev, g.g, now, stat)}</small>
            </button>
          ))}
        </div>
      )}
      <p className="faint" style={{ textAlign: 'center' }}>Atalhos no computador: espaço vira o cartão; 1–4 dão a nota.</p>
    </>
  )
}
