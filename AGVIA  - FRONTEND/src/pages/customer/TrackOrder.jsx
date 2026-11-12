import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Compass, ShieldCheck, Clock, MapPin, Package,
  CheckCircle2, AlertCircle, RefreshCw, MessageSquare, ExternalLink,
  ChevronRight, Truck, Sparkles, ChefHat, Box, ArrowRight, Printer,
  Lock, EyeOff, FileText, ArrowLeft
} from 'lucide-react'
import QRCode from 'qrcode'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { orderService } from '../../services/orderService'
import { BUSINESS } from '../../constants/business'
import { safeOpenWindow } from '../../utils/windowManager'
import toast from 'react-hot-toast'

// Steps mapping
const ORDER_STEPS = [
  { id: 'CONFIRMED', title: 'Order Confirmed', desc: 'Received & transmitted to the atelier', icon: CheckCircle2 },
  { id: 'PROCESSING', title: 'Atelier Tailoring & Quality Inspection', desc: 'Handcrafted with meticulous precision', icon: ChefHat },
  { id: 'PACKAGED', title: 'Heirloom Keepsake Packaging', desc: 'Sealed in acid-free tissue inside luxury AGVIA box', icon: Box },
  { id: 'SHIPPED', title: 'Dispatched with Insured Courier', desc: 'In transit with premium express delivery partner', icon: Truck },
  { id: 'DELIVERED', title: 'Successfully Delivered', desc: 'Enjoy your timeless AGVIA couture ensemble!', icon: Sparkles }
]

function getStepIndex(status = '') {
  switch (status.toUpperCase()) {
    case 'PENDING':
    case 'CONFIRMED':
      return 0
    case 'PROCESSING':
    case 'PREPARING':
      return 1
    case 'PACKAGED':
      return 2
    case 'SHIPPED':
    case 'OUT_FOR_DELIVERY':
      return 3
    case 'DELIVERED':
      return 4
    case 'CANCELLED':
      return -1
    default:
      return 0
  }
}

