/**
 * Centralized Payment Policy Service for AGVIA Ecommerce.
 * Evaluates payment options across products, variants, and mixed carts.
 * Mirrors the backend domain logic for seamless UX synchronization.
 */

export function evaluatePaymentPolicy(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      paymentMode: 'COD_AND_ONLINE',
      mode: 'COD_AND_ONLINE',
      codAllowed: true,
      onlineAllowed: true,
      conflict: false,
      reasonCode: 'OK',
      message: 'All payment methods are available.'
    }
  }

  const hasCodOnly = items.some(item => {
    const opt = String(item.paymentOption || item.product?.paymentOption || item.paymentPolicy?.mode || item.paymentPolicy?.paymentMode || item.product?.paymentPolicy?.mode || item.product?.paymentPolicy?.paymentMode || '').trim().toUpperCase()
    return opt === 'COD_ONLY' || item.onlineAllowed === false || item.product?.onlineAllowed === false
  })

  const hasOnlineOnly = items.some(item => {
    const opt = String(item.paymentOption || item.product?.paymentOption || item.paymentPolicy?.mode || item.paymentPolicy?.paymentMode || item.product?.paymentPolicy?.mode || item.product?.paymentPolicy?.paymentMode || '').trim().toUpperCase()
    return opt === 'ONLINE_ONLY' || item.codAllowed === false || item.product?.codAllowed === false
  })

  if (hasCodOnly && hasOnlineOnly) {
    return {
      paymentMode: 'CONFLICT',
      mode: 'CONFLICT',
      codAllowed: false,
      onlineAllowed: false,
      conflict: true,
      reasonCode: 'PAYMENT_CONFLICT',
      message: 'Your bag contains items that only support Cash on Delivery and items that only support Online Payment. Please purchase them separately.'
    }
  }

  if (hasCodOnly) {
    return {
      paymentMode: 'COD_ONLY',
      mode: 'COD_ONLY',
      codAllowed: true,
      onlineAllowed: false,
      conflict: false,
      reasonCode: 'COD_ONLY_ITEMS',
      message: 'For this product only Cash on Delivery (COD) is applicable. Online payment is unavailable.'
    }
  }

  if (hasOnlineOnly) {
    return {
      paymentMode: 'ONLINE_ONLY',
      mode: 'ONLINE_ONLY',
      codAllowed: false,
      onlineAllowed: true,
      conflict: false,
      reasonCode: 'ONLINE_ONLY_ITEMS',
      message: 'For this product only Online Payment is applicable. Cash on Delivery is unavailable.'
    }
  }

  return {
    paymentMode: 'COD_AND_ONLINE',
    mode: 'COD_AND_ONLINE',
    codAllowed: true,
    onlineAllowed: true,
    conflict: false,
    reasonCode: 'OK',
    message: 'Both Cash on Delivery and Online Payment are available.'
  }
}

export default {
  evaluatePaymentPolicy
}
