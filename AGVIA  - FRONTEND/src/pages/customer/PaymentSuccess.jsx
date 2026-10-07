import { useEffect, useState } from 'react'
import { useSearchParams, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, ShoppingBag, ArrowRight, Package, Crown, Truck, MapPin, CreditCard, Banknote } from 'lucide-react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { orderService } from '../../services/orderService'
import ReliableImage from '../../components/common/ReliableImage'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const location = useLocation()

  const rawOrderId = searchParams.get('orderId') || searchParams.get('id') || location.state?.orderNumber || location.state?.newOrderId || 'AGV-' + Math.floor(100000 + Math.random() * 900000)
  const orderId = String(rawOrderId).replace(/^ORD-/, '')

  const initialPaymentMethod = searchParams.get('paymentMethod') || location.state?.orderDetails?.paymentMethod || 'RAZORPAY'
  const isCod = String(initialPaymentMethod).toUpperCase() === 'COD'

  const [order, setOrder] = useState(location.state?.orderDetails || null)
  const [loading, setLoading] = useState(!location.state?.orderDetails)

  useEffect(() => {
    window.scrollTo(0, 0)

    if (!order && rawOrderId && !rawOrderId.startsWith('AGV-')) {
      orderService.getOrderById(rawOrderId)
        .then((data) => setOrder(data))
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [order, rawOrderId])

  const paymentMethodLabel = isCod ? 'Cash on Delivery (COD)' : 'Razorpay Secure Online'
  const paymentStatusLabel = isCod ? 'Payable upon Doorstep Delivery' : 'Authorized & Paid'
  const finalTotal = order?.total || order?.finalAmount || location.state?.orderDetails?.total || null

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#211D1E] font-body flex flex-col justify-between selection:bg-[#C9A45C]/30">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10 md:py-14 w-full">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3.5 mb-8"
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-md border-2 ${
            isCod 
              ? 'bg-amber-50 text-amber-700 border-amber-300' 
              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}>
            {isCod ? <Banknote size={42} /> : <CheckCircle2 size={44} />}
          </div>

          <span className="text-[10px] tracking-[0.3em] font-bold text-[#C9A45C] uppercase block">
            {isCod ? 'Atelier Order Confirmed · Cash on Delivery' : 'Payment & Couture Order Confirmed'}
          </span>

          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#5A1020]">
            {isCod ? 'Order Placed Successfully!' : 'Thank You for Your Order!'}
          </h1>

          <p className="text-sm text-[#211D1E]/75 max-w-lg mx-auto leading-relaxed">
            {isCod ? (
              <>
                Your order <strong className="text-[#5A1020] font-mono">#{rawOrderId}</strong> has been registered in our atelier system. For this product, only <strong>Cash on Delivery (COD)</strong> is applicable. Our delivery partner will collect payment upon parcel arrival.
              </>
            ) : (
              <>
                Your transaction has been securely authorized. Order <strong className="text-[#5A1020] font-mono">#{rawOrderId}</strong> has been transmitted to our master atelier karigars for bespoke finishing and heirloom packaging.
              </>
            )}
          </p>
        </motion.div>

        {/* Order Confirmation Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="bg-white border border-[#C9A45C]/25 rounded-3xl p-5 md:p-6 shadow-sm mb-8 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#C9A45C]/15">
            <div>
              <span className="text-[10px] text-[#C9A45C] font-bold uppercase tracking-wider block">Order Reference</span>
              <span className="font-mono font-bold text-sm text-[#5A1020]">#{rawOrderId}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full border ${
                isCod
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}>
                {isCod ? '💵 COD Applicable' : '⚡ Online Paid'}
              </span>
            </div>
          </div>

          {/* Key Facts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#C9A45C]/15">
              <span className="text-[10px] text-[#211D1E]/60 uppercase font-semibold block mb-0.5">Payment Method</span>
              <span className="font-bold text-[#5A1020] flex items-center gap-1.5">
                {isCod ? <Banknote size={14} className="text-[#C9A45C]" /> : <CreditCard size={14} className="text-[#C9A45C]" />}
                {paymentMethodLabel}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#C9A45C]/15">
              <span className="text-[10px] text-[#211D1E]/60 uppercase font-semibold block mb-0.5">Payment Status</span>
              <span className="font-bold text-emerald-800 flex items-center gap-1">
                ✓ {paymentStatusLabel}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#C9A45C]/15">
              <span className="text-[10px] text-[#211D1E]/60 uppercase font-semibold block mb-0.5">Estimated Dispatch</span>
              <span className="font-bold text-[#211D1E] flex items-center gap-1.5">
                <Truck size={14} className="text-[#C9A45C]" /> 3–5 Business Days
              </span>
            </div>
          </div>

          {/* Delivery Address if present */}
          {(order?.address?.line1 || location.state?.orderDetails?.address?.line1) && (
            <div className="p-3 rounded-2xl bg-[#FAF7F2]/80 border border-[#C9A45C]/15 text-xs flex items-start gap-2.5">
              <MapPin size={16} className="text-[#C9A45C] shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-[#211D1E]/60 uppercase font-semibold block">Shipping Destination</span>
                <span className="text-[#211D1E] font-medium">
                  {order?.address?.line1 || location.state?.orderDetails?.address?.line1}
                </span>
                {(order?.address?.phone || location.state?.customerPhone) && (
                  <span className="text-[11px] text-[#211D1E]/60 block mt-0.5">
                    Phone: {order?.address?.phone || location.state?.customerPhone}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Items Preview if available */}
          {Array.isArray(order?.items) && order.items.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#C9A45C] block mb-2">Wardrobe Pieces in this Order</span>
              <div className="space-y-2">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs p-2 rounded-xl bg-[#FAF7F2]/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {it.image && (
                        <div className="w-10 h-12 rounded-lg overflow-hidden shrink-0 bg-[#F2ECE4]">
                          <ReliableImage src={it.image} alt={it.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold text-[#211D1E] block truncate">{it.name}</span>
                        <span className="text-[10.5px] text-[#211D1E]/60">Qty: {it.qty}</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-[#5A1020] shrink-0">₹{(it.price * it.qty).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {finalTotal && (
            <div className="pt-2 flex justify-between items-baseline border-t border-[#C9A45C]/15">
              <span className="font-serif text-sm font-bold text-[#5A1020]">Total Amount {isCod ? '(Payable on Delivery)' : '(Paid)'}</span>
              <span className="font-serif text-xl font-bold text-[#5A1020]">₹{Number(finalTotal).toLocaleString('en-IN')}</span>
            </div>
          )}
        </motion.div>

        {/* Atelier Circle VIP Membership Upsell */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="bg-gradient-to-r from-[#2E050E] via-[#5A1020] to-[#2E050E] text-white rounded-3xl p-6 md:p-7 border border-[#C9A45C]/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C9A45C]/20 border border-[#C9A45C]/40 flex items-center justify-center shrink-0">
              <Crown size={24} className="text-[#C9A45C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[#C9A45C] font-bold tracking-widest uppercase">AGVIA Atelier Circle</span>
                <span className="text-[8px] bg-[#C9A45C]/20 text-[#C9A45C] px-2 py-0.5 rounded-full font-bold">15% OFF NEXT ORDER</span>
              </div>
              <h4 className="font-serif text-lg font-bold text-white mt-0.5">
                Join Atelier Circle VIP for ₹499/yr
              </h4>
              <p className="text-xs text-white/70">
                Unlock complimentary made-to-measure fittings, priority bridal dispatch, and bespoke styling consultations.
              </p>
            </div>
          </div>

          <Link
            to="/subscription"
            className="shrink-0 px-6 py-3 rounded-full bg-gradient-to-r from-[#C9A45C] to-[#E8C7C3] text-[#2E050E] font-bold text-xs tracking-wider uppercase shadow hover:scale-105 transition-all font-sans"
          >
            Explore VIP Circle
          </Link>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/orders"
            className="py-3.5 px-5 rounded-2xl bg-[#5A1020] hover:bg-[#400B16] text-[#FAF7F2] text-xs font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2 shadow-md transition-all font-sans"
          >
            <ShoppingBag size={15} /> Track in Orders
          </Link>
          <Link
            to={`/track-order?id=${rawOrderId}`}
            className="py-3.5 px-5 rounded-2xl border border-[#C9A45C]/40 hover:bg-[#C9A45C]/10 text-[#5A1020] text-xs font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2 transition-all font-sans"
          >
            <Package size={15} /> Live Order Status
          </Link>
          <Link
            to="/products"
            className="py-3.5 px-5 rounded-2xl border border-gray-200 hover:border-[#C9A45C]/40 text-[#211D1E]/80 hover:text-[#5A1020] text-xs font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2 transition-all font-sans"
          >
            Continue Shopping <ArrowRight size={14} />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
