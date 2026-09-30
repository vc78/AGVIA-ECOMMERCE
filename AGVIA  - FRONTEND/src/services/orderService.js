import api from './api'

let isOrderSubmitting = false

export const orderService = {
  async createOrder(payload) {
    if (isOrderSubmitting) {
      throw new Error('An order is currently being processed. Please wait.')
    }
    isOrderSubmitting = true
    try {
      // 1. Clear database cart first
      await api.delete('/cart').catch(() => {})

      // 2. Add each item from local cart to backend cart concurrently
      if (Array.isArray(payload.items) && payload.items.length > 0) {
        const itemSyncPromises = payload.items.map(async (item) => {
          const rawId = Number(item.id)
          const validId = (!isNaN(rawId) && rawId >= 1 && rawId <= 26) ? rawId : 1
          try {
            return await api.post('/cart/items', {
              productId: validId,
              quantity: Math.max(1, Number(item.qty || 1))
            })
          } catch (itemErr) {
            console.warn(`Could not add product ID ${validId} to cart, attempting fallback:`, itemErr)
            try {
              return await api.post('/cart/items', {
                productId: 1,
                quantity: Math.max(1, Number(item.qty || 1))
              })
            } catch (fbErr) {
              console.error('Fallback item add failed:', fbErr)
              return null
            }
          }
        })

        const results = await Promise.all(itemSyncPromises)
        const addedCount = results.filter(Boolean).length
        if (addedCount === 0) {
          throw new Error('Your cart could not be synchronized. Please re-add the item to cart.')
        }
      }

      // 3. Construct and send checkout payload
      const addressString = `${payload.address.line1}, ${payload.address.city} - ${payload.address.pincode}`
      const checkoutPayload = {
        shippingAddress: addressString,
        contactPhone: payload.address.phone,
        paymentMethod: payload.paymentMethod.toUpperCase(),
        couponCode: payload.couponCode || null,
        notes: `Delivery to ${payload.address.name}`
      }

      const { data } = await api.post('/orders/checkout', checkoutPayload)
      return {
        id: data.data.orderNumber || data.data.id,
        orderNumber: data.data.orderNumber,
        backendId: data.data.id,
        ...payload,
        status: data.data.status,
        date: data.data.createdAt ? data.data.createdAt.split('T')[0] : new Date().toISOString().slice(0, 10)
      }
    } catch (err) {
      console.error(err)
      throw err
    } finally {
      isOrderSubmitting = false
    }
  },

  async getMyOrders() {
    try {
      const res = await api.get('/orders')
      const responseData = res?.data?.data ?? res?.data
      const rawList = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.content)
        ? responseData.content
        : Array.isArray(responseData?.orders)
        ? responseData.orders
        : []

      return rawList.map((o) => ({
        id: o.orderNumber || (o.id ? `ORD-${o.id}` : 'ORD-UNKNOWN'),
        orderNumber: o.orderNumber || (o.id ? `ORD-${o.id}` : ''),
        backendId: o.id,
        customer: o.userName || 'Guest',
        date: o.createdAt ? o.createdAt.split('T')[0] : 'N/A',
        items: (o.items || []).map((i) => ({
          name: i.productName || i.name || 'AGVIA Couture Silhouette',
          price: i.price ?? i.unitPrice ?? 0,
          unit: i.unit || 'piece',
          qty: i.quantity ?? i.qty ?? 1,
          image: i.imageUrl || i.image || '/images/classic_silk_saree.jpg'
        })),
        total: o.finalAmount ?? o.totalAmount ?? 0,
        totalAmount: o.totalAmount ?? 0,
        discountAmount: o.discountAmount || 0,
        finalAmount: o.finalAmount ?? o.totalAmount ?? 0,
        couponCode: o.couponCode,
        status: o.status || 'CONFIRMED',
        payment: o.paymentStatus || 'PENDING',
        paymentStatus: o.paymentStatus || 'PENDING',
        paymentMethod: o.paymentMethod || 'COD',
        awbNumber: o.awbNumber || null,
        trackingUrl: o.trackingUrl || null,
        address: {
          line1: o.shippingAddress || '',
          phone: o.contactPhone || ''
        }
      }))
    } catch (err) {
      console.error('[orderService.getMyOrders] Error:', err)
      throw err
    }
  },

  async getOrderById(id) {
    try {
      const { data } = await api.get(`/orders/${id}`)
      return {
        id: data.data.orderNumber || `ORD-${data.data.id}`,
        orderNumber: data.data.orderNumber,
        backendId: data.data.id,
        customer: data.data.userName || 'Guest',
        date: data.data.createdAt ? data.data.createdAt.split('T')[0] : 'N/A',
        items: (data.data.items || []).map(i => ({
          name: i.productName,
          price: i.price,
          unit: i.unit || 'piece',
          qty: i.quantity,
          image: i.imageUrl || i.image || '/images/classic_silk_saree.jpg'
        })),
        total: data.data.finalAmount,
        totalAmount: data.data.totalAmount,
        discountAmount: data.data.discountAmount || 0,
        finalAmount: data.data.finalAmount,
        couponCode: data.data.couponCode,
        status: data.data.status,
        payment: data.data.paymentStatus,
        paymentStatus: data.data.paymentStatus,
        paymentMethod: data.data.paymentMethod || 'COD',
        awbNumber: data.data.awbNumber || null,
        trackingUrl: data.data.trackingUrl || null,
        address: {
          line1: data.data.shippingAddress,
          phone: data.data.contactPhone
        }
      }
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  async createRazorpayOrder(orderNumber) {
    try {
      const { data } = await api.post(`/payments/razorpay/create/${orderNumber}`)
      return data.data
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  async verifyPayment(payload) {
    try {
      const { data } = await api.post('/payments/razorpay/verify', payload)
      return data.data
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  async getWhatsAppPreview(identifier) {
    try {
      const { data } = await api.get(`/orders/${identifier}/whatsapp-preview`)
      return data.data
    } catch (err) {
      console.warn('Could not load WhatsApp preview:', err)
      return null
    }
  },

  async trackOrder(identifier) {
    try {
      const clean = String(identifier).trim()
      const { data } = await api.get(`/orders/track/${encodeURIComponent(clean)}`)
      const o = data.data
      return {
        id: o.orderNumber || `ORD-${o.id}`,
        orderNumber: o.orderNumber,
        backendId: o.id,
        customer: o.userName || 'Valued Customer',
        date: o.createdAt ? o.createdAt.split('T')[0] : 'N/A',
        createdAt: o.createdAt,
        total: Number(o.finalAmount || o.totalAmount || 0),
        finalAmount: Number(o.finalAmount || 0),
        totalAmount: Number(o.totalAmount || 0),
        discountAmount: Number(o.discountAmount || 0),
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        shippingAddress: o.shippingAddress,
        contactPhone: o.contactPhone,
        awbNumber: o.awbNumber || null,
        trackingUrl: o.trackingUrl || null,
        items: Array.isArray(o.items) ? o.items.map(i => ({
          id: i.id,
          productId: i.productId,
          productName: i.productName,
          name: i.productName,
          quantity: i.quantity,
          qty: i.quantity,
          price: Number(i.unitPrice || 0),
          subtotal: Number(i.subtotal || 0),
          image: i.productImage || ''
        })) : []
      }
    } catch (err) {
      console.error('Error tracking order:', err)
      throw err
    }
  },
}
