/**
 * AGVIA Luxury Boutique & Atelier — Role-Scoped Multi-Tab Session Manager
 *
 * Provides cryptographic-grade session isolation between Customer and Administrator roles.
 * Prevents cross-tab authentication collision where an admin login in one tab overwrites
 * or converts an active customer session in another tab.
 */

export const STORAGE_KEYS = {
  CUSTOMER_TOKEN: 'agvia_customer_token',
  CUSTOMER_USER: 'agvia_customer_user',
  ADMIN_TOKEN: 'agvia_admin_token',
  ADMIN_USER: 'agvia_admin_user',
  ACTIVE_TAB_ROLE: 'agvia_tab_role',
  SYNC_EVENT: 'agvia_auth_sync_event',
}

/**
 * Detect the role context of the current tab.
 * A tab running in '/admin/*' or explicitly designated as 'ADMIN' is scoped to ADMIN.
 * All boutique customer pages default to 'CUSTOMER'.
 */
export function getActiveTabContext() {
  if (typeof window === 'undefined') return 'CUSTOMER'

  try {
    const sessionRole = sessionStorage.getItem(STORAGE_KEYS.ACTIVE_TAB_ROLE)
    if (sessionRole === 'ADMIN' || sessionRole === 'CUSTOMER') {
      return sessionRole
    }

    const pathname = window.location.pathname.toLowerCase()
    if (pathname.startsWith('/admin')) {
      sessionStorage.setItem(STORAGE_KEYS.ACTIVE_TAB_ROLE, 'ADMIN')
      return 'ADMIN'
    }

    sessionStorage.setItem(STORAGE_KEYS.ACTIVE_TAB_ROLE, 'CUSTOMER')
    return 'CUSTOMER'
  } catch {
    return 'CUSTOMER'
  }
}

/**
 * Set the role context for the current tab.
 */
export function setActiveTabContext(role) {
  if (typeof window === 'undefined') return
  try {
    const normalized = role === 'ADMIN' || role === 'ROLE_ADMIN' ? 'ADMIN' : 'CUSTOMER'
    sessionStorage.setItem(STORAGE_KEYS.ACTIVE_TAB_ROLE, normalized)
  } catch (e) {
    console.warn('[sessionManager] Failed to set active tab context:', e)
  }
}

/**
 * Retrieve the active token for this specific tab context.
 */
export function getTabToken(preferredRole) {
  if (typeof window === 'undefined') return null

  const role = preferredRole || getActiveTabContext()

  try {
    if (role === 'ADMIN') {
      return (
        sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) ||
        localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) ||
        null
      )
    }

    // CUSTOMER role
    return (
      localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN) ||
      sessionStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN) ||
      localStorage.getItem('ps_token') || // Legacy fallback
      null
    )
  } catch {
    return null
  }
}

/**
 * Retrieve the active user for this specific tab context.
 */
export function getTabUser(preferredRole) {
  if (typeof window === 'undefined') return null

  const role = preferredRole || getActiveTabContext()

  try {
    let raw = null
    if (role === 'ADMIN') {
      raw =
        sessionStorage.getItem(STORAGE_KEYS.ADMIN_USER) ||
        localStorage.getItem(STORAGE_KEYS.ADMIN_USER)
    } else {
      raw =
        localStorage.getItem(STORAGE_KEYS.CUSTOMER_USER) ||
        sessionStorage.getItem(STORAGE_KEYS.CUSTOMER_USER) ||
        localStorage.getItem('ps_user') // Legacy fallback
    }

    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Persist credentials into role-isolated storage.
 */
export function setTabSession({ role, user, token }) {
  if (typeof window === 'undefined') return

  const normalizedRole =
    role === 'ADMIN' ||
    role === 'ROLE_ADMIN' ||
    user?.role === 'ADMIN' ||
    user?.role === 'ROLE_ADMIN'
      ? 'ADMIN'
      : 'CUSTOMER'

  try {
    if (normalizedRole === 'ADMIN') {
      // Admin session is isolated per tab/session with scoped fallback
      if (token) {
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token)
        localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token)
      }
      if (user) {
        const payload = JSON.stringify(user)
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_USER, payload)
        localStorage.setItem(STORAGE_KEYS.ADMIN_USER, payload)
      }
      sessionStorage.setItem(STORAGE_KEYS.ACTIVE_TAB_ROLE, 'ADMIN')
    } else {
      // Customer session is stored in customer-scoped keys
      if (token) {
        localStorage.setItem(STORAGE_KEYS.CUSTOMER_TOKEN, token)
        sessionStorage.setItem(STORAGE_KEYS.CUSTOMER_TOKEN, token)
        localStorage.setItem('ps_token', token) // Backward compatibility
      }
      if (user) {
        const payload = JSON.stringify(user)
        localStorage.setItem(STORAGE_KEYS.CUSTOMER_USER, payload)
        sessionStorage.setItem(STORAGE_KEYS.CUSTOMER_USER, payload)
        localStorage.setItem('ps_user', payload) // Backward compatibility
      }
      sessionStorage.setItem(STORAGE_KEYS.ACTIVE_TAB_ROLE, 'CUSTOMER')
    }
  } catch (e) {
    console.warn('[sessionManager] Failed to persist session:', e)
  }
}

/**
 * Clear session for a specific role without affecting the other role.
 */
export function clearTabSession(roleToClear) {
  if (typeof window === 'undefined') return

  const role = roleToClear || getActiveTabContext()

  try {
    if (role === 'ADMIN') {
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN)
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_USER)
      localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.ADMIN_USER)
    } else {
      localStorage.removeItem(STORAGE_KEYS.CUSTOMER_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.CUSTOMER_USER)
      sessionStorage.removeItem(STORAGE_KEYS.CUSTOMER_TOKEN)
      sessionStorage.removeItem(STORAGE_KEYS.CUSTOMER_USER)
      localStorage.removeItem('ps_token')
      localStorage.removeItem('ps_user')
      localStorage.removeItem('ps_cart')
      localStorage.removeItem('ps_wishlist')
      localStorage.removeItem('ps_circle_member')
    }
  } catch (e) {
    console.warn('[sessionManager] Failed to clear session:', e)
  }
}

