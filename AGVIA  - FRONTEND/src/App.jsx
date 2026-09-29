import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AppRoutes from './routes/AppRoutes'
import LoadingScreen from './components/customer/LoadingScreen'
import { authService } from './services/authService'
import { loggedOut, profileUpdated } from './store/authSlice'

export default function App() {
  const dispatch = useDispatch()
  const { token } = useSelector((state) => state.auth)

  // Verify stored session with backend on initial mount to ensure session validity
  useEffect(() => {
    if (token) {
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
        .catch((err) => {
          // If token is invalid, expired, or rejected, clear local session immediately
          if (err.response?.status === 401 || err.response?.status === 403) {
            dispatch(loggedOut())
          }
        })
    }
  }, [])

  return (
    <>
      <LoadingScreen />
      <AppRoutes />
    </>
  )
}
