/**
 * AGVIA Privacy-Conscious Client-Side Analytics Tracker
 *
 * Designed to be 100% non-blocking: analytics failures will NEVER interrupt
 * or break customer navigation, viewing, cart operations, or checkout.
 *
 * Deduplication guards prevent double-recording from React StrictMode,
 * component re-renders, and rapid clicks.
 */
import api from './api'

// ── Storage Keys ──────────────────────────────────────────────
const VISITOR_KEY = 'agvia_visitor_id'
const SESSION_KEY = 'agvia_session_id'
const SESSION_TIMESTAMP_KEY = 'agvia_session_last_active'
const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30-minute session inactivity timeout

// In-memory deduplication cache
const recentEvents = new Map()
const DEDUP_WINDOW_MS = 1500

/**
 * Generate a random UUID-like identifier without collecting any PII.
 */
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'v-' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
}

/**
 * Get or initialize persistent anonymous visitor ID.
 * Stored in localStorage so it persists across visits on the same browser.
 */
export function getVisitorId() {
  try {
    let vid = localStorage.getItem(VISITOR_KEY)
    if (!vid) {
      vid = 'vis-' + generateId()
      localStorage.setItem(VISITOR_KEY, vid)
    }
    return vid
  } catch {
    return 'vis-fallback-' + Date.now()
  }
}

/**
 * Get or initialize session ID with a 30-minute inactivity expiration window.
 */
export function getSessionId() {
  try {
    const now = Date.now()
    const lastActive = parseInt(sessionStorage.getItem(SESSION_TIMESTAMP_KEY) || '0', 10)
    let sid = sessionStorage.getItem(SESSION_KEY)

    // Expire session if inactive for more than 30 minutes or missing
    if (!sid || (lastActive && now - lastActive > SESSION_TIMEOUT_MS)) {
      sid = 'sess-' + generateId()
      sessionStorage.setItem(SESSION_KEY, sid)
    }

    sessionStorage.setItem(SESSION_TIMESTAMP_KEY, String(now))
    return sid
  } catch {
    return 'sess-fallback-' + Date.now()
  }
}

/**
 * Determine device type based on viewport width.
 */
export function getDeviceType() {
  if (typeof window === 'undefined') return 'Desktop'
  const width = window.innerWidth
  if (width < 768) return 'Mobile'
  if (width <= 1024) return 'Tablet'
  return 'Desktop'
}

/**
 * Normalize referrer source without storing sensitive full URL strings.
 */
export function getNormalizedReferrer() {
  if (typeof document === 'undefined' || !document.referrer) return 'Direct'
  const ref = document.referrer.toLowerCase()

  try {
    const refUrl = new URL(document.referrer)
    const host = refUrl.hostname.toLowerCase()
    const currentHost = window.location.hostname.toLowerCase()

    if (host === currentHost) return 'Direct'
    if (host.includes('google')) return 'Google'
    if (host.includes('instagram')) return 'Instagram'
    if (host.includes('facebook') || host.includes('fb.')) return 'Facebook'
    if (host.includes('whatsapp') || host.includes('wa.me')) return 'WhatsApp'
    if (host.includes('youtube')) return 'YouTube'
    if (host.includes('pinterest')) return 'Pinterest'
    if (host.includes('twitter') || host.includes('t.co') || host.includes('x.com')) return 'Twitter / X'
    return host
  } catch {
    return 'Direct'
  }
}

/**
 * Core Non-Blocking Event Tracking Dispatcher.
 * Uses navigator.sendBeacon and fetch with keepalive:true so events survive
 * instantaneous route changes and page navigation without blocking user interaction.
 */
