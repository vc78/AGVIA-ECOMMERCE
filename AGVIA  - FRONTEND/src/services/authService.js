import api from './api'

const normalizeRole = (role) => (role === 'ROLE_ADMIN' || role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER')

const mapAuthUser = (rawUser = {}) => ({
  id: rawUser.id,
  name: rawUser.fullName || rawUser.name,
  email: rawUser.email,
  phone: rawUser.phone,
  address: rawUser.address,
  phoneVerified: rawUser.phoneVerified,
  role: normalizeRole(rawUser.role),
})

export const authService = {
  /**
   * Normal credentials registration (no OTP required).
   */
  async register({ fullName, email, password, confirmPassword, termsAccepted }) {
    const { data } = await api.post('/auth/register', {
      fullName: fullName?.trim(),
      email: email?.trim(),
      password,
      confirmPassword,
      termsAccepted: Boolean(termsAccepted),
    })
    const res = data.data
    return {
      token: res.token,
      user: mapAuthUser(res.user),
    }
  },

  /**
   * Standard email and password sign-in (no OTP challenge).
   */
  async login({ email, password, rememberMe = true }) {
    const { data } = await api.post('/auth/login', {
      email: email?.trim(),
      identifier: email?.trim(),
      password,
      rememberMe: Boolean(rememberMe),
    })
    const res = data.data
    return {
      token: res.token || res.accessToken,
      user: mapAuthUser(res.user || res),
    }
  },

  /**
   * Authenticate customer using verified Google ID token.
   */
  async googleLogin(credential, nonce) {
    const { data } = await api.post('/auth/google', { credential, nonce })
    const res = data.data
    return {
      token: res.token,
      user: mapAuthUser(res.user),
    }
  },

  /**
   * Explicitly link a verified Google account while authenticated.
   */
  async linkGoogleAccount(credential, nonce) {
    const { data } = await api.post('/auth/google/link', { credential, nonce })
    return mapAuthUser(data.data)
  },

  /**
   * Request a single-use password reset link via email.
   */
  async forgotPassword(email) {
    const { data } = await api.post('/auth/forgot-password', { email: email?.trim() })
    return data
  },

  /**
   * Reset password using the token from email link.
   */
  async resetPassword({ token, newPassword, confirmPassword }) {
    const { data } = await api.post('/auth/reset-password', {
      token,
      newPassword,
      confirmPassword,
    })
    return data
  },

  /**
   * Change password while signed in and receive rotated session token.
   */
  async changePassword({ currentPassword, newPassword, confirmPassword }) {
    const { data } = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    })
    const res = data.data
    return {
      token: res.token,
      user: mapAuthUser(res.user),
    }
  },

  async adminLogin(credentials) {
    return this.login(credentials)
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.warn('[authService.logout] Backend logout unreachable:', err?.message)
    }
  },

  async getCurrentUser() {
    const { data } = await api.get('/auth/me', { _isAuthCheck: true })
    return data.data
  },

  async updateProfile(payload) {
    const { data } = await api.put('/users/profile', payload)
    return mapAuthUser(data.data)
  },
}
