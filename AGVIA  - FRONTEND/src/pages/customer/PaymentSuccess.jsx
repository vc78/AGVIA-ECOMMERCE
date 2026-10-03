import { useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, ShoppingBag, ArrowRight, Package, Crown } from 'lucide-react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId') || searchParams.get('id') || 'AGV-' + Math.floor(100000 + Math.random() * 900000)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#211D1E] font-body flex flex-col justify-between selection:bg-[#C9A45C]/30">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-14 w-full">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 mb-10"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 size={44} />
          </div>
          <span className="text-[10px] tracking-[0.3em] font-bold text-[#C9A45C] uppercase block">
            Payment & Couture Order Confirmed
          </span>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#5A1020]">
            Thank You for Your Order!
          </h1>
          <p className="text-sm text-[#211D1E]/70 max-w-lg mx-auto leading-relaxed">
            Your transaction has been securely authorized. Order <strong className="text-[#5A1020] font-mono">#{orderId}</strong> has been transmitted to our master atelier karigars for bespoke finishing and heirloom packaging.
          </p>
        </motion.div>

        {/* Atelier Circle VIP Membership Upsell */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="bg-gradient-to-r from-[#2E050E] via-[#5A1020] to-[#2E050E] text-white rounded-3xl p-6 md:p-7 border border-[#C9A45C]/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl mb-10"
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
            to={`/track-order?id=${orderId}`}
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
