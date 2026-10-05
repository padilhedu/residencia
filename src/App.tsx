import { useEffect } from 'react'
import { useRoute, type Tab } from './lib/router'
import { useStudy } from './lib/study'
import { useSession } from './lib/store'
import { useSyncStatus } from './lib/sync'
import { useAuth } from './lib/supabase'
import { Icon, ToastHost } from './components/ui'
import { Hoje } from './pages/Hoje'
import { Plano } from './pages/Plano'
import { Questoes } from './pages/Questoes'
import { Revisao } from './pages/Revisao'
import { Conteudo } from './pages/Conteudo'
import { Ajustes } from './pages/Ajustes'
import { Sessao } from './pages/Sessao'
import { TOPIC_MAP } from './data/topics'

const NAV: { tab: Tab; label: string; icon: () => JSX.Element }[] = [
  { tab: 'hoje', label: 'Hoje', icon: Icon.home },
  { tab: 'plano', label: 'Plano', icon: Icon.plan },
  { tab: 'questoes', label: 'Questões', icon: Icon.quiz },
  { tab: 'revisao', label: 'Revisão', icon: Icon.review },
  { tab: 'conteudo', label: 'Conteúdo', icon: Icon.book }
]

const TITLES: Record<Tab, string> = {
  hoje: 'Residência Odonto',
  plano: 'Cronograma',
  questoes: 'Resolver questões',
  revisao: 'Revisão e desempenho',
  conteudo: 'Conteúdo programático',
  ajustes: 'Ajustes',
  sessao: 'Questões'
}

export function App() {
  const route = useRoute()
  const study = useStudy()
  const session = useSession()
  const sync = useSyncStatus()
  const { user } = useAuth()

  useEffect(() => {
    const t = study.settings.theme
    if (t === 'auto') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', t)
  }, [study.settings.theme])

  let title = TITLES[route.tab]
  if (route.tab === 'conteudo' && route.param) title = TOPIC_MAP.get(route.param)?.short ?? title
  const sub = route.tab === 'hoje' ? 'ENARE · FDT/Fundatec — Odontologia' : undefined

  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <h1>
            {title}
            {sub && <small>{sub}</small>}
          </h1>
          {session && route.tab !== 'sessao' && (
            <a className="icon-btn" href="#/sessao" aria-label="Voltar à sessão em andamento" title="Sessão em andamento" style={{ width: 'auto', padding: '0 10px', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>
              ▶ Sessão
            </a>
          )}
          <a className="icon-btn" href="#/ajustes" aria-label="Ajustes e conta" title={user ? `Conta: ${sync.status}` : 'Ajustes'}>
            <span style={{ position: 'relative', display: 'grid' }}>
              <Icon.gear />
              <span className={`sync-dot ${user ? sync.status : 'local'}`} style={{ position: 'absolute', right: -4, top: -4 }} />
            </span>
          </a>
        </div>
      </header>

      <main className="page">
        {route.tab === 'hoje' && <Hoje />}
        {route.tab === 'plano' && <Plano />}
        {route.tab === 'questoes' && <Questoes key={route.param ?? ''} topicParam={route.param} />}
        {route.tab === 'revisao' && <Revisao />}
        {route.tab === 'conteudo' && <Conteudo topicId={route.param} />}
        {route.tab === 'ajustes' && <Ajustes />}
        {route.tab === 'sessao' && <Sessao />}
      </main>

      <nav className="tabbar" aria-label="Navegação principal">
        <div className="tabbar-in">
          {NAV.map((n) => (
            <a key={n.tab} href={`#/${n.tab}`} aria-current={route.tab === n.tab ? 'page' : undefined}>
              <n.icon />
              {n.label}
              {n.tab === 'revisao' && study.due.length > 0 && <span className="badge num">{study.due.length > 99 ? '99+' : study.due.length}</span>}
            </a>
          ))}
        </div>
      </nav>
      <ToastHost />
    </>
  )
}
