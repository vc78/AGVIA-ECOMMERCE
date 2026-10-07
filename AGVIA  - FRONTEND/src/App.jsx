import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AppRoutes from './routes/AppRoutes'
import LoadingScreen from './components/customer/LoadingScreen'
import { authService } from './services/authService'
import { loggedOut, profileUpdated, authCheckCompleted } from './store/authSlice'
import { initAuthSync } from './utils/authSync'

export default function App() {
  const dispatch = useDispatch()
  const { isAuthLoading } = useSelector((state) => state.auth)

  useEffect(() => {
    // 1. Initialize cross-tab synchronization (storage events + BroadcastChannel)
    const cleanupAuthSync = initAuthSync(dispatch, () => {
      // Authoritatively refresh profile when another tab completes login
      authService.getCurrentUser()
        .then((userData) => {
          if (userData) {
            dispatch(profileUpdated({
              id: userData.id,
              name: userData.fullName || userData.name,
              email: userData.email,
              phone: userData.phone,
              phoneVerified: userData.phoneVerified,
              role: userData.role === 'ROLE_ADMIN' || userData.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER'
            }))
          }
        })
        .catch(() => {})
    })

    // 2. Authoritative session verification on application startup
    let isMounted = true
    const token = typeof window !== 'undefined' ? localStorage.getItem('ps_token') : null

    if (!token) {
      dispatch(authCheckCompleted())
    } else {
      authService.getCurrentUser()
        .then((userData) => {
          if (isMounted && userData) {
            dispatch(profileUpdated({
              id: userData.id,
              name: userData.fullName || userData.name,
              email: userData.email,
              phone: userData.phone,
              phoneVerified: userData.phoneVerified,
              role: userData.role === 'ROLE_ADMIN' || userData.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER'
            }))
          }
        })
        .catch((err) => {
          if (isMounted) {
            // ONLY log out if backend explicitly returns 401 Unauthorized or 403 Forbidden
            if (err.response?.status === 401 || err.response?.status === 403) {
              if (localStorage.getItem('ps_token')) {
                dispatch(loggedOut())
              }
            }
          }
        })
        .finally(() => {
          if (isMounted) {
            dispatch(authCheckCompleted())
          }
        })
    }

    return () => {
      isMounted = false
      cleanupAuthSync()
    }
  }, [dispatch])

  return (
    <>
      <LoadingScreen />
      <AppRoutes />
    </>
  )
}
