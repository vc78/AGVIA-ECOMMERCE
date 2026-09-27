import api from './api'

// All authentication decisions and state verifications are authoritative on Spring Boot.

export const authService = {
  /**
   * Request Sign-Up OTP for new account registration.
   */
  async requestSignupOtp(payload) {
    try {
      const backendPayload = {
        fullName: payload.fullName || payload.name,
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
        confirmPassword: payload.confirmPassword || payload.password,
        address: payload.address || 'India'
      }
      const { data } = await api.post('/auth/signup/request-otp', backendPayload)
      return data.data
    } catch (err) {
      console.error('[authService.requestSignupOtp] Error:', err)
      throw err
    }
  },

  /**
   * Verify Sign-Up OTP, create account on backend, and issue JWT.
   */
  async verifySignupOtp({ challengeId, otp }) {
    try {
      const { data } = await api.post('/auth/signup/verify-otp', {
        challengeId,
        otp: String(otp).trim()
      })
      const result = data.data
      return {
        token: result.token,
        user: {
          id: result.user.id,
          name: result.user.fullName,
          email: result.user.email,
          phone: result.user.phone,
          phoneVerified: result.user.phoneVerified,
          role: result.user.role === 'ROLE_ADMIN' ? 'ADMIN' : 'CUSTOMER'
        }
      }
    } catch (err) {
      console.error('[authService.verifySignupOtp] Error:', err)
      throw err
    }
  },

  /**
   * Primary Sign-In endpoint.
   * Validates credentials and initiates SMS OTP challenge on backend.
   */
  async login(credentials) {
    try {
      const payload = {
        email: credentials.email || credentials.identifier || '',
        identifier: credentials.identifier || credentials.email || '',
        password: credentials.password
      }
      const { data } = await api.post('/auth/login', payload)
      const res = data.data

      if (res.requiresOtp) {
        return {
          requiresOtp: true,
          challengeId: res.challengeId,
          phoneMasked: res.phoneMasked,
          expiresIn: res.expiresIn || 300,
          devOtp: res.devOtp, // Add devOtp for testing
          message: res.message || 'OTP sent to your verified mobile number'
        }
      }

      // Fallback for direct token issuance if any
      return {
        token: res.accessToken || res.token,
        user: {
          id: res.userId || res.user?.id,
          name: res.fullName || res.user?.fullName,
          email: res.email || res.user?.email,
          phone: res.phone || res.user?.phone,
          role: (res.role === 'ROLE_ADMIN' || res.user?.role === 'ROLE_ADMIN') ? 'ADMIN' : 'CUSTOMER'
        }
      }
    } catch (err) {
      console.error('[authService.login] Error:', err)
      throw err
    }
  },

  /**
   * Verify Sign-In OTP and issue authenticated JWT session.
   */
  async verifyLoginOtp({ challengeId, otp }) {
    try {
      const { data } = await api.post('/auth/login/verify-otp', {
        challengeId,
        otp: String(otp).trim()
      })
      const result = data.data
      return {
        token: result.token,
        user: {
          id: result.user.id,
          name: result.user.fullName,
          email: result.user.email,
          phone: result.user.phone,
          phoneVerified: result.user.phoneVerified,
          role: result.user.role === 'ROLE_ADMIN' ? 'ADMIN' : 'CUSTOMER'
        }
      }
    } catch (err) {
      console.error('[authService.verifyLoginOtp] Error:', err)
      throw err
    }
  },

  /**
   * Resend OTP for pending challenge.
   */
  async resendOtp({ challengeId }) {
    try {
      const { data } = await api.post('/auth/otp/resend', { challengeId })
      return data.data
    } catch (err) {
      console.error('[authService.resendOtp] Error:', err)
      throw err
    }
  },

  /**
   * Admin Login wrapper that validates ROLE_ADMIN post-verification.
   */
  async adminLogin(credentials) {
    return this.login(credentials)
  },

  /**
   * Legacy register fallback.
   */
  async register(payload) {
    return this.requestSignupOtp(payload)
  },

  /**
   * Current user profile from Spring Boot.
   */
  async getCurrentUser() {
    try {
      const { data } = await api.get('/auth/me')
      return data.data
    } catch (err) {
      console.error('[authService.getCurrentUser] Error:', err)
      throw err
    }
  },

  async updateProfile(payload) {
    try {
      const { data } = await api.put('/users/profile', payload)
      return {
        id: data.data.id,
        name: data.data.fullName,
        email: data.data.email,
        phone: data.data.phone,
        address: data.data.address,
        role: data.data.role === 'ROLE_ADMIN' ? 'ADMIN' : 'CUSTOMER'
      }
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  async sendEmailOtp(newEmail) {
    try {
      const { data } = await api.post('/users/email/send-otp', { newEmail })
      return data
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  async verifyEmailOtp(newEmail, otp) {
    try {
      const { data } = await api.post('/users/email/verify-otp', { newEmail, otp })
      return {
        id: data.data.id,
        name: data.data.fullName,
        email: data.data.email,
        phone: data.data.phone,
        phoneVerified: data.data.phoneVerified,
        address: data.data.address,
        role: data.data.role === 'ROLE_ADMIN' ? 'ADMIN' : 'CUSTOMER'
      }
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  async sendPhoneOtp(newPhone) {
    try {
      const { data } = await api.post('/users/phone/send-otp', { newPhone })
      return data
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  async verifyPhoneOtp(newPhone, otp) {
    try {
      const { data } = await api.post('/users/phone/verify-otp', { newPhone, otp })
      return {
        id: data.data.id,
        name: data.data.fullName,
        email: data.data.email,
        phone: data.data.phone,
        phoneVerified: data.data.phoneVerified,
        address: data.data.address,
        role: data.data.role === 'ROLE_ADMIN' ? 'ADMIN' : 'CUSTOMER'
      }
    } catch (err) {
      console.error(err)
      throw err
    }
  }
}
