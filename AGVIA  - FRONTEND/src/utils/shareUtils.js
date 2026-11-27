import toast from 'react-hot-toast'

/**
 * Returns a clean, public, unauthenticated product URL.
 * Never includes tokens, session IDs, user IDs, or emails.
 */
export function getProductShareUrl(productId) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://agvia.in'
  return `${origin}/products/${productId}`
}

/**
 * Copies the clean public product link to clipboard and displays feedback.
 */
export async function copyProductLink(product) {
  if (!product?.id) return false
  const url = getProductShareUrl(product.id)
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    toast.success('Link copied to clipboard!', {
      id: `share-copy-${product.id}`,
      icon: '✨',
      style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px', fontSize: '12px' }
    })
    return true
  } catch (err) {
    console.error('Failed to copy link:', err)
    toast.error('Could not copy link.')
    return false
  }
}

/**
 * Generates direct WhatsApp share link for the product.
 */
export function getProductWhatsAppShareUrl(product) {
  const url = getProductShareUrl(product.id)
  const text = `Discover this exquisite piece on AGVIA Luxury Atelier ✨\n👗 *${product.name}*\n💰 ₹${Number(product.price || 0).toLocaleString('en-IN')}\n🔗 ${url}`
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
}

/**
 * Executes Web Share API where supported, or triggers fallback.
 */
export async function shareProduct(product) {
  if (!product?.id) return { success: false }

  const url = getProductShareUrl(product.id)
  const title = `AGVIA — ${product.name}`
  const text = `Discover ${product.name} on AGVIA Luxury Atelier`

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title,
        text,
        url,
      })
      return { success: true, method: 'native' }
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, aborted: true }
      }
      // If native share fails, fallback to modal/popover
      return { success: false, fallback: true }
    }
  }

  return { success: false, fallback: true }
}
