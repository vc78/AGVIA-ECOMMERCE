import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match!")
      return
    }
    setSubmitted(true)
    toast.success("Password reset successfully!", {
      style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
    })
  }

  return (
    <div className="min-h-screen bg-[#FFFDF8] flex flex-col justify-center items-center px-4 font-body relative">
      <Link to="/login" className="absolute top-6 left-6 text-xs text-[#B8860B] hover:text-[#8B0000] font-bold uppercase flex items-center gap-1.5 transition-colors">
        <ArrowLeft size={14} /> Back to Sign In
      </Link>

      <div className="w-full max-w-md p-8 bg-white border border-[#B8860B]/15 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8B0000] via-[#B8860B] to-[#8B0000]" />
        
        <div className="flex flex-col items-center mb-8 select-none">
          <div className="w-14 h-14 rounded-2xl bg-[#8B0000]/10 text-[#8B0000] border border-[#8B0000]/10 flex items-center justify-center mb-3">
            <CheckCircle2 size={24} />
          </div>
          <span className="font-display text-2xl tracking-[0.18em] font-bold uppercase text-[#8B0000] leading-none">
            AGVIA
          </span>
          <span className="font-body text-[8px] tracking-[0.38em] uppercase text-[#B8860B] font-semibold mt-1.5 pl-[1px]">
            UPDATE PASSWORD
          </span>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <h2 className="font-display text-xl text-[#8B0000] font-bold">Passcode Updated</h2>
            <p className="text-xs text-[#3A2D23]/60 leading-relaxed">
              Your security passcode has been updated successfully.
            </p>
            <Link to="/login" className="btn-primary w-full text-center text-xs font-bold tracking-widest py-4 block">
              Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-display text-xl text-center text-[#8B0000] font-bold mb-1">Set New Password</h2>
            <p className="text-center text-[#3A2D23]/50 mb-6 text-xs leading-relaxed">
              Please enter and confirm your new account password.
            </p>
            <input 
              type="password" 
              required 
              value={form.password} 
              onChange={(e) => setForm({ ...form, password: e.target.value })} 
              placeholder="New password" 
              className="input-field" 
            />
            <input 
              type="password" 
              required 
              value={form.confirmPassword} 
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} 
              placeholder="Confirm new password" 
              className="input-field" 
            />
            <button type="submit" className="btn-primary w-full text-xs font-bold tracking-widest py-4">
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
