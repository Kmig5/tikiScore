import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/global.css'
import App from './App.tsx'
import { ToastProvider } from './contexts/ToastContext.tsx'
import { DemoAccessProvider } from './app/DemoAccessContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <DemoAccessProvider>
          <App />
        </DemoAccessProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
