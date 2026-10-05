import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import { startSyncLoop } from './lib/sync'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

startSyncLoop()

// Service worker: deixa o app (e as 280 questões) disponível offline e atualiza sozinho.
registerSW({ immediate: true })
