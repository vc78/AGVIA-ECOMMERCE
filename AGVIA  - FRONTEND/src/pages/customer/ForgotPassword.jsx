import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MailCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import BrandLogo from '../../components/common/BrandLogo'
import SEOHead from '../../components/common/SEOHead'
import { authService } from '../../services/authService'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    try {
      await authService.forgotPassword(email.trim())
      setSubmitted(true)
      toast.success('If an account exists for that email, a password reset link has been sent.', {
        style: { background: '#651B2B', color: '#FBF5EA', borderRadius: '12px' }
      })
    } catch (err) {
      const msg = err?.response?.data?.message || err?.customerMessage || 'Unable to process request right now. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF5EA] flex flex-col justify-center items-center px-4 font-body relative">
      <SEOHead title="Forgot Password" noindex={true} />
      <Link to="/login" className="absolute top-6 left-6 text-xs text-[#B58A45] hover:text-[#651B2B] font-bold uppercase flex items-center gap-1.5 transition-colors">
        <ArrowLeft size={14} /> Back to Sign In
      </Link>

      <div className="w-full max-w-md p-8 bg-white border border-[#E7D4B9] rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#651B2B] via-[#B58A45] to-[#651B2B]" />

        <div className="flex flex-col items-center mb-6 select-none">
          <BrandLogo size="sm" />
          <span className="font-body text-[8px] tracking-[0.38em] uppercase text-[#B58A45] font-semibold mt-2">
            PASSWORD RECOVERY
          </span>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FBF5EA] border border-[#E7D4B9] flex items-center justify-center text-[#651B2B]">
              <MailCheck size={22} />
            </div>
            <h1 className="font-display text-xl text-[#651B2B] font-bold">Check Your Email</h1>
            <p className="text-xs text-[#38271F]/70 leading-relaxed">
              If an account exists for <strong className="text-[#38271F]">{email}</strong>, we have sent a single-use password reset link valid for 15 minutes.
            </p>
            <Link to="/login" className="btn-primary w-full text-center text-xs font-bold tracking-widest py-3.5 block">
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="font-display text-xl text-center text-[#651B2B] font-bold mb-1">Forgot Password?</h1>
            <p className="text-center text-[#38271F]/70 mb-6 text-xs leading-relaxed">
              Enter your registered email address to receive a secure password reset link.
            </p>
            <div>
              <label htmlFor="forgot-email" className="block text-[11px] font-semibold text-[#38271F]/80 mb-1">
                Email Address
              </label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="input-field"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-xs font-bold tracking-widest py-3.5 disabled:opacity-60"
            >
              {loading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
