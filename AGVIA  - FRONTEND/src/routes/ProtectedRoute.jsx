import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import BoutiqueSpinner from '../components/customer/BoutiqueSpinner'

/**
 * Guards a route by authentication and (optionally) role.
 * role="ADMIN"    -> only admins may pass, others sent to /admin/login
 * role="CUSTOMER" -> any authenticated user/customer may pass, others sent to /login
 * 
 * Crucial: Distinguishes "authentication in flight" (isAuthLoading) from "user definitely logged out".
 */
export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, isAuthLoading } = useSelector((state) => state.auth)
  const location = useLocation()

  // Wait for session verification before making redirect decisions
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF8]">
        <BoutiqueSpinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    const loginTarget = role === 'ADMIN' ? '/admin/login' : '/login'
    return <Navigate to={loginTarget} state={{ from: location.pathname }} replace />
  }

  // Admin route check: only ADMIN or ROLE_ADMIN
  if (role === 'ADMIN') {
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN'
    if (!isAdmin) {
      return <Navigate to="/admin/login" replace />
    }
    return children
  }

  // Customer or general authenticated route:
  // Any logged-in customer (with role CUSTOMER, USER, ROLE_USER, etc., or even ADMIN) is allowed to view customer pages.
  // Never redirect an authenticated user to Home ('/') when they visit customer pages like /orders or /profile!
  return children
}

