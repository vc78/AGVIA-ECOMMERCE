import axios from 'axios'
import { store } from '../store'
import { loggedOut } from '../store/authSlice'
import { getFriendlyErrorMessage, logDeveloperError } from './errorMessageService'

const RAW_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'https://agvia-ecommerce.onrender.com/api'

// Ensure /api suffix is present and clean trailing slashes
const cleanUrl = RAW_URL.trim().replace(/\/+$/, '')
const BASE_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = store.getState()?.auth?.token || localStorage.getItem('ps_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config

    // Log complete technical diagnostics for developers in console
    logDeveloperError(originalRequest?.url || 'API Request', error)

    if (error.response?.status === 401) {
      // If this was an initial session probe, don't destroy local session state before App.jsx evaluates it
      const isAuthCheck =
        originalRequest?.url?.includes('/auth/me') ||
        originalRequest?.url?.includes('/users/profile') ||
        originalRequest?._isAuthCheck

      if (!isAuthCheck && localStorage.getItem('ps_token')) {
        store.dispatch(loggedOut())
      }
      error.customerMessage = getFriendlyErrorMessage(error, 'Please sign in to continue.')
      return Promise.reject(error)
    }

    // Safe retry for idempotent GET requests on network/timeout errors (max 2 retries)
    if (
      originalRequest &&
      originalRequest.method?.toLowerCase() === 'get' &&
      !originalRequest._retryCount &&
      (!error.response || error.code === 'ECONNABORTED' || (error.response.status >= 502 && error.response.status <= 504))
    ) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
      const delayMs = originalRequest._retryCount * 1000
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      return api(originalRequest)
    }

    // Always sanitize error message into customer-friendly wording
    error.customerMessage = getFriendlyErrorMessage(error)
    return Promise.reject(error)
  }
)

export default api
