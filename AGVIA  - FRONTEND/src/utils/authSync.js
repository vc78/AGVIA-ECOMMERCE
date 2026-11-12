import { syncFromStorage, loggedOut } from '../store/authSlice'
import {
  getActiveTabContext,
  getTabToken,
  getTabUser,
  STORAGE_KEYS,
} from './sessionManager'

const CHANNEL_NAME = 'agvia_auth_sync_channel_v2'
const SYNC_KEY = STORAGE_KEYS.SYNC_EVENT

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
 * Explicitly carries the target role (CUSTOMER or ADMIN) to enforce cross-tab session isolation.
 */
export function broadcastAuthEvent(type, payload = {}) {
  const currentTabRole = getActiveTabContext()
  const explicitRole =
    payload.role ||
    (payload.user?.role?.includes('ADMIN') ? 'ADMIN' : currentTabRole)

  const eventData = {
    type, // 'LOGIN' | 'LOGOUT' | 'PROFILE_UPDATED'
    role: explicitRole,
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
 * Initialize multi-tab synchronization with role isolation.
 * Tabs only react to events targeted at their own active role context.
 *
 * @param {Function} dispatch Redux dispatch function
 * @param {Function} onSessionRestored Optional callback to re-verify/fetch authoritative session
 * @returns {Function} cleanup function
 */
export function initAuthSync(dispatch, onSessionRestored) {
  if (typeof window === 'undefined') return () => {}

  const handleSyncEvent = (eventData) => {
    if (!eventData || !eventData.type) return

    const tabContext = getActiveTabContext()
    const eventRole = eventData.role || 'CUSTOMER'

    // ISOLATION BARRIER: Ignore events meant for another role context
    if (eventRole !== tabContext) {
      return
    }

    if (eventData.type === 'LOGOUT') {
      dispatch(loggedOut({ role: tabContext }))
    } else if (eventData.type === 'LOGIN' || eventData.type === 'PROFILE_UPDATED') {
      try {
        const token = getTabToken(tabContext)
        const user = getTabUser(tabContext) || eventData.user

        if (token && user) {
          dispatch(
            syncFromStorage({
              user,
              token,
              role: tabContext,
              isAuthenticated: true,
            })
          )
          if (typeof onSessionRestored === 'function') {
            onSessionRestored(token, tabContext)
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

  // 2. Window storage event listener (fired in other tabs when localStorage changes)
  const handleStorage = (e) => {
    const tabContext = getActiveTabContext()

    if (e.key === SYNC_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue)
        handleSyncEvent(data)
      } catch (err) {
        console.warn('[authSync] Invalid storage sync payload:', err)
      }
    } else if (
      (tabContext === 'CUSTOMER' && (e.key === STORAGE_KEYS.CUSTOMER_TOKEN || e.key === STORAGE_KEYS.CUSTOMER_USER)) ||
      (tabContext === 'ADMIN' && (e.key === STORAGE_KEYS.ADMIN_TOKEN || e.key === STORAGE_KEYS.ADMIN_USER))
    ) {
      const token = getTabToken(tabContext)
      const user = getTabUser(tabContext)

      if (!token) {
        dispatch(loggedOut({ role: tabContext }))
      } else if (user) {
        dispatch(
          syncFromStorage({
            user,
            token,
            role: tabContext,
            isAuthenticated: true,
          })
        )
        if (typeof onSessionRestored === 'function') {
          onSessionRestored(token, tabContext)
        }
      }
    }
  }

  window.addEventListener('storage', handleStorage)

  // 3. Tab focus & visibility change revalidation
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      const tabContext = getActiveTabContext()
      const token = getTabToken(tabContext)
      const user = getTabUser(tabContext)

      const sessionMarker = `agvia_session_${tabContext.toLowerCase()}`
      if (!token) {
        if (sessionStorage.getItem(sessionMarker)) {
          sessionStorage.removeItem(sessionMarker)
          dispatch(loggedOut({ role: tabContext }))
        }
      } else if (user) {
        sessionStorage.setItem(sessionMarker, 'true')
        dispatch(
          syncFromStorage({
            user,
            token,
            role: tabContext,
            isAuthenticated: true,
          })
        )
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
