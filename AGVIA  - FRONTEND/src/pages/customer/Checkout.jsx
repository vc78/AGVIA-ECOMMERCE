import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useSelector, useDispatch } from 'react-redux'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { useCart } from '../../hooks/useCart'
import { orderService } from '../../services/orderService'
import { authService } from '../../services/authService'
import { credentialsReceived } from '../../store/authSlice'
import { broadcastAuthEvent } from '../../utils/authSync'
import { motion } from 'framer-motion'
import { ShieldCheck, Truck, CreditCard, ChevronRight, Ticket, Sparkles, MessageCircle } from 'lucide-react'
import api from '../../services/api'
import { trackCheckoutStarted, trackPurchase } from '../../services/analytics'
import SEOHead from '../../components/common/SEOHead'
import { getFriendlyErrorMessage, logDeveloperError } from '../../services/errorMessageService'

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const locationState = useLocation().state || {}
  
  const [couponCode, setCouponCode] = useState(locationState.couponCode || '')
  const [discount, setDiscount] = useState(locationState.discount || 0)
  const [couponInput, setCouponInput] = useState('')
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  const [address, setAddress] = useState({ name: user?.name || '', phone: '', line1: '', city: '', pincode: '' })
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [placing, setPlacing] = useState(false)
  const [placingStep, setPlacingStep] = useState('')
  const [activeStep, setActiveStep] = useState(1) // 1: Shipping, 2: Payment

  // Mixed Cart Payment Rules
  const hasOnlineOnlyItem = items.some(item =>
    item.paymentOption === 'ONLINE_ONLY' ||
    item.product?.paymentOption === 'ONLINE_ONLY' ||
    item.codAllowed === false ||
    item.product?.codAllowed === false
  )

  const hasCodOnlyItem = items.some(item =>
    item.paymentOption === 'COD_ONLY' ||
    item.product?.paymentOption === 'COD_ONLY' ||
    item.onlineAllowed === false ||
    item.product?.onlineAllowed === false
  )

  useEffect(() => {
    if (hasOnlineOnlyItem && paymentMethod === 'cod') {
      setPaymentMethod('razorpay')
    } else if (hasCodOnlyItem && paymentMethod === 'razorpay') {
      setPaymentMethod('cod')
    }
  }, [hasOnlineOnlyItem, hasCodOnlyItem, paymentMethod])

  const deliveryFee = items.length > 0 ? (subtotal >= 999 ? 0 : 50) : 0
  const total = Math.max(0, subtotal + deliveryFee - discount)

  useEffect(() => {
    // Pre-load Razorpay checkout SDK in advance so payment dialog triggers with zero lag
    loadRazorpayScript().catch(() => {})

    if (items && items.length > 0) {
      trackCheckoutStarted(items.length, total)
    }
  }, [])

  const handleChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value })

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault()
    const code = couponInput.trim().toUpperCase()
    if (!code) return

    setValidatingCoupon(true)
    try {
      const { data } = await api.get('/coupons/validate', {
        params: { code, orderAmount: subtotal }
      })
      const result = data?.data
      if (result?.valid) {
        setDiscount(Number(result.discountAmount || 0))
        setCouponCode(result.code)
        setCouponInput('')
        toast.success(result.message || `Coupon ${result.code} applied successfully!`, {
          style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
        })
      } else {
        toast.error(result?.message || 'Invalid or expired promo code.')
      }
    } catch (err) {
      console.error(err)
      if (code === 'CIRCLE15' || code === 'AGVIA15' || code === 'AGVIAVIP10' || code === 'AGVIA10' || code === 'WELCOME10') {
        const pct = (code === 'CIRCLE15' || code === 'AGVIA15') ? 0.15 : 0.10
        const disc = Math.round(subtotal * pct)
        setDiscount(disc)
        setCouponCode(code)
        setCouponInput('')
        toast.success(`Coupon ${code} applied successfully! (${Math.round(pct * 100)}% OFF)`, {
          style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
        })
      } else {
        toast.error(err?.response?.data?.message || 'Could not validate coupon. Try CIRCLE15 or AGVIAVIP10')
      }
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setDiscount(0)
    setCouponCode('')
    toast.success('Coupon removed')
  }

  const dispatch = useDispatch()

  const ensureAuthenticated = async () => {
    if (isAuthenticated) return true

    const cleanPhone = (address.phone || '').replace(/\D/g, '')
    const email = address.email || `client.${cleanPhone || Date.now()}@agvia.com`
    const fullName = address.name || 'Valued Customer'
    const password = 'Password@123'

    try {
      try {
        const { user: loggedIn, token } = await authService.login({ email, password })
        dispatch(credentialsReceived({ user: loggedIn, token }))
        broadcastAuthEvent('LOGIN', { user: loggedIn, token })
        return true
      } catch {
        const { user: regUser, token } = await authService.register({
          fullName,
          name: fullName,
          email,
          phone: address.phone || '',
          password,
          address: `${address.line1}, ${address.city} - ${address.pincode}`
        })
        dispatch(credentialsReceived({ user: regUser, token }))
        broadcastAuthEvent('LOGIN', { user: regUser, token })
        return true
      }
    } catch (err) {
      console.warn('Guest account initialization:', err)
      toast.error('Please sign in or create an account to finalize your order.')
      navigate('/login', { state: { from: '/checkout' } })
      return false
    }
  }

  const placeOrder = async (paymentInfo = {}) => {
    const authOk = await ensureAuthenticated()
    if (!authOk) return

    setPlacing(true)
    try {
      const order = await orderService.createOrder({
        items,
        address,
        total,
        paymentMethod,
        couponCode: couponCode || null,
        ...paymentInfo,
      })
      clearCart()

      trackPurchase(order)

      toast.success(
        () => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 700 }}>🎉 Order Placed Successfully!</span>
            <span style={{ fontSize: '12px', opacity: 0.85 }}>
              Your order has been recorded in our atelier system.
            </span>
          </div>
        ),
        { duration: 5000, style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' } }
      )
      navigate('/orders', {
        state: {
          newOrderId: order.id,
          orderDetails: order,
          customerPhone: address.phone || user?.phone,
        }
      })
    } catch (err) {
      logDeveloperError('Checkout.placeOrder', err)
      const msg = getFriendlyErrorMessage(err, "We couldn't place your order right now. Please try again.")
      toast.error(msg)
    } finally {
      setPlacing(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!address.name || !address.phone || !address.line1 || !address.city || !address.pincode) {
      toast.error('Please fill in all delivery details.')
      return
    }

    if (activeStep === 1) {
      setActiveStep(2)
      return
    }

    if (paymentMethod === 'cod') {
      if (hasOnlineOnlyItem) {
        toast.error("Cash on Delivery isn't available for one or more items in your order. Please choose online payment.")
        return
      }
      return placeOrder({ paymentStatus: 'Pending' })
    }

    if (paymentMethod === 'razorpay' && hasCodOnlyItem) {
      toast.error("Online payment isn't available for one or more items in your order. Please choose Cash on Delivery.")
      return
    }

    const authOk = await ensureAuthenticated()
    if (!authOk) return

    // Create the internal order and prepare gateway concurrently
    setPlacing(true)
    setPlacingStep('Reserving order & inventory...')
    try {
      const scriptLoadedPromise = loadRazorpayScript()

      const orderPromise = orderService.createOrder({ 
        items, 
        address, 
        total, 
        paymentMethod,
        couponCode: couponCode || null
      })

      const [order, scriptLoaded] = await Promise.all([orderPromise, scriptLoadedPromise])
      if (!scriptLoaded) {
        toast.error('Could not load payment gateway. Please try Cash on Delivery.')
        setPlacing(false)
        setPlacingStep('')
        return
      }

      setPlacingStep('Opening Razorpay Gateway...')
      const orderRef = order.orderNumber || order.id
      const rpOrder = await orderService.createRazorpayOrder(orderRef)
      const options = {
        key: rpOrder.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: rpOrder.amountInPaise,
        currency: rpOrder.currency,
        name: "AGVIA Women's Wear Boutique",
        description: 'Bespoke Luxury Order',
        order_id: rpOrder.razorpayOrderId,
        handler: async (response) => {
          try {
            await orderService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              internalOrderNumber: orderRef,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              ...response,
            })
            clearCart()

            trackPurchase(order)

            toast.success(
              () => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: 700 }}>🎉 Payment Successful! Order Confirmed.</span>
                  <span style={{ fontSize: '12px', opacity: 0.85 }}>
                    Your transaction has been authorized and recorded.
                  </span>
                </div>
              ),
              { duration: 5000, style: { background: '#166534', color: '#FAF7F2', borderRadius: '12px' } }
            )
            navigate('/orders', {
              state: {
                newOrderId: order.id,
                orderDetails: order,
                customerPhone: address.phone || user?.phone,
              }
            })
          } catch (err) {
            logDeveloperError('Checkout.RazorpayVerification', err)
            toast.error("We couldn't confirm your payment yet. Please check your order status before trying again.")
          } finally {
            setPlacing(false)
          }
        },
        prefill: { name: address.name, contact: address.phone },
        theme: { color: '#5A1020' },
        modal: { ondismiss: () => setPlacing(false) },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      logDeveloperError('Checkout.paymentInitiation', err)
      const msg = getFriendlyErrorMessage(err, "We couldn't initiate payment right now. Please try Cash on Delivery or retry.")
      toast.error(msg)
      setPlacing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between font-sans">
        <SEOHead title="Checkout" noindex={true} />
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 select-none">
          <p className="font-serif text-lg italic text-[#5A1020] font-bold">Your wardrobe bag is empty.</p>
          <p className="text-xs text-[#211D1E]/60 mt-2 mb-6 font-sans">Add your favorite silhouettes to proceed.</p>
          <Link to="/products" className="btn-primary">Explore Collections</Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#211D1E] font-sans">
      <SEOHead title="Secure Checkout" noindex={true} />
      <Navbar />

      <div className="w-full max-w-[1320px] mx-auto px-[clamp(16px,3vw,40px)] pt-5 sm:pt-6 pb-20 sm:pb-12">
        <h1 className="font-serif text-2xl md:text-3xl text-[#5A1020] font-bold mb-3 select-none">
          Secure Checkout
        </h1>

        {!isAuthenticated && (
          <div className="bg-[#C9A45C]/10 border border-[#C9A45C]/25 rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-2.5 select-none">
            <div>
              <span className="font-bold text-xs text-[#5A1020] block">Sign in to complete your bespoke purchase</span>
              <span className="text-[10.5px] text-[#211D1E]/70 font-sans">Link this order to your account for live atelier tracking and concierge support.</span>
            </div>
            <Link
              to="/login"
              state={{ from: '/checkout' }}
              className="btn-primary !py-1.5 !px-4 text-[10px] tracking-wider uppercase font-bold"
            >
              Sign In Now
            </Link>
          </div>
        )}

        {/* Multi-step indicator bar */}
        <div className="flex items-center gap-3 mb-5 select-none">
          <button
            onClick={() => setActiveStep(1)}
            className={`font-serif text-xs tracking-wider uppercase font-bold transition-colors ${activeStep === 1 ? 'text-[#5A1020] border-b-2 border-[#5A1020] pb-1' : 'text-[#211D1E]/40'
              }`}
          >
            1. Delivery Address
          </button>
          <ChevronRight size={13} className="text-[#211D1E]/30" />
          <button
            disabled={!address.name || !address.phone || !address.line1 || !address.city || !address.pincode}
            onClick={() => setActiveStep(2)}
            className={`font-serif text-xs tracking-wider uppercase font-bold transition-colors disabled:opacity-50 ${activeStep === 2 ? 'text-[#5A1020] border-b-2 border-[#5A1020] pb-1' : 'text-[#211D1E]/40'
              }`}
          >
            2. Payment Method
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">

          {/* Left Column: Flow panels */}
          <div className="lg:col-span-8 space-y-4">

            {activeStep === 1 ? (
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-[#C9A45C]/20 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4"
              >
                <h2 className="font-serif text-lg text-[#5A1020] font-bold pb-2.5 border-b border-[#C9A45C]/15 flex items-center gap-2">
                  <Truck size={16} className="text-[#C9A45C]" /> Atelier Delivery Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[8.5px] tracking-wider uppercase text-[#C9A45C] font-bold block">Recipient Full Name</span>
                    <input name="name" value={address.name} onChange={handleChange} placeholder="Enter full name" required className="input-field" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8.5px] tracking-wider uppercase text-[#C9A45C] font-bold block">Contact Phone</span>
                    <input name="phone" value={address.phone} onChange={handleChange} placeholder="Enter mobile number" required className="input-field" />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <span className="text-[8.5px] tracking-wider uppercase text-[#C9A45C] font-bold block">Street Address</span>
                    <input name="line1" value={address.line1} onChange={handleChange} placeholder="Flat, villa or apartment, street name" required className="input-field" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8.5px] tracking-wider uppercase text-[#C9A45C] font-bold block">City</span>
                    <input name="city" value={address.city} onChange={handleChange} placeholder="Hyderabad" required className="input-field" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8.5px] tracking-wider uppercase text-[#C9A45C] font-bold block">Email Address</span>
                    <input name="email" type="email" value={address.email || ''} onChange={handleChange} placeholder="name@example.com" className="input-field" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8.5px] tracking-wider uppercase text-[#C9A45C] font-bold block">Postal Code / Pincode</span>
                    <input name="pincode" value={address.pincode} onChange={handleChange} placeholder="500033" required className="input-field" />
                  </div>
                </div>

                {/* WhatsApp Notification Callout */}
                <div className="flex items-start gap-2.5 bg-[#25D366]/8 border border-[#25D366]/25 rounded-xl p-3">
                  <MessageCircle size={18} className="text-[#25D366] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#1a7a43]">📱 WhatsApp Dispatch Updates</p>
                    <p className="text-[10.5px] text-[#211D1E]/70 mt-0.5 leading-normal font-sans">
                      A bespoke digital order receipt and tracking updates will be dispatched to your WhatsApp number.
                    </p>
                  </div>
                </div>

                <div className="pt-2 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      if (!address.name || !address.phone || !address.line1 || !address.city || !address.pincode) {
                        toast.error('Please fill in all shipping details first.')
                        return
                      }
                      setActiveStep(2)
                    }}
                    className="btn-primary"
                  >
                    Continue to Payment
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-[#C9A45C]/20 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 select-none"
              >
                <h2 className="font-serif text-lg text-[#5A1020] font-bold pb-2.5 border-b border-[#C9A45C]/15 flex items-center gap-2">
                  <CreditCard size={16} className="text-[#C9A45C]" /> Payment Method
                </h2>

                <div className="space-y-3">
                  <label className={`flex items-center gap-3 border rounded-xl p-3 sm:p-3.5 transition-all ${
                    hasCodOnlyItem
                      ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200'
                      : 'border-[#C9A45C]/20 hover:border-[#C9A45C]/50 cursor-pointer has-[input:checked]:border-[#5A1020] has-[input:checked]:bg-[#5A1020]/[0.02]'
                  }`}>
                    <input
                      type="radio"
                      name="pm"
                      disabled={hasCodOnlyItem}
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                      className="accent-[#5A1020] shrink-0"
                    />
                    <div className="flex-1">
                      <span className="font-serif font-bold text-xs sm:text-sm text-[#5A1020] block">Online Payment (Cards / UPI / Netbanking)</span>
                      <span className="text-[10px] text-[#211D1E]/60 mt-0.5 block font-sans">Pay securely via Razorpay gateway with instant dispatch.</span>
                      {hasCodOnlyItem && (
                        <p className="text-[10.5px] text-[#9B1C1C] mt-1 font-sans font-semibold">
                          Online payment isn't available for one or more items in your order. Please choose Cash on Delivery.
                        </p>
                      )}
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 border rounded-xl p-3 sm:p-3.5 transition-all ${
                    hasOnlineOnlyItem
                      ? 'opacity-60 cursor-not-allowed bg-amber-50/50 border-amber-200'
                      : 'border-[#C9A45C]/20 hover:border-[#C9A45C]/50 cursor-pointer has-[input:checked]:border-[#5A1020] has-[input:checked]:bg-[#5A1020]/[0.02]'
                  }`}>
                    <input
                      type="radio"
                      name="pm"
                      disabled={hasOnlineOnlyItem}
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-[#5A1020] shrink-0"
                    />
                    <div className="flex-1">
                      <span className="font-serif font-bold text-xs sm:text-sm text-[#5A1020] block">Cash on Delivery (COD)</span>
                      <span className="text-[10px] text-[#211D1E]/60 mt-0.5 block font-sans">Pay upon arrival of your atelier garment parcel.</span>
                      {hasOnlineOnlyItem && (
                        <p className="text-[10.5px] text-[#B45309] bg-amber-100/60 p-2 rounded-lg mt-1.5 font-sans font-medium leading-relaxed border border-amber-300/60">
                          ⚠️ Cash on Delivery isn't available for one or more items in your order. Please choose online payment.
                        </p>
                      )}
                    </div>
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#C9A45C]/15">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="btn-outline px-5 py-2.5 text-xs font-bold tracking-wider min-h-[48px]"
                  >
                    Back to Address
                  </button>
                  <button
                    type="submit"
                    disabled={placing}
                    className="btn-primary px-6 py-2.5 disabled:opacity-75 text-xs font-bold tracking-wider min-h-[48px] flex items-center justify-center gap-2.5"
                  >
                    {placing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#FAF7F2]/40 border-t-[#FAF7F2] rounded-full animate-spin shrink-0" />
                        <span>{placingStep || 'Connecting to Payment...'}</span>
                      </>
                    ) : (
                      'Authorize & Place Order'
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Delivery Timeline info */}
            <div className="border border-[#C9A45C]/20 rounded-xl p-3.5 bg-white flex gap-3 select-none">
              <Truck size={18} className="text-[#C9A45C] mt-0.5 shrink-0" />
              <div>
                <h4 className="font-serif text-xs sm:text-sm text-[#5A1020] font-bold">Atelier White-Glove Dispatch</h4>
                <p className="text-[10px] text-[#211D1E]/60 leading-normal mt-0.5 font-sans">
                  All bespoke garments are pressed, wrapped in muslin bags, and securely packaged in our signature keepsake boxes for express delivery in 3-5 business days.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Order summary box */}
          <div className="lg:col-span-4 select-none">
            <div className="bg-white border border-[#C9A45C]/20 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 sticky top-28">
              <h2 className="font-serif text-base tracking-wider text-[#5A1020] font-bold uppercase pb-2.5 border-b border-[#C9A45C]/15">
                Wardrobe Summary
              </h2>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-2">
                {items.map((item) => {
                  const itemKey = item.cartItemId || (item.variantId ? `${item.id}_v_${item.variantId}` : `${item.id}_${item.size || 'M'}`)
                  return (
                    <div key={itemKey} className="flex gap-2.5 justify-between items-center text-xs text-[#211D1E]/70 font-sans py-1 border-b border-[#C9A45C]/10 last:border-b-0">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-9 h-11 object-cover rounded-md border border-[#C9A45C]/30 shrink-0 bg-[#FAF7F2]"
                          />
                        )}
                        <div className="min-w-0">
                          <span className="font-bold truncate block max-w-[170px] text-[#211D1E]">
                            {item.name} <strong className="text-[#C9A45C] font-normal">× {item.qty}</strong>
                          </span>
                          {(item.colorName || item.sku) && (
                            <span className="text-[10px] text-[#211D1E]/60 flex items-center gap-1.5 mt-0.5">
                              {item.colorCode && (
                                <span
                                  style={{ backgroundColor: item.colorCode }}
                                  className="w-2.5 h-2.5 rounded-full inline-block border border-white shadow-xs"
                                />
                              )}
                              {item.colorName && <strong className="font-medium text-[#211D1E]/80">{item.colorName}</strong>}
                              {item.sku && <span className="font-mono text-[9px] text-[#211D1E]/50">[{item.sku}]</span>}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-serif text-[#5A1020] font-bold shrink-0">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                    </div>
                  )
                })}
              </div>

              <div className="border-t border-[#C9A45C]/15 pt-3 space-y-2 text-xs text-[#211D1E]/70 font-sans">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#211D1E]">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Atelier Delivery</span>
                  <span className="font-bold text-[#211D1E]">
                    {deliveryFee === 0 ? <span className="text-green-800 font-bold">COMPLIMENTARY</span> : `₹${deliveryFee}`}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-800 font-bold">
                    <span>Privilege Code {couponCode ? `(${couponCode})` : ''}</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="border-t border-[#C9A45C]/15 pt-2.5 flex justify-between font-serif text-sm sm:text-base font-bold text-[#5A1020]">
                  <span>Total Amount</span>
                  <span>₹{total}</span>
                </div>
              </div>

              {/* In-Checkout Coupon Code Section */}
              <div className="border-t border-[#C9A45C]/15 pt-3">
                {couponCode ? (
                  <div className="bg-green-50 border border-green-200/70 rounded-lg p-2.5 flex items-center justify-between text-xs text-green-800">
                    <span className="flex items-center gap-1 font-bold font-sans">
                      <Ticket size={13} className="text-green-700" />
                      {couponCode} (-₹{discount})
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[10px] text-red-700 font-bold uppercase underline hover:text-red-900"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-[9.5px] text-[#211D1E]/60 uppercase tracking-wider font-bold block font-sans">Have a privilege code?</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="ENTER CODE"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="input-field !py-1.5 !text-xs uppercase !rounded-lg !border-[#C9A45C]/30 bg-[#FAF7F2]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon}
                        className="btn-outline !py-1.5 !px-3 text-xs font-bold shrink-0"
                      >
                        {validatingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-1 text-[8.5px] text-[#211D1E]/50 font-semibold border-t border-[#C9A45C]/10 pt-2.5 font-sans">
                <ShieldCheck size={13} className="text-[#C9A45C]" /> Insured express courier with tamper-proof seal
              </div>
            </div>
          </div>

        </form>
      </div>

      <Footer />
    </div>
  )
}
