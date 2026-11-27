import { useRef, useEffect } from 'react'

/**
 * AGVIA Luxury 6-Digit OTP Input
 * - Supports automatic focus advancement
 * - Backspace backward navigation
 * - Full clipboard paste of 6-digit code
 * - Mobile numeric keypad support (inputMode="numeric")
 * - WCAG accessible with aria labels
 */
export default function OtpInput({
  value = ['', '', '', '', '', ''],
  onChange,
  onComplete,
  disabled = false,
  hasError = false
}) {
  const inputRefs = useRef([])

  useEffect(() => {
    // Focus first input on mount
    if (!disabled && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [disabled])

  const handleDigitChange = (index, e) => {
    const rawChar = e.target.value
    // Extract only digits, take the last character typed
    const digit = rawChar.replace(/\D/g, '').slice(-1)

    const newOtp = [...value]
    newOtp[index] = digit
    onChange(newOtp)

    // Automatically focus next input if digit was entered
    if (digit && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus()
    }

    // Trigger onComplete when all 6 digits are populated
    if (digit && newOtp.every((d) => d !== '') && onComplete) {
      onComplete(newOtp.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    if (disabled) return

    if (e.key === 'Backspace') {
      if (!value[index] && index > 0 && inputRefs.current[index - 1]) {
        // Current box is already empty, focus previous and clear it
        inputRefs.current[index - 1].focus()
        const newOtp = [...value]
        newOtp[index - 1] = ''
        onChange(newOtp)
      } else {
        const newOtp = [...value]
        newOtp[index] = ''
        onChange(newOtp)
      }
    } else if (e.key === 'ArrowLeft' && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus()
    } else if (e.key === 'ArrowRight' && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    if (disabled) return

    const pastedData = e.clipboardData.getData('text').trim()
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('')

    if (digits.length > 0) {
      const newOtp = [...value]
      digits.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit
      })
      onChange(newOtp)

      const focusIdx = Math.min(digits.length, 5)
      if (inputRefs.current[focusIdx]) {
        inputRefs.current[focusIdx].focus()
      }

      if (newOtp.every((d) => d !== '') && onComplete) {
        onComplete(newOtp.join(''))
      }
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 min-[360px]:gap-2 sm:gap-3.5 my-4 sm:my-5 select-none" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1} of verification code`}
          disabled={disabled}
          value={value[i] || ''}
          onChange={(e) => handleDigitChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className={`w-9 min-[360px]:w-10 sm:w-12 md:w-13 h-12 sm:h-14 md:h-16 text-center text-lg sm:text-2xl font-bold font-mono rounded-xl sm:rounded-2xl border transition-all duration-200 outline-none shadow-sm ${
            hasError
              ? 'border-red-500 bg-red-50/50 text-red-900 focus:ring-2 focus:ring-red-300'
              : value[i]
              ? 'border-[#8B0000] bg-white text-[#8B0000] font-extrabold shadow-[0_2px_8px_rgba(139,0,0,0.08)]'
              : 'border-[#B8860B]/30 bg-[#FFFDF8] text-[#3A2D23] focus:border-[#8B0000] focus:ring-2 focus:ring-[#8B0000]/15 focus:bg-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
        />
      ))}
    </div>
  )
}
