import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import { credentialsReceived } from '../../store/authSlice'

export default function GoogleSignInButton({ from = '/' }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const buttonContainerRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [gisLoaded, setGisLoaded] = useState(false)

  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    (typeof window !== 'undefined' ? window.__GOOGLE_CLIENT_ID__ : '') ||
    '792586036173-3cgg5j9qnb5j9i939u7k5ke1qa6dsn8o.apps.googleusercontent.com'

  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      toast.error('Google authentication was cancelled or failed.')
      return
    }

    setLoading(true)
    try {
      const { user, token } = await authService.googleLogin(response.credential)
      dispatch(credentialsReceived({ user, token }))
      toast.success(`Welcome to AGVIA, ${user.name || 'Patron'}!`, {
        icon: '👑',
        style: { background: '#5A1020', color: '#FFFDF8', borderRadius: '12px' }
      })
      navigate(user.role === 'ADMIN' && from === '/' ? '/admin/dashboard' : from, { replace: true })
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not complete Google authentication. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check if Google Identity Services is available
    const checkGis = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        setGisLoaded(true)
        return true
      }
      return false
    }

    if (checkGis()) return

    // Poll briefly for script load if async
    const interval = setInterval(() => {
      if (checkGis()) clearInterval(interval)
    }, 200)

    const timeout = setTimeout(() => clearInterval(interval), 5000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (!gisLoaded || !buttonContainerRef.current) return

    try {
      if (clientId && window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        })

        // Render official Google button into the container
        buttonContainerRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'left',
          width: buttonContainerRef.current.offsetWidth || 340
        })
      }
    } catch (err) {
      console.warn('Google Identity initialization notice:', err)
    }
  }, [gisLoaded, clientId])

  // Custom button click handler (used if GIS button not rendered or for One Tap prompt)
  const handleCustomButtonClick = () => {
    if (!clientId) {
      toast.error('Google Sign-In is awaiting configuration. Please set VITE_GOOGLE_CLIENT_ID.', {
        duration: 4000
      })
      return
    }

    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        })
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('Google prompt not displayed, displaying fallback')
          }
        })
      } catch (err) {
        console.error('Error invoking Google One Tap prompt:', err)
        toast.error('Could not initiate Google login. Please check browser pop-up permissions.')
      }
    } else {
      toast.error('Google Identity service is loading. Please try again in a moment.')
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Official GIS container: automatically sized and responsive */}
      <div
        ref={buttonContainerRef}
        className={`w-full flex justify-center min-h-[44px] ${clientId && gisLoaded ? 'block' : 'hidden'}`}
      />

      {/* Branded Fallback / Direct Button matching AGVIA Design System */}
      {(!clientId || !gisLoaded || loading) && (
        <button
          type="button"
          onClick={handleCustomButtonClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold tracking-wide transition-all shadow-xs hover:shadow-sm touch-target min-h-[44px] select-none"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{loading ? 'Authenticating with Google...' : 'Continue with Google'}</span>
        </button>
      )}
    </div>
  )
}
