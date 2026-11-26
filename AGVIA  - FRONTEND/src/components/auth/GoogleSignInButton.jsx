import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import { credentialsReceived, profileUpdated } from '../../store/authSlice'
import { broadcastAuthEvent } from '../../utils/authSync'
import { BUSINESS } from '../../constants/business'

function generateNonce() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `llw_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export default function GoogleSignInButton({ from = '/', mode = 'login', onLinked }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const buttonContainerRef = useRef(null)
  const nonceRef = useRef(generateNonce())
  const [loading, setLoading] = useState(false)
  const [gisLoaded, setGisLoaded] = useState(false)

  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()

  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      toast.error('Google authentication was cancelled or failed.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'link') {
        const linkedUser = await authService.linkGoogleAccount(response.credential, nonceRef.current)
        dispatch(profileUpdated(linkedUser))
        toast.success('Google account linked successfully.', {
          style: { background: '#651B2B', color: '#FBF5EA', borderRadius: '12px' }
        })
        if (onLinked) onLinked(linkedUser)
        return
      }

      const { user, token } = await authService.googleLogin(response.credential, nonceRef.current)
      dispatch(credentialsReceived({ user, token, role: 'CUSTOMER', rememberMe: true }))
      broadcastAuthEvent('LOGIN', { user, token, role: 'CUSTOMER' })
      toast.success(`Welcome to ${BUSINESS.name}, ${user.name || 'Customer'}!`, {
        style: { background: '#651B2B', color: '#FBF5EA', borderRadius: '12px' }
      })
      navigate(from === '/login' || from === '/register' ? '/' : from, { replace: true })
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.customerMessage ||
        err?.message ||
        'Could not complete Google authentication. Please try again.'
      toast.error(msg)
    } finally {
      nonceRef.current = generateNonce()
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!clientId) return

    const checkGis = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        setGisLoaded(true)
        return true
      }
      return false
    }

    if (checkGis()) return

    const interval = setInterval(() => {
      if (checkGis()) clearInterval(interval)
    }, 200)

    const timeout = setTimeout(() => clearInterval(interval), 5000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [clientId])

  useEffect(() => {
    if (!clientId || !gisLoaded || !buttonContainerRef.current) return

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: nonceRef.current,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      })

      buttonContainerRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'pill',
        text: mode === 'link' ? 'continue_with' : 'continue_with',
        logo_alignment: 'left',
        width: buttonContainerRef.current.offsetWidth || 340
      })
    } catch (err) {
      console.warn('Google Identity initialization notice:', err)
    }
  }, [gisLoaded, clientId, mode])

  const handleFallbackClick = () => {
    if (!clientId) {
      toast.error('Google Sign-In is not configured for this environment yet (VITE_GOOGLE_CLIENT_ID missing).')
      return
    }
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          nonce: nonceRef.current,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        })
        window.google.accounts.id.prompt()
      } catch {
        toast.error('Could not initiate Google sign-in. Please allow pop-ups or check network connectivity.')
      }
    } else {
      toast.error('Google Sign-In script is still loading. Please try again in a moment.')
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={buttonContainerRef}
        className={`w-full flex justify-center min-h-[44px] ${clientId && gisLoaded ? 'block' : 'hidden'}`}
      />

      {(!clientId || !gisLoaded || loading) && (
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-[#E7D4B9] bg-white hover:bg-[#FBF5EA] text-[#38271F] text-xs font-semibold tracking-wide transition-all shadow-xs hover:shadow-sm touch-target min-h-[44px] select-none disabled:opacity-60"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-[#651B2B]/30 border-t-[#651B2B] rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          <span>
            {loading
              ? 'Authenticating with Google...'
              : mode === 'link'
              ? 'Link Google Account'
              : clientId
              ? 'Continue with Google'
              : 'Google Sign-In (Awaiting Configuration)'}
          </span>
        </button>
      )}
    </div>
  )
}
