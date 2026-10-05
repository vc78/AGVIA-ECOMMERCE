import { createSlice } from '@reduxjs/toolkit'

const storedUser = (() => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('ps_user') : null
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
})()

const storedToken = (() => {
  try {
    return typeof window !== 'undefined' ? (localStorage.getItem('ps_token') || null) : null
  } catch {
    return null
  }
})()

const initialState = {
  user: storedUser,       // { id, name, email, role: 'CUSTOMER' | 'ADMIN' }
  token: storedToken,
  isAuthenticated: !!(storedToken && storedUser),
  isAuthLoading: true,    // Distinguishes "checking authentication" from "definitely logged out"
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    credentialsReceived: (state, action) => {
      const { user, token } = action.payload
      state.user = user || state.user
      state.token = token || state.token
      state.isAuthenticated = true
      state.isAuthLoading = false
      try {
        if (user) localStorage.setItem('ps_user', JSON.stringify(state.user))
        if (token) localStorage.setItem('ps_token', state.token)
      } catch (e) {
        console.warn('Could not persist auth to localStorage:', e)
      }
    },
    loggedOut: (state) => {
      const currentUserId = state.user?.id
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.isAuthLoading = false
      // Clear ALL session-scoped keys so the next user starts completely fresh
      try {
        localStorage.removeItem('ps_user')
        localStorage.removeItem('ps_token')
        localStorage.removeItem('ps_cart')
        localStorage.removeItem('ps_wishlist')
        localStorage.removeItem('ps_circle_member')
        if (currentUserId) {
          localStorage.removeItem(`ps_cart_${currentUserId}`)
          localStorage.removeItem(`ps_user_addresses_${currentUserId}`)
        }
      } catch (e) {
        console.warn('Could not clear localStorage on logout:', e)
      }
      // Notify cart hook listeners so UI count badge resets immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('ps-cart-updated'))
      }
    },
    profileUpdated: (state, action) => {
      state.user = { ...(state.user || {}), ...action.payload }
      state.isAuthenticated = true
      state.isAuthLoading = false
      try {
        localStorage.setItem('ps_user', JSON.stringify(state.user))
      } catch (e) {
        console.warn('Could not persist updated profile:', e)
      }
    },
    authCheckStarted: (state) => {
      state.isAuthLoading = true
    },
    authCheckCompleted: (state) => {
      state.isAuthLoading = false
    },
    syncFromStorage: (state, action) => {
      const { user, token, isAuthenticated } = action.payload
      state.user = user || null
      state.token = token || null
      state.isAuthenticated = !!isAuthenticated
      state.isAuthLoading = false
    },
  },
})

export const {
  credentialsReceived,
  loggedOut,
  profileUpdated,
  authCheckStarted,
  authCheckCompleted,
  syncFromStorage,
} = authSlice.actions

export default authSlice.reducer
