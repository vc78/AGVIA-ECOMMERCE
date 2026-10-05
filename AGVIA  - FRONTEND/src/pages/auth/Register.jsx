import { useState } from 'react'
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import { credentialsReceived } from '../../store/authSlice'
import { broadcastAuthEvent } from '../../utils/authSync'
import { ArrowLeft } from 'lucide-react'
import OtpVerificationCard from '../../components/auth/OtpVerificationCard'
import GoogleSignInButton from '../../components/auth/GoogleSignInButton'
import SEOHead from '../../components/common/SEOHead'
import { getAuthErrorMessage, logDeveloperError } from '../../services/errorMessageService'

export default function Register() {
  const [step, setStep] = useState('FORM') // 'FORM' | 'OTP'
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [challengeId, setChallengeId] = useState('')
  const [phoneMasked, setPhoneMasked] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpError, setOtpError] = useState('')

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'
  const { isAuthenticated, user, isAuthLoading } = useSelector((state) => state.auth)

  // Do not flash registration screen while session is being verified
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex items-center justify-center">
        <SEOHead title="Create Account" noindex={true} />
        <div className="w-8 h-8 border-2 border-[#8B0000]/20 border-t-[#8B0000] rounded-full animate-spin" />
      </div>
    )
  }

  // Redirect away if already authenticated
  if (isAuthenticated) {
    if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
    const target = from === '/login' || from === '/register' ? '/' : from
    return <Navigate to={target} replace />
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  // Step 1: Submit signup form and request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault()

    if (form.password.length < 6) {
      toast.error('Please choose a password with at least 6 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Your passwords don't match. Please check and try again.")
      return
    }

    setLoading(true)
    setOtpError('')
    try {
      const res = await authService.requestSignupOtp({
        fullName: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword
      })

      setChallengeId(res.challengeId)
      setPhoneMasked(res.phoneMasked)
      if (res.devOtp) setDevOtp(res.devOtp)
      setStep('OTP')
      toast.success('Verification code sent to your mobile number!', {
        style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
      })
    } catch (err) {
      logDeveloperError('Register.handleRequestOtp', err)
      const msg = getAuthErrorMessage(err)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP and create user
  const handleVerifyOtp = async (otpCode) => {
    setLoading(true)
    setOtpError('')
    try {
      const { user, token } = await authService.verifySignupOtp({
        challengeId,
        otp: otpCode
      })

      dispatch(credentialsReceived({ user, token }))
      broadcastAuthEvent('LOGIN', { user, token })
      toast.success(`Account created successfully — welcome, ${user.name}!`, {
        style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
      })
      navigate(from, { replace: true })
    } catch (err) {
      logDeveloperError('Register.handleVerifyOtp', err)
      const msg = getAuthErrorMessage(err)
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
      <SEOHead title="Create Account" noindex={true} />
      <Link
        to="/login"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-xs text-[#B8860B] hover:text-[#8B0000] font-bold uppercase flex items-center gap-1.5 transition-colors touch-target min-h-[44px] px-2"
      >
        <ArrowLeft size={15} /> <span>Back to Sign In</span>
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
            Create Account
          </h1>
          <p className="text-center text-[#3A2D23]/60 mb-6 text-xs leading-relaxed">
            Register with your verified mobile number for exclusive handcrafted fashion.
          </p>

          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#3A2D23]/70 mb-1">Full Name</label>
              <input
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Venkat Chowdary"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#3A2D23]/70 mb-1">Email Address</label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="client@agvia.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#3A2D23]/70 mb-1">
                Mobile Number
              </label>
              <input
                name="phone"
                type="tel"
                required
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number (e.g. 9032306961)"
                className="input-field font-mono"
              />
              <p className="text-[10px] text-[#3A2D23]/50 mt-1 pl-1">
                A 6-digit one-time code will be dispatched to your mobile number and email.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#3A2D23]/70 mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#3A2D23]/70 mb-1">Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
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
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                'Request Verification Code'
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

          <GoogleSignInButton from="/" />

          <p className="text-center text-xs text-[#3A2D23]/60 mt-6 font-body">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-[#B8860B] hover:text-[#8B0000] font-bold underline decoration-[#B8860B]/30 transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>
      ) : (
        <OtpVerificationCard
          title="Account Verification"
          description="Enter the 6-digit OTP sent to your mobile number & email:"
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
