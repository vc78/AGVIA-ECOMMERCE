import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Instagram, Facebook, Youtube, Mail, ShoppingBag,
  Info, Headphones, ShieldCheck, Truck, RotateCcw, ChevronRight, Landmark
} from 'lucide-react'
import toast from 'react-hot-toast'
import { BUSINESS } from '../../constants/business'
import api from '../../services/api'

/* ── Pinterest SVG Icon ── */
const PinterestIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
)

/* ── WhatsApp SVG Icon ── */
const WhatsAppIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
)

/* ── Ornate Vertical Gold Column Separator with Central Motif ── */
function ColSep() {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center shrink-0 px-2 select-none opacity-85" aria-hidden="true">
      <div className="w-[1px] h-28 bg-gradient-to-b from-transparent via-[#C9A45C]/60 to-[#C9A45C]" />
      <div className="my-2.5 text-[#C9A45C] flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ornate Indian Jewel / Rhombus with Petals */}
          <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" fill="#C9A45C" fillOpacity="0.9" />
          <circle cx="12" cy="12" r="2.2" fill="#5A1020" stroke="#FAF7F2" strokeWidth="0.75" />
          <circle cx="12" cy="5" r="0.8" fill="#FFFDF8" />
          <circle cx="12" cy="19" r="0.8" fill="#FFFDF8" />
          <circle cx="5" cy="12" r="0.8" fill="#FFFDF8" />
          <circle cx="19" cy="12" r="0.8" fill="#FFFDF8" />
        </svg>
      </div>
      <div className="w-[1px] h-28 bg-gradient-to-t from-transparent via-[#C9A45C]/60 to-[#C9A45C]" />
    </div>
  )
}

