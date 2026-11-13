import { useMemo, useState } from 'react'
import {
  CATEGORIAS, FONTES_MANUAIS, alertOf, ativo, loadConcursos, refreshConcursos, setTrack, situacao, trackOf, useConcursos,
  type Categoria, type Concurso
} from '../lib/concursos'
import { useData, store } from '../lib/store'
import { useAuth, supabase } from '../lib/supabase'
import { currentSubscription, enableReminders, isIOS, isStandalone, pushSupported } from '../lib/push'
import { daysUntil, fmtShort, todayISO } from '../lib/dates'
import { Icon, toast } from '../components/ui'

type Filtro = 'todas' | Categoria | 'acompanhando'

const CAT_NOME: Record<Categoria, string> = { sc: 'SC', enare: 'ENARE', residencia: 'Residência' }

/** Radar de concursos para cirurgiões-dentistas: SC, ENARE e residências no Brasil */
export function Concursos() {
  const { items, loadedAt, loading, error } = useConcursos()
  const d = useData()
  const { user } = useAuth()
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [verEncerrados, setVerEncerrados] = useState(false)
  const [busca, setBusca] = useState('')
  const [busy, setBusy] = useState(false)
  const today = todayISO()

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    return items
      .filter((c) => {
        const t = trackOf(d, c.id)
        if (filtro === 'acompanhando') return t.fav || t.inscrito
        if (t.oculto) return false
        if (filtro !== 'todas' && c.categoria !== filtro) return false
        if (!verEncerrados && !ativo(c, today)) return false
        if (q && !`${c.titulo} ${c.orgao ?? ''} ${c.resumo ?? ''} ${c.uf ?? ''}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q)) return false
        return true
      })
      .sort((a, b) => {
        // prazos mais próximos primeiro; sem data depois, pelos mais recentes
        const sa = a.inscricoes_ate && a.inscricoes_ate >= today ? a.inscricoes_ate : null
        const sb = b.inscricoes_ate && b.inscricoes_ate >= today ? b.inscricoes_ate : null
        if (sa && sb) return sa.localeCompare(sb)
        if (sa) return -1
        if (sb) return 1
        return b.primeiro_visto.localeCompare(a.primeiro_visto)
      })
  }, [items, d, filtro, verEncerrados, busca, today])

  const contagem = useMemo(() => {
    const n: Record<string, number> = { todas: 0, sc: 0, enare: 0, residencia: 0, acompanhando: 0 }
    for (const c of items) {
      const t = trackOf(d, c.id)
      if (t.fav || t.inscrito) n.acompanhando++
      if (t.oculto || !ativo(c, today)) continue
      n.todas++
      n[c.categoria]++
    }
    return n
  }, [items, d, today])

  const buscarAgora = async () => {
    setBusy(true)
    try {
      toast(await refreshConcursos())
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  if (!supabase) {
    return (
      <>
        <div className="card tint">
          <h2>Radar de concursos</h2>
          <p className="muted" style={{ margin: 0 }}>A busca automática precisa do Supabase configurado (variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY). Enquanto isso, confira os sites abaixo.</p>
        </div>
        <Fontes />
      </>
    )
  }

  return (
    <>
      <div className="card tint">
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ marginBottom: 2 }}>Radar de concursos</h2>
            <div className="faint">
              Concursos para cirurgião-dentista em SC, ENARE e residências em Odontologia. Busca automática 2x por dia.
              {loadedAt && <> Atualizado {new Date(loadedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}.</>}
            </div>
          </div>
        </div>
        <div className="row wrap" style={{ marginTop: 10 }}>
          <button className="btn small primary" disabled={busy || loading} onClick={user ? buscarAgora : () => void loadConcursos()}>
            {busy ? 'Buscando nas fontes…' : loading ? 'Carregando…' : user ? 'Buscar agora' : 'Recarregar'}
          </button>
          {!user && <span className="faint">Entre na conta (Ajustes) para forçar uma busca nova e receber alertas.</span>}
        </div>
        {error && <div className="alert">Não consegui carregar: {error}. Mostrando a última lista salva.</div>}
      </div>

      <div className="chips scroll" style={{ marginBottom: 10 }}>
        {(['todas', 'sc', 'enare', 'residencia', 'acompanhando'] as Filtro[]).map((f) => (
          <button key={f} className="chip" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
            {f === 'todas' ? 'Todos' : f === 'acompanhando' ? '★ Acompanhando' : CATEGORIAS.find((c) => c.id === f)!.nome} <span className="num">({contagem[f]})</span>
          </button>
        ))}
      </div>
      <div className="row" style={{ marginBottom: 12 }}>
        <input type="search" placeholder="Filtrar por cidade, órgão, especialidade…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Filtrar" />
      </div>
      {filtro !== 'acompanhando' && (
        <label className="row faint" style={{ marginBottom: 12, cursor: 'pointer' }}>
          <input type="checkbox" className="check" checked={verEncerrados} onChange={(e) => setVerEncerrados(e.target.checked)} />
          Mostrar também encerrados e antigos
        </label>
      )}

      {lista.length === 0 ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            {loading ? 'Carregando…' : items.length === 0 ? 'Nenhum edital na base ainda. A primeira varredura acontece no próximo horário agendado (07h23 ou 18h23) ou quando você tocar em “Buscar agora”.' : 'Nada com esses filtros no momento.'}
          </p>
        </div>
      ) : (
        lista.map((c) => <Item key={c.id} c={c} />)
      )}

      <Alerta />
      <Fontes />
      <p className="faint" style={{ margin: '4px 2px 12px' }}>
        Os itens vêm de buscas automáticas em sites de notícias e agregadores: <b>confira sempre o edital oficial</b> (prazos, requisitos e se há vaga para Odontologia).
      </p>
    </>
  )
}

function Item({ c }: { c: Concurso }) {
  const d = useData()
  const t = trackOf(d, c.id)
  const s = situacao(c)
  const novo = Date.now() - Date.parse(c.primeiro_visto) < 3 * 864e5
  const prazo =
    s === 'sem-data' ? <span className="tag">prazo: ver edital</span>
    : s === 'encerrado' ? <span className="tag no">encerrado {fmtShort(c.inscricoes_ate!)}</span>
    : s === 'encerrando' ? <span className="tag warn">até {fmtShort(c.inscricoes_ate!)} · {daysUntil(c.inscricoes_ate!) === 0 ? 'hoje' : `${daysUntil(c.inscricoes_ate!)}d`}</span>
    : <span className="tag ok">até {fmtShort(c.inscricoes_ate!)}</span>
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="row wrap" style={{ gap: 6, marginBottom: 6 }}>
        <span className="tag gold">{CAT_NOME[c.categoria]}</span>
        {c.uf && c.categoria !== 'sc' && <span className="tag">{c.uf}</span>}
        {prazo}
        {novo && <span className="tag ok">novo</span>}
        {t.inscrito && <span className="tag ok">✓ inscrito</span>}
      </div>
      <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.35, display: 'block' }}>
        {c.titulo} <Icon.ext />
      </a>
      {(c.vagas || c.salario) && <div className="muted" style={{ marginTop: 4 }}>{[c.vagas, c.salario && `até ${c.salario}`].filter(Boolean).join(' · ')}</div>}
      {c.resumo && <div className="faint" style={{ marginTop: 4 }}>{c.resumo.length > 220 ? c.resumo.slice(0, 220) + '…' : c.resumo}</div>}
      <div className="row between" style={{ marginTop: 8 }}>
        <span className="faint">{c.fonte}</span>
        <div className="row" style={{ gap: 4 }}>
          <button className="btn ghost small" aria-pressed={!!t.fav} title="Acompanhar" aria-label="Acompanhar" onClick={() => setTrack(store.get(), c.id, { fav: !t.fav })} style={{ color: t.fav ? 'var(--gold)' : undefined }}>
            {Icon.star(t.fav)}
          </button>
          <button className="btn ghost small" onClick={() => setTrack(store.get(), c.id, { inscrito: !t.inscrito })}>{t.inscrito ? 'Desmarcar' : 'Inscrito'}</button>
          <button className="btn ghost small" onClick={() => { setTrack(store.get(), c.id, { oculto: !t.oculto }); if (!t.oculto) toast('Ocultado — não aparece mais na lista') }}>{t.oculto ? 'Mostrar' : 'Ocultar'}</button>
        </div>
      </div>
    </div>
  )
}

function Alerta() {
  const d = useData()
  const { user } = useAuth()
  const a = alertOf(d)
  const [busy, setBusy] = useState(false)
  if (!user) return null
  const toggle = async () => {
    setBusy(true)
    try {
      if (!a.on && !(await currentSubscription())) await enableReminders(19)
      store.setState('alert', 'concursos', { ...a, on: !a.on })
      toast(a.on ? 'Alertas de concursos desligados' : 'Você será avisado quando surgir edital novo')
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }
  const setCat = (cat: Categoria) => {
    const cats = a.categorias.includes(cat) ? a.categorias.filter((x) => x !== cat) : [...a.categorias, cat]
    if (cats.length) store.setState('alert', 'concursos', { ...a, categorias: cats })
  }
  return (
    <div className="card">
      <h2>Avisar quando surgir edital novo</h2>
      <p className="muted" style={{ marginTop: 0 }}>Notificação no celular logo depois da varredura (07h23 e 18h23) que encontrar editais novos.</p>
      {!pushSupported() ? (
        <div className="alert">Este navegador não suporta notificações.</div>
      ) : isIOS() && !isStandalone() ? (
        <div className="alert">No iPhone, instale o app na Tela de Início (Compartilhar → Adicionar à Tela de Início) para receber avisos.</div>
      ) : (
        <>
          <div className="chips" style={{ marginBottom: 10 }}>
            {CATEGORIAS.map((c) => (
              <button key={c.id} className="chip" aria-pressed={a.categorias.includes(c.id)} onClick={() => setCat(c.id)}>{c.nome}</button>
            ))}
          </div>
          <button className={`btn small ${a.on ? '' : 'primary'}`} disabled={busy} onClick={toggle}>{a.on ? 'Desligar alertas' : 'Ligar alertas'}</button>
        </>
      )}
    </div>
  )
}

function Fontes() {
  return (
    <div className="card">
    <details className="fold" style={{ border: 0, margin: 0, padding: 0 }}>
      <summary>Sites para conferir à mão</summary>
      <div className="list" style={{ marginTop: 8 }}>
        {FONTES_MANUAIS.map((f) => (
          <a key={f.url} className="list-item" href={f.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="t"><b>{f.nome}</b><span>{f.cat === 'todas' ? '' : CAT_NOME[f.cat]}</span></div>
            <Icon.ext />
          </a>
        ))}
      </div>
    </details>
    </div>
  )
}
