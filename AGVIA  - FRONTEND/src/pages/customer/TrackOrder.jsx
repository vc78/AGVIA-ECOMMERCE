import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Compass, ShieldCheck, Clock, MapPin, Package,
  CheckCircle2, AlertCircle, RefreshCw, MessageSquare, ExternalLink,
  ChevronRight, Truck, Sparkles, ChefHat, Box, ArrowRight, Printer
} from 'lucide-react'
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
  const initialOrderParam = searchParams.get('order') || ''
  
  const [orderId, setOrderId] = useState(initialOrderParam)
  const [trackingOrder, setTrackingOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])

  const { user } = useSelector((state) => state.auth)
  const pollingRef = useRef(null)

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
      const data = await orderService.trackOrder(cleanId)
      setTrackingOrder(data)
      setErrorMsg('')
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }))
      if (!isBackground) {
        setSearchParams({ order: cleanId })
      }
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

  // Auto-track if URL param is provided on mount
  useEffect(() => {
    if (initialOrderParam) {
      fetchOrderStatus(initialOrderParam)
    }
  }, [initialOrderParam])

  // Real-time synchronization: Poll every 6 seconds AND listen for live broadcast notifications
  useEffect(() => {
    if (!trackingOrder?.orderNumber && !trackingOrder?.id) return

    const targetId = trackingOrder.orderNumber || trackingOrder.id

    // 1. Polling fallback every 6 seconds
    pollingRef.current = setInterval(() => {
      fetchOrderStatus(targetId, true)
    }, 6000)

    // 2. Instant real-time broadcast channel listener for inter-tab status updates
    let channel = null
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('agvia_notifications_v1')
        channel.onmessage = (event) => {
          const payload = event?.data
          if (
            payload?.type === 'ORDER_STATUS_CHANGED' ||
            payload?.type === 'ORDER_CANCELLED' ||
            payload?.data?.orderNumber === trackingOrder.orderNumber ||
            String(payload?.data?.orderId) === String(trackingOrder.backendId)
          ) {
            fetchOrderStatus(targetId, true)
          }
        }
      }
    } catch (_) {}

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (channel) channel.close()
    }
  }, [trackingOrder?.orderNumber, trackingOrder?.id, trackingOrder?.backendId])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!orderId.trim()) return
    fetchOrderStatus(orderId)
  }

  const currentStep = trackingOrder ? getStepIndex(trackingOrder.status) : 0
  const isCancelled = trackingOrder?.status?.toUpperCase() === 'CANCELLED'

  const handleWhatsAppInquiry = () => {
    if (!trackingOrder) return
    const orderNum = trackingOrder.orderNumber || trackingOrder.id
    const text = encodeURIComponent(
      `Hello AGVIA Concierge! 👋\nI am tracking my atelier order *#${orderNum}* (Status: ${trackingOrder.status}). Could you please share an update on the courier dispatch schedule?\n\nThank you!`
    )
    const storeRaw = (BUSINESS?.contact?.whatsappRaw || '919032306961').replace(/\D/g, '')
    safeOpenWindow(`https://api.whatsapp.com/send?phone=${storeRaw}&text=${text}`, 'agvia_tracking_support', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#211D1E] font-body flex flex-col justify-between selection:bg-[#C9A45C]/30">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
        {/* Title Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#5A1020]/10 text-[#5A1020] border border-[#C9A45C]/30 flex items-center justify-center mx-auto shadow-sm">
            <Compass size={32} />
          </div>
          <span className="text-[10px] tracking-[0.3em] font-bold text-[#C9A45C] uppercase block">
            Real-Time Atelier Monitoring
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#5A1020]">
            Track Your Atelier Order
          </h1>
          <p className="text-xs text-[#211D1E]/70 max-w-md mx-auto leading-relaxed">
            Enter your order reference code (e.g. <span className="font-mono font-bold text-[#5A1020]">AGV-2026...</span>) to view live handcraft preparation and express courier status.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="max-w-xl mx-auto mb-10">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                placeholder="ENTER ORDER NO (e.g. AGV-2026... or #101)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#C9A45C]/30 rounded-2xl text-xs font-mono uppercase tracking-wider text-[#211D1E] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A1020]/20 focus:border-[#5A1020] shadow-sm transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3.5 bg-[#8B0000] hover:bg-[#700000] text-white font-bold text-xs rounded-2xl tracking-widest uppercase transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search size={14} /> Track Now
                </>
              )}
            </button>
          </form>

          {/* Quick Recent Orders Chips */}
          {recentOrders.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-gray-500">
              <span className="font-semibold text-gray-600">Your recent orders:</span>
              {recentOrders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setOrderId(o.orderNumber || o.id)
                    fetchOrderStatus(o.orderNumber || o.id)
                  }}
                  className="px-2.5 py-1 bg-white border border-gray-200 hover:border-[#8B0000] rounded-lg text-xs font-mono font-medium text-[#8B0000] hover:bg-[#FAF6EE] transition-all shadow-xs"
                >
                  #{o.orderNumber || o.id}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error Message Alert */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center gap-3 text-xs shadow-sm"
          >
            <AlertCircle size={18} className="shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="font-semibold">Order Not Found</p>
              <p className="text-[11px] text-red-700/80">{errorMsg}</p>
            </div>
          </motion.div>
        )}

        {/* Live Tracking Card */}
        {trackingOrder && (
          <>
            <style>{`
              @media print {
                body * { visibility: hidden !important; }
                #track-order-canvas, #track-order-canvas * { visibility: visible !important; }
                #track-order-canvas {
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100vw !important;
                  margin: 0 !important;
                  padding: 8mm 10mm !important;
                  background: #FFFFFF !important;
                  color: #000000 !important;
                  z-index: 9999999 !important;
                  border: none !important;
                  box-shadow: none !important;
                }
              }
            `}</style>
            <motion.div
              id="track-order-canvas"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-[#B8860B]/20 rounded-3xl shadow-xl overflow-hidden mb-12"
            >
              {/* Header Status Bar */}
              <div className="bg-gradient-to-r from-[#FAF6EE] via-white to-[#FAF6EE] border-b border-[#B8860B]/15 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="text-xs font-bold text-[#8B0000] font-mono">
                      #{trackingOrder.orderNumber || trackingOrder.id}
                    </span>
                    <span
                      className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        isCancelled
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : trackingOrder.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-[#8B0000] border-[#B8860B]/30'
                      }`}
                    >
                      {trackingOrder.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Placed on <strong>{trackingOrder.date || 'Today'}</strong> by <strong>{trackingOrder.customer}</strong>
                  </p>
                </div>

                {/* Real-Time Sync Indicator & Action Buttons */}
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Real-Time Sync Active</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2 text-[#5A1020] hover:text-white hover:bg-[#5A1020] rounded-xl border border-[#C9A45C]/40 transition-all flex items-center gap-1.5 text-xs font-semibold print:hidden"
                    title="Print Consignment Tracking Slip"
                  >
                    <Printer size={14} />
                    <span className="hidden sm:inline">Print Slip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fetchOrderStatus(trackingOrder.orderNumber || trackingOrder.id, true)}
                    disabled={isRefreshing}
                    className="p-2 text-gray-500 hover:text-[#8B0000] hover:bg-[#FAF6EE] rounded-xl border border-gray-200 transition-all print:hidden"
                    title="Refresh now"
                  >
                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

            {/* Stepper Visual Pipeline */}
            <div className="p-6 md:p-8 bg-white border-b border-[#B8860B]/10">
              <h3 className="font-display text-sm font-bold text-[#3A2D23] mb-6 flex items-center justify-between">
                <span>Preparation & Delivery Milestones</span>
                {lastUpdated && (
                  <span className="text-[10px] font-normal text-gray-400 font-sans">
                    Synced at {lastUpdated}
                  </span>
                )}
              </h3>

              {isCancelled ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-3">
                  <AlertCircle size={20} className="text-red-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Order Cancelled</span>
                    <span className="text-[11px]">This order has been cancelled. If any online payment was deducted, refunds are processed within 3-5 business days.</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                  {ORDER_STEPS.map((step, idx) => {
                    const isDone = currentStep >= idx
                    const isCurrent = currentStep === idx
                    const Icon = step.icon

                    return (
                      <div
                        key={step.id}
                        className={`flex md:flex-col items-center gap-3 text-left md:text-center p-3 rounded-2xl transition-all ${
                          isCurrent
                            ? 'bg-[#FAF6EE] border border-[#B8860B]/40 shadow-xs'
                            : isDone
                            ? 'bg-emerald-50/50 border border-emerald-100'
                            : 'opacity-40'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-colors ${
                            isDone
                              ? 'bg-[#8B0000] text-white'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <p
                            className={`text-xs font-bold leading-tight ${
                              isDone ? 'text-[#8B0000]' : 'text-gray-500'
                            }`}
                          >
                            {step.title}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1 leading-normal hidden md:block">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Order Details & Summary */}
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Items */}
              <div className="space-y-4">
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#8B0000] border-b border-[#B8860B]/10 pb-2">
                  Items in This Consignment ({trackingOrder.items?.length || 0})
                </h4>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {trackingOrder.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-[#FAF6EE]/50 rounded-xl border border-[#B8860B]/10 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName || item.name}
                            className="w-10 h-10 rounded-lg object-cover border border-[#C9A45C]/30 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#5A1020]/10 text-[#5A1020] flex items-center justify-center text-xs font-serif font-bold shrink-0">
                            AGVIA
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-[#3A2D23]">{item.productName || item.name}</p>
                          <p className="text-[10px] text-gray-500">Qty: {item.quantity || item.qty} × ₹{item.price}</p>
                        </div>
                      </div>
                      <span className="font-bold text-[#8B0000]">
                        ₹{item.subtotal || item.price * (item.quantity || 1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Logistics & Summary */}
              <div className="space-y-4">
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#8B0000] border-b border-[#B8860B]/10 pb-2">
                  Delivery & Payment Logistics
                </h4>

                <div className="space-y-3 text-xs text-gray-600 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="text-[#8B0000] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#3A2D23] block text-xs">Delivery Address:</span>
                      <span className="text-[11px] leading-relaxed">
                        {trackingOrder.shippingAddress || 'Hyderabad Area Delivery'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2 border-t border-gray-200/60">
                    <Clock size={16} className="text-[#B8860B] shrink-0" />
                    <span className="text-[11px]">
                      Expected Delivery: <strong>2–4 Business Days</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/60">
                    <span className="text-[11px]">Payment Mode:</span>
                    <strong className="text-[#3A2D23] font-mono text-[11px]">
                      {trackingOrder.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Prepaid (Razorpay)'}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 font-bold text-sm text-[#8B0000]">
                    <span>Total Amount:</span>
                    <span>₹{trackingOrder.total || trackingOrder.finalAmount}</span>
                  </div>
                </div>

                {/* WhatsApp & Print Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 print:hidden">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="py-3 px-4 bg-white hover:bg-[#FAF6EE] text-[#5A1020] border border-[#C9A45C]/50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
                  >
                    <Printer size={14} /> Print Slip
                  </button>
                  <button
                    type="button"
                    onClick={handleWhatsAppInquiry}
                    className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                  >
                    <MessageSquare size={14} /> Ask Status on WhatsApp
                  </button>
                  <Link
                    to="/orders"
                    className="py-3 px-4 bg-[#FAF6EE] hover:bg-[#F5E6C8] text-[#8B0000] border border-[#B8860B]/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    Orders <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
