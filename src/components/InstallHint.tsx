import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

let deferred: BeforeInstallPromptEvent | null = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
  })
}

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

/** Convite para instalar o app na tela inicial (some quando já está instalado) */
export function InstallHint() {
  const [hidden, setHidden] = useState(() => {
    try {
      return isStandalone() || localStorage.getItem('install-hint-hidden') === '1'
    } catch {
      return isStandalone()
    }
  })
  const [canPrompt, setCanPrompt] = useState(!!deferred)
  useEffect(() => {
    const on = () => setCanPrompt(true)
    window.addEventListener('beforeinstallprompt', on)
    return () => window.removeEventListener('beforeinstallprompt', on)
  }, [])
  if (hidden) return null
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const close = () => {
    setHidden(true)
    try {
      localStorage.setItem('install-hint-hidden', '1')
    } catch {
      /* ignora */
    }
  }
  return (
    <div className="card tint">
      <h2>📱 Instale no celular</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Instalado, o app abre em tela cheia e funciona <b>sem internet</b>: as questões ficam salvas no aparelho e o progresso sincroniza quando a conexão voltar.
      </p>
      {ios ? (
        <p className="muted">No Safari: toque em <b>Compartilhar</b> (□↑) → <b>Adicionar à Tela de Início</b>.</p>
      ) : canPrompt ? (
        <button className="btn primary" onClick={async () => { await deferred?.prompt(); deferred = null; close() }}>Instalar app</button>
      ) : (
        <p className="muted">No Chrome: menu <b>⋮</b> → <b>Instalar app</b> (ou “Adicionar à tela inicial”).</p>
      )}
      <button className="btn ghost small" style={{ paddingLeft: 0 }} onClick={close}>Agora não</button>
    </div>
  )
}
