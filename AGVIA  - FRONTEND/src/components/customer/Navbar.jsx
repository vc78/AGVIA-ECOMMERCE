import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Menu, X, User, Search, Heart, ShoppingBag, LogOut,
  ChevronDown, ShieldCheck, Sparkles, ArrowRight, Home
} from 'lucide-react'
import { loggedOut } from '../../store/authSlice'
import { authService } from '../../services/authService'
import { broadcastAuthEvent } from '../../utils/authSync'
import { useCart } from '../../hooks/useCart'
import { motion, AnimatePresence } from 'framer-motion'
import ReliableImage from '../common/ReliableImage'
import toast from 'react-hot-toast'

// ── Luxury Boutique Categories & Navigation Structure ─────────────────
const NAV_CATEGORIES = {
  COLLECTIONS: {
    label: 'Collections',
    path: '/products',
    items: [
      { name: 'Bridal Couture', path: '/products?category=Lehengas', desc: 'Regal bridal sets & trousseau edits', img: '/images/wedding_lehenga.jpg' },
      { name: 'Festive Celebrations', path: '/products?category=Sarees', desc: 'Handwoven pure silks & organza', img: '/images/classic_silk_saree.jpg' },
      { name: 'Royal Anarkalis', path: '/products?category=Anarkalis+%26+Kurtas', desc: 'Flowing silhouettes with zardozi', img: '/images/anarkali_set.jpg' },
      { name: 'Modern Evening', path: '/products?category=Dresses+%26+Gowns', desc: 'Contemporary couture & gowns', img: '/images/evening_gown.jpg' },
    ]
  },
  SAREES: {
    label: 'Sarees',
    path: '/products?category=Sarees',
    items: [
      { name: 'Classic Silk Sarees', path: '/products?category=Sarees', desc: 'Traditional heirloom weaves with zari', img: '/images/classic_silk_saree.jpg' },
      { name: 'Floral Organza Sarees', path: '/products?category=Sarees', desc: 'Sheer lightweight pastels & motifs', img: '/images/floral_organza_saree.jpg' },
      { name: 'Banarasi & Kanjeevaram', path: '/products?category=Sarees', desc: 'Pure temple border silks', img: '/images/classic_silk_saree.jpg' },
    ]
  },
  LEHENGAS: {
    label: 'Lehengas',
    path: '/products?category=Lehengas',
    items: [
      { name: 'Royal Wedding Lehengas', path: '/products?category=Lehengas', desc: 'Heavy hand-embroidered bridal sets', img: '/images/wedding_lehenga.jpg' },
      { name: 'Festive Silk Lehengas', path: '/products?category=Lehengas', desc: 'Lightweight festive flared skirts', img: '/images/festive_lehenga_set.jpg' },
    ]
  },
  KURTAS: {
    label: 'Kurtas',
    path: '/products?category=Anarkalis+%26+Kurtas',
    items: [
      { name: 'Embroidered Anarkalis', path: '/products?category=Anarkalis+%26+Kurtas', desc: 'Grand floor-length festive kalis', img: '/images/anarkali_set.jpg' },
      { name: 'Everyday Kurta Sets', path: '/products?category=Anarkalis+%26+Kurtas', desc: 'Chic comfortable daily wear', img: '/images/everyday_kurta_set.jpg' },
      { name: 'Festive Kurtis', path: '/products?category=Kurtis', desc: 'Intricate neckline & threadwork', img: '/images/festive_kurti.jpg' },
    ]
  },
  WESTERN_WEAR: {
    label: 'Western Wear',
    path: '/products?category=Western+Wear',
    items: [
      { name: 'Tailored Co-ord Sets', path: '/products?category=Western+Wear', desc: 'Chic modern co-ordinated outfits', img: '/images/coord_set.jpg' },
      { name: 'Evening Dresses & Gowns', path: '/products?category=Dresses+%26+Gowns', desc: 'Cocktail gowns with subtle sheen', img: '/images/evening_gown.jpg' },
    ]
  },
  MORE: {
    label: 'More',
    path: '/about',
    items: [
      { name: 'Our Weaving Story', path: '/about', desc: 'The heritage and philosophy of NOOLU' },
      { name: 'VIP Privilege Circle', path: '/subscription', desc: 'Boutique perks, preview access & styling' },
      { name: 'Bespoke Tailoring', path: '/wedding-orders', desc: 'Custom made-to-measure bridal & couture' },
      { name: 'Exclusive Offers', path: '/offers', desc: 'Seasonal privileges & celebratory codes' },
      { name: 'Corporate & Bulk Gifting', path: '/corporate-orders', desc: 'Artisanal gift hampers & bespoke sets' },
    ]
  }
}

