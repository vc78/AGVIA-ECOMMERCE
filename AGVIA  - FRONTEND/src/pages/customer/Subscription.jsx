import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Crown, Sparkles, Check, X, Gift, Zap, BookOpen,
  Star, Shield, Clock, ArrowRight, Calendar,
  Copy, CheckCircle2, RefreshCw, MessageCircle, Award, Ticket
} from 'lucide-react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { subscriptionService } from '../../services/subscriptionService'

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

const PERKS = [
  { icon: Ticket, title: '15% Lifetime Privilege', desc: 'Every ensemble, every season. No minimum spend required for Atelier Circle members.', color: '#C9A45C' },
  { icon: Gift, title: 'Heirloom Keepsake Trunk', desc: 'Complimentary luxury archival box with silk ribbon and handwritten calligraphed card on all orders.', color: '#5A1020' },
  { icon: Zap, title: 'Priority Atelier Dispatch', desc: 'Guaranteed expedited bespoke alteration and rush courier delivery for weddings and galas.', color: '#5A1020' },
  { icon: BookOpen, title: 'Private Collection Previews', desc: 'First access to limited-edition runway sarees, bridal trousseaus, and festive launches.', color: '#2D4A2D' },
  { icon: Star, title: 'Anniversary Silk Keepsake', desc: 'A complimentary pure silk stole delivered on your birthday or wedding anniversary.', color: '#1A3A5C' },
  { icon: MessageCircle, title: 'Personal Stylist Concierge', desc: 'Dedicated direct stylist assistance for drape advice, blouse customization, and sizing.', color: '#075E54' },
]

const COMPARISON = [
  { feature: 'Privilege on All Ensembles', guest: false, vip: '15% Always' },
  { feature: 'Complimentary Insured Courier', guest: '₹2,500+ only', vip: 'All Orders' },
  { feature: 'Heirloom Keepsake Trunk', guest: '₹299 add-on', vip: 'Always Free' },
  { feature: 'Priority Atelier Dispatch', guest: false, vip: true },
  { feature: 'Anniversary Silk Keepsake', guest: false, vip: true },
  { feature: 'Private Collection Previews', guest: false, vip: true },
  { feature: 'Personal Stylist Concierge', guest: false, vip: true },
  { feature: 'Bespoke Size Tailoring', guest: 'Chargeable', vip: 'Complimentary' },
  { feature: 'Early Festive Drop Access', guest: false, vip: true },
]

