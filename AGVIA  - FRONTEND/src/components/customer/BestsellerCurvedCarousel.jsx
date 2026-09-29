import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Heart, ArrowRight } from 'lucide-react'
import ReliableImage from '../common/ReliableImage'
import { toast } from 'react-hot-toast'
import ProductShareButton from '../common/ProductShareButton'

// Curated Bestselling Silhouettes matching exact reference design
const CURATED_BESTSELLERS = [
  {
    id: 'bs-emerald-gown-1',
    name: 'AGVIA Emerald Evening Gown',
    category: 'Gowns',
    price: 7999,
    unit: 'piece',
    image: '/images/evening_gown.jpg',
    bestseller: true,
  },
  {
    id: 'bs-purple-anarkali',
    name: 'AGVIA Royal Purple Embroidered Anarkali',
    category: 'Anarkalis & Kurtas',
    price: 4499,
    unit: 'piece',
    image: '/images/anarkali_set.jpg',
    bestseller: true,
  },
  {
    id: 'bs-emerald-saree',
    name: 'AGVIA Emerald Weave Festive Saree',
    category: 'Sarees',
    price: 5999,
    unit: 'piece',
    image: '/images/classic_silk_saree.jpg',
    bestseller: true,
  },
  {
    id: 'bs-royal-crimson-lehenga',
    name: 'AGVIA Royal Crimson Velvet Lehenga',
    category: 'Lehengas',
    price: 9999,
    unit: 'piece',
    image: '/images/wedding_lehenga.jpg',
    bestseller: true,
  },
  {
    id: 'bs-gold-kanjeevaram',
    name: 'AGVIA Kanjeevaram Gold Silk Saree',
    category: 'Sarees',
    price: 6499,
    unit: 'piece',
    image: '/images/bridal_dupatta.jpg',
    bestseller: true,
  },
  {
    id: 'bs-blush-organza',
    name: 'AGVIA Blush Pink Organza Saree',
    category: 'Sarees',
    price: 5499,
    unit: 'piece',
    image: '/images/floral_organza_saree.jpg',
    bestseller: true,
  },
  {
    id: 'bs-emerald-gown-2',
    name: 'AGVIA Emerald Evening Gown',
    category: 'Gowns',
    price: 7999,
    unit: 'piece',
    image: '/images/festive_lehenga_set.jpg',
    bestseller: true,
  },
]

// Delicate Gold Lotus Outline Emblem
function GoldLotusEmblem() {
  return (
    <div className="flex items-center justify-center my-1 text-[#C9A45C]">
      <svg viewBox="0 0 44 20" fill="none" className="w-8 h-4">
        <path
          d="M22 2C19 7 15 11 12 14C8 17 9 19 12 20C15 21 18 18 22 13C26 18 29 21 32 20C35 19 36 17 32 14C29 11 25 7 22 2Z"
          fill="#C9A45C"
          fillOpacity="0.2"
          stroke="#C9A45C"
          strokeWidth="1.1"
        />
        <circle cx="22" cy="15" r="1" fill="#C9A45C" />
      </svg>
    </div>
  )
}

