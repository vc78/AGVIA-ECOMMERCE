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
  Flame,
  Clock,
  Palette
} from 'lucide-react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import SweetCard from '../../components/customer/SweetCard'
import InteractiveItemsReel from '../../components/customer/InteractiveItemsReel'
import BestsellerCurvedCarousel from '../../components/customer/BestsellerCurvedCarousel'
import RangoliDivider from '../../components/customer/RangoliDivider'
import TestimonialsCarousel from '../../components/customer/TestimonialsCarousel'
import BespokeTrousseauBanner from '../../components/customer/BespokeTrousseauBanner'
import HeroCarousel from '../../components/customer/HeroCarousel'
import { productService } from '../../services/productService'
import { useCart } from '../../hooks/useCart'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import SEOHead from '../../components/common/SEOHead'

export default function Home() {
  const [bestsellers, setBestsellers] = useState([])
  const [trending, setTrending] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [limitedStock, setLimitedStock] = useState([])
  const [colorSwatches, setColorSwatches] = useState([])
  const [collections, setCollections] = useState([])
  const [sections, setSections] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showStoryModal, setShowStoryModal] = useState(false)
  const { addToCart } = useCart()

  useEffect(() => {
    setLoading(true)
    // 1. Fetch dynamic aggregated merchandising data
    productService.getHomepageData()
      .then((data) => {
        if (data) {
          if (Array.isArray(data.sections) && data.sections.length > 0) {
            setSections(data.sections.filter(s => s.active !== false).sort((a, b) => a.displayOrder - b.displayOrder))
          }
          if (Array.isArray(data.bestSellers)) setBestsellers(data.bestSellers)
          if (Array.isArray(data.trending)) setTrending(data.trending)
          if (Array.isArray(data.newArrivals)) setNewArrivals(data.newArrivals)
          if (Array.isArray(data.limitedStock)) setLimitedStock(data.limitedStock)
          if (Array.isArray(data.colors)) setColorSwatches(data.colors)
          if (Array.isArray(data.collections)) setCollections(data.collections)
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic homepage data, falling back:', err)
      })
      .finally(() => {
        // 2. Fetch full product catalog as fallback
        productService.getAll()
          .then((list) => {
            const safeList = Array.isArray(list) ? list : []
            setAllProducts(safeList)
            setBestsellers(prev => (prev.length > 0 ? prev : safeList.filter(p => p.bestseller).slice(0, 10)))
            setTrending(prev => (prev.length > 0 ? prev : safeList.slice(0, 8)))
            setNewArrivals(prev => (prev.length > 0 ? prev : safeList.slice(0, 8)))
          })
          .catch((err) => {
            console.warn('Could not load products:', err)
          })
          .finally(() => setLoading(false))
      })
  }, [])

  const handleAdd = (product) => {
    addToCart(product)
    toast.success(`${product.name} added to cart!`, { style: { background: '#800020', color: '#FFF8EB', borderRadius: '12px' } })
  }

  // Default sections order if not customized by admin in database
  const defaultSectionConfig = [
    { sectionKey: 'HERO_BANNER', title: 'Woven with Heritage. Styled for Today.' },
    { sectionKey: 'SHOP_BY_COLLECTION', title: 'Explore Our Collections' },
    { sectionKey: 'BRAND_STORY', title: 'Every Thread Has a Story.' },
    { sectionKey: 'BEST_SELLERS', title: 'The Signature Weaves' },
    { sectionKey: 'TRENDING_NOW', title: 'Trending This Season' },
    { sectionKey: 'NEW_ARRIVALS', title: 'Fresh From The Atelier' },
    { sectionKey: 'SHOP_BY_COLOR', title: 'Palette Royale' },
    { sectionKey: 'LIMITED_STOCK', title: 'Limited Stock Alert' },
    { sectionKey: 'FEATURED_PRODUCTS', title: 'Every Drape, Perfected' }
  ]

  const activeSections = sections.length > 0 ? sections : defaultSectionConfig

  const renderSection = (sec, index) => {
    const key = sec.sectionKey || sec.key

    switch (key) {
      case 'HERO_BANNER':
        return (
          <div key="hero-section" className="relative flex flex-col bg-[#1A050B]">
            <HeroCarousel onOpenStoryModal={() => setShowStoryModal(true)} />
            {/* Luxury Brand Trust Pillars */}
            <div className="relative z-20 w-full container-luxury -mt-6 sm:-mt-8 mb-6">
              <div className="bg-black/75 backdrop-blur-2xl border border-white/20 rounded-2xl py-3.5 px-4 sm:px-6 md:px-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:divide-x divide-white/10 text-white">
                <div className="flex items-center gap-2.5 sm:gap-3 py-1.5 justify-start">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#800020]/60 border border-[#F5B900]/50 flex items-center justify-center text-[#F5B900] shrink-0">
                    <Layers size={15} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-serif text-[11.5px] sm:text-[13px] font-bold text-white leading-tight truncate">Pure Handloom Silks</p>
                    <p className="font-sans text-[9.5px] sm:text-[10px] text-[#F5B900]/90 tracking-wider truncate">Certified Pure Weaves</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 sm:gap-3 py-1.5 justify-start md:pl-6">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#800020]/60 border border-[#F5B900]/50 flex items-center justify-center text-[#F5B900] shrink-0">
                    <Gem size={15} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-serif text-[11.5px] sm:text-[13px] font-bold text-white leading-tight truncate">Artisanal Zari Work</p>
                    <p className="font-sans text-[9.5px] sm:text-[10px] text-[#F5B900]/90 tracking-wider truncate">Heirloom Craftsmanship</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 sm:gap-3 py-1.5 justify-start md:pl-6">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#800020]/60 border border-[#F5B900]/50 flex items-center justify-center text-[#F5B900] shrink-0">
                    <ShieldCheck size={15} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-serif text-[11.5px] sm:text-[13px] font-bold text-white leading-tight truncate">Secure Payments</p>
                    <p className="font-sans text-[9.5px] sm:text-[10px] text-[#F5B900]/90 tracking-wider truncate">Razorpay & Insured COD</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 sm:gap-3 py-1.5 justify-start md:pl-6">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#800020]/60 border border-[#F5B900]/50 flex items-center justify-center text-[#F5B900] shrink-0">
                    <Globe size={15} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-serif text-[11.5px] sm:text-[13px] font-bold text-white leading-tight truncate">Insured Logistics</p>
                    <p className="font-sans text-[9.5px] sm:text-[10px] text-[#F5B900]/90 tracking-wider truncate">Tamper-Evident Delivery</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'SHOP_BY_COLLECTION':
        return (
          <div key="shop-by-collection">
            <RangoliDivider />
            <InteractiveItemsReel items={allProducts} />
          </div>
        )

      case 'BRAND_STORY':
        return (
          <div key="brand-story">
            <RangoliDivider flip />
            <BespokeTrousseauBanner />
          </div>
        )

      case 'BEST_SELLERS':
        if (bestsellers.length === 0) return null
        return (
          <div key="bestsellers">
            <RangoliDivider />
            <BestsellerCurvedCarousel bestsellers={bestsellers} onAdd={handleAdd} />
          </div>
        )

      case 'TRENDING_NOW':
        if (trending.length === 0) return null
        return (
          <section key="trending" className="section relative z-10 pt-6">
            <div className="container-luxury">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 pb-2 border-b border-[#C9A45C]/20">
                <div>
                  <span className="section-eyebrow text-[#C9A45C]">✦ TRENDING THIS SEASON ✦</span>
                  <h2 className="section-title text-[#211D1E] mt-1">{sec.title || 'Trending Now'}</h2>
                  {sec.subtitle && <p className="section-description">{sec.subtitle}</p>}
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B1A32] bg-[#8B1A32]/10 px-3 py-1 rounded-full border border-[#8B1A32]/25 uppercase tracking-wider">
                    <Flame size={13} className="text-[#8B1A32]" /> Patron Favorites
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[clamp(12px,1.8vw,20px)]">
                {trending.slice(0, 8).map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                  >
                    <SweetCard product={{ ...p, badge: 'TRENDING' }} onAdd={() => handleAdd(p)} />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )

      case 'NEW_ARRIVALS':
        if (newArrivals.length === 0) return null
        return (
          <section key="new-arrivals" className="section relative z-10 pt-6">
            <div className="container-luxury">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 pb-2 border-b border-[#C9A45C]/20">
                <div>
                  <span className="section-eyebrow text-[#C9A45C]">✦ FRESH FROM THE ATELIER ✦</span>
                  <h2 className="section-title text-[#211D1E] mt-1">{sec.title || 'New Arrivals'}</h2>
                  {sec.subtitle && <p className="section-description">{sec.subtitle}</p>}
                </div>
                <Link to="/products?sort=newest" className="text-xs font-bold text-[#5A1020] hover:text-[#C9A45C] flex items-center gap-1 transition-colors">
                  <span>Explore New Edits</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[clamp(12px,1.8vw,20px)]">
                {newArrivals.slice(0, 8).map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                  >
                    <SweetCard product={{ ...p, badge: 'NEW' }} onAdd={() => handleAdd(p)} />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )

      case 'SHOP_BY_COLOR':
        if (colorSwatches.length === 0) return null
        return (
          <section key="shop-by-color" className="section relative z-10 py-8 bg-gradient-to-b from-transparent via-[#FAF7F2] to-transparent">
            <div className="container-luxury">
              <div className="text-center max-w-xl mx-auto mb-6">
                <span className="section-eyebrow text-[#C9A45C]">✦ PALETTE ROYALE ✦</span>
                <h2 className="section-title text-[#211D1E] mt-1">{sec.title || 'Shop By Color'}</h2>
                <p className="section-description">
                  Immerse yourself in heritage dyes, sacred festive jewel tones, and opulent zari pairings.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap max-w-4xl mx-auto">
                {colorSwatches.map((c) => (
                  <Link
                    key={c.colorName}
                    to={`/products?color=${encodeURIComponent(c.colorName)}`}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white border border-[#C9A45C]/30 shadow-xs hover:shadow-md hover:border-[#5A1020] hover:scale-105 active:scale-95 transition-all group"
                  >
                    <span
                      style={{ backgroundColor: c.colorCode || '#5A1020' }}
                      className="w-5 h-5 rounded-full inline-block border-2 border-white shadow-xs shrink-0 ring-1 ring-black/10"
                    />
                    <span className="font-serif font-bold text-xs sm:text-sm text-[#211D1E] group-hover:text-[#5A1020] transition-colors">
                      {c.colorName}
                    </span>
                    {c.count > 0 && (
                      <span className="text-[10px] font-sans font-semibold text-[#C9A45C] bg-[#FAF7F2] px-1.5 py-0.5 rounded-full">
                        {c.count}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )

      case 'LIMITED_STOCK':
        if (limitedStock.length === 0) return null
        return (
          <section key="limited-stock" className="section relative z-10 pt-6">
            <div className="container-luxury">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 pb-2 border-b border-amber-700/25">
                <div>
                  <span className="section-eyebrow text-amber-800">✦ FINAL PIECES & VAULT RARITIES ✦</span>
                  <h2 className="section-title text-[#211D1E] mt-1">{sec.title || 'Limited Stock Alert'}</h2>
                  <p className="section-description">Only a few handcrafted pieces remain in our atelier vaults.</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <Clock size={13} className="text-amber-700" />
                  <span>Selling Fast</span>
                </div>
              </div>

              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[clamp(12px,1.8vw,20px)]">
                {limitedStock.slice(0, 8).map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                  >
                    <SweetCard product={{ ...p, badge: 'FEW LEFT' }} onAdd={() => handleAdd(p)} />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )

      case 'FEATURED_PRODUCTS':
      default:
        if (allProducts.length === 0) return null
        return (
          <section key="featured-edit" className="section relative z-10 pt-6">
            <div className="container-luxury">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 pb-2 border-b border-[#C9A45C]/20">
                <div>
                  <span className="section-eyebrow text-[#C9A45C]">✦ THE NOOLU EDIT ✦</span>
                  <h2 className="section-title text-[#211D1E] mt-1">{sec.title || 'Every Drape, Perfected'}</h2>
                  {sec.subtitle && <p className="section-description">{sec.subtitle}</p>}
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

              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[clamp(12px,1.8vw,20px)]">
                {allProducts.slice(0, 8).map((p, i) => (
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

              <div className="section-cta">
                <Link to="/products" className="btn-primary min-h-[48px]">
                  Shop All Silhouettes <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        )
    }
  }

  return (
    <div className="relative min-h-full bg-[#FFFDF8] overflow-x-hidden pb-14 sm:pb-0">
      <SEOHead
        title="Woven with Heritage. Styled for Today."
        description="Discover NOOLU — a contemporary expression of Indian textile heritage, timeless style and beautiful collections."
        canonicalUrl="/"
        type="website"
      />
      {/* ══ GLOBAL LUXURY BOUTIQUE BACKGROUND TEXTURE ══ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="w-full h-full bg-cover bg-center bg-fixed opacity-[0.14] mix-blend-multiply"
          style={{
            backgroundImage: "url('/images/boutique_luxury_bg.webp')",
            filter: 'contrast(1.04) saturate(1.08)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF8]/40 via-transparent to-[#FFFDF8]/70 pointer-events-none" />
      </div>

      {/* ══ AMBIENT GLOW SPOTLIGHT ══ */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#C9A45C]/08 via-[#8B0000]/03 to-transparent rounded-full blur-2xl pointer-events-none z-0" />

      <Navbar />

      {/* ══ DYNAMIC HOMEPAGE SECTIONS ══ */}
      {activeSections.map((sec, idx) => renderSection(sec, idx))}

      {/* Rangoli Divider before Testimonials */}
      <RangoliDivider />

      {/* ══ TESTIMONIALS (PATRON EXPERIENCES) ══ */}
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
              <span>✦ NOOLU ATELIER HERITAGE ✦</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-3">Every Thread Has a Story.</h3>
            <p className="font-sans text-xs sm:text-sm text-white/80 max-w-lg mx-auto leading-relaxed mb-6">
              At NOOLU, we celebrate the artistry of Indian textiles and the timeless beauty of weaving. Inspired by heritage and crafted for contemporary living, every collection brings together tradition, detail and elegance.
            </p>
            <div className="rounded-2xl overflow-hidden aspect-video relative border border-[#C9A45C]/30 mb-6 bg-black">
              <img src="/images/hero_dupatta_couture-600.webp" alt="Atelier Preview" width={600} height={335} loading="lazy" decoding="async" className="w-full h-full object-cover opacity-85" />
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
