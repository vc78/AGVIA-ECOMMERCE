import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import { credentialsReceived } from '../../store/authSlice'
import OtpVerificationCard from '../../components/auth/OtpVerificationCard'
import { ArrowLeft } from 'lucide-react'

export default function VerifyOtp() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const challengeId = location.state?.challengeId || ''
  const phoneMasked = location.state?.phoneMasked || ''
  const from = location.state?.from || '/'

  const [currentChallengeId, setCurrentChallengeId] = useState(challengeId)
  const [devOtp, setDevOtp] = useState(location.state?.devOtp || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!currentChallengeId) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex flex-col justify-center items-center px-4 font-body">
        <div className="w-full max-w-md p-8 bg-white border border-[#B8860B]/15 rounded-3xl text-center shadow-sm">
          <h2 className="font-display text-xl font-bold text-[#8B0000] mb-2">No Active OTP Session</h2>
          <p className="text-xs text-[#3A2D23]/70 mb-6">
            Please register or sign in to receive a verification code.
          </p>
          <Link to="/register" className="btn-primary inline-block text-xs font-bold px-6 py-3">
            Go to Registration
          </Link>
        </div>
      </div>
    )
  }

  const handleVerify = async (otpCode) => {
    setLoading(true)
    setError('')
    try {
      const { user, token } = await authService.verifySignupOtp({
        challengeId: currentChallengeId,
        otp: otpCode
      })
      dispatch(credentialsReceived({ user, token }))
      toast.success(`Account verified — welcome, ${user.name}!`, {
        style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
      })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      const res = await authService.resendOtp({ challengeId: currentChallengeId })
      if (res.challengeId) {
        setCurrentChallengeId(res.challengeId)
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
        to="/register"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-xs text-[#B8860B] hover:text-[#8B0000] font-bold uppercase flex items-center gap-1.5 transition-colors touch-target min-h-[44px] px-2"
      >
        <ArrowLeft size={15} /> <span>Back to Sign Up</span>
      </Link>

      <OtpVerificationCard
        title="Verify your mobile number"
        description="Enter the 6-digit OTP sent to"
        phoneMasked={phoneMasked}
        loading={loading}
        error={error}
        devOtp={devOtp}
        onVerify={handleVerify}
        onResend={handleResend}
        onChangePhone={() => navigate('/register')}
      />
    </div>
  )
}