// ── Delicate Botanical Floral Illustration — Left Edge ─────────────────
function BotanicalFloralLeft({ className = '' }) {
  return (
    <svg
      viewBox="0 0 110 88"
      fill="none"
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="petalGlowL1" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFDF7" />
          <stop offset="65%" stopColor="#F8EDE0" />
          <stop offset="100%" stopColor="#E6D3BC" />
        </radialGradient>
        <radialGradient id="petalGlowL2" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFFBF2" />
          <stop offset="70%" stopColor="#F5E6D4" />
          <stop offset="100%" stopColor="#DFCEB8" />
        </radialGradient>
        <linearGradient id="leafGradL1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9EAD78" />
          <stop offset="50%" stopColor="#788652" />
          <stop offset="100%" stopColor="#576337" />
        </linearGradient>
        <linearGradient id="leafGradL2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#B3C48C" />
          <stop offset="60%" stopColor="#809059" />
          <stop offset="100%" stopColor="#5A663A" />
        </linearGradient>
        <radialGradient id="flowerCenterL" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F5B335" />
          <stop offset="60%" stopColor="#D9822B" />
          <stop offset="100%" stopColor="#800020" />
        </radialGradient>
      </defs>

      {/* Gentle leaf cluster extending from edge */}
      {/* Leaf 1 — Top Left */}
      <path
        d="M2 18 C12 8, 30 10, 36 22 C26 28, 10 26, 2 18 Z"
        fill="url(#leafGradL1)"
        opacity="0.85"
      />
      <path d="M4 18 Q20 18 34 22" stroke="#C99A3B" strokeWidth="0.6" opacity="0.6" />

      {/* Leaf 2 — Bottom Left */}
      <path
        d="M0 64 C14 54, 32 58, 38 72 C26 78, 12 76, 0 64 Z"
        fill="url(#leafGradL2)"
        opacity="0.85"
      />
      <path d="M2 65 Q22 66 36 72" stroke="#C99A3B" strokeWidth="0.6" opacity="0.6" />

      {/* Leaf 3 — Soft trailing bud leaf */}
      <path
        d="M24 40 C34 32, 50 36, 54 48 C42 54, 30 50, 24 40 Z"
        fill="url(#leafGradL1)"
        opacity="0.75"
      />
      <path d="M26 41 Q40 42 52 48" stroke="#C99A3B" strokeWidth="0.5" opacity="0.5" />

      {/* Main Floral Blossom — Centered slightly off edge */}
      <g transform="translate(18, 44)">
        {/* Blossom Petals */}
        <path d="M0 -5 C-12 -22, 12 -22, 0 -5 Z" fill="url(#petalGlowL1)" stroke="#E8DAC8" strokeWidth="0.5" />
        <path d="M-5 0 C-22 -12, -22 12, -5 0 Z" fill="url(#petalGlowL2)" stroke="#E8DAC8" strokeWidth="0.5" />
        <path d="M0 5 C-12 22, 12 22, 0 5 Z" fill="url(#petalGlowL1)" stroke="#E8DAC8" strokeWidth="0.5" />
        <path d="M5 0 C22 -12, 22 12, 5 0 Z" fill="url(#petalGlowL2)" stroke="#E8DAC8" strokeWidth="0.5" />
        <path d="M-3 -3 C-18 -18, -2 -24, -3 -3 Z" fill="url(#petalGlowL1)" opacity="0.9" />
        <path d="M3 -3 C18 -18, 24 -2, 3 -3 Z" fill="url(#petalGlowL2)" opacity="0.9" />
        <path d="M3 3 C18 18, 2 24, 3 3 Z" fill="url(#petalGlowL1)" opacity="0.9" />
        <path d="M-3 3 C-18 18, -24 2, -3 3 Z" fill="url(#petalGlowL2)" opacity="0.9" />

        {/* Golden pistil center */}
        <circle cx="0" cy="0" r="4.2" fill="url(#flowerCenterL)" />
        <circle cx="0" cy="0" r="1.5" fill="#FFE08A" />
        {/* Stamen accent dots */}
        <circle cx="-2.5" cy="-2.5" r="0.7" fill="#800020" />
        <circle cx="2.5" cy="-2.5" r="0.7" fill="#800020" />
        <circle cx="2.5" cy="2.5" r="0.7" fill="#800020" />
        <circle cx="-2.5" cy="2.5" r="0.7" fill="#800020" />
      </g>

      {/* Secondary Petite Bud Blossom — Higher corner */}
      <g transform="translate(10, 20)">
        <ellipse cx="0" cy="0" rx="6.5" ry="5.5" fill="url(#petalGlowL2)" stroke="#E8DAC8" strokeWidth="0.4" />
        <circle cx="0" cy="0" r="2.2" fill="url(#flowerCenterL)" />
      </g>
    </svg>
  )
}

