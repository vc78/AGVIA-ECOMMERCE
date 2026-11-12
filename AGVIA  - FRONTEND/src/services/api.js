import axios from 'axios'
import { store } from '../store'
import { loggedOut } from '../store/authSlice'
import { getFriendlyErrorMessage, logDeveloperError } from './errorMessageService'
import { getTabToken, getActiveTabContext, clearTabSession } from '../utils/sessionManager'

const RAW_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://agvia.onrender.com/api'
    : 'http://localhost:8080/api')

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
  const url = config.url || ''
  const isExplicitAdminApi = url.includes('/admin/') || url.startsWith('/admin')
  const currentTabContext = getActiveTabContext()

  // Select token based on the target endpoint and active tab context
  let token = null
  if (isExplicitAdminApi || currentTabContext === 'ADMIN') {
    token = getTabToken('ADMIN')
  } else {
    token = getTabToken('CUSTOMER')
  }

  // Fallback to store token if not resolved by tab storage
  if (!token) {
    const storeState = store.getState()?.auth
    token = storeState?.token || null
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config

    // Log diagnostics in developer console
    logDeveloperError(originalRequest?.url || 'API Request', error)

    if (error.response?.status === 401) {
      const isAuthCheck =
        originalRequest?.url?.includes('/auth/me') ||
        originalRequest?.url?.includes('/users/profile') ||
        originalRequest?._isAuthCheck

      const isExplicitAdminApi =
        originalRequest?.url?.includes('/admin/') ||
        originalRequest?.url?.startsWith('/admin')
      const targetRole = isExplicitAdminApi ? 'ADMIN' : 'CUSTOMER'

      if (!isAuthCheck) {
        clearTabSession(targetRole)
        store.dispatch(loggedOut({ role: targetRole }))
      }

      error.customerMessage = getFriendlyErrorMessage(error, 'Please sign in to continue.')
      return Promise.reject(error)
    }

    // Safe retry for idempotent GET requests on network/timeout errors (max 2 retries)
    if (
      originalRequest &&
      originalRequest.method?.toLowerCase() === 'get' &&
      !originalRequest._retryCount &&
      (!error.response ||
        error.code === 'ECONNABORTED' ||
        (error.response.status >= 502 && error.response.status <= 504))
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
