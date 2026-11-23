import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { store } from './store'
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary'
import './index.css'

// Vite global chunk load error recovery across deployments
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('Vite preload error (new deployment detected). Reloading...', event)
    const reloadKey = 'app_chunk_auto_reload_ts'
    const lastReload = parseInt(sessionStorage.getItem(reloadKey) || '0', 10)
    const now = Date.now()
    if (now - lastReload > 8000) {
      sessionStorage.setItem(reloadKey, String(now))
      window.location.reload()
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <Toaster position="top-center" toastOptions={{
          style: { background: '#5C1A2B', color: '#FBF3E7', fontFamily: 'Inter, sans-serif' },
        }} />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
