import { syncFromStorage, loggedOut } from '../store/authSlice'

const CHANNEL_NAME = 'agvia_auth_sync_channel'
const SYNC_KEY = 'ps_auth_sync'

let broadcastChannel = null
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME)
  }
} catch (e) {
  console.warn('[authSync] BroadcastChannel not supported or restricted:', e)
}

/**
 * Broadcast an authentication event to all other tabs.
 * Uses both BroadcastChannel (immediate) and localStorage storage event (universal).
 */
export function broadcastAuthEvent(type, payload = {}) {
  const eventData = {
    type, // 'LOGIN' | 'LOGOUT' | 'PROFILE_UPDATED'
    timestamp: Date.now(),
    ...payload,
  }

  // 1. Post via BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(eventData)
    } catch (e) {
      console.warn('[authSync] Failed to post to BroadcastChannel:', e)
    }
  }

  // 2. Trigger cross-tab storage event via localStorage update
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify(eventData))
  } catch (e) {
    console.warn('[authSync] Failed to write sync key to localStorage:', e)
  }
}

/**
 * Initialize multi-tab synchronization.
 * Listens for cross-tab login/logout events, storage changes, and tab visibility changes.
 *
 * @param {Function} dispatch Redux dispatch function
 * @param {Function} onSessionRestored Optional callback to re-verify/fetch authoritative session
 * @returns {Function} cleanup function
 */
export function initAuthSync(dispatch, onSessionRestored) {
  if (typeof window === 'undefined') return () => {}

  const handleSyncEvent = (eventData) => {
    if (!eventData || !eventData.type) return

    if (eventData.type === 'LOGOUT') {
      dispatch(loggedOut())
    } else if (eventData.type === 'LOGIN' || eventData.type === 'PROFILE_UPDATED') {
      try {
        const rawUser = localStorage.getItem('ps_user')
        const token = localStorage.getItem('ps_token')
        const user = rawUser ? JSON.parse(rawUser) : eventData.user

        if (token && user) {
          dispatch(syncFromStorage({ user, token, isAuthenticated: true }))
          if (typeof onSessionRestored === 'function') {
            onSessionRestored(token)
          }
        }
      } catch (e) {
        console.warn('[authSync] Failed to parse credentials on sync event:', e)
      }
    }
  }

  // 1. BroadcastChannel message listener
  const handleBroadcastMessage = (event) => {
    if (event.data) {
      handleSyncEvent(event.data)
    }
  }

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage)
  }

  // 2. Window storage event listener (fired only in other tabs when localStorage changes)
  const handleStorage = (e) => {
    if (e.key === SYNC_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue)
        handleSyncEvent(data)
      } catch (err) {
        console.warn('[authSync] Invalid storage sync payload:', err)
      }
    } else if (e.key === 'ps_token' || e.key === 'ps_user') {
      const token = localStorage.getItem('ps_token')
      const rawUser = localStorage.getItem('ps_user')

      if (!token) {
        dispatch(loggedOut())
      } else if (rawUser) {
        try {
          const user = JSON.parse(rawUser)
          dispatch(syncFromStorage({ user, token, isAuthenticated: true }))
          if (typeof onSessionRestored === 'function') {
            onSessionRestored(token)
          }
        } catch {
          // ignore parsing error
        }
      }
    }
  }

  window.addEventListener('storage', handleStorage)

  // 3. Tab focus & visibility change revalidation
  // When user switches back to this tab from another tab where they logged in/out
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      const token = localStorage.getItem('ps_token')
      const rawUser = localStorage.getItem('ps_user')

      if (!token) {
        // Tab A logged out while Tab B was hidden
        dispatch(loggedOut())
      } else if (rawUser) {
        try {
          const user = JSON.parse(rawUser)
          dispatch(syncFromStorage({ user, token, isAuthenticated: true }))
        } catch {
          // ignore
        }
      }
    }
  }

  window.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('focus', handleVisibility)

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage)
    }
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener('visibilitychange', handleVisibility)
    window.removeEventListener('focus', handleVisibility)
  }
}
