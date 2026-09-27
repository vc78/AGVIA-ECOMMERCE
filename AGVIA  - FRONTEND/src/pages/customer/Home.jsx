import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
  Crown,
  Play,
  Scissors,
  Sparkles,
  Package,
  Ruler,
  ShieldCheck,
  Globe,
  Gem,
  Layers,
  X,
} from 'lucide-react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import SweetCard from '../../components/customer/SweetCard'
import InteractiveItemsReel from '../../components/customer/InteractiveItemsReel'
import BestsellerCurvedCarousel from '../../components/customer/BestsellerCurvedCarousel'
import RangoliDivider from '../../components/customer/RangoliDivider'
import TestimonialsCarousel from '../../components/customer/TestimonialsCarousel'
import BespokeTrousseauBanner from '../../components/customer/BespokeTrousseauBanner'
import { productService } from '../../services/productService'
import { useCart } from '../../hooks/useCart'
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import { ProductGridSkeleton } from '../../components/common/SkeletonLoaders'

// ── Hero Slides ────────────────────────────────────────────
const HERO_SLIDES = [
  {
    image: '/images/hero_dupatta_couture.jpg',
    tag: 'WEAR YOUR STORY •',
    titleMain: 'Timeless\nTradition',
    titleScript: 'Modern You',
    subtitle: 'Explore our curated ethnic and contemporary collections crafted for every occasion.',
    cta: '/products',
    accent: '#C9A45C',
  },
  {
    image: '/images/classic_silk_saree.jpg',
    tag: 'THE SIGNATURE SILK EDIT •',
    titleMain: 'Heirloom\nSilks',
    titleScript: 'Pure Grace',
    subtitle: 'Pure Kanjeevaram and Banarasi handlooms woven with fine gold zari borders.',
    cta: '/products?category=Sarees',
    accent: '#C9A45C',
  },
  {
    image: '/images/wedding_lehenga.jpg',
    tag: 'ROYAL BRIDAL ATELIER •',
    titleMain: 'Wedding\nCouture',
    titleScript: 'Regal Charm',
    subtitle: 'Hand-embroidered zardozi bridal sets with double dupattas and bespoke fit.',
    cta: '/products?category=Lehengas',
    accent: '#5A1020',
  },
  {
    image: '/images/anarkali_set.jpg',
    tag: 'FESTIVE OCCASION WEAR •',
    titleMain: 'Embroidered\nAnarkalis',
    titleScript: 'Flowing Kalis',
    subtitle: 'Intricate kalis adorned with fine mirror-work and delicate thread embroidery.',
    cta: '/products?category=Anarkalis+%26+Kurtas',
    accent: '#7A1F32',
  },
]

