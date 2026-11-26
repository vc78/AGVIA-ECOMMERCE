import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ShieldCheck, ArrowLeft, KeyRound, UserCheck } from 'lucide-react'
import { authService } from '../../services/authService'
import { credentialsReceived } from '../../store/authSlice'
import { broadcastAuthEvent } from '../../utils/authSync'
import { setActiveTabContext } from '../../utils/sessionManager'
import BrandLogo from '../../components/common/BrandLogo'
import { BUSINESS } from '../../constants/business'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user, isAuthLoading } = useSelector((state) => state.auth)

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#1A0B10] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A45C]/20 border-t-[#C9A45C] rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN')) {
    return <Navigate to="/admin/dashboard" replace />
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const executeLogin = async (credentials) => {
    setLoading(true)
    try {
      const data = await authService.login(credentials)
      if (data.requiresOtp) {
        toast.success('Verification code required to access admin console', {
          style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
        })
        navigate('/verify-login-otp', {
          state: {
            challengeId: data.challengeId,
            phoneMasked: data.phoneMasked,
            devOtp: data.devOtp,
            from: '/admin/dashboard'
          }
        })
        return
      }
      const userData = data.user || data
      const token = data.token || ''
      const role = userData.role || ''
      if (!role.includes('ADMIN')) {
        toast.error('Access restricted to administrators only')
        return
      }
      setActiveTabContext('ADMIN')
      dispatch(credentialsReceived({ user: userData, token, role: 'ADMIN' }))
      broadcastAuthEvent('LOGIN', { user: userData, token, role: 'ADMIN' })
      toast.success(`Welcome to ${BUSINESS.name} Admin`, {
        style: { background: '#651B2B', color: '#FBF5EA', borderRadius: '12px' }
      })
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      console.error('[AdminLogin] Error:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Invalid admin credentials'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    executeLogin(form)
  }

  return (
    <div className="min-h-screen bg-[#38271F] flex flex-col justify-center items-center px-4 font-body relative">
      <Link to="/" className="absolute top-6 left-6 text-xs text-[#E7D4B9] hover:text-white font-bold uppercase flex items-center gap-1.5 transition-colors tracking-wider">
        <ArrowLeft size={14} /> Back to Store
      </Link>

      <div className="w-full max-w-md p-8 bg-[#FBF5EA] border border-[#B58A45]/35 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#651B2B] via-[#B58A45] to-[#651B2B]" />

        <div className="flex flex-col items-center mb-6 select-none">
          <BrandLogo size="md" />
          <span className="font-sans text-[8px] tracking-[0.32em] uppercase text-[#651B2B] font-bold mt-2">
            ADMIN MANAGEMENT PORTAL
          </span>
        </div>

        {/* Informative notice if currently signed in as customer */}
        {isAuthenticated && user?.role !== 'ADMIN' && user?.role !== 'ROLE_ADMIN' && (
          <div className="mb-5 p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs">
            <UserCheck size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Customer Account Active</p>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                Signed in as <span className="font-semibold">{user.name || user.email}</span>. Sign in with Administrator credentials below to open the admin console.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#651B2B] mb-1 font-sans">
              Admin Email
            </label>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="Enter admin email"
              className="input-field !bg-white !border-[#B58A45]/35 focus:!border-[#651B2B] w-full"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#651B2B] mb-1 font-sans">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input-field !bg-white !border-[#B58A45]/35 focus:!border-[#651B2B] w-full"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-xs font-bold tracking-widest py-3.5 flex items-center justify-center gap-2"
          >
            <KeyRound size={14} className="text-[#E7D4B9]" />
            <span>{loading ? 'Authenticating Admin...' : 'Sign In to Admin Portal'}</span>
          </button>
        </form>

        <p className="text-center text-[10px] text-[#38271F]/55 mt-5 font-sans tracking-wider">
          {BUSINESS.name.toUpperCase()} · PROTECTED ADMIN CONSOLE
        </p>
      </div>
    </div>
  )
}
