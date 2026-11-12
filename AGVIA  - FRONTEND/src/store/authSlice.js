import { createSlice } from '@reduxjs/toolkit'
import {
  getActiveTabContext,
  getTabToken,
  getTabUser,
  setTabSession,
  clearTabSession,
} from '../utils/sessionManager'

const initialRole = getActiveTabContext()
const storedUser = getTabUser(initialRole)
const storedToken = getTabToken(initialRole)

const initialState = {
  user: storedUser, // { id, name, email, role: 'CUSTOMER' | 'ADMIN' }
  token: storedToken,
  isAuthenticated: !!(storedToken && storedUser),
  isAuthLoading: !!storedToken,
  tabRole: initialRole, // 'CUSTOMER' | 'ADMIN'
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    credentialsReceived: (state, action) => {
      const { user, token, role } = action.payload || {}
      const targetUser = user || state.user
      const targetToken = token || state.token
      const effectiveRole =
        role ||
        (targetUser?.role?.includes('ADMIN') ? 'ADMIN' : 'CUSTOMER')

      state.user = targetUser
      state.token = targetToken
      state.isAuthenticated = !!(targetUser && targetToken)
      state.isAuthLoading = false
      state.tabRole = effectiveRole

      setTabSession({
        role: effectiveRole,
        user: targetUser,
        token: targetToken,
      })
    },
    loggedOut: (state, action) => {
      const targetRole = action?.payload?.role || state.tabRole || getActiveTabContext()
      const currentUserId = state.user?.id

      // Clear the target role's storage without touching the other role
      clearTabSession(targetRole)

      if (currentUserId && targetRole === 'CUSTOMER') {
        try {
          localStorage.removeItem(`ps_cart_${currentUserId}`)
          localStorage.removeItem(`ps_user_addresses_${currentUserId}`)
        } catch (_) {}
      }

      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.isAuthLoading = false

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('ps-cart-updated'))
      }
    },
    profileUpdated: (state, action) => {
      const updatedUser = { ...(state.user || {}), ...action.payload }
      state.user = updatedUser
      state.isAuthenticated = true
      state.isAuthLoading = false

      setTabSession({
        role: state.tabRole,
        user: updatedUser,
        token: state.token,
      })
    },
    authCheckStarted: (state) => {
      state.isAuthLoading = true
    },
    authCheckCompleted: (state) => {
      state.isAuthLoading = false
    },
    syncFromStorage: (state, action) => {
      const { user, token, role, isAuthenticated } = action.payload || {}
      const tabContext = getActiveTabContext()

      // CRUCIAL: Cross-tab sync must NEVER overwrite a customer tab with admin credentials,
      // and vice versa. Only sync if the incoming role matches the active tab's context.
      const incomingRole =
        role ||
        (user?.role?.includes('ADMIN') ? 'ADMIN' : 'CUSTOMER')

      if (incomingRole !== tabContext) {
        // Silently drop cross-role sync event
        return
      }

      state.user = user || null
      state.token = token || null
      state.isAuthenticated = !!isAuthenticated
      state.isAuthLoading = false
      state.tabRole = tabContext
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