// ── Realistic Trust Badge SVG Icons ────────────────────────
function IconSilk() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5" aria-hidden="true">
      <path d="M6 26 Q16 4 26 26" stroke="#E6C687" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M10 20 Q16 10 22 20" stroke="#E6C687" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6"/>
      <circle cx="16" cy="27" r="2" fill="#E6C687" opacity="0.8"/>
      <path d="M13 14 Q16 8 19 14" stroke="#E6C687" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4"/>
    </svg>
  )
}
function IconNeedle() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5" aria-hidden="true">
      <line x1="8" y1="24" x2="24" y2="8" stroke="#E6C687" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="22" cy="10" rx="3" ry="1.5" transform="rotate(-45 22 10)" stroke="#E6C687" strokeWidth="1.5" fill="none"/>
      <path d="M8 24 Q6 28 10 26 Z" fill="#E6C687" opacity="0.8"/>
      <path d="M14 18 Q17 13 20 16" stroke="#E6C687" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5"/>
      <path d="M11 21 Q14 16 17 19" stroke="#E6C687" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4"/>
    </svg>
  )
}
function IconTape() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5" aria-hidden="true">
      <rect x="4" y="13" width="24" height="6" rx="3" stroke="#E6C687" strokeWidth="1.5" fill="none"/>
      <line x1="8" y1="13" x2="8" y2="19" stroke="#E6C687" strokeWidth="1"/>
      <line x1="12" y1="13" x2="12" y2="19" stroke="#E6C687" strokeWidth="1"/>
      <line x1="16" y1="13" x2="16" y2="19" stroke="#E6C687" strokeWidth="1"/>
      <line x1="20" y1="13" x2="20" y2="19" stroke="#E6C687" strokeWidth="1"/>
      <line x1="24" y1="13" x2="24" y2="19" stroke="#E6C687" strokeWidth="1"/>
      <path d="M10 10 Q16 7 22 10" stroke="#E6C687" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6"/>
    </svg>
  )
}
function IconBox() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5" aria-hidden="true">
      <rect x="6" y="14" width="20" height="14" rx="1.5" stroke="#E6C687" strokeWidth="1.5" fill="none"/>
      <path d="M6 14 L16 9 L26 14" stroke="#E6C687" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
      <line x1="16" y1="9" x2="16" y2="28" stroke="#E6C687" strokeWidth="1" opacity="0.5"/>
      <path d="M12 11 Q16 7 20 11" stroke="#E6C687" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <circle cx="16" cy="10" r="1.5" fill="#E6C687" opacity="0.9"/>
    </svg>
  )
}

// ── Trust Badges ───────────────────────────────────────────
const TRUST = [
  { Icon: IconSilk, label: 'Pure Handloom Silk', sub: 'Silk Mark Certified' },
  { Icon: IconNeedle, label: 'Zardozi Handcraft', sub: 'Master Atelier Embroidery' },
  { Icon: IconTape, label: 'Made-to-Measure', sub: 'Bespoke Custom Fitting' },
  { Icon: IconBox, label: 'Luxury Keepsake Box', sub: 'Complimentary Trousseau Wrap' },
]

// ── Testimonials ───────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Radhika Reddy', city: 'Hyderabad', rating: 5,
    quote: "My wedding reception lehenga from AGVIA drew endless compliments. The zardozi intricacy and bespoke drape were completely unmatched.",
    avatar: '/images/wedding_lehenga.jpg',
  },
  {
    name: 'Meera Nambiar', city: 'Bengaluru', rating: 5,
    quote: "The pure silk saree I received feels like an heirloom. The weight of the silk and real gold zari border are extraordinary.",
    avatar: '/images/classic_silk_saree.jpg',
  },
  {
    name: 'Pooja Singhania', city: 'Mumbai', rating: 5,
    quote: "AGVIA's concierge team assisted me with made-to-measure styling and dispatch. The velvet keepsake packaging was royal.",
    avatar: '/images/anarkali_set.jpg',
  },
]

// ── Section Header with Strict Spacing Hierarchy ───────────
function SectionHeader({ tag, title, subtitle }) {
  return (
    <div className="section-header">
      <span className="section-eyebrow">
        ✦ {tag} ✦
      </span>
      <h2 className="section-title">
        {title}
      </h2>
      {subtitle && (
        <p className="section-description">
          {subtitle}
        </p>
      )}
    </div>
  )
}