// Subtle Swipe / Touch Hand Icon
function SwipeHandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-[#5A1020]">
      <path d="M12 4v7M8 8v5M16 8v5M20 13c0 4.418-3.582 8-8 8s-8-3.582-8-8a8 8 0 0 1 2.343-5.657L12 11" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 3l2 2-2 2M17 3l-2 2 2 2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function BestsellerCurvedCarousel({ bestsellers = [], onAdd }) {
  const items = useMemo(() => {
    if (!bestsellers || bestsellers.length === 0) return CURATED_BESTSELLERS
    if (bestsellers.length >= 7) return bestsellers
    const existingIds = new Set(bestsellers.map(b => String(b.id)))
    const needed = CURATED_BESTSELLERS.filter(c => !existingIds.has(String(c.id)))
    return [...bestsellers, ...needed].slice(0, 7)
  }, [bestsellers])

  const [activeIdx, setActiveIdx] = useState(3)
  const [favorites, setFavorites] = useState({})
  const [addingId, setAddingId] = useState(null)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280)
  const [isPaused, setIsPaused] = useState(false)

  const dragStartX = useRef(null)
  const isDragging = useRef(false)
  const containerRef = useRef(null)

  useEffect(() => {
    let resizeTimer = null
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        setWindowWidth(window.innerWidth)
      }, 100)
    }
    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const total = items.length

  const handlePrev = useCallback(() => {
    setActiveIdx((prev) => (prev - 1 + total) % total)
  }, [total])

  const handleNext = useCallback(() => {
    setActiveIdx((prev) => (prev + 1) % total)
  }, [total])

  // Slow autonomous auto-scroll by itself
  useEffect(() => {
    if (isPaused) return
    const autoScrollTimer = setInterval(() => {
      handleNext()
    }, 4200)
    return () => clearInterval(autoScrollTimer)
  }, [isPaused, handleNext])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', handleKeyDown, { passive: true })
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrev, handleNext])

  // Lightweight Drag / Swipe handlers
  const handlePointerDown = (e) => {
    setIsPaused(true)
    dragStartX.current = e.clientX || (e.touches && e.touches[0].clientX)
    isDragging.current = false
  }

  const handlePointerMove = (e) => {
    if (dragStartX.current === null) return
    const currentX = e.clientX || (e.touches && e.touches[0].clientX)
    if (Math.abs(currentX - dragStartX.current) > 10) {
      isDragging.current = true
    }
  }

  const handlePointerUp = (e) => {
    if (dragStartX.current === null) return
    const currentX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX) || dragStartX.current
    const diff = currentX - dragStartX.current
    if (Math.abs(diff) > 40) {
      if (diff > 0) handlePrev()
      else handleNext()
    }
    dragStartX.current = null
    setTimeout(() => {
      isDragging.current = false
      setIsPaused(false)
    }, 1500)
  }

  const toggleFavorite = (e, id) => {
    e.stopPropagation()
    e.preventDefault()
    setFavorites(prev => {
      const next = !prev[id]
      toast(next ? 'Added to Wishlist' : 'Removed from Wishlist', {
        icon: next ? '💖' : '🤍',
        style: { background: '#5A1020', color: '#FFFDF8', borderRadius: '12px', fontSize: '13px' }
      })
      return { ...prev, [id]: next }
    })
  }

  const handleAddClick = (e, item) => {
    e.stopPropagation()
    e.preventDefault()
    setAddingId(item.id)
    if (onAdd) onAdd(item)
    setTimeout(() => setAddingId(null), 800)
  }

  // Responsive spatial parameters (tight and elegant)
  const isMobile = windowWidth < 640
  const isTablet = windowWidth >= 640 && windowWidth < 1024

  const maxVisibleOffset = isMobile ? 1 : (isTablet ? 2 : 3)
  const xSpacing = isMobile ? Math.min(140, Math.max(95, Math.floor(windowWidth * 0.36))) : (isTablet ? 185 : 225)
  const zStep = isMobile ? -30 : -45
  const rotStep = isMobile ? 16 : 14

  const getCardStyle = (index) => {
    let offset = index - activeIdx
    while (offset > total / 2) offset -= total
    while (offset < -total / 2) offset += total

    const isVisible = Math.abs(offset) <= maxVisibleOffset
    const absOffset = Math.abs(offset)

    if (!isVisible) {
      return {
        x: Math.sign(offset) * 750,
        y: 40,
        z: -250,
        scale: 0.5,
        rotateY: -Math.sign(offset) * 35,
        zIndex: 0,
        opacity: 0,
        pointerEvents: 'none',
      }
    }

    // Tight subtle parabolic Y-drop
    const yDrop = absOffset === 0 ? 0 : (absOffset === 1 ? 6 : (absOffset === 2 ? 16 : 28))
    const scale = absOffset === 0 ? (isMobile ? 1.0 : 1.05) : (absOffset === 1 ? 0.94 : (absOffset === 2 ? 0.84 : 0.74))
    const opacity = absOffset === 0 ? 1 : (absOffset === 1 ? 0.96 : (absOffset === 2 ? 0.86 : 0.68))
    const zIndex = 40 - absOffset * 10
    const rotateY = -offset * rotStep

    return {
      x: offset * xSpacing,
      y: yDrop,
      z: absOffset * zStep,
      scale,
      rotateY,
      zIndex,
      opacity,
      pointerEvents: 'auto',
    }
  }

  return (
    <section className="relative py-6 sm:py-8 md:py-10 overflow-hidden select-none">
      {/* ══ PALACE ARCHITECTURAL BACKDROP WITH IVORY OVERLAY ══ */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div
          className="w-full h-full bg-cover bg-[center_25%]"
          style={{
            backgroundImage: "url('/images/bestsellers_palace_bg.jpg')",
            filter: 'contrast(1.02) saturate(1.04) brightness(1.02)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF8]/92 via-[#FFFDF8]/60 to-[#FFFDF8]/95 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-[#FFFDF8]/20 to-[#FFFDF8]/75 pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 min-[481px]:px-5 md:px-6 lg:px-7 xl:px-8">
        {/* ══ HEADER (COMPACT & BALANCED) ═══════════════════════════ */}
        <div className="text-center max-w-2xl mx-auto mb-3 sm:mb-4">
          <div className="inline-flex items-center gap-2 mb-1">
            <span
              style={{ fontFamily: "'Lato', 'Manrope', 'Inter', sans-serif" }}
              className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em] text-[#C9A45C]"
            >
              ✦ THE SIGNATURE EDIT ✦
            </span>
          </div>

          <h2
            style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#5A1020] tracking-tight leading-tight mb-1"
          >
            Bestselling Silhouettes
          </h2>

          <p
            style={{ fontFamily: "'Lato', 'Manrope', 'Inter', sans-serif" }}
            className="text-[11.5px] sm:text-[12.5px] text-[#5A1020]/75 tracking-wide max-w-lg mx-auto leading-relaxed px-2"
          >
            Each silhouette is hand-loomed and embroidered by master artisans.
            Certified pure silks and bespoke couture.
          </p>

          <GoldLotusEmblem />
        </div>

        {/* ══ 3D CURVED CAROUSEL DISPLAY (SNUG PROPORTIONS) ═════════ */}
        <div
          ref={containerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="relative h-[375px] sm:h-[395px] md:h-[415px] flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
          style={{ perspective: '1100px' }}
        >
          {/* Circular Left Arrow Button */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsPaused(true); handlePrev(); setTimeout(() => setIsPaused(false), 2500) }}
            aria-label="Previous silhouette"
            className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 border border-[#E6C687]/60 shadow-[0_6px_18px_rgba(90,16,32,0.12)] backdrop-blur-md flex items-center justify-center text-[#5A1020] transition-all duration-300 hover:scale-110 hover:bg-[#5A1020] hover:text-white hover:border-[#5A1020] cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Circular Right Arrow Button */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsPaused(true); handleNext(); setTimeout(() => setIsPaused(false), 2500) }}
            aria-label="Next silhouette"
            className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 border border-[#E6C687]/60 shadow-[0_6px_18px_rgba(90,16,32,0.12)] backdrop-blur-md flex items-center justify-center text-[#5A1020] transition-all duration-300 hover:scale-110 hover:bg-[#5A1020] hover:text-white hover:border-[#5A1020] cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>

          {/* Cards Arc Track */}
          <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
            {items.map((item, idx) => {
              const cardStyle = getCardStyle(idx)
              let offset = idx - activeIdx
              while (offset > total / 2) offset -= total
              while (offset < -total / 2) offset += total
              const isCenter = offset === 0
              const isFav = !!favorites[item.id]

              const categoryName = typeof item.category === 'object'
                ? (item.category?.name || '')
                : (item.category || item.categoryName || 'COUTURE')

              return (
                <motion.div
                  key={item.id}
                  onClick={() => {
                    if (isDragging.current) return
                    if (!isCenter) {
                      setIsPaused(true)
                      setActiveIdx(idx)
                      setTimeout(() => setIsPaused(false), 2500)
                    }
                  }}
                  animate={{
                    x: cardStyle.x,
                    y: cardStyle.y,
                    z: cardStyle.z,
                    scale: cardStyle.scale,
                    rotateY: cardStyle.rotateY,
                    opacity: cardStyle.opacity,
                  }}
                  transition={{
                    duration: 0.85,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                  style={{
                    position: 'absolute',
                    zIndex: cardStyle.zIndex,
                    pointerEvents: cardStyle.pointerEvents,
                    transformStyle: 'preserve-3d',
                    willChange: 'transform, opacity',
                  }}
                  className="w-[215px] sm:w-[235px] md:w-[250px] lg:w-[260px] transition-shadow duration-300"
                >
                  {/* Card Container */}
                  <div
                    className={`bg-white rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 ${
                      isCenter
                        ? 'border border-[#C9A45C]/75 shadow-[0_18px_45px_rgba(90,16,32,0.20)] ring-1 ring-[#C9A45C]/30'
                        : 'border border-[#E8DCCF]/90 shadow-[0_8px_24px_rgba(90,16,32,0.08)] hover:border-[#C9A45C]/50'
                    }`}
                  >
                    {/* Top Inset Image with rounded corners & floating heart */}
                    <div className="relative aspect-[3.8/4.2] m-2 rounded-lg sm:rounded-xl overflow-hidden bg-[#F7F2EB]">
                      <ReliableImage
                        src={item.image}
                        alt={item.name}
                        sizes="(max-width: 640px) 215px, (max-width: 1024px) 250px, 260px"
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />

                      {/* Floating Share Icon */}
                      <div className="absolute top-2 left-2 z-20">
                        <ProductShareButton
                          product={item}
                          variant="icon"
                          className="!w-7 !h-7 !min-w-[28px] !min-h-[28px] !p-0 !bg-white/95 !text-[#5A1020] border border-[#E6C687]/40 shadow-sm hover:scale-110 hover:!bg-[#5A1020] hover:!text-white"
                        />
                      </div>

                      {/* Floating Heart / Wishlist Icon */}
                      <button
                        onClick={(e) => toggleFavorite(e, item.id)}
                        aria-label="Save to Wishlist"
                        className={`absolute top-2 right-2 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                          isCenter
                            ? 'bg-[#5A1020] text-white shadow-md hover:bg-[#8B0000] hover:scale-110'
                            : isFav
                              ? 'bg-[#5A1020] text-white shadow-md'
                              : 'bg-white/95 text-[#5A1020] border border-[#E6C687]/40 shadow-sm hover:scale-110 hover:bg-white'
                        }`}
                      >
                        <Heart
                          size={13}
                          fill={isCenter || isFav ? 'currentColor' : 'none'}
                          strokeWidth={2}
                        />
                      </button>

                      {/* Clickable link to product details */}
                      <Link
                        to={`/products/${item.id}`}
                        onClick={(e) => {
                          if (isDragging.current || !isCenter) e.preventDefault()
                        }}
                        className="absolute inset-0 z-10"
                        aria-label={item.name}
                      />
                    </div>

                    {/* Card Body */}
                    <div className="px-3 pb-3 pt-0.5">
                      <span
                        style={{ fontFamily: "'Lato', 'Manrope', 'Inter', sans-serif" }}
                        className="block text-[9.5px] font-bold tracking-[0.18em] text-[#B8860B] uppercase"
                      >
                        {categoryName}
                      </span>

                      <h3
                        style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}
                        className="text-[13.5px] sm:text-[14.5px] font-bold text-[#211D1E] leading-snug line-clamp-1 mt-0.5"
                        title={item.name}
                      >
                        {item.name}
                      </h3>

                      <div className="flex items-center justify-between gap-1.5 mt-1.5 pt-1 border-t border-[#E8DCCF]/40">
                        <div>
                          <span
                            style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}
                            className="text-[14px] sm:text-[15px] font-bold text-[#211D1E]"
                          >
                            ₹{Number(item.price || 0).toLocaleString()}
                          </span>
                          <span
                            style={{ fontFamily: "'Lato', 'Inter', sans-serif" }}
                            className="text-[9.5px] text-[#211D1E]/55 ml-0.5"
                          >
                            / {item.unit || 'piece'}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleAddClick(e, item)}
                          className={`inline-flex items-center justify-center gap-1 text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full transition-all duration-200 ${
                            isCenter
                              ? 'bg-[#5A1020] text-white hover:bg-[#8B0000] shadow-sm hover:scale-105 active:scale-95'
                              : 'border border-[#5A1020]/45 text-[#5A1020] hover:bg-[#5A1020] hover:text-white'
                          }`}
                        >
                          {addingId === item.id ? 'Added ✓' : '+ ADD'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ══ GOLDEN ORBITAL TRAJECTORY LINE & NODE INDICATORS (COMPACT) ══ */}
        <div className="relative w-full max-w-3xl mx-auto -mt-2 mb-2 pointer-events-auto">
          <svg viewBox="0 0 1000 45" fill="none" className="w-full h-6 overflow-visible pointer-events-none">
            <defs>
              <linearGradient id="orbitGoldGradCompact" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C9A45C" stopOpacity="0.1" />
                <stop offset="25%" stopColor="#C9A45C" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#C9A45C" stopOpacity="0.8" />
                <stop offset="75%" stopColor="#C9A45C" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#C9A45C" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path
              d="M 50,10 Q 500,40 950,10"
              stroke="url(#orbitGoldGradCompact)"
              strokeWidth="1.4"
              fill="none"
            />
          </svg>

          {/* Interactive Node Indicators */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-4 -mt-2 relative z-20">
            {items.map((_, i) => {
              let offset = i - activeIdx
              while (offset > total / 2) offset -= total
              while (offset < -total / 2) offset += total
              const isCenter = offset === 0

              return (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  aria-label={`Go to silhouette ${i + 1}`}
                  className="p-1 focus:outline-none transition-transform duration-200 hover:scale-125"
                >
                  {isCenter ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[#5A1020] bg-white flex items-center justify-center shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-[#5A1020]" />
                    </div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-[#C9A45C]/55 hover:bg-[#5A1020] transition-colors" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ══ INTERACTION PROMPT HINT ════════════════════════════════ */}
        <div className="flex items-center justify-center gap-1.5 mb-2.5 text-[#5A1020]/75">
          <SwipeHandIcon />
          <span
            style={{ fontFamily: "'Lato', 'Manrope', 'Inter', sans-serif" }}
            className="text-[11px] font-medium tracking-wide"
          >
            Swipe or use arrows to explore
          </span>
        </div>

        {/* ══ ROYAL CRIMSON "VIEW FULL COLLECTION →" CTA ══ */}
        <div className="flex items-center justify-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[#C9A45C]">
            <span className="text-[9px]">✦</span>
            <span className="w-8 md:w-16 h-[1px] bg-gradient-to-r from-transparent to-[#C9A45C]" />
          </div>

          <Link
            to="/products"
            style={{ fontFamily: "'Lato', 'Manrope', 'Inter', sans-serif" }}
            className="inline-flex items-center gap-2 bg-[#5A1020] hover:bg-[#78152B] text-white font-semibold text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase px-7 sm:px-9 py-2.5 sm:py-3 rounded-full shadow-[0_6px_20px_rgba(90,16,32,0.22)] hover:shadow-[0_10px_26px_rgba(90,16,32,0.32)] hover:scale-105 active:scale-98 transition-all duration-200"
          >
            <span>VIEW FULL COLLECTION</span>
            <ArrowRight size={13} className="stroke-[2.2]" />
          </Link>

          <div className="hidden sm:flex items-center gap-1.5 text-[#C9A45C]">
            <span className="w-8 md:w-16 h-[1px] bg-gradient-to-l from-transparent to-[#C9A45C]" />
            <span className="text-[9px]">✦</span>
          </div>
        </div>
      </div>
    </section>
  )
}