// ── Delicate Botanical Floral Illustration — Right Edge ────────────────
function BotanicalFloralRight({ className = '' }) {
  return (
    <svg
      viewBox="0 0 110 88"
      fill="none"
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="petalGlowR1" cx="65%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFDF7" />
          <stop offset="65%" stopColor="#F8EDE0" />
          <stop offset="100%" stopColor="#E6D3BC" />
        </radialGradient>
        <radialGradient id="petalGlowR2" cx="60%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFFBF2" />
          <stop offset="70%" stopColor="#F5E6D4" />
          <stop offset="100%" stopColor="#DFCEB8" />
        </radialGradient>
        <linearGradient id="leafGradR1" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9EAD78" />
          <stop offset="50%" stopColor="#788652" />
          <stop offset="100%" stopColor="#576337" />
        </linearGradient>
        <linearGradient id="leafGradR2" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#B3C48C" />
          <stop offset="60%" stopColor="#809059" />
          <stop offset="100%" stopColor="#5A663A" />
        </linearGradient>
        <radialGradient id="flowerCenterR" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F5B335" />
          <stop offset="60%" stopColor="#D9822B" />
          <stop offset="100%" stopColor="#800020" />
        </radialGradient>
      </defs>

      {/* Gentle leaf cluster extending from right edge */}
      {/* Leaf 1 — Top Right */}
      <path
        d="M108 18 C98 8, 80 10, 74 22 C84 28, 100 26, 108 18 Z"
        fill="url(#leafGradR1)"
        opacity="0.85"
      />
      <path d="M106 18 Q90 18 76 22" stroke="#C99A3B" strokeWidth="0.6" opacity="0.6" />

      {/* Leaf 2 — Bottom Right */}
      <path
        d="M110 64 C96 54, 78 58, 72 72 C84 78, 98 76, 110 64 Z"
        fill="url(#leafGradR2)"
        opacity="0.85"
      />
      <path d="M108 65 Q88 66 74 72" stroke="#C99A3B" strokeWidth="0.6" opacity="0.6" />

      {/* Leaf 3 — Soft trailing leaf */}
      <path
        d="M86 40 C76 32, 60 36, 56 48 C68 54, 80 50, 86 40 Z"
        fill="url(#leafGradR1)"
        opacity="0.75"
      />
      <path d="M84 41 Q70 42 58 48" stroke="#C99A3B" strokeWidth="0.5" opacity="0.5" />

      {/* Main Floral Blossom — Framing right corner */}
      <g transform="translate(92, 44)">
        {/* Blossom Petals */}
        <path d="M0 -5 C12 -22, -12 -22, 0 -5 Z" fill="url(#petalGlowR1)" stroke="#E8DAC8" strokeWidth="0.5" />
        <path d="M5 0 C22 -12, 22 12, 5 0 Z" fill="url(#petalGlowR2)" stroke="#E8DAC8" strokeWidth="0.5" />
        <path d="M0 5 C12 22, -12 22, 0 5 Z" fill="url(#petalGlowR1)" stroke="#E8DAC8" strokeWidth="0.5" />
        <path d="M-5 0 C-22 -12, -22 12, -5 0 Z" fill="url(#petalGlowR2)" stroke="#E8DAC8" strokeWidth="0.5" />
        <path d="M3 -3 C18 -18, 2 -24, 3 -3 Z" fill="url(#petalGlowR1)" opacity="0.9" />
        <path d="M-3 -3 C-18 -18, -24 -2, -3 -3 Z" fill="url(#petalGlowR2)" opacity="0.9" />
        <path d="M-3 3 C-18 18, -2 24, -3 3 Z" fill="url(#petalGlowR1)" opacity="0.9" />
        <path d="M3 3 C18 18, 24 2, 3 3 Z" fill="url(#petalGlowR2)" opacity="0.9" />

        {/* Golden pistil center */}
        <circle cx="0" cy="0" r="4.2" fill="url(#flowerCenterR)" />
        <circle cx="0" cy="0" r="1.5" fill="#FFE08A" />
        {/* Stamen accent dots */}
        <circle cx="-2.5" cy="-2.5" r="0.7" fill="#800020" />
        <circle cx="2.5" cy="-2.5" r="0.7" fill="#800020" />
        <circle cx="2.5" cy="2.5" r="0.7" fill="#800020" />
        <circle cx="-2.5" cy="2.5" r="0.7" fill="#800020" />
      </g>

      {/* Secondary Petite Bud Blossom */}
      <g transform="translate(100, 20)">
        <ellipse cx="0" cy="0" rx="6.5" ry="5.5" fill="url(#petalGlowR2)" stroke="#E8DAC8" strokeWidth="0.4" />
        <circle cx="0" cy="0" r="2.2" fill="url(#flowerCenterR)" />
      </g>
    </svg>
  )
}

