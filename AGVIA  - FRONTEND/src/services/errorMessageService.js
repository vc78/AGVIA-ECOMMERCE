/**
 * AGVIA Centralized User-Friendly Error Messaging Service
 *
 * Strict architectural rule:
 * - Customers NEVER see technical jargon, stack traces, HTTP codes, or database errors.
 * - Developers ALWAYS receive complete technical diagnostics in the console.
 * - Every message answers: 1) WHAT happened, 2) WHAT the customer can do next.
 */

// Developer technical logger
export function logDeveloperError(context, error) {
  if (typeof console !== 'undefined' && console.error) {
    const technicalDetails = {
      context,
      message: error?.message,
      code: error?.code,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      url: error?.config?.url,
      method: error?.config?.method,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    }
    console.error(`[AGVIA Tech Log: ${context}]`, technicalDetails)
  }
}

/**
 * Universal error parser converting technical exceptions into friendly human wording
 */
export function getFriendlyErrorMessage(error, defaultFallback = 'Something went wrong. Please try again in a moment.') {
  if (!error) return defaultFallback

  // Check network & connectivity failures
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine) {
    return 'We could not connect right now. Please check your internet connection and try again.'
  }

  // Check timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
    return 'This request is taking longer than expected. Please try again shortly.'
  }

  const status = error.response?.status
  const backendMsg = error.response?.data?.message || error.response?.data?.error || ''

  // Humanize known backend responses
  if (typeof backendMsg === 'string') {
    const lower = backendMsg.toLowerCase()

    if (lower.includes('invalid credentials') || lower.includes('bad credentials')) {
      return 'Your email or password is not correct. Please check and try again.'
    }
    if (lower.includes('already exists') || lower.includes('duplicate')) {
      return 'An account with these details already exists. Please sign in instead.'
    }
    if (lower.includes('user not found') || lower.includes('account not found')) {
      return 'We could not find an account with those details. Please check or register.'
    }
    if (lower.includes('jwt') || lower.includes('token') || lower.includes('expired')) {
      return 'Your session has expired for security. Please sign in again.'
    }
    if (lower.includes('out of stock') || lower.includes('stock')) {
      return 'Sorry, this silhouette is currently out of stock or limited in quantity.'
    }
    if (lower.includes('coupon') || lower.includes('discount')) {
      return 'This promo code is either invalid, expired, or does not meet the minimum order requirement.'
    }
    if (lower.includes('otp') && (lower.includes('invalid') || lower.includes('incorrect'))) {
      return 'The verification code entered is incorrect. Please check and try again.'
    }
    if (lower.includes('otp') && lower.includes('expired')) {
      return 'This verification code has expired. Please request a new code.'
    }
    if (lower.includes('rate limit') || lower.includes('too many')) {
      return 'You are making requests a little too quickly. Please wait a moment and try again.'
    }
  }

  // Handle standard HTTP status codes
  switch (status) {
    case 400:
      return 'Some of the details provided need attention. Please verify and try again.'
    case 401:
      return 'Please sign in to your AGVIA account to continue.'
    case 403:
      return 'You do not have permission to perform this action.'
    case 404:
      return 'We could not find what you were looking for. It may have been moved or updated.'
    case 408:
      return 'The request took longer than expected. Please try again.'
    case 409:
      return 'This item or account already exists. Please check your details.'
    case 422:
      return 'Please check the information you entered and try again.'
    case 429:
      return 'You are making requests a little too quickly. Please wait a moment and try again.'
    case 500:
      return 'We encountered a momentary issue on our side. Please try again shortly.'
    case 502:
    case 503:
    case 504:
      return 'Our boutique services are undergoing a brief refresh. Please check back in a moment.'
    default:
      return defaultFallback
  }
}

/**
 * Authentication specific error messages
 */
export function getAuthErrorMessage(error) {
  logDeveloperError('Authentication', error)
  return getFriendlyErrorMessage(error, 'We could not complete your sign-in. Please try again.')
}

/**
 * Cart & Wishlist specific messages
 */
export function getCartErrorMessage(error) {
  logDeveloperError('Cart', error)
  return getFriendlyErrorMessage(error, 'We could not update your shopping bag right now. Please try again.')
}

/**
 * Checkout specific messages
 */
export function getCheckoutErrorMessage(error) {
  logDeveloperError('Checkout', error)
  return getFriendlyErrorMessage(error, 'We could not place your order right now. Please review your details and try again.')
}

/**
 * Payment specific messages
 */
export function getPaymentErrorMessage(error) {
  logDeveloperError('Payment', error)
  return getFriendlyErrorMessage(error, 'Your payment could not be processed. Please check with your payment provider or select Cash on Delivery.')
}

/**
 * Order & Tracking specific messages
 */
export function getOrderErrorMessage(error) {
  logDeveloperError('Orders', error)
  return getFriendlyErrorMessage(error, 'We could not load your order details right now. Please try again shortly.')
}

/**
 * Profile & Address specific messages
 */
export function getProfileErrorMessage(error) {
  logDeveloperError('Profile', error)
  return getFriendlyErrorMessage(error, 'We could not save your profile changes. Please try again.')
}

/**
 * Form validation helper returning human-friendly prompts
 */
export function getValidationPrompt(field) {
  const map = {
    name: 'Please enter your full name.',
    fullName: 'Please enter your full name.',
    email: 'Please enter a valid email address.',
    password: 'Password must be at least 6 characters.',
    confirmPassword: 'Passwords do not match. Please verify.',
    phone: 'Please enter a valid 10-digit mobile number.',
    otp: 'Please enter the 6-digit verification code.',
    line1: 'Please enter your street address.',
    city: 'Please enter your city.',
    state: 'Please enter your state.',
    pincode: 'Please enter a valid 6-digit PIN code.',
    comment: 'Please share your thoughts for the review.'
  }
  return map[field] || 'Please provide all required details.'
}

export default {
  logDeveloperError,
  getFriendlyErrorMessage,
  getAuthErrorMessage,
  getCartErrorMessage,
  getCheckoutErrorMessage,
  getPaymentErrorMessage,
  getOrderErrorMessage,
  getProfileErrorMessage,
  getValidationPrompt
}