export async function track(eventType, data = {}) {
  try {
    if (!eventType) return

    // ── Deduplication Guard ─────────────────────────────────
    // Prevent duplicate events fired within DEDUP_WINDOW_MS (e.g. React StrictMode or rapid double clicks)
    const dedupKey = `${eventType}:${data.productId || ''}:${data.pagePath || ''}:${data.shareMethod || ''}`
    const now = Date.now()
    const lastTime = recentEvents.get(dedupKey) || 0

    if (now - lastTime < DEDUP_WINDOW_MS) {
      return // Skip duplicate
    }
    recentEvents.set(dedupKey, now)

    // Clean up old deduplication cache entries periodically
    if (recentEvents.size > 100) {
      for (const [k, t] of recentEvents.entries()) {
        if (now - t > 10000) recentEvents.delete(k)
      }
    }

    const payload = {
      eventType,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      pagePath: data.pagePath || (typeof window !== 'undefined' ? window.location.pathname : null),
      pageTitle: data.pageTitle || (typeof document !== 'undefined' ? document.title : null),
      productId: data.productId ? Number(data.productId) : null,
      deviceType: getDeviceType(),
      referrer: getNormalizedReferrer(),
      shareMethod: data.shareMethod || null,
      quantity: data.quantity ? Number(data.quantity) : 1,
    }

    if (import.meta.env.DEV) {
      console.log(`[AGVIA Analytics] 📡 ${eventType}`, payload)
    }

    const payloadStr = JSON.stringify(payload)
    const baseUrl = api.defaults.baseURL || 'https://agvia-ecommerce.onrender.com/api'
    const trackUrl = `${baseUrl.replace(/\/+$/, '')}/analytics/track`

    // Priority 1: navigator.sendBeacon (specifically designed for reliable analytics during unloads/navigation)
    let beaconSent = false
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([payloadStr], { type: 'application/json' })
        beaconSent = navigator.sendBeacon(trackUrl, blob)
      } catch {
        beaconSent = false
      }
    }

    // Priority 2: fetch with keepalive: true
    if (!beaconSent && typeof fetch !== 'undefined') {
      try {
        fetch(trackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadStr,
          keepalive: true,
        }).catch(() => {
          // Fallback to axios if fetch fails
          api.post('/analytics/track', payload).catch(() => {})
        })
      } catch {
        api.post('/analytics/track', payload).catch(() => {})
      }
    } else if (!beaconSent) {
      // Priority 3: standard Axios client
      api.post('/analytics/track', payload).catch(() => {})
    }
  } catch {
    // Non-blocking fallback: analytics errors never bubble up
  }
}

// ── Convenient Semantic Trackers ─────────────────────────────

export function trackPageView(pagePath, pageTitle) {
  track('PAGE_VIEW', { pagePath, pageTitle })
}

export function trackProductView(product) {
  if (!product?.id) return
  track('PRODUCT_VIEW', {
    productId: product.id,
    pagePath: `/products/${product.id}`,
    pageTitle: product.name,
  })
}

export function trackAddToCart(product, quantity = 1) {
  if (!product?.id) return
  track('ADD_TO_CART', {
    productId: product.id,
    quantity,
    pagePath: typeof window !== 'undefined' ? window.location.pathname : null,
  })
}

export function trackWishlist(product, isAdded) {
  if (!product?.id) return
  track(isAdded ? 'WISHLIST_ADD' : 'WISHLIST_REMOVE', {
    productId: product.id,
  })
}

export function trackProductShare(product, shareMethod = 'WEB_SHARE') {
  if (!product?.id) return
  track('PRODUCT_SHARE', {
    productId: product.id,
    shareMethod,
  })
}

export function trackCheckoutStarted(itemCount, total) {
  track('CHECKOUT_STARTED', {
    quantity: itemCount,
    pagePath: '/checkout',
    pageTitle: 'Checkout',
  })
}

export function trackPurchase(order) {
  if (!order?.id && !order?.orderNumber) return
  track('PURCHASE', {
    pagePath: '/orders',
    pageTitle: 'Order Confirmation',
  })
}

const analytics = {
  track,
  trackPageView,
  trackProductView,
  trackAddToCart,
  trackWishlist,
  trackProductShare,
  trackCheckoutStarted,
  trackPurchase,
  getVisitorId,
  getSessionId,
  getDeviceType,
}

export default analytics
