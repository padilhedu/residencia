import { useSyncExternalStore } from 'react'

export type Tab = 'hoje' | 'plano' | 'questoes' | 'revisao' | 'conteudo' | 'ajustes' | 'sessao' | 'gabaritos' | 'cards'
const TABS: Tab[] = ['hoje', 'plano', 'questoes', 'revisao', 'conteudo', 'ajustes', 'sessao', 'gabaritos', 'cards']

export interface Route {
  tab: Tab
  param?: string
}

function parse(): Route {
  const h = (typeof location !== 'undefined' ? location.hash : '').replace(/^#\/?/, '')
  const [tab, ...rest] = h.split('/')
  const t = TABS.includes(tab as Tab) ? (tab as Tab) : 'hoje'
  return { tab: t, param: rest.length ? decodeURIComponent(rest.join('/')) : undefined }
}

let route = parse()
const listeners = new Set<() => void>()
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    route = parse()
    listeners.forEach((l) => l())
    window.scrollTo(0, 0)
  })
}

export function useRoute(): Route {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => route
  )
}

export function go(tab: Tab, param?: string) {
  location.hash = `#/${tab}${param ? '/' + encodeURIComponent(param) : ''}`
}
