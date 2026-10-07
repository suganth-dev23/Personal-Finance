import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import { AppErrorBoundary } from './components/common/AppErrorBoundary'

// Register PWA service worker with auto-update
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary isRoot>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
