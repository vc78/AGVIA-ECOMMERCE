import { useCallback, useEffect, useState } from 'react'
import { trackAddToCart } from '../services/analytics'

// Lightweight cart persisted to localStorage. Kept outside Redux (only auth
// is modeled in the store, per the app's state slice) but exposed as a hook
// so any page/component can read and mutate the cart consistently.

// User-isolated cart persisted to localStorage.
// Guest cart is kept separate under ps_cart_guest and merged into the user cart upon login.

function getCartKey() {
  try {
    const rawUser = localStorage.getItem('ps_user')
    if (rawUser) {
      const user = JSON.parse(rawUser)
      const identifier = user.id || user.email
      if (identifier) {
        return `ps_cart_${identifier}`
      }
    }
  } catch {
    // fallback to guest
  }
  return 'ps_cart_guest'
}

function readCart() {
  try {
    const key = getCartKey()
    let items = JSON.parse(localStorage.getItem(key) || 'null')

    // Migration from old legacy global ps_cart if present
    if (items === null) {
      const legacy = localStorage.getItem('ps_cart')
      if (legacy) {
        items = JSON.parse(legacy)
        localStorage.setItem(key, JSON.stringify(items))
        localStorage.removeItem('ps_cart')
      } else {
        items = []
      }
    }

    // If authenticated, check and merge any remaining guest cart items
    if (key !== 'ps_cart_guest') {
      const guestItems = JSON.parse(localStorage.getItem('ps_cart_guest') || '[]')
      if (Array.isArray(guestItems) && guestItems.length > 0) {
        guestItems.forEach((gItem) => {
          const existing = items.find((i) => i.id === gItem.id)
          if (existing) {
            existing.qty += gItem.qty
          } else {
            items.push(gItem)
          }
        })
        localStorage.setItem(key, JSON.stringify(items))
        localStorage.removeItem('ps_cart_guest')
      }
    }

    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

function writeCart(items) {
  const key = getCartKey()
  localStorage.setItem(key, JSON.stringify(items))
  // Keep legacy key cleared
  localStorage.removeItem('ps_cart')
  window.dispatchEvent(new Event('ps-cart-updated'))
}

export function useCart() {
  const [items, setItems] = useState(readCart())

  useEffect(() => {
    const sync = () => setItems(readCart())
    window.addEventListener('ps-cart-updated', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('ps-cart-updated', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const addToCart = useCallback((product, qty = 1) => {
    if (!product || !product.id) return
    const current = readCart()
    const targetCartId = product.variantId
      ? `${product.id}_v_${product.variantId}`
      : `${product.id}_size_${product.size || 'M'}`

    const idx = current.findIndex((i) => {
      if (i.cartItemId) return i.cartItemId === targetCartId
      if (product.variantId) return i.id === product.id && i.variantId === product.variantId
      return i.id === product.id && (i.size || 'M') === (product.size || 'M')
    })

    if (idx >= 0) {
      current[idx].qty += qty
    } else {
      current.push({
        cartItemId: targetCartId,
        id: product.id,
        productId: product.id,
        variantId: product.variantId || null,
        colorName: product.colorName || null,
        colorCode: product.colorCode || null,
        sku: product.sku || null,
        size: product.size || null,
        name: product.name,
        price: product.price,
        unit: product.unit,
        image: product.image,
        paymentOption: product.paymentOption || 'COD_AND_ONLINE',
        codAllowed: product.paymentOption !== 'ONLINE_ONLY',
        onlineAllowed: product.paymentOption !== 'COD_ONLY',
        product: product,
        qty
      })
    }
    writeCart(current)
    trackAddToCart(product, qty)
  }, [])

  const updateQty = useCallback((cartItemIdOrId, qty) => {
    const current = readCart()
    const idx = current.findIndex((i) => i.cartItemId === cartItemIdOrId || i.id === cartItemIdOrId)
    if (idx >= 0) {
      if (qty <= 0) current.splice(idx, 1)
      else current[idx].qty = qty
    }
    writeCart(current)
  }, [])

  const removeFromCart = useCallback((cartItemIdOrId) => {
    writeCart(readCart().filter((i) => i.cartItemId !== cartItemIdOrId && i.id !== cartItemIdOrId))
  }, [])

  const clearCart = useCallback(() => writeCart([]), [])

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const count = items.reduce((sum, i) => sum + i.qty, 0)

  return { items, addToCart, updateQty, removeFromCart, clearCart, subtotal, count }
}
