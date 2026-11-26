import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import BrandLogo from '../../components/common/BrandLogo'
import SEOHead from '../../components/common/SEOHead'
import { authService } from '../../services/authService'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = (searchParams.get('token') || '').trim()

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!token) {
      setErrorMsg('Missing password reset token. Please request a new reset link.')
      return
    }
    if (form.password.length < 8 || !/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/\d/.test(form.password)) {
      const m = 'Password must be at least 8 characters and include uppercase, lowercase, and a number.'
      setErrorMsg(m)
      toast.error(m)
      return
    }
    if (form.password !== form.confirmPassword) {
      const m = 'Passwords do not match.'
      setErrorMsg(m)
      toast.error(m)
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword({
        token,
        newPassword: form.password,
        confirmPassword: form.confirmPassword
      })
      setSubmitted(true)
      toast.success('Password updated successfully!', {
        style: { background: '#651B2B', color: '#FBF5EA', borderRadius: '12px' }
      })
    } catch (err) {
      const msg = err?.response?.data?.message || err?.customerMessage || 'This reset link is invalid or has expired.'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF5EA] flex flex-col justify-center items-center px-4 font-body relative">
      <SEOHead title="Reset Password" noindex={true} />
      <Link to="/login" className="absolute top-6 left-6 text-xs text-[#B58A45] hover:text-[#651B2B] font-bold uppercase flex items-center gap-1.5 transition-colors">
        <ArrowLeft size={14} /> Back to Sign In
      </Link>

      <div className="w-full max-w-md p-8 bg-white border border-[#E7D4B9] rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#651B2B] via-[#B58A45] to-[#651B2B]" />

        <div className="flex flex-col items-center mb-6 select-none">
          <BrandLogo size="sm" />
          <span className="font-body text-[8px] tracking-[0.38em] uppercase text-[#B58A45] font-semibold mt-2">
            RESET PASSWORD
          </span>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <CheckCircle2 size={22} />
            </div>
            <h1 className="font-display text-xl text-[#651B2B] font-bold">Password Updated</h1>
            <p className="text-xs text-[#38271F]/70 leading-relaxed">
              Your password has been updated and previous active sessions have been revoked.
            </p>
            <Link to="/login" className="btn-primary w-full text-center text-xs font-bold tracking-widest py-3.5 block">
              Sign In with New Password
            </Link>
          </div>
        ) : !token ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-700">
              <AlertCircle size={22} />
            </div>
            <h1 className="font-display text-xl text-[#651B2B] font-bold">Invalid Reset Link</h1>
            <p className="text-xs text-[#38271F]/70 leading-relaxed">
              This password reset link is missing a valid token or has expired.
            </p>
            <Link to="/forgot-password" className="btn-primary w-full text-center text-xs font-bold tracking-widest py-3.5 block">
              Request New Reset Link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="font-display text-xl text-center text-[#651B2B] font-bold mb-1">Set New Password</h1>
            <p className="text-center text-[#38271F]/70 mb-5 text-xs leading-relaxed">
              Choose a strong new password (at least 8 characters with uppercase, lowercase, and a number).
            </p>

            {errorMsg && (
              <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="New password"
                className="input-field pr-11"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#38271F]/50 hover:text-[#651B2B]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              className="input-field"
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-xs font-bold tracking-widest py-3.5 disabled:opacity-60"
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
