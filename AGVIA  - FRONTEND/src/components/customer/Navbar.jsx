import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Menu, X, User, Search, Heart, ShoppingBag, LogOut,
  ArrowRight, MessageCircle, MapPin, ShieldCheck, Phone
} from 'lucide-react'
import { loggedOut } from '../../store/authSlice'
import { authService } from '../../services/authService'
import { broadcastAuthEvent } from '../../utils/authSync'
import { useCart } from '../../hooks/useCart'
import { motion, AnimatePresence } from 'framer-motion'
import BrandLogo from '../common/BrandLogo'
import { BUSINESS, buildWhatsAppUrl } from '../../constants/business'
import toast from 'react-hot-toast'

const NAV_LINKS = [
  { label: 'Home', path: '/', match: (loc) => loc.pathname === '/' },
  {
    label: 'Collections',
    path: '/products',
    match: (loc) => loc.pathname === '/products' && !loc.search.includes('category='),
  },
  {
    label: 'Dharmavaram Sarees',
    path: '/products?category=Dharmavaram+Silk+Sarees',
    match: (loc) => decodeURIComponent(loc.search).toLowerCase().includes('dharmavaram'),
  },
  {
    label: 'Kanchi-style Sarees',
    path: '/products?category=Kanchi-Style+Silk+Sarees',
    match: (loc) => decodeURIComponent(loc.search).toLowerCase().includes('kanchi'),
  },
  {
    label: 'Traditional Weaves',
    path: '/products?category=Traditional+Handloom+Weaves',
    match: (loc) => decodeURIComponent(loc.search).toLowerCase().includes('traditional'),
  },
  { label: 'About Us', path: '/about', match: (loc) => loc.pathname === '/about' },
  { label: 'Contact', path: '/contact', match: (loc) => loc.pathname === '/contact' },
]

