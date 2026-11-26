import { useState } from 'react'
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react'
import { authService } from '../../services/authService'
import { credentialsReceived } from '../../store/authSlice'
import { broadcastAuthEvent } from '../../utils/authSync'
import { setActiveTabContext } from '../../utils/sessionManager'
import GoogleSignInButton from '../../components/auth/GoogleSignInButton'
import SEOHead from '../../components/common/SEOHead'
import BrandLogo from '../../components/common/BrandLogo'
import { BUSINESS } from '../../constants/business'
import { getAuthErrorMessage, logDeveloperError } from '../../services/errorMessageService'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const from = location.state?.from || searchParams.get('from') || searchParams.get('redirect') || '/'
  const { isAuthenticated, user, isAuthLoading } = useSelector((state) => state.auth)

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FBF5EA] flex items-center justify-center">
        <SEOHead title="Sign In" noindex={true} />
        <div className="w-8 h-8 border-2 border-[#651B2B]/20 border-t-[#651B2B] rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
    return <Navigate to={from} replace />
  }

  const handleChange = (e) => {
    setErrorMsg('')
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      const { user: loggedInUser, token } = await authService.login({
        email: form.email.trim(),
        password: form.password,
        rememberMe
      })

      const effectiveRole = loggedInUser?.role?.includes('ADMIN') ? 'ADMIN' : 'CUSTOMER'
      setActiveTabContext(effectiveRole)
      dispatch(credentialsReceived({ user: loggedInUser, token, role: effectiveRole, rememberMe }))
      broadcastAuthEvent('LOGIN', { user: loggedInUser, token, role: effectiveRole })
      toast.success(`Welcome back, ${loggedInUser.name || 'Customer'}!`, {
        style: { background: '#651B2B', color: '#FBF5EA', borderRadius: '12px' }
      })
      navigate(effectiveRole === 'ADMIN' && from === '/' ? '/admin/dashboard' : from, { replace: true })
    } catch (err) {
      logDeveloperError('Login.handleSubmit', err)
      const msg = getAuthErrorMessage(err)
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF5EA] flex flex-col justify-center items-center px-4 py-8 sm:py-12 font-body relative">
      <SEOHead title="Sign In" noindex={true} />
      <Link
        to="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-xs text-[#B58A45] hover:text-[#651B2B] font-bold uppercase flex items-center gap-1.5 transition-colors touch-target min-h-[44px] px-2"
      >
        <ArrowLeft size={15} /> <span>Back to Store</span>
      </Link>

      <div className="w-full max-w-md p-6 sm:p-8 bg-white border border-[#E7D4B9] rounded-3xl shadow-sm relative overflow-hidden mt-8 sm:mt-0">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#651B2B] via-[#B58A45] to-[#651B2B]" />

        <Link to="/" className="flex flex-col items-center mb-5 sm:mb-6 select-none group">
          <BrandLogo size="md" />
        </Link>

        <h1 className="font-display text-2xl text-center text-[#651B2B] font-bold mb-1">
          Welcome Back
        </h1>
        <p className="text-center text-[#38271F]/70 mb-6 text-xs leading-relaxed">
          Sign in with your email and password to manage your orders at {BUSINESS.name}.
        </p>

        {errorMsg && (
          <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-[11px] font-semibold text-[#38271F]/80 mb-1">
              Email Address
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              className="input-field"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="login-password" className="block text-[11px] font-semibold text-[#38271F]/80">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-semibold text-[#651B2B] hover:text-[#B58A45] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="input-field pr-11"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#38271F]/50 hover:text-[#651B2B] p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-[#38271F]/80 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-[#B58A45] text-[#651B2B] focus:ring-[#651B2B]"
            />
            <span>Keep me signed in on this device</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-xs font-bold tracking-widest min-h-[48px] py-3.5 mt-2 flex items-center justify-center gap-2 touch-target"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <Lock size={14} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-[#E7D4B9]" />
          <span className="px-3 text-[10px] font-bold text-[#38271F]/50 uppercase tracking-widest">
            or continue with
          </span>
          <div className="flex-1 border-t border-[#E7D4B9]" />
        </div>

        <GoogleSignInButton from={from} />

        <p className="text-center text-xs text-[#38271F]/70 mt-6 font-body">
          New here?{' '}
          <Link
            to="/register"
            className="text-[#651B2B] hover:text-[#B58A45] font-bold underline decoration-[#B58A45]/40 transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
