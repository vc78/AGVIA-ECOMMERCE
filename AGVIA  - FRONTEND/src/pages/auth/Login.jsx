import { useState } from 'react'
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import { credentialsReceived } from '../../store/authSlice'
import { ArrowLeft } from 'lucide-react'
import OtpVerificationCard from '../../components/auth/OtpVerificationCard'
import GoogleSignInButton from '../../components/auth/GoogleSignInButton'

export default function Login() {
  const [step, setStep] = useState('FORM') // 'FORM' | 'OTP'
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [challengeId, setChallengeId] = useState('')
  const [phoneMasked, setPhoneMasked] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpError, setOtpError] = useState('')

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  // Redirect away if already authenticated
  if (isAuthenticated) {
    if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
    return <Navigate to={from} replace />
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  // Step 1: Submit credentials to initiate login & request OTP
  const handleInitiateLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setOtpError('')

    try {
      const res = await authService.login({
        identifier: form.identifier.trim(),
        password: form.password
      })

      if (res.requiresOtp) {
        setChallengeId(res.challengeId)
        setPhoneMasked(res.phoneMasked)
        if (res.devOtp) setDevOtp(res.devOtp)
        setStep('OTP')
        toast.success('Verification code sent to your mobile number!', {
          style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
        })
      } else if (res.token && res.user) {
        // Direct authentication fallback
        dispatch(credentialsReceived({ user: res.user, token: res.token }))
        toast.success(`Welcome back, ${res.user.name}!`, {
          style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
        })
        navigate(res.user.role === 'ADMIN' && from === '/' ? '/admin/dashboard' : from, { replace: true })
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid email/phone or password'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify Login OTP
  const handleVerifyOtp = async (otpCode) => {
    setLoading(true)
    setOtpError('')

    try {
      const { user, token } = await authService.verifyLoginOtp({
        challengeId,
        otp: otpCode
      })

      dispatch(credentialsReceived({ user, token }))
      toast.success(`Welcome back, ${user.name}!`, {
        style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
      })
      navigate(user.role === 'ADMIN' && from === '/' ? '/admin/dashboard' : from, { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Verification failed. Please try again.'
      setOtpError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    try {
      const res = await authService.resendOtp({ challengeId })
      if (res.challengeId) {
        setChallengeId(res.challengeId)
      }
      if (res.devOtp) {
        setDevOtp(res.devOtp)
      }
      toast.success('A new verification code has been sent!', {
        style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
      })
    } catch (err) {
      throw err
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDF8] flex flex-col justify-center items-center px-4 py-8 sm:py-12 font-body relative">
      <Link
        to="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-xs text-[#B8860B] hover:text-[#8B0000] font-bold uppercase flex items-center gap-1.5 transition-colors touch-target min-h-[44px] px-2"
      >
        <ArrowLeft size={15} /> <span>Back to Store</span>
      </Link>

      {step === 'FORM' ? (
        <div className="w-full max-w-md p-5 sm:p-8 bg-white border border-[#B8860B]/15 rounded-3xl shadow-sm relative overflow-hidden mt-8 sm:mt-0">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8B0000] via-[#B8860B] to-[#8B0000]" />

          <Link to="/" className="flex flex-col items-center mb-6 sm:mb-8 select-none group">
            <span className="font-display text-2xl tracking-[0.18em] font-bold uppercase text-[#8B0000] leading-none group-hover:text-[#B8860B] transition-colors duration-300">
              AGVIA
            </span>
            <span className="font-body text-[8px] tracking-[0.38em] uppercase text-[#B8860B] font-semibold mt-1.5 pl-[1px]">
              HAUTE COUTURE BOUTIQUE
            </span>
          </Link>

          <h1 className="font-display text-2xl text-center text-[#8B0000] font-bold mb-1">
            Welcome Back
          </h1>
          <p className="text-center text-[#3A2D23]/60 mb-6 text-xs leading-relaxed">
            Sign in with your Email or Mobile Number to access your bespoke wardrobe.
          </p>

          <form onSubmit={handleInitiateLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#3A2D23]/70 mb-1">
                Email or Mobile Number
              </label>
              <input
                name="identifier"
                type="text"
                required
                value={form.identifier}
                onChange={handleChange}
                placeholder="e.g. client@agvia.com or 9032306961"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#3A2D23]/70 mb-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-xs font-bold tracking-widest min-h-[48px] py-3.5 mt-2 flex items-center justify-center gap-2 touch-target"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-[#B8860B]/20" />
            <span className="px-3 text-[10px] font-bold text-[#3A2D23]/50 uppercase tracking-widest">
              or continue with
            </span>
            <div className="flex-1 border-t border-[#B8860B]/20" />
          </div>

          <GoogleSignInButton from={from} />

          <p className="text-center text-xs text-[#3A2D23]/60 mt-6 font-body">
            New here?{' '}
            <Link
              to="/register"
              className="text-[#B8860B] hover:text-[#8B0000] font-bold underline decoration-[#B8860B]/30 transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      ) : (
        <OtpVerificationCard
          title="Sign-In Verification"
          description="Enter the 6-digit OTP code sent to your mobile number & email:"
          phoneMasked={phoneMasked}
          loading={loading}
          error={otpError}
          devOtp={devOtp}
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
          onChangePhone={() => {
            setStep('FORM')
            setOtpError('')
          }}
        />
      )}
    </div>
  )
}
