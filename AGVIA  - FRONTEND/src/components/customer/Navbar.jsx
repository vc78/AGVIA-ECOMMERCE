import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Menu, X, User, Search, Heart, ShoppingBag, LogOut,
  ArrowRight, ChevronDown, Sparkles, Truck, Gift,
  Crown, Flower2, Gem, Scissors, Feather, Layers, Home
} from 'lucide-react'
import { loggedOut } from '../../store/authSlice'
import { useCart } from '../../hooks/useCart'
import { motion, AnimatePresence } from 'framer-motion'
import ReliableImage from '../common/ReliableImage'

// ── Luxury Boutique Categories ──────────────────────────────────────
const NAV_CATEGORIES = {
  COLLECTIONS: {
    label: 'COLLECTIONS',
    path: '/products',
    items: [
      { name: 'Bridal Couture', path: '/products?category=Lehengas', desc: 'Regal bridal sets & trousseau edits', img: '/images/wedding_lehenga.jpg' },
      { name: 'Festive Celebrations', path: '/products?category=Sarees', desc: 'Handwoven pure silks & organza', img: '/images/classic_silk_saree.jpg' },
      { name: 'Royal Anarkalis', path: '/products?category=Anarkalis+%26+Kurtas', desc: 'Flowing silhouettes with zardozi', img: '/images/anarkali_set.jpg' },
      { name: 'Modern Evening', path: '/products?category=Dresses+%26+Gowns', desc: 'Contemporary couture & gowns', img: '/images/evening_gown.jpg' },
    ]
  },
  SAREES: {
    label: 'SAREES',
    path: '/products?category=Sarees',
    items: [
      { name: 'Classic Silk Sarees', path: '/products?category=Sarees', desc: 'Traditional heirloom weaves with zari', img: '/images/classic_silk_saree.jpg' },
      { name: 'Floral Organza Sarees', path: '/products?category=Sarees', desc: 'Sheer lightweight pastels & motifs', img: '/images/floral_organza_saree.jpg' },
      { name: 'Kanjeevaram & Banarasi', path: '/products?category=Sarees', desc: 'Pure temple border silks', img: '/images/classic_silk_saree.jpg' },
    ]
  },
  LEHENGAS: {
    label: 'LEHENGAS',
    path: '/products?category=Lehengas',
    items: [
      { name: 'Royal Wedding Lehengas', path: '/products?category=Lehengas', desc: 'Heavy hand-embroidered bridal sets', img: '/images/wedding_lehenga.jpg' },
      { name: 'Festive Silk Lehengas', path: '/products?category=Lehengas', desc: 'Lightweight festive flared skirts', img: '/images/festive_lehenga_set.jpg' },
    ]
  },
  KURTAS: {
    label: 'KURTAS',
    path: '/products?category=Anarkalis+%26+Kurtas',
    items: [
      { name: 'Embroidered Anarkalis', path: '/products?category=Anarkalis+%26+Kurtas', desc: 'Grand floor-length festive kalis', img: '/images/anarkali_set.jpg' },
      { name: 'Everyday Kurta Sets', path: '/products?category=Anarkalis+%26+Kurtas', desc: 'Chic comfortable daily wear', img: '/images/everyday_kurta_set.jpg' },
      { name: 'Festive Kurtis', path: '/products?category=Kurtis', desc: 'Intricate neckline & threadwork', img: '/images/festive_kurti.jpg' },
    ]
  },
  WESTERN_WEAR: {
    label: 'WESTERN WEAR',
    path: '/products?category=Western+Wear',
    items: [
      { name: 'Tailored Co-ord Sets', path: '/products?category=Western+Wear', desc: 'Chic modern co-ordinated outfits', img: '/images/coord_set.jpg' },
      { name: 'Evening Dresses & Gowns', path: '/products?category=Dresses+%26+Gowns', desc: 'Cocktail gowns with subtle sheen', img: '/images/evening_gown.jpg' },
    ]
  },
  MORE: {
    label: 'MORE',
    path: '/products',
    items: [
      { name: 'Bridal Dupattas', path: '/products?category=Dupattas', desc: 'Embellished bridal veil drapes', img: '/images/bridal_dupatta.jpg' },
      { name: 'Custom Stitching', path: '/wedding-orders', desc: 'Made-to-measure bespoke blouse & tailoring', img: '/images/anarkali_set.jpg' },
      { name: 'VIP Membership', path: '/subscription', desc: 'AGVIA Haute Privilege Circle & styling perks', img: '/images/hero_banner.jpg' },
    ]
  }
}

