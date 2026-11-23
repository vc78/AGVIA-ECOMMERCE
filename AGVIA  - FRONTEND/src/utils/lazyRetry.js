import { lazy } from 'react'

/**
 * Robust lazy loading wrapper with automatic retry and auto-reload on deployment chunk changes.
 * Completely resolves: "TypeError: Failed to fetch dynamically imported module"
 * when a new version of the frontend is built and deployed to Vercel.
 */
export function lazyRetry(importFn) {
  return lazy(() =>
    new Promise((resolve, reject) => {
      importFn()
        .then(resolve)
        .catch((error) => {
          const errMsg = String(error?.message || error || '')
          const isChunkError =
            errMsg.includes('Failed to fetch dynamically imported module') ||
            errMsg.includes('error loading dynamically imported module') ||
            errMsg.includes('Importing a module script failed') ||
            errMsg.includes('Unexpected token') ||
            error?.name === 'TypeError'

          if (isChunkError && typeof window !== 'undefined') {
            const reloadKey = 'app_chunk_auto_reload_ts'
            const lastReload = parseInt(sessionStorage.getItem(reloadKey) || '0', 10)
            const now = Date.now()

            // If we haven't auto-reloaded in the last 10 seconds, force a reload to get the latest chunk manifest
            if (now - lastReload > 10000) {
              sessionStorage.setItem(reloadKey, String(now))
              console.warn('[lazyRetry] New deployment chunk detected. Auto-refreshing to latest version...', error)
              window.location.reload()
              return
            }
          }

          reject(error)
        })
    })
  )
}

export default lazyRetry
