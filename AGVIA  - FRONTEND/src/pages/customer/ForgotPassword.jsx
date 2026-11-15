import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
    toast.success("Password reset link has been dispatched to your email address.", {
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
            <KeyRound size={24} />
          </div>
          <span className="font-display text-2xl tracking-[0.18em] font-bold uppercase text-[#8B0000] leading-none">
            AGVIA
          </span>
          <span className="font-body text-[8px] tracking-[0.38em] uppercase text-[#B8860B] font-semibold mt-1.5 pl-[1px]">
            RESET REQUEST
          </span>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <h2 className="font-display text-xl text-[#8B0000] font-bold">Check Your Email</h2>
            <p className="text-xs text-[#3A2D23]/60 leading-relaxed">
              We have sent instructions to reset your passcode to <strong className="text-[#3A2D23]">{email}</strong>.
            </p>
            <Link to="/login" className="btn-primary w-full text-center text-xs font-bold tracking-widest py-4 block">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-display text-xl text-center text-[#8B0000] font-bold mb-1">Recover Credentials</h2>
            <p className="text-center text-[#3A2D23]/50 mb-6 text-xs leading-relaxed">
              Enter your registered client email to receive a recovery token.
            </p>
            <input 
              name="email" 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Email address" 
              className="input-field" 
            />
            <button type="submit" className="btn-primary w-full text-xs font-bold tracking-widest py-4">
              Send Recovery Token
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