// ── Watermark Botanical Illustration (SVG) ───────────────────────────
function BotanicalCornerDecor({ className = '' }) {
  return (
    <svg viewBox="0 0 160 110" fill="none" className={`pointer-events-none select-none opacity-30 ${className}`}>
      <path d="M150 100 C130 80, 100 60, 60 70 C40 75, 20 90, 5 105" stroke="#C9A45C" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M120 70 C135 60, 145 40, 140 25 C125 35, 115 55, 120 70 Z" fill="#C9A45C" fillOpacity="0.18" stroke="#C9A45C" strokeWidth="0.8" />
      <path d="M95 62 C110 50, 115 30, 105 18 C92 28, 90 48, 95 62 Z" fill="#C9A45C" fillOpacity="0.18" stroke="#C9A45C" strokeWidth="0.8" />
      <path d="M70 68 C80 50, 75 32, 60 25 C55 40, 60 58, 70 68 Z" fill="#C9A45C" fillOpacity="0.18" stroke="#C9A45C" strokeWidth="0.8" />
      <path d="M45 78 C48 60, 40 45, 28 40 C28 55, 36 70, 45 78 Z" fill="#C9A45C" fillOpacity="0.18" stroke="#C9A45C" strokeWidth="0.8" />
      <circle cx="140" cy="22" r="1.5" fill="#C9A45C" />
      <circle cx="103" cy="15" r="1.5" fill="#C9A45C" />
      <circle cx="58" cy="22" r="1.5" fill="#C9A45C" />
    </svg>
  )
}

