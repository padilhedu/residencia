import { useMemo } from 'react'
import { QUESTIONS, topicIncidence } from '../data/exams'
import { TOPICS, TOPIC_MAP, ytSearch } from '../data/topics'
import { theoryInterval, MIN_ATTEMPTS_FOR_STATS } from '../lib/srs'
import { startSession, useStudy } from '../lib/study'
import { go } from '../lib/router'
import { store, valueOf } from '../lib/store'
import { Bar, ExtLink, Icon, accTone, pct, toast } from '../components/ui'
import { addDays, daysUntil, fmtShort, relDays, todayISO, toISO } from '../lib/dates'

export function Conteudo({ topicId }: { topicId?: string }) {
  return topicId && TOPIC_MAP.has(topicId) ? <TopicDetail id={topicId} /> : <TopicList />
}

function TopicList() {
  const study = useStudy()
  const inc = useMemo(() => topicIncidence(), [])
  const groups = [
    { area: 'sus', title: 'Conhecimentos gerais — SUS, Humanização e Saúde Coletiva' },
    { area: 'odonto', title: 'Conhecimentos específicos — Odontologia' }
  ] as const
  return (
    <>
      <div className="card tint">
        <h2>Conteúdo programático</h2>
        <p className="muted" style={{ margin: 0 }}>
          Baseado no Anexo I do edital FDT 2026 e nas provas ENARE 2026/27 e FDT 2023–2025. Em cada tema: o que estudar, bibliografia oficial com links, aulas sugeridas e quantas questões já caíram.
        </p>
        <a className="btn small ghost" style={{ paddingLeft: 0 }} href="/provas/FDT-2026-anexo-I-referencias-bibliograficas.pdf" target="_blank" rel="noopener noreferrer">
          Abrir Anexo I (referências do edital) <Icon.ext />
        </a>
      </div>
      {groups.map((g) => (
        <div key={g.area}>
          <div className="section-title">{g.title}</div>
          <div className="card" style={{ padding: '6px 14px' }}>
            <div className="list">
              {TOPICS.filter((t) => t.area === g.area)
                .sort((a, b) => {
                  const ia = inc.get(a.id), ib = inc.get(b.id)
                  return (ib?.fdt ?? 0) + (ib?.enare ?? 0) - ((ia?.fdt ?? 0) + (ia?.enare ?? 0))
                })
                .map((t) => {
                  const i = inc.get(t.id) ?? { fdt: 0, enare: 0 }
                  const st = study.stats.get(t.id)
                  return (
                    <button key={t.id} className="list-item" onClick={() => go('conteudo', t.id)}>
                      <span className="t">
                        <b>{t.name}</b>
                        <span>FDT {i.fdt} · ENARE {i.enare} questões{st && st.total >= MIN_ATTEMPTS_FOR_STATS ? ` · seu acerto ${pct(st.acc)}` : ''}</span>
                      </span>
                      {st && st.total >= MIN_ATTEMPTS_FOR_STATS ? <span className={`dot ${accTone(st.acc)}`} /> : null}
                      <span style={{ color: 'var(--ink-faint)', transform: 'rotate(180deg)', display: 'inline-flex' }}><Icon.back /></span>
                    </button>
                  )
                })}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

function TopicDetail({ id }: { id: string }) {
  const t = TOPIC_MAP.get(id)!
  const study = useStudy()
  const qs = QUESTIONS.filter((q) => q.topic === id)
  const fdt = qs.filter((q) => q.exam !== 'enare2026').length
  const st = study.stats.get(id)
  const last = valueOf<string>(study.d, 'topic', id)
  const next = last ? toISO(addDays(new Date(last), theoryInterval(st))) : null
  const today = todayISO()
  const unseen = qs.filter((q) => !study.cards.has(q.id)).map((q) => q.id)

  return (
    <>
      <button className="btn ghost small" style={{ paddingLeft: 0, marginBottom: 6 }} onClick={() => go('conteudo')}>
        <Icon.back /> Conteúdo
      </button>
      <div className="card">
        <h2 style={{ fontSize: 18 }}>{t.name}</h2>
        <div className="row wrap" style={{ marginBottom: 10 }}>
          <span className="tag">FDT: {fdt} questões</span>
          <span className="tag">ENARE: {qs.length - fdt} questões</span>
          {st && st.total >= MIN_ATTEMPTS_FOR_STATS && <span className={`tag ${accTone(st.acc)}`}>seu acerto {pct(st.acc)}</span>}
        </div>
        {st && st.total >= MIN_ATTEMPTS_FOR_STATS && <Bar value={st.acc} tone="auto" />}
        {t.tips && <div className="alert" style={{ marginTop: 12 }}>💡 {t.tips}</div>}
        <div className="grid2" style={{ marginTop: 12 }}>
          <button className="btn primary" disabled={!qs.length} onClick={() => startSession({ mode: 'treino', title: `Questões · ${t.short}`, qids: qs.map((q) => q.id) })}>
            Todas as questões ({qs.length})
          </button>
          <button className="btn" disabled={!unseen.length} onClick={() => startSession({ mode: 'treino', title: `Inéditas · ${t.short}`, qids: unseen })}>
            Só inéditas ({unseen.length})
          </button>
        </div>
      </div>

      <div className="card">
        <h2>O que estudar</h2>
        <ul style={{ paddingLeft: 18, margin: 0 }} className="stack">
          {t.items.map((it, i) => <li key={i} style={{ fontSize: 14.5 }}>{it}</li>)}
        </ul>
      </div>

      <div className="card">
        <h2>Bibliografia</h2>
        <ul style={{ paddingLeft: 18, margin: 0 }} className="stack">
          {t.refs.map((r, i) => (
            <li key={i} style={{ fontSize: 14 }}>
              <ExtLink href={r.url}>{r.t}</ExtLink>
              {!r.url && <span className="faint"> (livro)</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Aulas para assistir</h2>
        <p className="faint" style={{ marginTop: 0 }}>Buscas prontas no YouTube — escolha a aula mais recente e de um canal de residência/concursos de saúde.</p>
        <div className="stack">
          {t.videos.map((v) => (
            <a key={v} className="btn small block" style={{ justifyContent: 'flex-start' }} href={ytSearch(v)} target="_blank" rel="noopener noreferrer">
              <Icon.play /> {v}
            </a>
          ))}
        </div>
      </div>

      <div className="card gold">
        <h2>Revisão da teoria</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {last ? `Última revisão em ${fmtShort(last.slice(0, 10))}. Próxima: ${next && next <= today ? 'hoje' : next ? `${fmtShort(next)} (${relDays(daysUntil(next))})` : '—'}.` : 'Você ainda não marcou revisão teórica deste tema.'}
          {' '}O intervalo depende do seu acerto: 3 dias (&lt;50%), 7 (&lt;70%), 14 (&lt;85%) ou 30.
        </p>
        <button className="btn gold" onClick={() => { store.setState('topic', id, new Date().toISOString()); toast('Revisão registrada') }}>
          Revisei a teoria hoje
        </button>
      </div>
    </>
  )
}
