import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ShieldCheck, ArrowLeft } from 'lucide-react'
import { authService } from '../../services/authService'
import { credentialsReceived } from '../../store/authSlice'
import { broadcastAuthEvent } from '../../utils/authSync'
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await authService.login(form)
      const user = data.user || data
      const token = data.token || ''
      const role = user.role || ''
      if (!role.includes('ADMIN')) {
        toast.error('Access restricted to atelier administrators only')
        return
      }
      dispatch(credentialsReceived({ user, token }))
      broadcastAuthEvent('LOGIN', { user, token })
      toast.success('Welcome to AGVIA Atelier Workspace', {
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
      navigate('/admin/dashboard')
    } catch (err) {
      toast.error('Invalid admin credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1A0B10] flex flex-col justify-center items-center px-4 font-body relative">
      <Link to="/login" className="absolute top-6 left-6 text-xs text-[#C9A45C] hover:text-white font-bold uppercase flex items-center gap-1.5 transition-colors tracking-wider">
        <ArrowLeft size={14} /> Back to Patron Login
      </Link>

      <div className="w-full max-w-md p-8 bg-[#FAF7F2] border border-[#C9A45C]/30 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5A1020] via-[#C9A45C] to-[#5A1020]" />
        
        <div className="flex flex-col items-center mb-8 select-none">
          <img src="/images/agvia-logo.webp" alt="AGVIA" width={72} height={64} decoding="async" className="h-16 w-auto object-contain mb-3" />
          <span className="font-serif text-2xl tracking-[0.2em] font-bold uppercase text-[#5A1020] leading-none">
            AGVIA
          </span>
          <span className="font-sans text-[8px] tracking-[0.35em] uppercase text-[#C9A45C] font-semibold mt-1.5 pl-[1px]">
            ATELIER ADMIN PORTAL
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="Admin email" className="input-field !bg-white !border-[#C9A45C]/30 focus:!border-[#5A1020]" />
          <input name="password" type="password" required value={form.password} onChange={handleChange} placeholder="Password" className="input-field !bg-white !border-[#C9A45C]/30 focus:!border-[#5A1020]" />
          
          <button type="submit" disabled={loading} className="btn-primary w-full text-xs font-bold tracking-widest py-4">
            {loading ? 'Verifying Admin...' : 'Sign In to Atelier'}
          </button>
        </form>

        <p className="text-center text-[10px] text-[#211D1E]/40 mt-6 font-sans tracking-wider">
          ENCRYPTED ATELIER CONSOLE
        </p>
      </div>
    </div>
  )
}