// ── Miniature Vintage Wooden & Crimson Silk Thread Spool ───────────────
function MiniatureThreadSpool({ className = '' }) {
  return (
    <div
      className={`relative flex items-center shrink-0 ${className}`}
      aria-hidden="true"
      title="NOOLU Handcrafted Threadwork"
    >
      <svg
        viewBox="0 0 38 44"
        fill="none"
        className="w-7 sm:w-8 md:w-8.5 h-auto shrink-0 drop-shadow-[0_2px_4px_rgba(50,29,28,0.12)]"
      >
        <defs>
          {/* Wood Flange Gradient */}
          <linearGradient id="spoolWood" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9C6B34" />
            <stop offset="25%" stopColor="#C99458" />
            <stop offset="50%" stopColor="#E5BE8A" />
            <stop offset="75%" stopColor="#C99458" />
            <stop offset="100%" stopColor="#7E5224" />
          </linearGradient>
          {/* Crimson / Maroon Wound Silk Thread Gradient */}
          <linearGradient id="silkThreadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5E0017" />
            <stop offset="25%" stopColor="#800020" />
            <stop offset="50%" stopColor="#A81D3D" />
            <stop offset="75%" stopColor="#800020" />
            <stop offset="100%" stopColor="#4A0012" />
          </linearGradient>
          <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C99A3B" />
            <stop offset="50%" stopColor="#F5D79E" />
            <stop offset="100%" stopColor="#A67B28" />
          </linearGradient>
        </defs>

        {/* Soft shadow under base */}
        <ellipse cx="19" cy="40" rx="14" ry="2.5" fill="#321D1C" fillOpacity="0.14" />

        {/* Bottom Wooden Flange */}
        <ellipse cx="19" cy="36" rx="13" ry="4" fill="url(#spoolWood)" stroke="url(#goldRim)" strokeWidth="0.6" />
        <path d="M6 36 C6 38 32 38 32 36 L32 37.5 C32 39.5 6 39.5 6 37.5 Z" fill="#6E441E" />

        {/* Spool Central Cylinder with Wound Maroon Silk Thread */}
        <rect x="9.5" y="12" width="19" height="22" rx="1.5" fill="url(#silkThreadGrad)" />
        {/* Realistic fine horizontal thread lines */}
        <line x1="9.5" y1="15" x2="28.5" y2="15" stroke="#FFEAEF" strokeWidth="0.4" strokeOpacity="0.35" />
        <line x1="9.5" y1="18" x2="28.5" y2="18" stroke="#3A000E" strokeWidth="0.4" strokeOpacity="0.5" />
        <line x1="9.5" y1="21" x2="28.5" y2="21" stroke="#FFEAEF" strokeWidth="0.4" strokeOpacity="0.35" />
        <line x1="9.5" y1="24" x2="28.5" y2="24" stroke="#3A000E" strokeWidth="0.4" strokeOpacity="0.5" />
        <line x1="9.5" y1="27" x2="28.5" y2="27" stroke="#FFEAEF" strokeWidth="0.4" strokeOpacity="0.35" />
        <line x1="9.5" y1="30" x2="28.5" y2="30" stroke="#3A000E" strokeWidth="0.4" strokeOpacity="0.5" />

        {/* Top Wooden Flange */}
        <path d="M6 10 C6 12 32 12 32 10 L32 11.5 C32 13.5 6 13.5 6 11.5 Z" fill="#6E441E" />
        <ellipse cx="19" cy="10" rx="13" ry="4" fill="url(#spoolWood)" stroke="url(#goldRim)" strokeWidth="0.6" />
        {/* Spool top spindle hole */}
        <ellipse cx="19" cy="10" rx="3.5" ry="1.2" fill="#42250F" />

        {/* Flowing unwound thread strand leading towards logo & bottom */}
        <path
          d="M28.5 31 C34 32, 36 35, 38 39"
          stroke="#800020"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M28.5 31.8 C34 32.8, 36 35.8, 38 39.8"
          stroke="#C99A3B"
          strokeWidth="0.7"
          strokeOpacity="0.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  )
}

// ── Traditional Indian Loom Weaving Ornamental Knot (Brahma Mudi) ─────
function OrnamentalWeavingKnot() {
  return (
    <svg
      viewBox="0 0 48 24"
      fill="none"
      className="w-12 h-6 shrink-0"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="knotGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5DC9A" />
          <stop offset="50%" stopColor="#C99A3B" />
          <stop offset="100%" stopColor="#9C7020" />
        </linearGradient>
      </defs>
      {/* Horizontal connector thread wings meeting the bottom flowing lines */}
      <line x1="0" y1="12" x2="13" y2="12" stroke="url(#knotGoldGrad)" strokeWidth="1" strokeDasharray="1.5 1" />
      <line x1="35" y1="12" x2="48" y2="12" stroke="url(#knotGoldGrad)" strokeWidth="1" strokeDasharray="1.5 1" />

      {/* Traditional Indian Loom Knot (Brahma Mudi / Endless Textile Knot) */}
      {/* Outer intertwined diamond loop */}
      <path
        d="M24,2 L34,12 L24,22 L14,12 Z"
        stroke="url(#knotGoldGrad)"
        strokeWidth="1.3"
        fill="#FFF9F0"
      />
      {/* Inner weave petal loops in deep maroon */}
      <path
        d="M24,5 C27,8 30,11 30,12 C30,13 27,16 24,19 C21,16 18,13 18,12 C18,11 21,8 24,5 Z"
        stroke="#800020"
        strokeWidth="1.1"
        fill="#FFF9F0"
      />
      {/* Center radiant gold bead accent */}
      <circle cx="24" cy="12" r="2.2" fill="url(#knotGoldGrad)" />
      <circle cx="24" cy="12" r="0.8" fill="#800020" />
      {/* Four directional knot nodes */}
      <circle cx="14" cy="12" r="1.2" fill="url(#knotGoldGrad)" />
      <circle cx="34" cy="12" r="1.2" fill="url(#knotGoldGrad)" />
      <circle cx="24" cy="2" r="1.2" fill="url(#knotGoldGrad)" />
      <circle cx="24" cy="22" r="1.2" fill="url(#knotGoldGrad)" />
    </svg>
  )
}

// ── Thin, Flowing Maroon & Antique-Gold Bottom Thread Motif ────────────
function FlowingHeritageThread({ className = '' }) {
  return (
    <div
      className={`absolute bottom-0 left-0 right-0 h-6 pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 24"
        fill="none"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {/* Secondary Antique-Gold Thread Line */}
        <path
          d="M0,17 C160,22 320,13 540,17 C640,19 700,20 720,20 C740,20 800,19 900,17 C1120,13 1280,22 1440,17"
          stroke="#C99A3B"
          strokeWidth="0.85"
          strokeOpacity="0.8"
        />
        {/* Primary Flowing Maroon Silk Thread Line */}
        <path
          d="M0,19 C180,24 340,15 560,19 C650,21 700,22 720,22 C740,22 790,21 880,19 C1100,15 1260,24 1440,19"
          stroke="#800020"
          strokeWidth="1.2"
          strokeOpacity="0.95"
        />
      </svg>

      {/* Centered Weaving Ornamental Knot Medallion */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[1px] z-10 flex items-center justify-center">
        <OrnamentalWeavingKnot />
      </div>
    </div>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAnnouncement, setShowAnnouncement] = useState(() => {
    try {
      return sessionStorage.getItem('noolu_announcement_dismissed') !== 'true'
    } catch {
      return true
    }
  })

  const dropdownTimeoutRef = useRef(null)
  const searchInputRef = useRef(null)

  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { count } = useCart()

  // Track scroll position for subtle elevation change
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile drawer and dropdown on route change
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

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null)
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleDismissAnnouncement = () => {
    setShowAnnouncement(false)
    try {
      sessionStorage.setItem('noolu_announcement_dismissed', 'true')
    } catch {
      // ignore
    }
  }

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
      setActiveDropdown(null)
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
      {/* ── Dynamic Spacer for Fixed Header ─────────────────────────── */}
      {/* Ensures hero carousel and page content sit flush with zero gap */}
      <div
        className={`transition-all duration-300 ${
          showAnnouncement
            ? 'h-[110px] sm:h-[114px] md:h-[118px]'
            : 'h-[80px] sm:h-[84px] md:h-[88px]'
        }`}
      />

      <header
        className={`fixed top-0 left-0 right-0 z-50 select-none transition-shadow duration-300 ${
          scrolled
            ? 'shadow-[0_4px_22px_rgba(50,29,28,0.06)]'
            : 'shadow-[0_2px_14px_rgba(50,29,28,0.035)]'
        }`}
      >
        {/* ══════════════════════════════════════════════════════════════
            1. OPTIONAL SLIM ANNOUNCEMENT STRIP (DISMISSIBLE)
        ══════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showAnnouncement && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#800020] text-[#FFF9F0] border-b border-[#6B001B] overflow-hidden"
            >
              <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 h-7 sm:h-7.5 flex items-center justify-between text-[11px] sm:text-xs font-medium tracking-wide">
                <div className="w-6 shrink-0" /> {/* Spacer for optical center balance */}

                <div className="flex items-center gap-2 text-center truncate">
                  <span className="text-[#FFF9F0]/90">
                    Complimentary Shipping on Eligible Orders
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDismissAnnouncement}
                  className="w-6 h-6 flex items-center justify-center text-[#FFF9F0]/70 hover:text-white rounded-full transition-colors shrink-0"
                  aria-label="Dismiss announcement"
                  title="Dismiss announcement"
                >
                  <X size={13} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════════
            2. PRIMARY NOOLU HERITAGE THREADWORK NAVIGATION BAR
               - Warm Ivory Background: #FFF9F0
               - Height: 80–90px on Desktop (h-[84px] md:h-[88px])
               - Thin Antique-Gold Borders & Soft Shadow
        ══════════════════════════════════════════════════════════════ */}
        <div className="relative bg-gradient-to-b from-[#FFFDF9] via-[#FFF9F0] to-[#FFF7EC] border-t border-b border-[#C99A3B]/30 h-[80px] sm:h-[84px] md:h-[88px] flex items-center overflow-hidden">

          {/* ── Delicate Botanical Floral Illustrations at Far Edges (Desktop) ── */}
          <BotanicalFloralLeft className="absolute left-0 top-0 bottom-0 w-24 sm:w-28 md:w-32 h-full z-10 hidden md:block" />
          <BotanicalFloralRight className="absolute right-0 top-0 bottom-0 w-24 sm:w-28 md:w-32 h-full z-10 hidden md:block" />

          {/* ── Thin, Flowing Maroon & Antique-Gold Thread with Center Knot ── */}
          <FlowingHeritageThread className="hidden md:block z-10" />

          {/* ── Content Container ── */}
          <div className="relative w-full max-w-[1380px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 flex items-center justify-between gap-3 sm:gap-4 z-20">

            {/* ── Left: Miniature Thread Spool + Official NOOLU Logo ── */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Miniature Thread Spool Illustration */}
              <MiniatureThreadSpool className="hidden sm:flex" />

              {/* Official NOOLU Logo */}
              <Link
                to="/"
                className="flex items-center shrink-0 group py-1"
                title="NOOLU — A Rhythm of Loom"
              >
                <img
                  src="/images/agvia-logo.webp"
                  alt="NOOLU — A Rhythm of Loom"
                  width={124}
                  height={56}
                  fetchpriority="high"
                  decoding="async"
                  className="h-10 sm:h-11 md:h-12 w-auto object-contain transition-opacity duration-200 group-hover:opacity-90"
                />
              </Link>
            </div>

            {/* ── Centre: Primary Navigation Links (Desktop) ── */}
            <nav
              aria-label="Main Navigation"
              className="hidden lg:flex items-center gap-5 xl:gap-8 text-[13px] xl:text-[13.5px] font-sans font-medium text-[#321D1C]"
            >
              {/* HOME LINK WITH REFINED MAROON UNDERLINE */}
              <Link
                to="/"
                className={`relative py-2 px-1 transition-colors duration-200 ${
                  isHomeActive
                    ? 'text-[#800020] font-semibold'
                    : 'hover:text-[#800020]'
                }`}
              >
                <span>Home</span>
                {isHomeActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#800020] rounded-full" />
                )}
              </Link>

              {/* CATEGORIES WITH DROPDOWNS */}
              {Object.entries(NAV_CATEGORIES).map(([key, cat]) => {
                const isOpen = activeDropdown === key
                const isActive =
                  (key === 'COLLECTIONS' && location.pathname === '/products' && !location.search) ||
                  (key === 'SAREES' && location.search.includes('category=Sarees')) ||
                  (key === 'LEHENGAS' && location.search.includes('category=Lehengas')) ||
                  (key === 'KURTAS' && (location.search.includes('category=Anarkalis') || location.search.includes('category=Kurtis'))) ||
                  (key === 'WESTERN_WEAR' && (location.search.includes('category=Western+Wear') || location.search.includes('category=Dresses')))

                return (
                  <div
                    key={key}
                    className="relative py-2"
                    onMouseEnter={() => handleMouseEnter(key)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      to={cat.path}
                      className={`flex items-center gap-1 px-1 py-1 transition-colors duration-200 ${
                        isActive || isOpen
                          ? 'text-[#800020] font-semibold'
                          : 'hover:text-[#800020]'
                      }`}
                      aria-expanded={isOpen}
                    >
                      <span>{cat.label}</span>
                      <ChevronDown
                        size={13}
                        className={`transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#800020]' : 'text-[#321D1C]/60'
                        }`}
                      />
                    </Link>

                    {/* Refined Active Underline */}
                    {isActive && (
                      <span className="absolute -bottom-1 left-1 right-1 h-[2.5px] bg-[#800020] rounded-full" />
                    )}

                    {/* Minimal Premium Dropdown Card */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.16 }}
                          className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 ${
                            cat.items?.[0]?.img ? 'w-80' : 'w-64'
                          }`}
                        >
                          <div className="bg-[#FFF9F0] rounded-2xl shadow-[0_16px_40px_rgba(50,29,28,0.1)] border border-[#C99A3B]/30 overflow-hidden p-3">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#321D1C]/10">
                              <span className="text-xs uppercase tracking-wider font-semibold text-[#800020]">
                                {cat.label}
                              </span>
                              <Link
                                to={cat.path}
                                onClick={() => setActiveDropdown(null)}
                                className="text-[11px] text-[#800020] hover:underline font-medium flex items-center gap-1"
                              >
                                View All <ArrowRight size={11} />
                              </Link>
                            </div>

                            <div className="space-y-1">
                              {cat.items.map((item) => (
                                <Link
                                  key={item.name}
                                  to={item.path}
                                  onClick={() => setActiveDropdown(null)}
                                  className="group/item flex items-center gap-3 p-2 rounded-xl hover:bg-[#800020]/5 transition-colors"
                                >
                                  {item.img && (
                                    <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-[#C99A3B]/20 bg-[#FAF6F0]">
                                      <ReliableImage
                                        src={item.img}
                                        alt={item.name}
                                        sizes="44px"
                                        loading="lazy"
                                        className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-[#321D1C] group-hover/item:text-[#800020] transition-colors truncate">
                                      {item.name}
                                    </p>
                                    {item.desc && (
                                      <p className="text-[10px] text-[#321D1C]/60 line-clamp-1">
                                        {item.desc}
                                      </p>
                                    )}
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

            {/* ── Right Actions: Search, Sign In, Wishlist, Shopping Bag ── */}
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-3.5 shrink-0">

              {/* Compact Search Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="hidden sm:flex items-center"
              >
                <div className="flex items-center gap-2 rounded-full border border-[#C99A3B]/35 bg-white/80 px-3.5 py-1.5 transition-all duration-300 focus-within:border-[#800020] focus-within:bg-white focus-within:shadow-[0_2px_10px_rgba(128,0,32,0.06)] w-36 md:w-44 lg:w-52 focus-within:w-48 md:focus-within:w-56 shadow-[0_1px_4px_rgba(50,29,28,0.03)]">
                  <Search size={14} className="text-[#321D1C]/50 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search styles, collections..."
                    className="w-full bg-transparent text-xs text-[#321D1C] placeholder-[#321D1C]/40 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-[#321D1C]/40 hover:text-[#321D1C] text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </form>

              {/* Atelier Admin Direct Header Badge (if logged in as admin) */}
              {isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN') && (
                <Link
                  to="/admin/dashboard"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[#800020] text-white rounded-full text-[11px] font-semibold tracking-wide hover:bg-[#660019] transition-all shadow-xs shrink-0"
                  title="Open Atelier Admin Console"
                >
                  <ShieldCheck size={13} className="text-[#FFF9F0]" />
                  <span>Admin</span>
                </Link>
              )}

              {/* Sign In / Account Icon & Menu */}
              {isAuthenticated ? (
                <div className="relative group/user flex items-center">
                  <Link
                    to="/profile"
                    className="p-1.5 text-[#321D1C] hover:text-[#800020] transition-colors rounded-full flex items-center gap-1.5"
                    title={`Signed in as ${user?.name || 'Account'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#800020] text-white flex items-center justify-center text-xs font-semibold shadow-xs">
                      {user?.name?.[0]?.toUpperCase() || <User size={15} />}
                    </div>
                    <span className="hidden xl:inline text-xs font-medium text-[#321D1C] max-w-[80px] truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                  </Link>

                  {/* Dropdown Menu on Desktop */}
                  <div className="hidden group-hover/user:flex flex-col absolute right-0 top-full pt-1 z-50">
                    <div className="bg-[#FFF9F0] rounded-xl shadow-lg border border-[#C99A3B]/30 p-1.5 min-w-[150px] text-xs">
                      {(user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN') && (
                        <Link
                          to="/admin/dashboard"
                          className="px-2.5 py-1.5 hover:bg-[#800020]/10 rounded-lg text-[#800020] font-semibold flex items-center gap-1.5 border-b border-[#321D1C]/10 mb-1"
                        >
                          <ShieldCheck size={13} /> Admin Panel
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        className="px-2.5 py-1.5 hover:bg-[#800020]/5 rounded-lg text-[#321D1C] font-medium block"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/orders"
                        className="px-2.5 py-1.5 hover:bg-[#800020]/5 rounded-lg text-[#321D1C] font-medium block"
                      >
                        My Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        className="px-2.5 py-1.5 hover:bg-[#800020]/5 rounded-lg text-[#321D1C] font-medium block"
                      >
                        My Wishlist
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-rose-50 text-rose-700 rounded-lg font-medium flex items-center gap-1.5 mt-0.5 border-t border-[#321D1C]/10"
                      >
                        <LogOut size={12} /> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative group/user flex items-center">
                  <Link
                    to="/login"
                    className="p-1.5 text-[#321D1C] hover:text-[#800020] transition-colors rounded-full flex items-center gap-1.5"
                    title="Account / Sign In"
                  >
                    <User size={20} strokeWidth={1.75} />
                    <span className="hidden sm:inline text-xs font-medium">Sign In</span>
                  </Link>

                  {/* Dropdown for Guest */}
                  <div className="hidden group-hover/user:flex flex-col absolute right-0 top-full pt-1 z-50">
                    <div className="bg-[#FFF9F0] rounded-xl shadow-lg border border-[#C99A3B]/30 p-1.5 min-w-[140px] text-xs">
                      <Link
                        to="/login"
                        className="px-2.5 py-1.5 hover:bg-[#800020]/5 rounded-lg text-[#321D1C] font-medium block"
                      >
                        Patron Sign In
                      </Link>
                      <Link
                        to="/register"
                        className="px-2.5 py-1.5 hover:bg-[#800020]/5 rounded-lg text-[#800020] font-semibold block border-t border-[#321D1C]/10 mt-0.5"
                      >
                        Create Account
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Wishlist Icon */}
              <Link
                to="/wishlist"
                className="p-1.5 text-[#321D1C] hover:text-[#800020] transition-colors rounded-full"
                title="Wishlist"
              >
                <Heart size={20} strokeWidth={1.75} />
              </Link>

              {/* Shopping Bag Icon with Cart Count */}
              <Link
                to="/cart"
                className="relative p-1.5 text-[#321D1C] hover:text-[#800020] transition-colors rounded-full"
                title="Shopping Bag"
              >
                <ShoppingBag size={20} strokeWidth={1.75} />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#800020] text-white text-[9.5px] font-bold flex items-center justify-center shadow-xs">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Hamburger */}
              <button
                className="lg:hidden p-1.5 text-[#321D1C] hover:text-[#800020] transition-colors rounded-full"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open Navigation Menu"
              >
                <Menu size={22} />
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          3. CLEAN SLIDE-OUT DRAWER FOR MOBILE & TABLET
      ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 right-0 z-[60] w-full max-w-[min(340px,calc(100vw-32px))] bg-[#FFF9F0] flex flex-col shadow-2xl"
            >
              {/* Drawer Top Header */}
              <div className="flex justify-between items-center px-4 py-3.5 border-b border-[#C99A3B]/30 bg-[#FFF9F0]">
                <div className="flex items-center gap-2">
                  <MiniatureThreadSpool className="scale-90" />
                  <img
                    src="/images/agvia-logo.webp"
                    alt="NOOLU — A Rhythm of Loom"
                    width={96}
                    height={44}
                    loading="lazy"
                    decoding="async"
                    className="h-9 w-auto object-contain"
                  />
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-[#321D1C] hover:text-[#800020] rounded-full transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Account Strip */}
              <div className="p-3 mx-3 mt-3 bg-white/80 border border-[#C99A3B]/30 rounded-2xl flex items-center justify-between gap-2.5 shadow-2xs">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#800020] text-white flex items-center justify-center text-xs font-semibold shrink-0">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#321D1C] truncate">
                          {user?.name || 'Account'}
                        </p>
                        <p className="text-[10px] text-[#321D1C]/50 truncate font-sans">
                          {user?.email || 'Logged in'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-2.5 py-1 bg-white border border-[#C99A3B]/30 rounded-lg text-[10px] font-medium text-[#321D1C] hover:text-[#800020]"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                        className="px-2 py-1 bg-rose-50 border border-rose-200 rounded-lg text-[10px] font-medium text-rose-700"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#800020]">
                        Welcome to NOOLU
                      </p>
                      <p className="text-[10px] text-[#321D1C]/60">
                        Sign in for bespoke couture privileges
                      </p>
                    </div>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3.5 py-1.5 bg-[#800020] text-white rounded-xl text-xs font-medium hover:bg-[#660019] transition-colors shrink-0"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Search Input */}
              <div className="p-3 border-b border-[#C99A3B]/20">
                <form onSubmit={(e) => { handleSearchSubmit(e); setMobileMenuOpen(false); }}>
                  <div className="flex items-center gap-2 rounded-full border border-[#C99A3B]/30 bg-white/80 px-3.5 py-2">
                    <Search size={14} className="text-[#321D1C]/50" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search sarees, lehengas, styles..."
                      className="w-full bg-transparent text-xs text-[#321D1C] focus:outline-none"
                    />
                  </div>
                </form>
              </div>

              {/* Navigation Links List */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between text-sm font-medium text-[#321D1C] hover:text-[#800020] hover:bg-black/5 px-3 py-2.5 rounded-xl transition-all"
                >
                  <span>Home</span>
                  <ArrowRight size={13} className="text-[#321D1C]/40" />
                </Link>

                <div className="pt-2 pb-1 px-3">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#800020]">
                    Collections
                  </span>
                </div>

                {Object.entries(NAV_CATEGORIES).map(([key, cat]) => (
                  <Link
                    key={key}
                    to={cat.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between text-sm text-[#321D1C] hover:text-[#800020] hover:bg-black/5 px-3 py-2.5 rounded-xl transition-all"
                  >
                    <span>{cat.label}</span>
                    <ArrowRight size={13} className="text-[#321D1C]/40" />
                  </Link>
                ))}

                <div className="pt-2 pb-1 px-3">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#800020]">
                    Account
                  </span>
                </div>

                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between text-sm text-[#321D1C] hover:text-[#800020] hover:bg-black/5 px-3 py-2.5 rounded-xl transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <Heart size={16} className="text-[#800020]" /> Wishlist
                  </span>
                  <ArrowRight size={13} className="text-[#321D1C]/40" />
                </Link>

                <Link
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between text-sm text-[#321D1C] hover:text-[#800020] hover:bg-black/5 px-3 py-2.5 rounded-xl transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <ShoppingBag size={16} className="text-[#800020]" /> Shopping Bag
                    {count > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#800020] text-white text-[10px] font-bold">
                        {count}
                      </span>
                    )}
                  </span>
                  <ArrowRight size={13} className="text-[#321D1C]/40" />
                </Link>

                <Link
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between text-sm text-[#321D1C] hover:text-[#800020] hover:bg-black/5 px-3 py-2.5 rounded-xl transition-all"
                >
                  <span>My Orders</span>
                  <ArrowRight size={13} className="text-[#321D1C]/40" />
                </Link>

                {(user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN') && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between text-sm font-semibold text-[#800020] bg-[#800020]/10 px-3 py-2.5 rounded-xl transition-all mt-1"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={16} /> Admin Panel
                    </span>
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>

              {/* Drawer Bottom Footer */}
              <div className="p-3.5 border-t border-[#C99A3B]/30 bg-[#FFF9F0] flex items-center justify-between">
                <span className="text-[10px] text-[#321D1C]/60 tracking-wider uppercase font-medium">
                  NOOLU — A Rhythm of Loom
                </span>
                {isAuthenticated && (
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="text-xs text-rose-700 font-medium flex items-center gap-1"
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          4. MOBILE BOTTOM NAVIGATION BAR (< sm screens)
      ══════════════════════════════════════════════════════════════ */}
      <nav
        aria-label="Mobile bottom navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FFF9F0]/98 backdrop-blur-md border-t border-[#C99A3B]/30 shadow-[0_-2px_12px_rgba(50,29,28,0.06)] px-1 py-1 select-none"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          paddingBottom: 'max(6px, env(safe-area-inset-bottom, 6px))'
        }}
      >
        <div className="flex items-center justify-between w-full max-w-md mx-auto">
          {/* Home */}
          <Link
            to="/"
            className={`flex-1 min-w-0 flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors ${
              location.pathname === '/' ? 'text-[#800020] font-bold' : 'text-[#321D1C]/70 hover:text-[#800020]'
            }`}
          >
            <Home size={18} strokeWidth={1.8} />
            <span className="text-[9.5px] tracking-wide mt-0.5 truncate">Home</span>
            {location.pathname === '/' && <span className="w-1.5 h-1.5 rounded-full bg-[#800020] mt-0.5" />}
          </Link>

          {/* Shop */}
          <Link
            to="/products"
            className={`flex-1 min-w-0 flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors ${
              location.pathname.startsWith('/products') ? 'text-[#800020] font-bold' : 'text-[#321D1C]/70 hover:text-[#800020]'
            }`}
          >
            <Sparkles size={18} strokeWidth={1.8} />
            <span className="text-[9.5px] tracking-wide mt-0.5 truncate">Shop</span>
            {location.pathname.startsWith('/products') && <span className="w-1.5 h-1.5 rounded-full bg-[#800020] mt-0.5" />}
          </Link>

          {/* Bag */}
          <Link
            to="/cart"
            className={`flex-1 min-w-0 relative flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors ${
              location.pathname === '/cart' ? 'text-[#800020] font-bold' : 'text-[#321D1C]/70 hover:text-[#800020]'
            }`}
          >
            <div className="relative">
              <ShoppingBag size={18} strokeWidth={1.8} />
              {count > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#800020] text-white text-[8.5px] font-bold flex items-center justify-center">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </div>
            <span className="text-[9.5px] tracking-wide mt-0.5 truncate">Bag</span>
            {location.pathname === '/cart' && <span className="w-1.5 h-1.5 rounded-full bg-[#800020] mt-0.5" />}
          </Link>

          {/* Wishlist */}
          <Link
            to="/wishlist"
            className={`flex-1 min-w-0 flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors ${
              location.pathname === '/wishlist' ? 'text-[#800020] font-bold' : 'text-[#321D1C]/70 hover:text-[#800020]'
            }`}
          >
            <Heart size={18} strokeWidth={1.8} />
            <span className="text-[9.5px] tracking-wide mt-0.5 truncate">Saved</span>
            {location.pathname === '/wishlist' && <span className="w-1.5 h-1.5 rounded-full bg-[#800020] mt-0.5" />}
          </Link>

          {/* Account */}
          <Link
            to={isAuthenticated ? "/profile" : "/login"}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors ${
              location.pathname === '/profile' || location.pathname === '/login' ? 'text-[#800020] font-bold' : 'text-[#321D1C]/70 hover:text-[#800020]'
            }`}
          >
            <User size={18} strokeWidth={1.8} />
            <span className="text-[9.5px] tracking-wide mt-0.5 truncate">
              {isAuthenticated ? (user?.name?.split(' ')[0] || 'Account') : 'Sign In'}
            </span>
            {(location.pathname === '/profile' || location.pathname === '/login') && <span className="w-1.5 h-1.5 rounded-full bg-[#800020] mt-0.5" />}
          </Link>
        </div>
      </nav>
    </>
  )
}
