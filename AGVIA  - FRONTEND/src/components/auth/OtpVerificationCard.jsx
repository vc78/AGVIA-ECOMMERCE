import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react'
import OtpInput from './OtpInput'

/**
 * Reusable AGVIA Luxury OTP Verification Screen
 * - Clean AGVIA design tokens: Deep wine (#8B0000), Champagne gold (#B8860B), Warm ivory (#FFFDF8), Charcoal (#3A2D23)
 * - Independent client-side countdown timer for Resend button
 * - Communicates with backend for authoritative validation
 */
export default function OtpVerificationCard({
  phoneMasked,
  onVerify,
  onResend,
  onChangePhone,
  loading = false,
  error = '',
  resendCooldownSeconds = 60,
  title = 'Verification Code',
  description = 'Enter the 6-digit verification code sent to your mobile number & email',
  devOtp = ''
}) {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [secondsRemaining, setSecondsRemaining] = useState(resendCooldownSeconds)
  const [isResending, setIsResending] = useState(false)
  const [localError, setLocalError] = useState('')

  // Sync external error with local state
  useEffect(() => {
    if (error) {
      setLocalError(error)
    }
  }, [error])

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (secondsRemaining <= 0) return

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [secondsRemaining])

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleDigitChange = (digits) => {
    setOtpDigits(digits)
    if (localError) setLocalError('')
  }

  const handleVerifySubmit = (e) => {
    if (e) e.preventDefault()
    const otpCode = otpDigits.join('')
    if (otpCode.length !== 6) {
      setLocalError('Please enter all 6 digits of the verification code.')
      return
    }
    onVerify(otpCode)
  }

  const handleResendClick = async () => {
    if (secondsRemaining > 0 || isResending || loading) return

    setIsResending(true)
    setLocalError('')
    try {
      await onResend()
      setSecondsRemaining(resendCooldownSeconds)
      setOtpDigits(['', '', '', '', '', ''])
    } catch (err) {
      setLocalError(err?.response?.data?.message || 'Unable to resend OTP right now. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const isComplete = otpDigits.every((d) => d !== '')

  return (
    <div className="w-full max-w-md p-4 min-[360px]:p-6 sm:p-8 bg-white border border-[#B8860B]/20 rounded-3xl shadow-lg relative overflow-hidden">
      {/* Top AGVIA signature gold gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#8B0000] via-[#B8860B] to-[#8B0000]" />

      {/* Brand Monogram */}
      <div className="flex flex-col items-center mb-6 select-none">
        <div className="w-12 h-12 rounded-full bg-[#8B0000]/5 border border-[#B8860B]/25 flex items-center justify-center mb-3">
          <ShieldCheck className="text-[#8B0000]" size={24} />
        </div>
        <span className="font-display text-xl tracking-[0.2em] font-bold uppercase text-[#8B0000] leading-none">
          AGVIA
        </span>
        <span className="font-body text-[8px] tracking-[0.35em] uppercase text-[#B8860B] font-semibold mt-1">
          HAUTE COUTURE BOUTIQUE
        </span>
      </div>

      <h2 className="font-display text-2xl text-center text-[#8B0000] font-bold mb-1.5">
        {title}
      </h2>

      <p className="text-center text-[#3A2D23]/70 mb-2 text-xs leading-relaxed font-body">
        {description}
      </p>

      {phoneMasked && (
        <div className="text-center mb-4">
          <span className="inline-block px-3.5 py-1 bg-[#FFFDF8] border border-[#B8860B]/30 rounded-full text-xs font-mono font-bold text-[#8B0000] tracking-wider shadow-inner">
            {phoneMasked}
          </span>
        </div>
      )}

      {/* Dev / Test Mode OTP Helper */}
      {devOtp && (
        <div className="mb-4 p-3 bg-[#B8860B]/10 border border-[#B8860B]/30 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8B0000]">Dev Test Mode OTP</span>
            <span className="font-mono text-sm font-bold text-[#3A2D23]">{devOtp}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setOtpDigits(devOtp.split(''))
              if (localError) setLocalError('')
            }}
            className="px-2.5 py-1 bg-[#8B0000] text-[#FFFDF8] rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-[#680000] transition-colors shadow-sm"
          >
            Auto-fill
          </button>
        </div>
      )}

      {/* Error Banner */}
      {localError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-center text-center font-medium animate-fadeIn">
          {localError}
        </div>
      )}

      {/* 6-Digit OTP Input */}
      <form onSubmit={handleVerifySubmit}>
        <OtpInput
          value={otpDigits}
          onChange={handleDigitChange}
          onComplete={(code) => onVerify(code)}
          disabled={loading || isResending}
          hasError={!!localError}
        />

        {/* Action Button */}
        <button
          type="submit"
          disabled={!isComplete || loading || isResending}
          className="btn-primary w-full text-xs font-bold tracking-widest py-3.5 mt-2 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            'Verify & Continue'
          )}
        </button>
      </form>

      {/* Secondary Controls: Resend and Change Mobile */}
      <div className="mt-6 pt-5 border-t border-[#B8860B]/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-body">
        {/* Resend Cooldown Counter / Button */}
        {secondsRemaining > 0 ? (
          <span className="text-[#3A2D23]/60 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#B8860B] animate-pulse" />
            Resend OTP in{' '}
            <strong className="font-mono text-[#8B0000] font-bold">
              {formatTimer(secondsRemaining)}
            </strong>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResendClick}
            disabled={isResending || loading}
            className="text-[#B8860B] hover:text-[#8B0000] font-bold inline-flex items-center gap-1 transition-colors underline decoration-[#B8860B]/40"
          >
            <RefreshCw size={13} className={isResending ? 'animate-spin' : ''} />
            {isResending ? 'Sending...' : 'Resend OTP'}
          </button>
        )}

        {/* Change Phone Option */}
        {onChangePhone && (
          <button
            type="button"
            onClick={onChangePhone}
            disabled={loading || isResending}
            className="text-[#3A2D23]/70 hover:text-[#8B0000] font-medium transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={13} /> Change details
          </button>
        )}
      </div>
    </div>
  )
}