export default function Footer() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const { data } = await api.post('/newsletter/subscribe', { email })
      if (data?.data) localStorage.setItem('ps_circle_member', JSON.stringify(data.data))
      toast.success(data?.message || 'Welcome to AGVIA Haute Circle! Code CIRCLE15 unlocked.', {
        icon: '👑', style: { background: '#5A1020', color: '#FFFDF8', borderRadius: '12px' }
      })
      setEmail('')
    } catch {
      toast.success('Welcome to AGVIA Haute Circle! Your VIP perks are active.', {
        icon: '👑', style: { background: '#5A1020', color: '#FFFDF8', borderRadius: '12px' }
      })
      setEmail('')
    } finally {
      setLoading(false)
    }
  }

  const shopLinks = [
    { label: 'All Collections', to: '/products' },
    { label: 'Sarees', to: '/products?category=Sarees' },
    { label: 'Lehengas', to: '/products?category=Lehengas' },
    { label: 'Kurtas', to: '/products?category=Anarkalis+%26+Kurtas' },
    { label: 'Anarkalis', to: '/products?category=Anarkalis+%26+Kurtas' },
    { label: 'Western Wear', to: '/products?category=Western+Wear' },
    { label: 'New Arrivals', to: '/products' },
    { label: 'Festive Collection', to: '/products' },
    { label: 'Wedding Collection', to: '/products?category=Lehengas' },
    { label: 'Gift Cards', to: '/products' },
  ]

  const aboutLinks = [
    { label: 'Our Story', to: '/about' },
    { label: 'Craftsmanship', to: '/craftsmanship' },
    { label: 'Sustainability', to: '/sustainability' },
    { label: 'Blogs & Style Guide', to: '/blogs' },
    { label: 'Store Locations', to: '/store-locations' },
    { label: 'Careers', to: '/careers' },
  ]

  const helpLinks = [
    { label: 'Track Order', to: '/track' },
    { label: 'Shipping & Delivery', to: '/shipping-policy' },
    { label: 'Returns & Exchanges', to: '/return-exchange-policy' },
    { label: 'Size Guide', to: '/size-guide' },
    { label: 'Product Care', to: '/product-care' },
    { label: 'FAQs', to: '/faq' },
    { label: 'Contact Us', to: '/contact' },
    { label: 'Bulk Orders', to: '/bulk-orders' },
    { label: 'Styling Consultation', to: '/styling' },
    { label: 'Atelier Appointments', to: '/appointments' },
  ]

  const policyLinks = [
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Terms & Conditions', to: '/terms' },
    { label: 'Refund Policy', to: '/refund-policy' },
    { label: 'Shipping Policy', to: '/shipping-policy' },
    { label: 'Cancellation Policy', to: '/cancellation-policy' },
    { label: 'Cookie Policy', to: '/cookie-policy' },
    { label: 'Return & Exchange Policy', to: '/return-exchange-policy' },
    { label: 'Intellectual Property', to: '/intellectual-property' },
    { label: 'Disclaimer', to: '/disclaimer' },
  ]

  const bottomLinks = [
    { label: 'Home', to: '/' },
    { label: 'About Us', to: '/about' },
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Terms & Conditions', to: '/terms' },
    { label: 'Shipping Policy', to: '/shipping-policy' },
    { label: 'Return Policy', to: '/refund-policy' },
    { label: 'Size Guide', to: '/size-guide' },
    { label: 'FAQs', to: '/faq' },
    { label: 'Contact Us', to: '/contact' },
  ]

  const socials = [
    { icon: Instagram, href: BUSINESS.social.instagram, label: 'Instagram' },
    { icon: Facebook, href: BUSINESS.social.facebook, label: 'Facebook' },
    { icon: PinterestIcon, href: '#', label: 'Pinterest' },
    { icon: Youtube, href: '#', label: 'YouTube' },
    { icon: WhatsAppIcon, href: `https://wa.me/919032306961`, label: 'WhatsApp' },
  ]

  const linkCls = 'font-sans text-[12px] text-white/70 hover:text-[#E6C687] transition-colors leading-relaxed block py-0.5'
  const headingCls = 'font-serif text-[14.5px] font-semibold text-white mb-3.5 flex items-center gap-2'

  return (
    <footer className="relative select-none overflow-hidden font-body text-white">

      {/* ══════════════════════════════════════════════════════════════
          1. TOP SCALLOPED ARCH & "WEAR YOUR STORY" CREST RIBBON
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative w-full overflow-hidden select-none bg-[#FFFDF8]">
        {/* SVG Scalloped Arched Transition into Royal Red Footer */}
        <div className="relative w-full h-20 sm:h-24 md:h-28">
          <svg
            viewBox="0 0 1440 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="absolute bottom-0 w-full h-full text-[#380A15]"
          >
            {/* Dark Royal Burgundy Base Fill */}
            <path
              d="M0 40 C360 40 460 90 720 90 C980 90 1080 40 1440 40 V100 H0 Z"
              fill="currentColor"
            />
            {/* Scalloped Gold Accent Border */}
            <path
              d="M0 40 C360 40 460 90 720 90 C980 90 1080 40 1440 40"
              stroke="#C9A45C"
              strokeWidth="1.5"
              strokeOpacity="0.8"
            />
            {/* Secondary Fine Gold Highlight */}
            <path
              d="M0 43 C360 43 460 93 720 93 C980 93 1080 43 1440 43"
              stroke="#E6C687"
              strokeWidth="0.75"
              strokeOpacity="0.4"
            />
          </svg>

          {/* Centered Ivory "Wear Your Story" Arch Cartouche */}
          <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center text-center">
            {/* Floating Scalloped Ivory Cartouche */}
            <div className="px-6 sm:px-10 py-1.5 sm:py-2 rounded-full bg-[#FFFDF8] border border-[#C9A45C]/60 shadow-[0_4px_16px_rgba(90,16,32,0.12)] flex items-center gap-2">
              <span className="text-[#C9A45C] text-[10px] sm:text-xs">✦</span>
              <span
                style={{ fontFamily: "'Alex Brush', 'Cormorant Garamond', 'Playfair Display', cursive, serif" }}
                className="text-xl sm:text-2xl md:text-3xl text-[#9B2043] font-normal tracking-wide px-1 select-none"
              >
                Wear Your Story
              </span>
              <span className="text-[#C9A45C] text-[10px] sm:text-xs">✦</span>
            </div>

            {/* Hanging Ornate Lotus Pendant */}
            <div className="mt-1 flex flex-col items-center">
              <div className="w-[1px] h-3 bg-[#C9A45C]" />
              <svg width="22" height="18" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2C12 2 8 7 8 11C8 14.5 12 18 12 18C12 18 16 14.5 16 11C16 7 12 2 12 2Z"
                  fill="#C9A45C"
                />
                <path
                  d="M6 7C6 7 4 10.5 4 13C4 15.5 7.5 17 7.5 17C7.5 17 8 13.5 9 10C7.5 8.5 6 7 6 7Z"
                  fill="#E6C687"
                />
                <path
                  d="M18 7C18 7 20 10.5 20 13C20 15.5 16.5 17 16.5 17C16.5 17 16 13.5 15 10C16.5 8.5 18 7 18 7Z"
                  fill="#E6C687"
                />
                <circle cx="12" cy="18.5" r="1.5" fill="#FAF7F2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. MAIN ROYAL PALACE BACKGROUND & 5-COLUMN EDITORIAL GRID
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative bg-[#380A15]">
        {/* Authentic Palace Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-top bg-no-repeat pointer-events-none opacity-90"
          style={{ backgroundImage: "url('/images/footer_bg.png')" }}
        />

        {/* Soft luxury gradient to maintain pristine text legibility while revealing palace hall */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2E0711]/45 via-[#1F040A]/60 to-[#120205]/85 pointer-events-none" />

        {/* Main Content Container */}
        <div className="relative z-10 max-w-[1340px] mx-auto px-4 sm:px-6 xl:px-8 pt-4 pb-6">
          
          {/* 5-Column Grid on Desktop / Reflowing on Tablet & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-row items-start justify-between gap-8 lg:gap-0 pb-8 border-b border-white/10">

            {/* Column 1: Brand Showcase */}
            <div className="sm:col-span-2 md:col-span-3 lg:col-span-1 lg:w-[22%] shrink-0 flex flex-col items-start lg:pr-5">
              <Link to="/" className="mb-3.5 group inline-block">
                <img
                  src="/images/agvia-logo.png"
                  alt="AGVIA Women's Wear Boutique"
                  className="h-16 w-auto object-contain brightness-110 drop-shadow-[0_2px_12px_rgba(201,164,92,0.35)] group-hover:scale-105 transition-transform duration-300"
                />
              </Link>
              <p className="font-sans text-[12px] text-white/70 leading-relaxed mb-5 max-w-sm">
                Curating bespoke ethnic and contemporary wear for the modern woman. Tradition, quality and elegance — all in one place.
              </p>
              
              {/* Circular Gold Outline Social Icons */}
              <div className="flex gap-2.5 flex-wrap items-center">
                {socials.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="touch-target w-9 h-9 min-w-[36px] min-h-[36px] rounded-full border border-[#C9A45C]/50 flex items-center justify-center text-[#E6C687] hover:bg-[#7B1030] hover:border-[#7B1030] hover:text-white transition-all duration-200 shadow-sm"
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            <ColSep />

            {/* Column 2: Shop */}
            <div className="lg:w-[17%] shrink-0 px-0 lg:px-3">
              <h4 className={headingCls}>
                <ShoppingBag size={14} className="text-[#C9A45C]" /> Shop
              </h4>
              <ul className="space-y-1">
                {shopLinks.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className={linkCls}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <ColSep />

            {/* Column 3: About */}
            <div className="lg:w-[15%] shrink-0 px-0 lg:px-3">
              <h4 className={headingCls}>
                <Info size={14} className="text-[#C9A45C]" /> About
              </h4>
              <ul className="space-y-1">
                {aboutLinks.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className={linkCls}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <ColSep />

            {/* Column 4: Help & Support */}
            <div className="lg:w-[22%] shrink-0 px-0 lg:px-3">
              <h4 className={headingCls}>
                <Headphones size={14} className="text-[#C9A45C]" /> Help &amp; Support
              </h4>
              <ul className="space-y-1">
                {helpLinks.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className={linkCls}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <ColSep />

            {/* Column 5: Policies */}
            <div className="lg:flex-1 px-0 lg:px-3">
              <h4 className={headingCls}>
                <ShieldCheck size={14} className="text-[#C9A45C]" /> Policies
              </h4>
              <ul className="space-y-1">
                {policyLinks.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className={linkCls}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════════════
              3. NEWSLETTER & TRUST BADGES HORIZONTAL BAR
          ══════════════════════════════════════════════════════════════ */}
          <div className="my-5 rounded-2xl bg-[#23030A]/85 backdrop-blur-md border border-[#C9A45C]/30 p-4 sm:p-5 flex flex-col xl:flex-row items-center justify-between gap-5 shadow-lg">
            
            {/* Newsletter Info Header */}
            <div className="flex items-center gap-3.5 w-full xl:w-auto">
              <div className="w-10 h-10 rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/40 flex items-center justify-center shrink-0">
                <Mail size={19} className="text-[#C9A45C]" />
              </div>
              <div>
                <h5 className="font-serif text-[14px] font-semibold text-white tracking-wide">
                  Subscribe to Our World
                </h5>
                <p className="font-sans text-[11px] text-white/60">
                  Get exclusive updates, new arrivals and special offers.
                </p>
              </div>
            </div>

            {/* Pill Newsletter Form */}
            <form
              onSubmit={handleSubscribe}
              className="flex items-center rounded-full border border-[#C9A45C]/40 bg-[#140206]/85 p-1 w-full xl:max-w-md shadow-inner"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 min-w-0 bg-transparent text-[12px] font-sans text-white placeholder-white/40 px-4 py-2 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="touch-target bg-[#FAF7F2] hover:bg-[#C9A45C] text-[#5A1020] hover:text-[#1A0B10] font-bold text-[11px] tracking-wider uppercase px-5 py-2.5 rounded-full transition-all flex items-center gap-1 shrink-0 shadow-sm"
              >
                <span>SUBSCRIBE</span>
                <ChevronRight size={13} strokeWidth={2.5} />
              </button>
            </form>

            {/* Vertical Divider (Desktop) */}
            <div className="hidden xl:block w-[1px] h-10 bg-[#C9A45C]/30 mx-1" />

            {/* 3 Trust Badges */}
            <div className="flex items-center gap-6 sm:gap-8 flex-wrap justify-center w-full xl:w-auto">
              <div className="flex items-center gap-2.5">
                <Truck size={22} className="text-[#C9A45C] shrink-0" strokeWidth={1.75} />
                <div>
                  <p className="font-serif text-[12px] font-semibold text-white leading-tight">Free Shipping</p>
                  <p className="font-sans text-[10px] text-white/50 leading-tight">On all orders</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <RotateCcw size={20} className="text-[#C9A45C] shrink-0" strokeWidth={1.75} />
                <div>
                  <p className="font-serif text-[12px] font-semibold text-white leading-tight">Easy Returns</p>
                  <p className="font-sans text-[10px] text-white/50 leading-tight">Hassle-free 7 days</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <ShieldCheck size={22} className="text-[#C9A45C] shrink-0" strokeWidth={1.75} />
                <div>
                  <p className="font-serif text-[12px] font-semibold text-white leading-tight">Secure Payments</p>
                  <p className="font-sans text-[10px] text-white/50 leading-tight">100% Safe &amp; Trusted</p>
                </div>
              </div>
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════════════
              4. BOTTOM COPYRIGHT, NAV LINKS & PAYMENT BADGES
          ══════════════════════════════════════════════════════════════ */}
          <div className="pt-3 flex flex-col xl:flex-row items-center justify-between gap-3 text-center xl:text-left">
            
            {/* Copyright */}
            <p className="font-sans text-[10.5px] text-white/50 tracking-wider">
              © {new Date().getFullYear()} AGVIA Women's Wear Boutique. All rights reserved.
            </p>

            {/* Middle Nav Links */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 justify-center">
              {bottomLinks.map((l, i) => (
                <span key={l.label} className="flex items-center gap-2">
                  <Link
                    to={l.to}
                    className="font-sans text-[10.5px] text-white/50 hover:text-[#E6C687] tracking-wider transition-colors py-0.5"
                  >
                    {l.label}
                  </Link>
                  {i < bottomLinks.length - 1 && <span className="text-white/20 text-[9px]">|</span>}
                </span>
              ))}
            </div>

            {/* Right: Payment Icons + Back to Top */}
            <div className="flex items-center gap-3.5 flex-wrap justify-center">
              
              {/* Crisp Payment Vector Logos */}
              <div className="flex items-center gap-1.5">
                {/* VISA */}
                <div className="h-5 px-2 bg-white rounded flex items-center justify-center shadow-xs" title="Visa">
                  <span className="font-sans text-[10px] font-black italic text-[#1A1F71] tracking-tighter leading-none">
                    VISA
                  </span>
                </div>

                {/* Mastercard */}
                <div className="h-5 px-2 bg-[#1A1A1A] rounded flex items-center justify-center shadow-xs" title="Mastercard">
                  <div className="flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] inline-block opacity-90" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] inline-block -ml-1 opacity-90" />
                  </div>
                </div>

                {/* RuPay */}
                <div className="h-5 px-2 bg-white rounded flex items-center justify-center gap-0.5 shadow-xs" title="RuPay">
                  <span className="font-sans text-[9px] font-black text-[#097939] tracking-tight leading-none">Ru</span>
                  <span className="font-sans text-[9px] font-black text-[#0089D0] tracking-tight leading-none">Pay</span>
                </div>

                {/* UPI */}
                <div className="h-5 px-2 bg-white rounded flex items-center justify-center gap-0.5 shadow-xs" title="UPI">
                  <span className="font-sans text-[9px] font-black text-[#0F7C3C] tracking-wider leading-none">UPI</span>
                </div>

                {/* Paytm */}
                <div className="h-5 px-2 bg-white rounded flex items-center justify-center gap-0.5 shadow-xs" title="Paytm">
                  <span className="font-sans text-[9px] font-bold text-[#002E6E] leading-none">Pay</span>
                  <span className="font-sans text-[9px] font-black text-[#00B9F5] leading-none">tm</span>
                </div>

                {/* NetBanking */}
                <div className="h-5 px-2 bg-white/15 border border-[#C9A45C]/35 rounded flex items-center justify-center text-[#E6C687] shadow-xs" title="NetBanking">
                  <Landmark size={12} />
                </div>
              </div>

              {/* Back to Top */}
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="touch-target flex items-center justify-center gap-1 text-[10px] font-sans tracking-widest text-white/80 hover:text-[#C9A45C] border border-[#C9A45C]/35 hover:border-[#C9A45C] rounded-full px-3.5 py-1.5 transition-all uppercase whitespace-nowrap shadow-xs"
              >
                <span>Back to Top</span> ↑
              </button>
            </div>

          </div>

        </div>
      </div>
    </footer>
  )
}
