import axios from 'axios'
import { store } from '../store'
import { loggedOut } from '../store/authSlice'

const RAW_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'https://agvia-ecommerce.onrender.com/api'

// Ensure /api suffix is present and clean trailing slashes
const cleanUrl = RAW_URL.trim().replace(/\/+$/, '')
const BASE_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401) {
      store.dispatch(loggedOut())
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

    return Promise.reject(error)
  }
)

export default api