export default function TrackOrder() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialToken = searchParams.get('token') || ''
  const initialOrderParam = searchParams.get('order') || ''
  const initialQuery = initialToken || initialOrderParam

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [trackingOrder, setTrackingOrder] = useState(null)
  const [isPublicView, setIsPublicView] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const pollingRef = useRef(null)
  const navigate = useNavigate()

  // Fetch recent user orders if authenticated for quick selection
  useEffect(() => {
    if (user?.email) {
      orderService.getMyOrders()
        .then(orders => {
          if (Array.isArray(orders)) {
            setRecentOrders(orders.slice(0, 3))
          }
        })
        .catch(() => {})
    }
  }, [user])

  // Track order handler
  const fetchOrderStatus = async (identifier, isBackground = false) => {
    if (!identifier || !identifier.trim()) return
    const cleanId = identifier.trim()

    if (!isBackground) {
      setLoading(true)
      setErrorMsg('')
    } else {
      setIsRefreshing(true)
    }

    try {
      // 1. If it looks like a 64-character hex tracking token or URL has token param:
      const hasTokenParam = !!searchParams.get('token')
      const isHexToken = /^[a-f0-9]{32,64}$/i.test(cleanId)

      if (hasTokenParam || isHexToken) {
        const publicData = await orderService.getPublicTracking(cleanId)
        setTrackingOrder(publicData)
        setIsPublicView(true)
        setErrorMsg('')
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }))
        if (!isBackground) {
          setSearchParams({ token: cleanId })
        }
        generateQr(cleanId, true)
        return
      }

      // 2. Otherwise try full authenticated order track
      const data = await orderService.trackOrder(cleanId)
      setTrackingOrder(data)
      setIsPublicView(false)
      setErrorMsg('')
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }))
      if (!isBackground) {
        setSearchParams({ order: cleanId })
      }
      generateQr(data.trackingToken || cleanId, !!data.trackingToken)
    } catch (err) {
      console.warn('Track order lookup failed:', err)
      if (!isBackground) {
        setTrackingOrder(null)
        const msg = err?.response?.data?.message || `No active order found with reference "${cleanId}". Please verify your order number.`
        setErrorMsg(msg)
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const generateQr = (tokenOrRef, isToken) => {
    try {
      const siteUrl = typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://agvia.onrender.com'
      const paramName = isToken ? 'token' : 'order'
      const targetUrl = `${siteUrl}/track-order?${paramName}=${encodeURIComponent(tokenOrRef)}`

      QRCode.toDataURL(targetUrl, {
        width: 180,
        margin: 1,
        color: { dark: '#5A1020', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      }).then(url => setQrCodeUrl(url)).catch(() => {})
    } catch (_) {}
  }

  // Auto-track if URL param is provided on mount
  useEffect(() => {
    if (initialToken) {
      fetchOrderStatus(initialToken)
    } else if (initialOrderParam) {
      fetchOrderStatus(initialOrderParam)
    }
  }, [initialToken, initialOrderParam])

  // Real-time polling
  useEffect(() => {
    if (!trackingOrder) return
    const targetId = trackingOrder.trackingToken || trackingOrder.orderNumber || trackingOrder.id
    if (!targetId) return

    pollingRef.current = setInterval(() => {
      fetchOrderStatus(targetId, true)
    }, 8000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [trackingOrder?.trackingToken, trackingOrder?.orderNumber, trackingOrder?.id])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    fetchOrderStatus(searchQuery)
  }

  const handleProtectedAction = (actionName) => {
    if (!isAuthenticated) {
      toast.error(`Please sign in with your AGVIA account to ${actionName}.`, {
        icon: '🔒',
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
      const redirectUrl = `/login?from=${encodeURIComponent(window.location.pathname + window.location.search)}`
      navigate(redirectUrl)
      return
    }

    if (actionName === 'view complete order') {
      navigate('/orders')
    } else if (actionName === 'download invoice') {
      toast('Redirecting to your orders to download authentic invoice...', { icon: '📄' })
      navigate('/orders')
    } else {
      navigate('/orders')
    }
  }

  const handleWhatsAppInquiry = () => {
    if (!trackingOrder) return
    const orderNum = trackingOrder.maskedOrderNumber || trackingOrder.orderNumber || trackingOrder.id
    const text = encodeURIComponent(
      `Hello AGVIA Concierge! 👋\nI am tracking my atelier order *#${orderNum}* (Status: ${trackingOrder.status}). Could you please share an update on the courier dispatch schedule?\n\nThank you!`
    )
    const storeRaw = (BUSINESS?.contact?.whatsappRaw || '919032306961').replace(/\D/g, '')
    safeOpenWindow(`https://api.whatsapp.com/send?phone=${storeRaw}&text=${text}`, 'agvia_tracking_support', 'noopener,noreferrer')
  }

  const currentStep = trackingOrder ? getStepIndex(trackingOrder.status) : 0
  const isCancelled = trackingOrder?.status?.toUpperCase() === 'CANCELLED'

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#211D1E] font-body flex flex-col justify-between selection:bg-[#C9A45C]/30">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #agvia-print-slip, #agvia-print-slip * { visibility: visible !important; }
          #agvia-print-slip {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            margin: 0 !important;
            padding: 10mm 15mm !important;
            background: #FFFFFF !important;
            color: #1A0B10 !important;
            z-index: 9999999 !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        {/* Title Header */}
        <div className="text-center space-y-3 mb-8 print:hidden">
          <div className="w-14 h-14 rounded-2xl bg-[#5A1020]/10 text-[#5A1020] border border-[#C9A45C]/30 flex items-center justify-center mx-auto shadow-xs">
            <Compass size={28} />
          </div>
          <span className="text-[10px] tracking-[0.3em] font-bold text-[#C9A45C] uppercase block">
            Real-Time Atelier Monitoring & Courier Tracking
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#5A1020]">
            Track Your Atelier Order
          </h1>
          <p className="text-xs text-[#211D1E]/70 max-w-md mx-auto leading-relaxed">
            Enter your order reference code or scan your parcel QR token to inspect live atelier preparation and insured transit.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="max-w-xl mx-auto mb-8 print:hidden">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                placeholder="ENTER ORDER NO OR QR TRACKING TOKEN"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#C9A45C]/40 rounded-2xl text-xs font-mono font-bold tracking-wider placeholder:font-sans placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A1020]/20 focus:border-[#5A1020] shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="py-3.5 px-6 bg-[#5A1020] hover:bg-[#72152b] text-[#FAF7F2] rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Track Status</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Recent Orders Pill Bar */}
          {recentOrders.length > 0 && !trackingOrder && (
            <div className="mt-4 flex flex-wrap items-center gap-2 justify-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Your Recent Orders:</span>
              {recentOrders.map((ro) => (
                <button
                  key={ro.id}
                  onClick={() => {
                    const ref = ro.trackingToken || ro.orderNumber || ro.id
                    setSearchQuery(ref)
                    fetchOrderStatus(ref)
                  }}
                  className="px-3 py-1 bg-white hover:bg-[#FAF6EE] text-[#5A1020] border border-[#C9A45C]/30 rounded-full text-[10.5px] font-mono font-bold transition-all shadow-2xs"
                >
                  #{ro.orderNumber || ro.id}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error Display */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-3 mb-8 max-w-xl mx-auto shadow-xs">
            <AlertCircle size={20} className="text-rose-600 shrink-0" />
            <div className="flex-1">
              <span className="font-bold block">Lookup Notice</span>
              <span className="text-[11px] leading-relaxed">{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Tracking Card */}
        {trackingOrder && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            id="agvia-print-slip"
            className="bg-white border border-[#C9A45C]/30 rounded-3xl shadow-xl overflow-hidden relative"
          >
            {/* Luxury Header Banner */}
            <div className="bg-[#5A1020] text-[#FAF7F2] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#C9A45C]/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9.5px] tracking-widest uppercase bg-[#C9A45C]/20 text-[#C9A45C] px-2.5 py-0.5 rounded-full font-bold border border-[#C9A45C]/40">
                    {isPublicView ? 'Verified Public Consignment' : 'Atelier Client Order'}
                  </span>
                  {isRefreshing && (
                    <span className="text-[10px] text-[#C9A45C] flex items-center gap-1">
                      <RefreshCw size={10} className="animate-spin" /> Live Syncing...
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-2xl font-bold tracking-wide">
                  Order {trackingOrder.maskedOrderNumber || `#${trackingOrder.orderNumber || trackingOrder.id}`}
                </h3>
                <p className="text-[11px] text-[#FAF7F2]/70 font-mono">
                  Placed on {trackingOrder.createdAt ? new Date(trackingOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                  {lastUpdated && ` • Updated at ${lastUpdated} IST`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-[#C9A45C] block font-bold">Consignment State</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isCancelled
                      ? 'bg-red-500/20 text-red-200 border border-red-500/40'
                      : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                  }`}>
                    {trackingOrder.status}
                  </span>
                </div>
                {qrCodeUrl && (
                  <div className="p-1 bg-white rounded-xl shadow-xs">
                    <img src={qrCodeUrl} alt="Order QR" className="w-14 h-14" />
                  </div>
                )}
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="p-6 md:p-8 bg-[#FAF7F2]/50 border-b border-[#C9A45C]/20">
              <div className="text-center mb-6">
                <span className="text-[10px] tracking-widest font-bold uppercase text-[#C9A45C]">Step-by-Step Atelier & Logistics Journey</span>
              </div>

              {isCancelled ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-3">
                  <AlertCircle size={20} className="text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Consignment Cancelled</span>
                    <span className="text-[11px]">This order has been cancelled. If any payment was made, refunds are credited within 3–5 working days.</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                  {ORDER_STEPS.map((step, idx) => {
                    const isDone = currentStep >= idx
                    const isCurrent = currentStep === idx
                    const Icon = step.icon

                    return (
                      <div
                        key={step.id}
                        className={`flex md:flex-col items-center gap-3 text-left md:text-center p-3 rounded-2xl transition-all ${
                          isCurrent
                            ? 'bg-[#FAF6EE] border border-[#C9A45C] shadow-sm'
                            : isDone
                            ? 'bg-emerald-50/60 border border-emerald-100'
                            : 'opacity-40'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
                            isDone ? 'bg-[#5A1020] text-white' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className={`text-xs font-bold leading-tight ${isDone ? 'text-[#5A1020]' : 'text-gray-500'}`}>
                            {step.title}
                          </p>
                          <p className="text-[9.5px] text-gray-500 mt-0.5 leading-snug hidden md:block">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Public Shielded View vs Authenticated Order View */}
            {isPublicView ? (
              <div className="p-6 md:p-8 space-y-6">
                {/* Privacy Safeguard Alert */}
                <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-xs text-[#382820]">
                  <EyeOff size={18} className="text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-amber-900 block">Privacy Shield Active</span>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      You are viewing the authenticated public tracking portal via QR security token. Recipient names, full street addresses, and payment secrets are shielded.
                    </p>
                  </div>
                </div>

                {/* Logistics Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-[#FAF7F2] border border-[#C9A45C]/20 rounded-2xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Destination City</span>
                    <p className="font-bold text-[#5A1020] flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#C9A45C]" />
                      {trackingOrder.destinationCity}, {trackingOrder.destinationState}
                    </p>
                  </div>

                  <div className="p-4 bg-[#FAF7F2] border border-[#C9A45C]/20 rounded-2xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Estimated Transit Window</span>
                    <p className="font-bold text-[#5A1020] flex items-center gap-1.5">
                      <Clock size={14} className="text-[#C9A45C]" />
                      {trackingOrder.estimatedDelivery || '2–4 Business Days'}
                    </p>
                  </div>

                  <div className="p-4 bg-[#FAF7F2] border border-[#C9A45C]/20 rounded-2xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Courier Partner</span>
                    <p className="font-bold text-[#5A1020] flex items-center gap-1.5">
                      <Truck size={14} className="text-[#C9A45C]" />
                      {trackingOrder.carrier || 'AGVIA Insured Express Logistics'}
                    </p>
                  </div>
                </div>

                {/* Protected Actions Call-to-Action Bar */}
                <div className="p-5 bg-white border border-[#C9A45C]/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <h5 className="font-serif font-bold text-[#5A1020] text-sm">Need complete invoice or address modification?</h5>
                    <p className="text-[11px] text-gray-500">Sign in with your verified patron credentials to manage this order.</p>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleProtectedAction('view complete order')}
                      className="flex-1 sm:flex-initial py-2.5 px-4 bg-[#5A1020] hover:bg-[#72152b] text-[#FAF7F2] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                    >
                      <Lock size={12} /> Sign In to Unlock
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProtectedAction('download invoice')}
                      className="py-2.5 px-4 bg-[#FAF6EE] hover:bg-[#F5E6C8] text-[#5A1020] border border-[#C9A45C]/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <FileText size={12} /> Invoice PDF
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Authenticated Complete Order View */
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Items */}
                <div className="space-y-4">
                  <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#5A1020] border-b border-[#C9A45C]/20 pb-2">
                    Consignment Items ({trackingOrder.items?.length || 0})
                  </h4>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {trackingOrder.items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-[#FAF7F2] rounded-xl border border-[#C9A45C]/20 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover border border-[#C9A45C]/30 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#5A1020]/10 text-[#5A1020] flex items-center justify-center text-xs font-serif font-bold shrink-0">
                              AGVIA
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-[#382820]">{item.name}</p>
                            <p className="text-[10px] text-gray-500">Qty: {item.quantity || item.qty} × ₹{item.price}</p>
                          </div>
                        </div>
                        <span className="font-bold text-[#5A1020]">
                          ₹{item.subtotal || item.price * (item.quantity || 1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Logistics & Payment */}
                <div className="space-y-4">
                  <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#5A1020] border-b border-[#C9A45C]/20 pb-2">
                    Delivery Address & Payment Details
                  </h4>

                  <div className="space-y-3 text-xs bg-[#FAF7F2] p-4 rounded-2xl border border-[#C9A45C]/20">
                    <div className="flex items-start gap-2.5">
                      <MapPin size={16} className="text-[#5A1020] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[#382820] block text-xs">Shipping Address:</span>
                        <span className="text-[11px] leading-relaxed text-gray-600">
                          {trackingOrder.shippingAddress || 'Hyderabad Area Delivery'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#C9A45C]/20">
                      <span className="text-[11px] text-gray-500">Payment Mode:</span>
                      <strong className="text-[#382820] font-mono text-[11px]">
                        {trackingOrder.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Prepaid (Razorpay)'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#C9A45C]/20 font-bold text-sm text-[#5A1020]">
                      <span>Grand Total:</span>
                      <span>₹{trackingOrder.total || trackingOrder.finalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions Footer */}
            <div className="p-4 bg-[#FAF7F2] border-t border-[#C9A45C]/30 flex flex-wrap gap-2 items-center justify-between print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-4 bg-white hover:bg-[#FAF6EE] text-[#5A1020] border border-[#C9A45C]/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
              >
                <Printer size={14} /> Print Slip
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleWhatsAppInquiry}
                  className="py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                >
                  <MessageSquare size={14} /> WhatsApp Support
                </button>

                {isAuthenticated && (
                  <Link
                    to="/orders"
                    className="py-2.5 px-4 bg-[#5A1020] hover:bg-[#72152b] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    My Orders <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  )
}