const MOBILE_HEADLINES = [
  { text: 'DIRECT HANDLOOM WEAVER • DHARMAVARAM', icon: MapPin },
  { text: '15 YEARS WEAVING EXPERIENCE • SINCE 2019', icon: ShieldCheck },
  { text: `WHATSAPP ENQUIRY: ${BUSINESS.contact.whatsapp}`, icon: MessageCircle },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [headlineIndex, setHeadlineIndex] = useState(0)

  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { count } = useCart()

  useEffect(() => {
    const timer = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % MOBILE_HEADLINES.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname, location.search])

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

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {
      // ignore
    }
    dispatch(loggedOut({ role: 'CUSTOMER' }))
    broadcastAuthEvent('LOGOUT', { role: 'CUSTOMER' })
    toast.success('Signed out successfully')
    navigate('/')
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const whatsappShortcutUrl = buildWhatsAppUrl(
    'Namaste Lokesh Lingam Weaver, I would like to enquire about your Dharmavaram handloom sarees.'
  )

  return (
    <>
      {/* Spacer for sticky dual header */}
      <div className="h-[92px] md:h-[104px]" />

      <header className="fixed top-0 left-0 right-0 z-50 select-none shadow-[0_4px_24px_rgba(56,39,31,0.08)]">
        {/* 1. TOP HERITAGE BAR (DEEP MAROON) */}
        <div className="relative bg-[#651B2B] text-[#E7D4B9] border-b border-[#B58A45]/35 overflow-hidden">
          <div className="hidden md:flex w-full max-w-[1360px] mx-auto px-[clamp(16px,3vw,40px)] h-8 items-center justify-between text-[10px] tracking-[0.16em] uppercase font-medium">
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-[#B58A45] shrink-0" />
              <span>Direct Handloom Weaver • Dharmavaram, AP</span>
            </div>

            <div className="flex items-center gap-2 text-[#FBF5EA] tracking-[0.2em] font-serif text-[11px]">
              <span className="w-6 h-[1px] bg-[#B58A45]/70" />
              <span>15 Years of Weaving Experience • Since 2019</span>
              <span className="w-6 h-[1px] bg-[#B58A45]/70" />
            </div>

            <a
              href={whatsappShortcutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[#E7D4B9] hover:text-white transition-colors"
            >
              <MessageCircle size={12} className="text-[#B58A45] shrink-0" />
              <span>WhatsApp: {BUSINESS.contact.whatsapp}</span>
            </a>
          </div>

          {/* Mobile Ticker */}
          <div className="flex md:hidden w-full h-7 items-center justify-center px-3 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={headlineIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-1.5 text-[9.5px] tracking-[0.14em] uppercase font-semibold text-[#FBF5EA] whitespace-nowrap"
              >
                {(() => {
                  const item = MOBILE_HEADLINES[headlineIndex]
                  const Icon = item.icon
                  return <Icon size={11} className="text-[#B58A45] shrink-0" />
                })()}
                <span>{MOBILE_HEADLINES[headlineIndex].text}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* 2. MAIN NAVIGATION BAR (WARM IVORY) */}
        <div
          className={`relative bg-[#FBF5EA] border-b border-[#E7D4B9] transition-all duration-300 ${
            scrolled ? 'py-1.5' : 'py-2'
          }`}
        >
          <div className="w-full max-w-[1360px] mx-auto px-[clamp(12px,2.5vw,32px)] flex items-center justify-between gap-2 lg:gap-4">
            {/* Official Logo (Exact Asset) */}
            <Link
              to="/"
              className="flex items-center shrink-0 group py-0.5 select-none"
              aria-label="Lokesh Lingam Weaver Home"
            >
              <BrandLogo
                variant="light"
                size="md"
                priority
                className="transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-4 2xl:gap-5" aria-label="Primary Navigation">
              {NAV_LINKS.map((item) => {
                const active = item.match(location)
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`relative py-1.5 text-[11.5px] tracking-[0.12em] uppercase font-semibold whitespace-nowrap transition-colors ${
                      active ? 'text-[#651B2B]' : 'text-[#38271F] hover:text-[#651B2B]'
                    }`}
                  >
                    {item.label}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B58A45] rounded-full" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Tablet Navigation Links */}
            <nav className="hidden md:flex xl:hidden items-center gap-3 overflow-x-auto no-scrollbar" aria-label="Tablet Navigation">
              {NAV_LINKS.slice(0, 5).map((item) => {
                const active = item.match(location)
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`text-[10.5px] tracking-[0.1em] uppercase font-semibold whitespace-nowrap px-2 py-1 rounded-full transition-colors ${
                      active ? 'bg-[#651B2B] text-[#FBF5EA]' : 'text-[#38271F] hover:text-[#651B2B]'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Right Utility Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center">
                <div className="flex items-center gap-1.5 rounded-full border border-[#B58A45]/45 bg-white/85 px-3 py-1.5 transition-all focus-within:border-[#651B2B] focus-within:bg-white w-36 lg:w-44 2xl:w-52">
                  <Search size={13} className="text-[#6E5A4F] shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sarees..."
                    className="w-full bg-transparent text-[11px] text-[#38271F] placeholder-[#6E5A4F]/70 focus:outline-none"
                  />
                </div>
              </form>

              {/* WhatsApp Contact Shortcut */}
              <a
                href={whatsappShortcutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#65704B]/40 bg-[#65704B]/10 hover:bg-[#65704B] text-[#38271F] hover:text-white transition-all text-[10.5px] font-bold uppercase tracking-wider"
                title={`WhatsApp ${BUSINESS.contact.whatsapp}`}
              >
                <MessageCircle size={13} />
                <span className="hidden 2xl:inline">WhatsApp</span>
              </a>

              {/* Admin Panel Shortcut */}
              {isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN') && (
                <Link
                  to="/admin/dashboard"
                  className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-[#651B2B] text-[#FBF5EA] border border-[#B58A45]/60 rounded-full text-[10px] font-bold tracking-wider uppercase hover:bg-[#4A111D] transition-all"
                >
                  <ShieldCheck size={13} className="text-[#B58A45]" />
                  <span>Admin</span>
                </Link>
              )}

              {/* Account / Auth */}
              {isAuthenticated ? (
                <div className="relative group/user flex items-center gap-1">
                  <Link
                    to="/profile"
                    className="touch-target p-1.5 text-[#38271F] hover:text-[#651B2B] transition-colors rounded-full hover:bg-[#E7D4B9]/40 flex items-center gap-1.5"
                    title={`Signed in as ${user?.name || 'Account'}`}
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#651B2B] text-[#FBF5EA] flex items-center justify-center font-serif text-xs font-bold">
                      {user?.name?.[0]?.toUpperCase() || <User size={15} />}
                    </div>
                    <span className="hidden lg:inline text-[11px] font-medium text-[#38271F] max-w-[76px] truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                  </Link>

                  <div className="hidden group-hover/user:flex flex-col absolute right-0 top-full pt-1.5 z-50">
                    <div className="bg-white rounded-xl shadow-lg border border-[#E7D4B9] p-1.5 min-w-[150px] text-xs">
                      {(user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN') && (
                        <Link
                          to="/admin/dashboard"
                          className="px-2.5 py-1.5 hover:bg-[#FBF5EA] rounded-lg text-[#651B2B] font-bold flex items-center gap-1.5 border-b border-[#E7D4B9] mb-1"
                        >
                          <ShieldCheck size={13} className="text-[#B58A45]" /> Admin Dashboard
                        </Link>
                      )}
                      <Link to="/profile" className="px-2.5 py-1.5 hover:bg-[#FBF5EA] rounded-lg text-[#38271F] font-medium block">
                        My Profile
                      </Link>
                      <Link to="/orders" className="px-2.5 py-1.5 hover:bg-[#FBF5EA] rounded-lg text-[#38271F] font-medium block">
                        My Orders
                      </Link>
                      <Link to="/track-order" className="px-2.5 py-1.5 hover:bg-[#FBF5EA] rounded-lg text-[#38271F] font-medium block">
                        Track Order
                      </Link>
                      <Link to="/wishlist" className="px-2.5 py-1.5 hover:bg-[#FBF5EA] rounded-lg text-[#38271F] font-medium block">
                        My Wishlist
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-rose-50 text-rose-800 rounded-lg font-medium flex items-center gap-1.5 mt-0.5 border-t border-gray-100"
                      >
                        <LogOut size={12} /> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1 py-1.5 px-2.5 sm:px-3 rounded-full bg-[#651B2B]/10 hover:bg-[#651B2B] text-[#651B2B] hover:text-[#FBF5EA] transition-all text-[10.5px] font-bold uppercase tracking-wider border border-[#651B2B]/30"
                  title="Sign In"
                >
                  <User size={14} />
                  <span className="hidden xs:inline">Sign In</span>
                </Link>
              )}

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="hidden sm:flex touch-target p-2 text-[#38271F] hover:text-[#651B2B] transition-colors rounded-full hover:bg-[#E7D4B9]/40"
                title="Wishlist"
                aria-label="Wishlist"
              >
                <Heart size={18} strokeWidth={1.75} />
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="touch-target relative p-2 text-[#38271F] hover:text-[#651B2B] transition-colors rounded-full hover:bg-[#E7D4B9]/40"
                title="Shopping Bag"
                aria-label="Shopping Bag"
              >
                <ShoppingBag size={18} strokeWidth={1.75} />
                {count > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#651B2B] text-[#FBF5EA] text-[9.5px] font-bold flex items-center justify-center">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="xl:hidden touch-target p-2 text-[#38271F] hover:text-[#651B2B] transition-colors rounded-full hover:bg-[#E7D4B9]/40"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open Menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 3. MOBILE NAVIGATION DRAWER */}
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
              className="fixed inset-y-0 right-0 z-[60] w-full max-w-[min(340px,calc(100vw-32px))] bg-[#FBF5EA] flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-center px-4 py-3 border-b border-[#E7D4B9] bg-[#FBF5EA]">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
                  <BrandLogo variant="light" size="sm" />
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="touch-target p-2 text-[#651B2B] hover:bg-white rounded-full transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Search */}
              <div className="p-3 border-b border-[#E7D4B9]">
                <form
                  onSubmit={(e) => {
                    handleSearchSubmit(e)
                    setMobileMenuOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2 rounded-full border border-[#B58A45]/40 bg-white px-3.5 py-2">
                    <Search size={14} className="text-[#6E5A4F]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search handloom sarees..."
                      className="w-full bg-transparent text-xs text-[#38271F] focus:outline-none"
                    />
                  </div>
                </form>
              </div>

              {/* Drawer Navigation Links */}
              <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
                {NAV_LINKS.map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between font-serif text-[15px] font-semibold text-[#38271F] hover:text-[#651B2B] hover:bg-[#E7D4B9]/35 px-4 py-3 rounded-xl transition-all min-h-[44px]"
                  >
                    <span>{item.label}</span>
                    <ArrowRight size={14} className="text-[#B58A45]" />
                  </Link>
                ))}

                <div className="pt-3 pb-1 px-4">
                  <span className="text-[10px] uppercase tracking-[0.22em] font-sans font-bold text-[#B58A45]">
                    Customer Services
                  </span>
                </div>

                <Link
                  to="/track-order"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between font-serif text-[14px] text-[#38271F] hover:bg-[#E7D4B9]/35 px-4 py-3 rounded-xl min-h-[44px]"
                >
                  <span>Track Order</span>
                  <ArrowRight size={13} className="text-[#B58A45]" />
                </Link>

                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between font-serif text-[14px] text-[#38271F] hover:bg-[#E7D4B9]/35 px-4 py-3 rounded-xl min-h-[44px]"
                >
                  <span className="flex items-center gap-2"><Heart size={15} className="text-[#651B2B]" /> Wishlist</span>
                  <ArrowRight size={13} className="text-[#B58A45]" />
                </Link>

                <Link
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between font-serif text-[14px] text-[#38271F] hover:bg-[#E7D4B9]/35 px-4 py-3 rounded-xl min-h-[44px]"
                >
                  <span className="flex items-center gap-2"><ShoppingBag size={15} className="text-[#651B2B]" /> Shopping Bag ({count})</span>
                  <ArrowRight size={13} className="text-[#B58A45]" />
                </Link>

                {isAuthenticated ? (
                  <>
                    <Link
                      to="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between font-serif text-[14px] text-[#38271F] hover:bg-[#E7D4B9]/35 px-4 py-3 rounded-xl min-h-[44px]"
                    >
                      <span>My Orders</span>
                      <ArrowRight size={13} className="text-[#B58A45]" />
                    </Link>
                    {(user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN') && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between font-serif text-[14px] font-bold text-[#651B2B] bg-white border border-[#B58A45]/40 px-4 py-3 rounded-xl min-h-[44px]"
                      >
                        <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-[#B58A45]" /> Admin Dashboard</span>
                        <ArrowRight size={13} className="text-[#B58A45]" />
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center justify-between font-serif text-[14px] font-semibold text-rose-800 hover:bg-rose-50 px-4 py-3 rounded-xl min-h-[44px]"
                    >
                      <span className="flex items-center gap-2"><LogOut size={15} /> Sign Out</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 mt-3 py-3 rounded-full bg-[#651B2B] text-[#FBF5EA] text-xs font-bold uppercase tracking-wider"
                  >
                    <User size={14} /> Sign In / Register
                  </Link>
                )}
              </div>

              {/* Drawer Bottom WhatsApp & Phone */}
              <div className="p-4 border-t border-[#E7D4B9] bg-[#E7D4B9]/30 space-y-2">
                <a
                  href={whatsappShortcutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#65704B] text-white text-xs font-bold uppercase tracking-wider"
                >
                  <MessageCircle size={14} /> WhatsApp {BUSINESS.contact.whatsapp}
                </a>
                <a
                  href={`tel:${BUSINESS.contact.phoneRaw}`}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[#38271F]"
                >
                  <Phone size={13} className="text-[#651B2B]" /> Call {BUSINESS.contact.phone}
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