// ── AGVIA Lady Emblem Logo Icon ─────────────────────────────────────
function AgviaLogoEmblem() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 md:w-11 md:h-11 shrink-0">
      {/* Sparkles around lady */}
      <path d="M14 18 L16 11 L18 18 L25 20 L18 22 L16 29 L14 22 L7 20 Z" fill="#C9A45C" />
      <path d="M50 14 L51 9 L52 14 L57 15 L52 16 L51 21 L50 16 L45 15 Z" fill="#C9A45C" />
      <path d="M12 44 L13 40 L14 44 L18 45 L14 46 L13 50 L12 46 L8 45 Z" fill="#C9A45C" opacity="0.85" />
      <path d="M52 46 L53 42 L54 46 L58 47 L54 48 L53 52 L52 48 L48 47 Z" fill="#C9A45C" opacity="0.85" />
      
      {/* Crown / Hair */}
      <circle cx="32" cy="18" r="4.5" stroke="#C9A45C" strokeWidth="1.5" fill="#FAF6F0" />
      <path d="M30 13 L32 10 L34 13 L36 11 L35 15 L29 15 L28 11 Z" fill="#C9A45C" />
      
      {/* Elegant Silhouette Gown */}
      <path d="M30 23 L28 29 L23 35 L16 53 L32 52 L48 53 L41 35 L36 29 L34 23 Z" stroke="#C9A45C" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Gown inner drapery lines */}
      <path d="M28 29 L32 44 L36 29" stroke="#C9A45C" strokeWidth="1" strokeLinecap="round" opacity="0.75" />
      <path d="M25 38 L32 52 L39 38" stroke="#C9A45C" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <path d="M19 48 L32 52 L45 48" stroke="#C9A45C" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      {/* Base flourish pedestal */}
      <path d="M22 55 L32 53.5 L42 55" stroke="#C9A45C" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownTimeoutRef = useRef(null)

  const MOBILE_HEADLINES = [
    { text: 'FREE SHIPPING ON ORDERS ₹999+', icon: Truck },
    { text: '✦ ELEGANT STYLES FOR EVERY OCCASION ✦', icon: Sparkles },
    { text: 'USE CODE: AGVIA15 FOR 15% OFF', icon: Gift },
    { text: 'EASY 7-DAY HASSLE-FREE RETURNS', icon: Truck },
  ]
  const [headlineIndex, setHeadlineIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % MOBILE_HEADLINES.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { count } = useCart()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setActiveDropdown(null)
  }, [location.pathname, location.search])

  // Prevent background scrolling when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const handleLogout = () => {
    dispatch(loggedOut())
    navigate('/')
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleMouseEnter = (key) => {
    clearTimeout(dropdownTimeoutRef.current)
    setActiveDropdown(key)
  }

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
    }, 150)
  }

  const isHomeActive = location.pathname === '/'

  return (
    <>
      {/* Spacer for sticky dual header (top bar ~30px + main nav ~64px = ~94px) */}
      <div className="h-[88px] md:h-[94px]" />

      <header className="fixed top-0 left-0 right-0 z-50 select-none shadow-[0_4px_25px_rgba(0,0,0,0.06)]">

        {/* ══════════════════════════════════════════════════════════════
            1. TOP ANNOUNCEMENT BAR (DEEP BURGUNDY / WINE)
        ══════════════════════════════════════════════════════════════ */}
        {/* ══════════════════════════════════════════════════════════════
            1. TOP ANNOUNCEMENT BAR (DEEP BURGUNDY / WINE)
        ══════════════════════════════════════════════════════════════ */}
        <div className="relative bg-[#480814] text-[#E6C894] border-b border-[#5E1220] overflow-hidden select-none">
          {/* Subtle background damask floral flourishes at edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black/25 to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black/25 to-transparent pointer-events-none" />

          {/* Desktop Spread (md and up) */}
          <div className="hidden md:flex w-full max-w-[1320px] mx-auto px-[clamp(16px,3vw,40px)] h-7 sm:h-8 items-center justify-between text-[10px] sm:text-[10.5px] tracking-[0.16em] uppercase font-medium">
            
            {/* Left: Free Shipping & Easy Returns */}
            <div className="flex items-center gap-1.5 text-[#E6C894]">
              <Truck size={12} className="text-[#E6C894] shrink-0" />
              <span className="font-semibold tracking-[0.18em]">FREE SHIPPING</span>
              <span className="opacity-40">|</span>
              <span className="tracking-[0.18em]">EASY RETURNS</span>
            </div>

            {/* Center: Elegant Styles Symmetrical Flourish */}
            <div className="flex items-center gap-2 text-[#E6C894] tracking-[0.22em] text-[10.5px] font-serif">
              <span className="w-6 lg:w-12 h-[1px] bg-gradient-to-r from-transparent to-[#E6C894]/70" />
              <span className="text-[#E6C894] text-[9px]">✦</span>
              <span className="tracking-[0.24em] font-medium text-white/95">
                ELEGANT STYLES FOR EVERY OCCASION
              </span>
              <span className="text-[#E6C894] text-[9px]">✦</span>
              <span className="w-6 lg:w-12 h-[1px] bg-gradient-to-l from-transparent to-[#E6C894]/70" />
            </div>

            {/* Right: Exclusive Collections & Secure Payments */}
            <div className="flex items-center gap-1.5 text-[#E6C894]">
              <Gift size={11} className="text-[#E6C894] shrink-0" />
              <span className="tracking-[0.18em]">EXCLUSIVE COLLECTIONS</span>
              <span className="opacity-40">|</span>
              <span className="tracking-[0.18em]">SECURE PAYMENTS</span>
            </div>

          </div>

          {/* Mobile Centered Dynamic Headline (< md) */}
          <div className="flex md:hidden w-full h-7 items-center justify-center px-3 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={headlineIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-1.5 text-[9px] xs:text-[10px] tracking-[0.18em] uppercase font-semibold text-[#E6C894] whitespace-nowrap"
              >
                {(() => {
                  const item = MOBILE_HEADLINES[headlineIndex]
                  const Icon = item.icon
                  return <Icon size={11} className="text-[#E6C894] shrink-0" />
                })()}
                <span>{MOBILE_HEADLINES[headlineIndex].text}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            2. MAIN LUXURY NAVBAR (WARM IVORY / SILK CREAM)
        ══════════════════════════════════════════════════════════════ */}
        <div className={`relative bg-[#FAF6F0] border-b border-[#EAE0D2] transition-all duration-300 ${scrolled ? 'py-1.5' : 'py-2 md:py-2.5'}`}>
          
          {/* Subtle Botanical Leaf Watermark in Corners */}
          <BotanicalCornerDecor className="absolute -left-4 -bottom-2 w-32 h-20 transform -scale-x-100 hidden lg:block" />
          <BotanicalCornerDecor className="absolute -right-2 -bottom-2 w-36 h-22 hidden lg:block" />

          <div className="w-full max-w-[1320px] mx-auto px-[clamp(16px,3vw,40px)] flex items-center justify-between gap-3">

            {/* ── Left: AGVIA Official Brand Logo ── */}
            <Link to="/" className="flex items-center shrink-0 group py-0.5">
              <img
                src="/images/agvia-logo.webp"
                alt="AGVIA Women's Wear Boutique"
                width={140}
                height={44}
                fetchPriority="high"
                decoding="async"
                className="h-9 sm:h-10 lg:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* ── Center: Tablet Compact Nav (md to xl) ── */}
            <nav className="hidden md:flex xl:hidden items-center gap-2 lg:gap-3">
              <Link
                to="/"
                className={`text-[11px] tracking-[0.14em] uppercase px-2.5 py-1 rounded-full transition-all ${
                  isHomeActive ? 'bg-[#5A1020] text-white font-bold' : 'text-[#382820] hover:text-[#5A1020]'
                }`}
              >
                Home
              </Link>
              <Link
                to="/products?category=Sarees"
                className="text-[11px] tracking-[0.14em] uppercase px-2 py-1 text-[#382820] hover:text-[#5A1020] transition-colors"
              >
                Sarees
              </Link>
              <Link
                to="/products?category=Lehengas"
                className="text-[11px] tracking-[0.14em] uppercase px-2 py-1 text-[#382820] hover:text-[#5A1020] transition-colors"
              >
                Lehengas
              </Link>
              <Link
                to="/products"
                className="text-[11px] tracking-[0.14em] uppercase px-2 py-1 text-[#382820] hover:text-[#5A1020] transition-colors"
              >
                Collections
              </Link>
            </nav>

            {/* ── Center: Desktop Full Navigation Links ── */}
            <nav className="hidden xl:flex items-center gap-4 lg:gap-5 xl:gap-6">
              
              {/* HOME LINK WITH ORNAMENTAL FLOURISH */}
              <Link
                to="/"
                className="relative py-1 flex flex-col items-center group cursor-pointer"
              >
                <span className={`text-[12px] tracking-[0.18em] uppercase font-semibold transition-colors duration-200 ${
                  isHomeActive ? 'text-[#4A0A16]' : 'text-[#382820] hover:text-[#4A0A16]'
                }`}>
                  HOME
                </span>
                {/* Reference Image Underline Flourish: ──◆── */}
                {isHomeActive ? (
                  <div className="flex items-center justify-center gap-1 mt-1 text-[#B68C48]">
                    <span className="w-3.5 h-[1.5px] bg-[#B68C48]" />
                    <span className="w-1.5 h-1.5 rotate-45 bg-[#B68C48]" />
                    <span className="w-3.5 h-[1.5px] bg-[#B68C48]" />
                  </div>
                ) : (
                  <div className="h-[2.5px] mt-1" />
                )}
              </Link>

              {/* DROPDOWN CATEGORIES */}
              {Object.entries(NAV_CATEGORIES).map(([key, cat]) => {
                const isOpen = activeDropdown === key
                const isActive = location.search.toLowerCase().includes(cat.label.toLowerCase()) || 
                  (key === 'COLLECTIONS' && location.pathname === '/products' && !location.search)

                return (
                  <div
                    key={key}
                    className="relative py-1"
                    onMouseEnter={() => handleMouseEnter(key)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      to={cat.path}
                      className={`flex items-center gap-1 text-[12px] tracking-[0.16em] uppercase font-medium transition-colors duration-200 ${
                        isActive || isOpen ? 'text-[#4A0A16] font-semibold' : 'text-[#382820] hover:text-[#4A0A16]'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <ChevronDown
                        size={12}
                        className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#B68C48]' : 'text-[#382820]/60'}`}
                      />
                    </Link>

                    {/* Dropdown Menu Card */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.18 }}
                          className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50 w-72 sm:w-80"
                        >
                          <div className="bg-[#FFFDF9] rounded-2xl shadow-[0_16px_45px_rgba(74,10,22,0.12)] border border-[#EBE1D4] overflow-hidden p-3.5">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EFE7DC]">
                              <span className="font-serif text-[11px] uppercase tracking-[0.2em] font-bold text-[#4A0A16]">
                                {cat.label}
                              </span>
                              <Link
                                to={cat.path}
                                onClick={() => setActiveDropdown(null)}
                                className="text-[10px] text-[#B68C48] hover:text-[#4A0A16] tracking-wider uppercase font-semibold flex items-center gap-1"
                              >
                                View All <ArrowRight size={10} />
                              </Link>
                            </div>

                            <div className="space-y-2">
                              {cat.items.map((item) => (
                                <Link
                                  key={item.name}
                                  to={item.path}
                                  onClick={() => setActiveDropdown(null)}
                                  className="group/item flex items-center gap-3 p-2 rounded-xl hover:bg-[#FAF5ED] transition-colors"
                                >
                                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#E8DEC0]">
                                    <ReliableImage
                                      src={item.img}
                                      alt={item.name}
                                      sizes="48px"
                                      loading="lazy"
                                      className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-serif text-[13px] font-bold text-[#4A0A16] group-hover/item:text-[#B68C48] transition-colors truncate">
                                      {item.name}
                                    </p>
                                    <p className="font-sans text-[10px] text-[#6A5A50] line-clamp-1">
                                      {item.desc}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}

            </nav>

            {/* ── Right: Pill Search Bar & Interactive Icons ── */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-3.5 shrink-0">
              
              {/* Pill-shaped Search Bar */}
              <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center">
                <div className="flex items-center gap-2 rounded-full border border-[#DFD3C5] bg-[#FAF6F0] px-3 py-1 transition-all duration-300 focus-within:border-[#B68C48] focus-within:bg-white focus-within:shadow-[0_2px_12px_rgba(182,140,72,0.12)] w-40 lg:w-52 xl:w-60">
                  <Search size={13} className="text-[#8C7A6B] shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search styles, collections..."
                    className="w-full bg-transparent text-[11px] text-[#2C1F18] placeholder-[#9E8E81] focus:outline-none"
                  />
                </div>
              </form>

              {/* User Profile */}
              {isAuthenticated ? (
                <div className="hidden sm:flex relative group/user items-center">
                  <Link
                    to="/profile"
                    className="touch-target p-2 text-[#382820] hover:text-[#4A0A16] transition-colors rounded-full hover:bg-black/5"
                    title={`Signed in as ${user?.name || 'Account'}`}
                  >
                    <User size={19} strokeWidth={1.75} />
                  </Link>
                  {/* Subtle hover menu */}
                  <div className="hidden group-hover/user:flex flex-col absolute right-0 top-full pt-1.5 z-50">
                    <div className="bg-white rounded-xl shadow-lg border border-[#E8DEC0] p-1.5 min-w-[130px] text-xs">
                      <Link to="/profile" className="px-2.5 py-1.5 hover:bg-[#FAF6F0] rounded-lg text-[#382820] font-medium block">
                        My Profile
                      </Link>
                      <Link to="/orders" className="px-2.5 py-1.5 hover:bg-[#FAF6F0] rounded-lg text-[#382820] font-medium block">
                        My Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-rose-50 text-rose-700 rounded-lg font-medium flex items-center gap-1.5 mt-0.5 border-t border-gray-100"
                      >
                        <LogOut size={12} /> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden sm:flex relative group/user items-center">
                  <Link
                    to="/login"
                    className="touch-target p-2 text-[#382820] hover:text-[#4A0A16] transition-colors rounded-full hover:bg-black/5"
                    title="Sign In / Login"
                  >
                    <User size={19} strokeWidth={1.75} />
                  </Link>
                  {/* Guest menu */}
                  <div className="hidden group-hover/user:flex flex-col absolute right-0 top-full pt-1.5 z-50">
                    <div className="bg-white rounded-xl shadow-lg border border-[#E8DEC0] p-1.5 min-w-[130px] text-xs">
                      <Link to="/login" className="px-2.5 py-1.5 hover:bg-[#FAF6F0] rounded-lg text-[#382820] font-medium block">
                        Sign In / Login
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Wishlist Icon */}
              <Link
                to="/wishlist"
                className="hidden sm:flex touch-target p-2 text-[#382820] hover:text-[#4A0A16] transition-colors rounded-full hover:bg-black/5"
                title="Wishlist"
              >
                <Heart size={19} strokeWidth={1.75} />
              </Link>

              {/* Shopping Bag Icon with Cart Count Badge */}
              <Link
                to="/cart"
                className="touch-target relative p-2 text-[#382820] hover:text-[#4A0A16] transition-colors rounded-full hover:bg-black/5"
                title="Shopping Bag"
              >
                <ShoppingBag size={19} strokeWidth={1.75} />
                {count > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#5A1020] text-white text-[9.5px] font-bold flex items-center justify-center shadow-xs">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Hamburger */}
              <button
                className="xl:hidden touch-target p-2 text-[#382820] hover:text-[#4A0A16] transition-colors rounded-full hover:bg-black/5"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open Mobile Menu"
              >
                <Menu size={22} />
              </button>

            </div>

          </div>
        </div>

      </header>

      {/* ══════════════════════════════════════════════════════════════
          3. MOBILE NAVIGATION DRAWER
      ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 right-0 z-[60] w-full max-w-[min(340px,calc(100vw-32px))] bg-[#FFFDF9] flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-center px-4 py-3 border-b border-[#EAE0D2] bg-[#FAF6F0]">
                <div className="flex items-center">
                  <img
                    src="/images/agvia-logo.webp"
                    alt="AGVIA Women's Wear Boutique"
                    width={112}
                    height={32}
                    loading="lazy"
                    decoding="async"
                    className="h-8 w-auto object-contain"
                  />
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="touch-target p-2 text-[#4A0A16] hover:bg-white rounded-full transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Search */}
              <div className="p-3 border-b border-[#EAE0D2]">
                <form onSubmit={(e) => { handleSearchSubmit(e); setMobileMenuOpen(false); }}>
                  <div className="flex items-center gap-2 rounded-full border border-[#DFD3C5] bg-[#FAF6F0] px-3.5 py-2">
                    <Search size={14} className="text-[#8C7A6B]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search styles, sarees, lehengas..."
                      className="w-full bg-transparent text-xs text-[#2C1F18] focus:outline-none"
                    />
                  </div>
                </form>
              </div>

              {/* Drawer Links */}
              <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between font-serif text-[15px] font-semibold text-[#4A0A16] hover:bg-[#FAF6F0] px-4 py-3 rounded-xl transition-all min-h-[44px]"
                >
                  <span>Home</span>
                  <ArrowRight size={14} className="text-[#B68C48]" />
                </Link>

                <div className="pt-3 pb-1 px-4">
                  <span className="text-[10px] uppercase tracking-[0.25em] font-sans font-bold text-[#B68C48]">
                    Boutique Collections
                  </span>
                </div>

                {Object.entries(NAV_CATEGORIES).map(([key, cat]) => (
                  <div key={key} className="space-y-0.5">
                    <Link
                      to={cat.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between font-serif text-[14px] font-medium text-[#382820] hover:text-[#4A0A16] hover:bg-[#FAF6F0] px-4 py-3 rounded-xl transition-all min-h-[44px]"
                    >
                      <span>{cat.label}</span>
                      <ArrowRight size={13} className="text-[#B68C48]/60" />
                    </Link>
                  </div>
                ))}

                <div className="pt-3 pb-1 px-4">
                  <span className="text-[10px] uppercase tracking-[0.25em] font-sans font-bold text-[#B68C48]">
                    Account & Privileges
                  </span>
                </div>

                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between font-serif text-[14px] text-[#382820] hover:bg-[#FAF6F0] px-4 py-3 rounded-xl transition-all min-h-[44px]"
                >
                  <span className="flex items-center gap-2"><Heart size={15} className="text-[#4A0A16]" /> Wishlist</span>
                  <ArrowRight size={13} className="text-[#B68C48]/60" />
                </Link>

                <Link
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between font-serif text-[14px] text-[#382820] hover:bg-[#FAF6F0] px-4 py-3 rounded-xl transition-all min-h-[44px]"
                >
                  <span className="flex items-center gap-2"><ShoppingBag size={15} className="text-[#4A0A16]" /> Shopping Bag</span>
                  <ArrowRight size={13} className="text-[#B68C48]/60" />
                </Link>

                <Link
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between font-serif text-[14px] text-[#382820] hover:bg-[#FAF6F0] px-4 py-3 rounded-xl transition-all min-h-[44px]"
                >
                  <span>My Orders</span>
                  <ArrowRight size={13} className="text-[#B68C48]/60" />
                </Link>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[#EAE0D2] bg-[#FAF6F0] flex items-center justify-between">
                {isAuthenticated ? (
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="text-xs text-rose-700 font-medium flex items-center gap-1.5"
                  >
                    <LogOut size={14} /> Sign Out ({user?.name?.split(' ')[0]})
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs text-[#4A0A16] font-semibold tracking-wider uppercase underline"
                  >
                    Sign In to Boutique
                  </Link>
                )}
                <span className="text-[10px] text-[#B68C48] tracking-widest uppercase">
                  AGVIA COUTURE
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          4. DEDICATED MOBILE BOTTOM NAVIGATION BAR (< sm screens)
      ══════════════════════════════════════════════════════════════ */}
      <nav aria-label="Mobile bottom navigation" className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-t border-[#E6C687]/30 shadow-[0_-4px_20px_rgba(90,16,32,0.06)] px-1.5 py-1 select-none">
        <div className="flex items-center justify-between w-full max-w-md mx-auto">
          {/* Home */}
          <Link
            to="/"
            className={`flex-1 min-w-0 flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors ${
              location.pathname === '/' ? 'text-[#5A1020] font-bold' : 'text-[#756B6C] hover:text-[#5A1020]'
            }`}
          >
            <Home size={18} strokeWidth={1.8} />
            <span className="text-[9px] tracking-wider uppercase mt-0.5 truncate">Home</span>
            {location.pathname === '/' && <span className="w-1.5 h-1.5 rounded-full bg-[#5A1020] mt-0.5" />}
          </Link>

          {/* Collections */}
          <Link
            to="/products"
            className={`flex-1 min-w-0 flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors ${
              location.pathname.startsWith('/products') ? 'text-[#5A1020] font-bold' : 'text-[#756B6C] hover:text-[#5A1020]'
            }`}
          >
            <Sparkles size={18} strokeWidth={1.8} />
            <span className="text-[9px] tracking-wider uppercase mt-0.5 truncate">Shop</span>
            {location.pathname.startsWith('/products') && <span className="w-1.5 h-1.5 rounded-full bg-[#5A1020] mt-0.5" />}
          </Link>

          {/* Search Trigger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex-1 min-w-0 flex flex-col items-center justify-center min-h-[44px] text-[#756B6C] hover:text-[#5A1020] transition-colors"
            aria-label="Open search and menu"
          >
            <Search size={18} strokeWidth={1.8} />
            <span className="text-[9px] tracking-wider uppercase mt-0.5 truncate">Explore</span>
          </button>

          {/* Wishlist */}
          <Link
            to="/wishlist"
            className={`flex-1 min-w-0 flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors ${
              location.pathname === '/wishlist' ? 'text-[#5A1020] font-bold' : 'text-[#756B6C] hover:text-[#5A1020]'
            }`}
          >
            <Heart size={18} strokeWidth={1.8} />
            <span className="text-[9px] tracking-wider uppercase mt-0.5 truncate">Saved</span>
            {location.pathname === '/wishlist' && <span className="w-1.5 h-1.5 rounded-full bg-[#5A1020] mt-0.5" />}
          </Link>

          {/* Bag */}
          <Link
            to="/cart"
            className={`flex-1 min-w-0 relative flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors ${
              location.pathname === '/cart' ? 'text-[#5A1020] font-bold' : 'text-[#756B6C] hover:text-[#5A1020]'
            }`}
          >
            <div className="relative">
              <ShoppingBag size={18} strokeWidth={1.8} />
              {count > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#5A1020] text-white text-[8.5px] font-bold flex items-center justify-center">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </div>
            <span className="text-[9px] tracking-wider uppercase mt-0.5 truncate">Bag</span>
            {location.pathname === '/cart' && <span className="w-1.5 h-1.5 rounded-full bg-[#5A1020] mt-0.5" />}
          </Link>
        </div>
      </nav>
    </>
  )
}
