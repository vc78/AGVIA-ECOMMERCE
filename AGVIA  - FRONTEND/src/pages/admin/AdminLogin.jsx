import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ShieldCheck, ArrowLeft, KeyRound, Sparkles, UserCheck } from 'lucide-react'
import { authService } from '../../services/authService'
import { credentialsReceived } from '../../store/authSlice'
import { broadcastAuthEvent } from '../../utils/authSync'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const [form, setForm] = useState({ email: 'admin@agvia.com', password: 'agvia@123' })
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
        toast.error('Access restricted to atelier administrators only')
        return
      }
      dispatch(credentialsReceived({ user: userData, token }))
      broadcastAuthEvent('LOGIN', { user: userData, token })
      toast.success('Welcome to AGVIA Atelier Workspace', {
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
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

  const handleQuickLogin = () => {
    const creds = { email: 'admin@agvia.com', password: 'agvia@123' }
    setForm(creds)
    executeLogin(creds)
  }

  return (
    <div className="min-h-screen bg-[#1A0B10] flex flex-col justify-center items-center px-4 font-body relative">
      <Link to="/" className="absolute top-6 left-6 text-xs text-[#C9A45C] hover:text-white font-bold uppercase flex items-center gap-1.5 transition-colors tracking-wider">
        <ArrowLeft size={14} /> Back to Boutique Store
      </Link>

      <div className="w-full max-w-md p-8 bg-[#FAF7F2] border border-[#C9A45C]/30 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5A1020] via-[#C9A45C] to-[#5A1020]" />
        
        <div className="flex flex-col items-center mb-6 select-none">
          <img src="/images/agvia-logo.webp" alt="AGVIA" width={72} height={64} decoding="async" className="h-16 w-auto object-contain mb-3" />
          <span className="font-serif text-2xl tracking-[0.2em] font-bold uppercase text-[#5A1020] leading-none">
            AGVIA
          </span>
          <span className="font-sans text-[8px] tracking-[0.35em] uppercase text-[#C9A45C] font-semibold mt-1.5 pl-[1px]">
            ATELIER ADMIN CONSOLE
          </span>
        </div>

        {/* Informative notice if currently signed in as patron */}
        {isAuthenticated && user?.role !== 'ADMIN' && user?.role !== 'ROLE_ADMIN' && (
          <div className="mb-5 p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs">
            <UserCheck size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Patron Account Active</p>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                Signed in as <span className="font-semibold">{user.name || user.email}</span>. Sign in with Atelier Administrator credentials below to open the workspace.
              </p>
            </div>
          </div>
        )}

        {/* 1-Click Fast Admin Sign In Box */}
        <div className="mb-5 p-3.5 bg-[#5A1020]/5 border border-[#C9A45C]/35 rounded-2xl">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#5A1020] mb-2 px-1">
            <span>Admin: <strong>admin@agvia.com</strong></span>
            <span>Pass: <strong>agvia@123</strong></span>
          </div>
          <button
            type="button"
            onClick={handleQuickLogin}
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-[#5A1020] to-[#3C0A14] hover:from-[#72152b] hover:to-[#5A1020] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs border border-[#C9A45C]/30"
          >
            <Sparkles size={14} className="text-[#C9A45C]" />
            <span>1-Click Admin Access</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A1020] mb-1 font-sans">
              Admin Email
            </label>
            <input 
              name="email" 
              type="email" 
              required 
              value={form.email} 
              onChange={handleChange} 
              placeholder="admin@agvia.com" 
              className="input-field !bg-white !border-[#C9A45C]/30 focus:!border-[#5A1020] w-full" 
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A1020] mb-1 font-sans">
              Password
            </label>
            <input 
              name="password" 
              type="password" 
              required 
              value={form.password} 
              onChange={handleChange} 
              placeholder="••••••••" 
              className="input-field !bg-white !border-[#C9A45C]/30 focus:!border-[#5A1020] w-full" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary w-full text-xs font-bold tracking-widest py-3.5 flex items-center justify-center gap-2"
          >
            <KeyRound size={14} className="text-[#C9A45C]" />
            <span>{loading ? 'Authenticating Admin...' : 'Sign In to Atelier'}</span>
          </button>
        </form>

        <p className="text-center text-[10px] text-[#211D1E]/40 mt-5 font-sans tracking-wider">
          PROTECTED ATELIER ENTERPRISE CONSOLE
        </p>
      </div>
    </div>
  )
}