export default function Home() {
  const [bestsellers, setBestsellers] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showStoryModal, setShowStoryModal] = useState(false)
  const { addToCart } = useCart()

  // Hero state
  const [heroIdx, setHeroIdx] = useState(0)
  const [heroDir, setHeroDir] = useState(1)
  const heroTimer = useRef(null)

  // Scroll parallax
  const { scrollY } = useScroll()
  const yText = useTransform(scrollY, [0, 400], [0, 40])
  const yBg = useTransform(scrollY, [0, 400], [0, 60])

  useEffect(() => {
    setLoading(true)
    productService.getAll().then((list) => {
      const safeList = Array.isArray(list) ? list : []
      const best = safeList.filter(p => p.bestseller)
      setBestsellers(best.length > 0 ? best.slice(0, 10) : safeList.slice(0, 10))
      setAllProducts(safeList.slice(0, 8))
    }).catch((err) => {
      console.warn('Could not load products:', err)
      setBestsellers([])
      setAllProducts([])
    })
    .finally(() => setLoading(false))
  }, [])

  const startHeroTimer = () => {
    clearInterval(heroTimer.current)
    heroTimer.current = setInterval(() => {
      setHeroDir(1)
      setHeroIdx(i => (i + 1) % HERO_SLIDES.length)
    }, 6500)
  }

  useEffect(() => {
    startHeroTimer()
    return () => clearInterval(heroTimer.current)
  }, [])

  const gotoSlide = (idx) => {
    setHeroDir(idx > heroIdx ? 1 : -1)
    setHeroIdx(idx)
    startHeroTimer()
  }

  const prevSlide = () => { setHeroDir(-1); setHeroIdx(i => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length); startHeroTimer() }
  const nextSlide = () => { setHeroDir(1); setHeroIdx(i => (i + 1) % HERO_SLIDES.length); startHeroTimer() }

  const handleAdd = (product) => {
    addToCart(product)
    toast.success(`${product.name} added to cart!`, { style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' } })
  }

  const slide = HERO_SLIDES[heroIdx]

  return (
    <div className="relative min-h-full bg-[#FFFDF8] overflow-x-hidden pb-14 sm:pb-0">
      {/* ══ GLOBAL LUXURY BOUTIQUE BACKGROUND TEXTURE ══ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="w-full h-full bg-cover bg-center bg-fixed opacity-[0.14] mix-blend-multiply"
          style={{
            backgroundImage: "url('/images/boutique_luxury_bg.jpg')",
            filter: 'contrast(1.04) saturate(1.08)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF8]/40 via-transparent to-[#FFFDF8]/70 pointer-events-none" />
      </div>

      {/* ══ AMBIENT GLOW SPOTLIGHT ══ */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#C9A45C]/08 via-[#8B0000]/03 to-transparent rounded-full blur-2xl pointer-events-none z-0" />

      <Navbar />

      {/* ══════════════════════════════════════════════════════════════
          1. HERO SECTION (EXACT REFERENCE DESIGN)
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[560px] sm:min-h-[640px] md:min-h-[720px] lg:min-h-[820px] xl:min-h-[880px] flex flex-col justify-between overflow-hidden bg-[#240810] pt-3 sm:pt-4 pb-4 sm:pb-6">
        
        {/* Cinematic Background Image with Slide Transition */}
        <AnimatePresence mode="sync">
          <motion.div
            key={heroIdx}
            className="absolute inset-0 z-0"
            initial={{ opacity: 0, scale: 1.04, x: heroDir * 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.98, x: -heroDir * 40 }}
            transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
          >
            <motion.img
              src={slide.image}
              alt={slide.titleMain || 'AGVIA Boutique'}
              loading={heroIdx === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className="absolute -top-8 -bottom-8 w-full h-[calc(100%+64px)] object-cover object-[center_28%] lg:object-center filter contrast-[1.03] brightness-[0.96]"
              style={{ y: yBg }}
            />
            {/* Left Vignette & Gradient for High Text Contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1A040C]/90 via-[#1A040C]/55 to-transparent sm:w-4/5 lg:w-3/5" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#150309] via-transparent to-black/35" />
          </motion.div>
        </AnimatePresence>

        {/* Top Vignette Overlay */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />

        {/* Main Hero Content Area */}
        <div className="relative z-10 w-full container-luxury flex-1 flex items-center py-4 sm:py-8 md:py-10">
          <div className="w-full flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8">
            
            {/* Left Column: Vertical Slide Indicator + Main Typography + CTAs + Social Proof */}
            <div className="flex items-start gap-3 sm:gap-6 max-w-2xl">
              
              {/* Vertical Slide Numbers (Desktop) */}
              <div className="hidden sm:flex flex-col items-center gap-3 text-white/45 text-[11px] font-mono select-none pt-2">
                <span className={`transition-all font-bold ${heroIdx === 0 ? 'text-white text-xs' : 'text-white/40'}`}>01</span>
                <span className="w-[1.5px] h-6 bg-white/70 rounded-full" />
                <button onClick={() => gotoSlide(1)} className={`hover:text-white transition-colors ${heroIdx === 1 ? 'text-white font-bold' : ''}`}>02</button>
                <button onClick={() => gotoSlide(2)} className={`hover:text-white transition-colors ${heroIdx === 2 ? 'text-white font-bold' : ''}`}>03</button>
                <button onClick={() => gotoSlide(3)} className={`hover:text-white transition-colors ${heroIdx === 3 ? 'text-white font-bold' : ''}`}>04</button>
              </div>

              {/* Text Block */}
              <div className="space-y-3 sm:space-y-4">
                <div className="inline-flex items-center gap-1.5 text-[#E6C894] tracking-[0.26em] text-[9px] sm:text-[10px] font-bold uppercase">
                  <span>{slide.tag || 'WEAR YOUR STORY •'}</span>
                </div>

                <h1 className="font-display text-[clamp(2.2rem,5.5vw,4.5rem)] font-bold text-white leading-[1.03] tracking-tight">
                  Timeless<br />
                  Tradition<br />
                  <span
                    style={{ fontFamily: "'Alex Brush', 'Cormorant Garamond', cursive" }}
                    className="italic font-normal text-[clamp(2.8rem,7vw,5.5rem)] text-[#FFFDF8] block -mt-1 sm:-mt-2 filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
                  >
                    Modern You
                  </span>
                </h1>

                <p className="font-sans text-xs sm:text-[13.5px] text-white/85 max-w-md leading-relaxed tracking-wide">
                  {slide.subtitle || 'Explore our curated ethnic and contemporary collections crafted for every occasion.'}
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    to={slide.cta || '/products'}
                    className="inline-flex items-center justify-center gap-2 bg-[#6B1426] hover:bg-[#8B1A32] text-white font-bold text-[11px] sm:text-xs tracking-[0.16em] uppercase px-7 sm:px-8 py-3.5 rounded-full shadow-[0_8px_25px_rgba(107,20,38,0.5)] hover:scale-105 active:scale-95 transition-all duration-200 min-h-[48px]"
                  >
                    <span>EXPLORE COLLECTIONS</span>
                    <ArrowRight size={13} className="stroke-[2.5]" />
                  </Link>

                  <button
                    onClick={() => setShowStoryModal(true)}
                    className="inline-flex items-center justify-center gap-2 bg-black/35 hover:bg-black/55 border border-white/30 text-white font-semibold text-[11px] sm:text-xs tracking-[0.12em] uppercase px-6 py-3.5 rounded-full backdrop-blur-md transition-all duration-200 hover:border-white/60 active:scale-95 min-h-[48px]"
                  >
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-[9px] pl-0.5">▶</span>
                    <span>WATCH OUR STORY</span>
                  </button>
                </div>

                {/* Social Proof: 3 Customer Avatars + 10,000+ Happy Customers */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex -space-x-2">
                    <img src="/images/classic_silk_saree.jpg" alt="Client 1" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white shadow-sm" />
                    <img src="/images/wedding_lehenga.jpg" alt="Client 2" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white shadow-sm" />
                    <img src="/images/anarkali_set.jpg" alt="Client 3" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white shadow-sm" />
                  </div>
                  <div className="text-[11px] sm:text-xs text-white/90">
                    <span className="font-bold tracking-wide">10,000+ Happy Customers</span>
                    <div className="flex text-[#FFD700] text-[10px] gap-0.5 mt-0.5">
                      {'★★★★★'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: "Elegance in Every Detail ♡" Calligraphy Script */}
            <div className="hidden lg:flex flex-col items-end justify-center h-[420px] text-right self-stretch pr-2">
              {/* Calligraphy Script */}
              <div className="pt-4">
                <p
                  style={{ fontFamily: "'Alex Brush', 'Cormorant Garamond', cursive" }}
                  className="text-4xl xl:text-5xl text-white transform -rotate-3 select-none leading-tight filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                >
                  Elegance
                </p>
                <p
                  style={{ fontFamily: "'Alex Brush', 'Cormorant Garamond', cursive" }}
                  className="text-3xl xl:text-4xl text-[#E6C894] transform -rotate-3 select-none leading-none -mt-1 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                >
                  in Every Detail ♡
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ══ GLASSMORPHIC FLOATING USP BAR ════════════════════════ */}
        <div className="relative z-20 w-full container-luxury pt-3">
          <div className="bg-black/40 backdrop-blur-xl border border-white/18 rounded-2xl py-3 px-3.5 sm:px-6 md:px-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 md:divide-x divide-white/10 text-white">
            
            <div className="flex items-center gap-2.5 sm:gap-3 py-1.5 justify-start">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 border border-[#E6C687]/40 flex items-center justify-center text-[#E6C687] shrink-0">
                <Layers size={15} />
              </div>
              <div className="text-left min-w-0">
                <p className="font-serif text-[11.5px] sm:text-[13px] font-bold text-white leading-tight truncate">Premium Fabrics</p>
                <p className="font-sans text-[9.5px] sm:text-[10px] text-[#E6C687]/80 tracking-wider truncate">Handpicked Quality</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 py-1.5 justify-start md:pl-6">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 border border-[#E6C687]/40 flex items-center justify-center text-[#E6C687] shrink-0">
                <Gem size={15} />
              </div>
              <div className="text-left min-w-0">
                <p className="font-serif text-[11.5px] sm:text-[13px] font-bold text-white leading-tight truncate">Bespoke Designs</p>
                <p className="font-sans text-[9.5px] sm:text-[10px] text-[#E6C687]/80 tracking-wider truncate">Made for You</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 py-1.5 justify-start md:pl-6">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 border border-[#E6C687]/40 flex items-center justify-center text-[#E6C687] shrink-0">
                <ShieldCheck size={15} />
              </div>
              <div className="text-left min-w-0">
                <p className="font-serif text-[11.5px] sm:text-[13px] font-bold text-white leading-tight truncate">Secure Payments</p>
                <p className="font-sans text-[9.5px] sm:text-[10px] text-[#E6C687]/80 tracking-wider truncate">Safe & Trusted</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 py-1.5 justify-start md:pl-6">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 border border-[#E6C687]/40 flex items-center justify-center text-[#E6C687] shrink-0">
                <Globe size={15} />
              </div>
              <div className="text-left min-w-0">
                <p className="font-serif text-[11.5px] sm:text-[13px] font-bold text-white leading-tight truncate">Worldwide Shipping</p>
                <p className="font-sans text-[9.5px] sm:text-[10px] text-[#E6C687]/80 tracking-wider truncate">Delivering Happiness</p>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* Rangoli Divider — between Hero and Shop by Collection */}
      <RangoliDivider />

      {/* ══════════════════════════════════════════════════════════════
          2. SHOP BY COLLECTION (ARCHED CAROUSEL SHOWCASE)
      ══════════════════════════════════════════════════════════════ */}
      <InteractiveItemsReel items={allProducts} />

      {/* Rangoli Divider — between Shop by Collection and Bridal Trousseau */}
      <RangoliDivider flip />

      {/* ══════════════════════════════════════════════════════════════
          3. BRIDAL TROUSSEAU, ELEVATED (INTERACTIVE CONSULTATION & ATELIER SCHEDULING)
      ══════════════════════════════════════════════════════════════ */}
      <BespokeTrousseauBanner />

      {/* Rangoli Divider — between Bridal Trousseau and AGVIA Edit */}
      <RangoliDivider />

      {/* ══════════════════════════════════════════════════════════════
          4. THE AGVIA EDIT / EVERY DRAPE, PERFECTED
      ══════════════════════════════════════════════════════════════ */}
      <section className="section relative z-10 pt-4">
        <div className="container-luxury">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 pb-2 border-b border-[#C9A45C]/20">
            <div>
              <span className="section-eyebrow text-[#C9A45C]">✦ THE AGVIA EDIT ✦</span>
              <h2 className="section-title text-[#211D1E] mt-1">Every Drape, Perfected</h2>
            </div>
            <div className="hidden sm:block text-right">
              <p
                style={{ fontFamily: "'Alex Brush', 'Cormorant Garamond', cursive" }}
                className="text-2xl lg:text-3xl text-[#8B1A32] transform -rotate-3 select-none leading-none"
              >
                Tradition Reimagined ♡
              </p>
            </div>
          </div>

          {allProducts.length > 0 && (
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[clamp(12px,1.8vw,20px)]">
              {allProducts.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                >
                  <SweetCard key={p.id} product={p} onAdd={() => handleAdd(p)} />
                </motion.div>
              ))}
            </div>
          )}

          <div className="section-cta">
            <Link to="/products" className="btn-primary min-h-[48px]">
              Shop All Silhouettes <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Rangoli Divider — between AGVIA Edit and Bestsellers */}
      <RangoliDivider flip />

      {/* ══════════════════════════════════════════════════════════════
          5. BESTSELLERS (THE SIGNATURE EDIT) - 3D CURVED CAROUSEL
      ══════════════════════════════════════════════════════════════ */}
      <BestsellerCurvedCarousel bestsellers={bestsellers} onAdd={handleAdd} />

      {/* Rangoli Divider — between Bestsellers and Testimonials */}
      <RangoliDivider />

      {/* ══════════════════════════════════════════════════════════════
          6. TESTIMONIALS (PATRON EXPERIENCES)
      ══════════════════════════════════════════════════════════════ */}
      <TestimonialsCarousel />

      {/* ══ VIDEO STORY MODAL ═════════════════════════════════════ */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-[#1E050D] border border-[#C9A45C]/40 rounded-3xl overflow-hidden shadow-2xl p-6 text-center text-white">
            <button
              onClick={() => setShowStoryModal(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="inline-flex items-center gap-1.5 text-[#C9A45C] text-xs font-bold tracking-widest uppercase mb-3">
              <span>✦ AGVIA ATELIER HERITAGE ✦</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-3">Crafted for Royal Moments</h3>
            <p className="font-sans text-xs sm:text-sm text-white/80 max-w-lg mx-auto leading-relaxed mb-6">
              Step inside our Hyderabad atelier where master artisans hand-embroider zardozi motifs and handloom pure silk heirlooms for brides and discerning connoisseurs across the globe.
            </p>
            <div className="rounded-2xl overflow-hidden aspect-video relative border border-[#C9A45C]/30 mb-6 bg-black">
              <img src="/images/hero_dupatta_couture.jpg" alt="Atelier Preview" className="w-full h-full object-cover opacity-85" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-16 h-16 rounded-full bg-[#6B1426] flex items-center justify-center shadow-xl">
                  <Play size={24} className="fill-white ml-1" />
                </div>
              </div>
            </div>
            <Link
              to="/products"
              onClick={() => setShowStoryModal(false)}
              className="inline-flex items-center gap-2 bg-[#C9A45C] hover:bg-white text-[#211D1E] font-bold text-xs tracking-widest uppercase px-8 py-3.5 rounded-full shadow-lg transition-all"
            >
              <span>EXPLORE THE COLLECTION</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