export default function Subscription() {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const [activeSub, setActiveSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState('plan')

  useEffect(() => {
    if (user) {
      subscriptionService.getMySubscription().then(sub => {
        if (sub?.status === 'ACTIVE' && (sub?.validTill || sub?.endDate)) {
          const expiryDate = sub.validTill || sub.endDate
          const expiry = new Date(expiryDate)
          if (expiry > new Date()) {
            setActiveSub(sub)
            setStep('success')
          }
        }
      }).catch(err => {
        console.error('Subscription load error:', err)
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please log in to join AGVIA Atelier Circle VIP.', { style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' } })
      navigate('/login?redirect=/subscription')
      return
    }
    const loaded = await loadRazorpayScript()
    if (!loaded) {
      toast.error('Payment gateway failed to load. Please try again.')
      return
    }
    setPurchasing(true)
    try {
      const order = await subscriptionService.createOrder({
        email: user.email,
        customerName: user.name,
        customerPhone: user.phone || '',
        planName: 'AGVIA_ATELIER_VIP'
      })

      const options = {
        key: order.razorpayKeyId,
        amount: Math.round(order.amount * 100),
        currency: 'INR',
        name: "AGVIA Women's Wear Boutique",
        description: 'AGVIA Atelier Circle VIP Membership - Annual',
        order_id: order.razorpayOrderId,
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: { color: '#5A1020' },
        modal: {
          ondismiss: () => {
            setPurchasing(false)
            toast('Payment cancelled.', { icon: '⚠️' })
          }
        },
        handler: async (response) => {
          try {
            const result = await subscriptionService.verifyAndActivate({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              email: user.email
            })
            setActiveSub(result)
            setStep('success')
            toast.success('Welcome to AGVIA Atelier Circle VIP! Your membership is now ACTIVE.', {
              duration: 5000,
              style: { background: '#1F1F1F', color: '#E6C687', borderRadius: '14px', border: '1px solid #B8860B' }
            })
          } catch (err) {
            toast.error(err?.response?.data?.message || 'Payment verification failed.')
          } finally {
            setPurchasing(false)
          }
        },
      }
      new window.Razorpay(options).open()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not initiate payment. Please try again.')
      setPurchasing(false)
    }
  }

  const handleCopyCoupon = () => {
    const code = activeSub?.exclusiveCoupon || activeSub?.couponCode || 'AGVIAVIP10'
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Coupon copied! Ready to use at checkout.', {
      icon: '✨',
      style: { background: '#5C1A2B', color: '#FBF3E7', borderRadius: '12px' }
    })
    setTimeout(() => setCopied(false), 2500)
  }

  const expiryValue = activeSub?.validTill || activeSub?.endDate
  const daysLeft = expiryValue
    ? Math.max(0, Math.ceil((new Date(expiryValue) - new Date()) / 86400000))
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#8B0000] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFDF8] font-body text-[#3A2D23] overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#1A0A0A] via-[#2A1117] to-[#3A1F0F]">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#8B0000]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#B8860B]/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#B8860B]/40 bg-[#B8860B]/10 text-[#E6C687] text-[10px] font-bold tracking-[0.3em] uppercase mb-6">
              <Crown size={14} className="text-[#E6C687]" />
              <span>AGVIA Atelier Circle</span>
              <Crown size={14} className="text-[#E6C687]" />
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-[0.95] mb-6">
              VIP Membership<br />
              <em className="italic text-[#E6C687]">Redefined.</em>
            </h1>

            <p className="text-base md:text-lg text-white/65 leading-relaxed max-w-xl mx-auto mb-10">
              One circle. Unlimited couture privileges. Join patrons across Hyderabad and beyond who experience AGVIA like never before — bespoke bridal styling, priority atelier dispatch, and celebratory privileges on every ensemble.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {step === 'success' ? (
                <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#B8860B] to-[#E6C687] text-[#1A0A0A] font-bold text-sm shadow-xl">
                  <CheckCircle2 size={18} />
                  <span>VIP Member Active — {daysLeft} Days Remaining</span>
                </div>
              ) : (
                <button
                  onClick={handleSubscribe}
                  disabled={purchasing}
                  className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-[#8B0000] to-[#B8860B] text-white font-bold text-sm tracking-widest uppercase shadow-2xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 active:scale-95"
                >
                  {purchasing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Crown size={18} />
                      <span>Join VIP — ₹299/Year</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              )}
              <a href="#compare" className="text-[#E6C687]/70 hover:text-[#E6C687] text-xs tracking-wider transition-colors underline underline-offset-4">
                See what is included
              </a>
            </div>

            {step !== 'success' && (
              <p className="text-[11px] text-white/30 mt-5 tracking-wide">
                ₹299/year · Cancel anytime · Instant activation · Secure via Razorpay
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ACTIVE MEMBER CARD */}
      <AnimatePresence>
        {step === 'success' && activeSub && (
          <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="py-16 px-6">
            <div className="max-w-2xl mx-auto">
              <div className="relative bg-gradient-to-br from-[#1F1F1F] via-[#2A201A] to-[#8B0000] rounded-3xl p-8 md:p-10 border border-[#B8860B]/30 shadow-2xl overflow-hidden text-[#FFFDF8]">
                <div className="absolute top-0 right-0 w-56 h-56 bg-[#B8860B]/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#8B0000]/20 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <span className="text-[9px] tracking-[0.35em] text-[#B8860B] font-bold uppercase block mb-1.5">AGVIA Atelier Circle</span>
                      <h2 className="font-display text-2xl md:text-3xl font-bold text-white">VIP Membership</h2>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-[#B8860B]/20 border border-[#B8860B]/40 flex items-center justify-center">
                      <Crown size={28} className="text-[#B8860B]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div>
                      <span className="text-[9px] text-white/40 tracking-wider uppercase block mb-1">Member Name</span>
                      <span className="font-semibold text-sm">{activeSub.customerName || user?.name || 'VIP Member'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/40 tracking-wider uppercase block mb-1">Status</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B8860B]">
                        <span className="w-2 h-2 rounded-full bg-[#B8860B] animate-pulse" />Active
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/40 tracking-wider uppercase block mb-1">Plan</span>
                      <span className="text-sm font-semibold">{activeSub.planTier || 'VIP'} - Annual</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/40 tracking-wider uppercase block mb-1">Valid Till</span>
                      <span className="text-sm font-semibold flex items-center gap-1.5">
                        <Calendar size={13} className="text-[#B8860B]" />
                        {expiryValue ? new Date(expiryValue).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-center justify-between text-[10px] text-white/50 mb-2">
                      <span>Membership validity</span>
                      <span className="text-[#B8860B] font-bold">{daysLeft} days remaining</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#B8860B] to-[#E6C687] rounded-full transition-all"
                        style={{ width: `${Math.min(100, (daysLeft / 365) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white/5 border border-dashed border-[#B8860B]/50 rounded-2xl p-5">
                    <span className="text-[9px] text-[#B8860B] tracking-[0.25em] uppercase font-bold block mb-2">Your Exclusive VIP Coupon</span>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-2xl md:text-3xl font-bold text-white tracking-widest">
                        {activeSub.exclusiveCoupon || activeSub.couponCode || 'AGVIAVIP10'}
                      </span>
                      <button
                        onClick={handleCopyCoupon}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B8860B] hover:bg-[#E6C687] text-[#1A0A0A] font-bold text-xs tracking-wider transition-all active:scale-95 shadow-md"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-white/40 mt-2">
                      {activeSub.discountPercent || 15}% off all orders — Apply code at checkout
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Link
                  to="/products"
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#8B0000] text-white font-bold text-xs tracking-widest uppercase hover:bg-[#a01010] transition-all shadow-lg"
                >
                  <span>Shop and Redeem {activeSub.discountPercent || 15}%</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  to="/orders"
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[#B8860B]/30 text-[#8B0000] font-bold text-xs tracking-widest uppercase hover:bg-[#F5E6C8]/30 transition-all"
                >
                  <Award size={14} />
                  <span>View My Orders</span>
                </Link>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* PERKS GRID */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[10px] tracking-[0.35em] font-semibold uppercase text-[#B8860B] block mb-3">Exclusive Access</span>
          <h2 className="font-display text-4xl md:text-5xl text-[#8B0000] font-bold mb-4">6 VIP Privileges Unlocked</h2>
          <p className="text-sm text-[#3A2D23]/60 max-w-xl mx-auto leading-relaxed">
            One membership activates your entire suite of VIP privileges, automatically applied to every future order.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PERKS.map((perk, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="bg-white border border-[#B8860B]/12 rounded-3xl p-7 hover:shadow-[0_16px_48px_rgba(184,134,11,0.12)] hover:-translate-y-1.5 transition-all duration-300"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-sm"
                style={{ backgroundColor: `${perk.color}20`, border: `1px solid ${perk.color}30` }}
              >
                <perk.icon size={22} style={{ color: perk.color }} />
              </div>
              <h3 className="font-display font-bold text-base text-[#3A2D23] mb-2">{perk.title}</h3>
              <p className="text-sm text-[#3A2D23]/60 leading-relaxed">{perk.desc}</p>
              <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold tracking-wider" style={{ color: perk.color }}>
                <Check size={12} />
                <span>INCLUDED IN VIP</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section id="compare" className="py-20 px-6 bg-[#F9F3E9]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[10px] tracking-[0.35em] font-semibold uppercase text-[#B8860B] block mb-3">Compare Plans</span>
            <h2 className="font-display text-4xl md:text-5xl text-[#8B0000] font-bold">Guest vs VIP</h2>
          </div>

          <div className="bg-white rounded-3xl border border-[#B8860B]/15 overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-[#8B0000] text-white text-xs font-bold uppercase tracking-widest">
              <div className="p-5">Feature</div>
              <div className="p-5 text-center border-l border-white/10">Guest</div>
              <div className="p-5 text-center border-l border-[#B8860B]/40 bg-[#B8860B]/20">
                <div className="flex items-center justify-center gap-1.5">
                  <Crown size={14} className="text-[#E6C687]" />
                  <span className="text-[#E6C687]">VIP</span>
                </div>
              </div>
            </div>

            {COMPARISON.map((row, i) => (
              <div key={i} className="grid grid-cols-3 border-b border-[#B8860B]/8 text-xs hover:bg-[#FFFDF8] transition-colors">
                <div className="p-4 md:p-5 font-medium text-[#3A2D23] flex items-center">{row.feature}</div>
                <div className="p-4 md:p-5 border-l border-[#B8860B]/8 flex items-center justify-center">
                  {row.guest === false ? <X size={16} className="text-gray-300" /> : <span className="text-[#3A2D23]/60 text-center">{row.guest}</span>}
                </div>
                <div className="p-4 md:p-5 border-l border-[#B8860B]/8 bg-[#B8860B]/5 flex items-center justify-center">
                  {row.vip === true ? <Check size={16} className="text-[#B8860B]" /> : <span className="font-bold text-[#8B0000] text-center">{row.vip}</span>}
                </div>
              </div>
            ))}
          </div>

          {step !== 'success' && (
            <div className="text-center mt-10">
              <button
                onClick={handleSubscribe}
                disabled={purchasing}
                className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-[#8B0000] to-[#B8860B] text-white font-bold text-sm tracking-widest uppercase shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-70"
              >
                <Crown size={18} />
                <span>Activate VIP — Only ₹299/Year</span>
              </button>
              <p className="text-xs text-[#3A2D23]/40 mt-4">Instant activation · Secure payment via Razorpay</p>
            </div>
          )}
        </div>
      </section>

      {/* TRUST */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'Secure and Safe', desc: 'All payments processed via Razorpay with bank-grade 256-bit encryption.' },
            { icon: RefreshCw, title: 'Cancel Anytime', desc: 'No lock-in. Request a full refund within 7 days if you are not satisfied.' },
            { icon: Clock, title: 'Instant Activation', desc: 'VIP privileges activate immediately after payment — no waiting period.' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-8 bg-white border border-[#B8860B]/12 rounded-3xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#8B0000]/8 flex items-center justify-center mx-auto mb-4">
                <item.icon size={22} className="text-[#8B0000]" />
              </div>
              <h3 className="font-display font-bold text-base text-[#3A2D23] mb-2">{item.title}</h3>
              <p className="text-sm text-[#3A2D23]/55 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      {step !== 'success' && (
        <section className="mx-6 md:mx-12 xl:mx-20 mb-24 rounded-3xl bg-gradient-to-r from-[#1A0A0A] via-[#2A1117] to-[#3A1F0F] text-white py-16 px-8 text-center relative overflow-hidden border border-[#B8860B]/20">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#B8860B]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <Crown size={40} className="text-[#E6C687] mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Ready to go <em className="italic text-[#E6C687]">Royal?</em>
            </h2>
            <p className="text-white/60 text-sm max-w-md mx-auto mb-8 leading-relaxed">
              Join the AGVIA Atelier Circle today for just ₹299/year and unlock lifetime VIP privileges on every order.
            </p>
            <button
              onClick={handleSubscribe}
              disabled={purchasing}
              className="inline-flex items-center gap-3 px-12 py-5 rounded-full bg-gradient-to-r from-[#B8860B] to-[#E6C687] text-[#1A0A0A] font-bold text-sm tracking-widest uppercase shadow-2xl hover:scale-[1.03] transition-all duration-300 disabled:opacity-70"
            >
              <Sparkles size={18} />
              <span>Join Now — ₹299/Year</span>
            </button>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
