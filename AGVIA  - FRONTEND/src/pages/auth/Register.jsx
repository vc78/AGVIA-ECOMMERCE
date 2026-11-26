import { useState } from 'react'
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { ArrowLeft, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { authService } from '../../services/authService'
import { credentialsReceived } from '../../store/authSlice'
import { broadcastAuthEvent } from '../../utils/authSync'
import { setActiveTabContext } from '../../utils/sessionManager'
import GoogleSignInButton from '../../components/auth/GoogleSignInButton'
import SEOHead from '../../components/common/SEOHead'
import BrandLogo from '../../components/common/BrandLogo'
import { BUSINESS } from '../../constants/business'
import { getAuthErrorMessage, logDeveloperError } from '../../services/errorMessageService'

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'
  const { isAuthenticated, user, isAuthLoading } = useSelector((state) => state.auth)

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FBF5EA] flex items-center justify-center">
        <SEOHead title="Create Account" noindex={true} />
        <div className="w-8 h-8 border-2 border-[#651B2B]/20 border-t-[#651B2B] rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
    const target = from === '/login' || from === '/register' ? '/' : from
    return <Navigate to={target} replace />
  }

  const handleChange = (e) => {
    setErrorMsg('')
    const { name, type, value, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const passwordValidLength = form.password.length >= 8
  const passwordHasCaseAndDigit = /[a-z]/.test(form.password) && /[A-Z]/.test(form.password) && /\d/.test(form.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!form.name.trim() || form.name.trim().length < 2) {
      const m = 'Please enter your full name (at least 2 characters).'
      setErrorMsg(m)
      toast.error(m)
      return
    }
    if (!passwordValidLength || !passwordHasCaseAndDigit) {
      const m = 'Password must be at least 8 characters and include uppercase, lowercase, and a number.'
      setErrorMsg(m)
      toast.error(m)
      return
    }
    if (form.password !== form.confirmPassword) {
      const m = 'Your passwords do not match. Please check and try again.'
      setErrorMsg(m)
      toast.error(m)
      return
    }
    if (!form.termsAccepted) {
      const m = 'Please accept the Terms & Conditions and Privacy Policy to continue.'
      setErrorMsg(m)
      toast.error(m)
      return
    }

    setLoading(true)
    try {
      const { user: createdUser, token } = await authService.register({
        fullName: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        termsAccepted: form.termsAccepted
      })

      setActiveTabContext('CUSTOMER')
      dispatch(credentialsReceived({ user: createdUser, token, role: 'CUSTOMER', rememberMe: true }))
      broadcastAuthEvent('LOGIN', { user: createdUser, token, role: 'CUSTOMER' })
      toast.success(`Account created — welcome, ${createdUser.name}!`, {
        style: { background: '#651B2B', color: '#FBF5EA', borderRadius: '12px' }
      })
      navigate(from === '/login' || from === '/register' ? '/' : from, { replace: true })
    } catch (err) {
      logDeveloperError('Register.handleSubmit', err)
      const msg = err?.response?.data?.message || getAuthErrorMessage(err)
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF5EA] flex flex-col justify-center items-center px-4 py-8 sm:py-12 font-body relative">
      <SEOHead title="Create Account" noindex={true} />
      <Link
        to="/login"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-xs text-[#B58A45] hover:text-[#651B2B] font-bold uppercase flex items-center gap-1.5 transition-colors touch-target min-h-[44px] px-2"
      >
        <ArrowLeft size={15} /> <span>Back to Sign In</span>
      </Link>

      <div className="w-full max-w-md p-6 sm:p-8 bg-white border border-[#E7D4B9] rounded-3xl shadow-sm relative overflow-hidden mt-8 sm:mt-0">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#651B2B] via-[#B58A45] to-[#651B2B]" />

        <Link to="/" className="flex flex-col items-center mb-5 sm:mb-6 select-none group">
          <BrandLogo size="md" />
        </Link>

        <h1 className="font-display text-2xl text-center text-[#651B2B] font-bold mb-1">
          Create Account
        </h1>
        <p className="text-center text-[#38271F]/70 mb-6 text-xs leading-relaxed">
          Register for your {BUSINESS.name} customer account.
        </p>

        {errorMsg && (
          <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-[11px] font-semibold text-[#38271F]/80 mb-1">
              Full Name
            </label>
            <input
              id="reg-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-[11px] font-semibold text-[#38271F]/80 mb-1">
              Email Address
            </label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password" className="block text-[11px] font-semibold text-[#38271F]/80 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="reg-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="At least 8 chars, upper, lower, and digit"
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
            {form.password && (
              <div className="mt-1.5 space-y-0.5 text-[10.5px]">
                <p className={`flex items-center gap-1 ${passwordValidLength ? 'text-emerald-700' : 'text-[#38271F]/60'}`}>
                  <CheckCircle2 size={11} /> Minimum 8 characters
                </p>
                <p className={`flex items-center gap-1 ${passwordHasCaseAndDigit ? 'text-emerald-700' : 'text-[#38271F]/60'}`}>
                  <CheckCircle2 size={11} /> Includes uppercase, lowercase, and a number
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="reg-confirm" className="block text-[11px] font-semibold text-[#38271F]/80 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="reg-confirm"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                className="input-field pr-11"
              />
              <button
                type="button"
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#38271F]/50 hover:text-[#651B2B] p-1"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2.5 text-[11px] text-[#38271F]/80 leading-relaxed cursor-pointer select-none pt-1">
            <input
              name="termsAccepted"
              type="checkbox"
              checked={form.termsAccepted}
              onChange={handleChange}
              className="mt-0.5 rounded border-[#B58A45] text-[#651B2B] focus:ring-[#651B2B]"
            />
            <span>
              I agree to the{' '}
              <Link to="/terms" className="text-[#651B2B] font-semibold underline">
                Terms &amp; Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy-policy" className="text-[#651B2B] font-semibold underline">
                Privacy Policy
              </Link>.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-xs font-bold tracking-widest min-h-[48px] py-3.5 mt-2 flex items-center justify-center gap-2 touch-target"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              'Create Account'
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
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[#651B2B] hover:text-[#B58A45] font-bold underline decoration-[#B58A45]/40 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
