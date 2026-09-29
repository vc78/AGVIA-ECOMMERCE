import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import ReliableImage from '../common/ReliableImage'

// ── Curated Boutique Collections matching user's exact design reference ──
const BOUTIQUE_COLLECTIONS = [
  {
    id: 'sarees',
    name: 'Sarees',
    subtitle: 'Timeless Elegance',
    styles: '25+ Styles',
    image: '/images/classic_silk_saree.jpg',
    link: '/products?category=Sarees',
    iconType: 'saree',
    featured: false,
  },
  {
    id: 'lehengas',
    name: 'Lehengas',
    subtitle: 'Bridal & Festive',
    styles: '40+ Styles',
    image: '/images/wedding_lehenga.jpg',
    link: '/products?category=Lehengas',
    iconType: 'lehenga',
    featured: false,
  },
  {
    id: 'festive-ensembles',
    name: 'Festive Ensembles',
    subtitle: 'Curated Sets',
    styles: '40+ Styles',
    image: '/images/coord_set.jpg',
    link: '/products?category=Western+Wear',
    iconType: 'wedding',
    featured: false,
  },
  {
    id: 'anarkalis-kurtas',
    name: 'Anarkalis & Kurtas',
    subtitle: 'Graceful Comfort',
    styles: '30+ Styles',
    image: '/images/anarkali_set.jpg',
    link: '/products?category=Anarkalis+%26+Kurtas',
    iconType: 'anarkali',
    featured: true,
  },
  {
    id: 'wedding-festive',
    name: 'Wedding & Festive',
    subtitle: 'Grand Occasions',
    styles: '20+ Styles',
    image: '/images/evening_gown.jpg',
    link: '/wedding-orders',
    iconType: 'gown',
    featured: false,
  },
  {
    id: 'western-wear',
    name: 'Western Wear',
    subtitle: 'Contemporary Chic',
    styles: '35+ Styles',
    image: '/images/pexels-ron-lach-8386651.jpg',
    link: '/products?category=Western+Wear',
    iconType: 'gown',
    featured: false,
  },
  {
    id: 'zardozi-kurtas',
    name: 'Zardozi Kurtas',
    subtitle: 'Signature Craft',
    styles: '15+ Styles',
    image: '/images/everyday_kurta_set.jpg',
    link: '/products?category=Kurtis',
    iconType: 'zardosi',
    featured: false,
  },
]

// ── Artisanal Badge SVGs matching each category ──
function CategoryIcon({ type }) {
  switch (type) {
    case 'saree':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
          <path d="M6 3C4 6 4 17 12 21C20 17 20 6 18 3" strokeLinecap="round" />
          <path d="M8 7C11 11 13 14 16 17" strokeLinecap="round" />
          <circle cx="12" cy="11" r="1.5" fill="currentColor" opacity="0.3" />
        </svg>
      )
    case 'lehenga':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
          <path d="M9 4H15L19 20H5L9 4Z" strokeLinejoin="round" />
          <path d="M12 4V20" strokeDasharray="2 2" opacity="0.5" />
          <circle cx="12" cy="7" r="1" fill="currentColor" />
        </svg>
      )
    case 'anarkali':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
          <path d="M9 3H15L17 10L19.5 21H4.5L7 10L9 3Z" strokeLinejoin="round" />
          <circle cx="12" cy="6.5" r="1.5" fill="currentColor" opacity="0.4" />
        </svg>
      )
    case 'gown':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
          <path d="M10 3H14L13 9L18 21H6L11 9L10 3Z" strokeLinejoin="round" />
          <path d="M12 9V21" strokeDasharray="2 2" opacity="0.4" />
        </svg>
      )
    case 'wedding':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
          <circle cx="8.5" cy="6" r="2.5" />
          <circle cx="15.5" cy="6" r="2.5" />
          <path d="M5.5 19V14C5.5 12 7.5 11 9.5 11C10.5 11 11.5 12 11.5 13" strokeLinecap="round" />
          <path d="M18.5 19V14C18.5 12 16.5 11 14.5 11C13.5 11 12.5 12 12.5 13" strokeLinecap="round" />
        </svg>
      )
    case 'zardosi':
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
          <line x1="6" y1="18" x2="18" y2="6" strokeLinecap="round" />
          <ellipse cx="17" cy="7" rx="2.5" ry="1.2" transform="rotate(-45 17 7)" />
          <path d="M6 18C4 20 6 22 8 20" strokeLinecap="round" />
        </svg>
      )
  }
}

// ── Delicate Lotus Ornament SVG ──
function GoldLotusSvg() {
  return (
    <svg viewBox="0 0 46 22" fill="none" className="w-8 h-4 mx-auto text-[#C9A45C]">
      <path
        d="M23 2C20 7 16 11 12 14C8 17 9 19 12 20C15 21 18 18 23 13C28 18 31 21 34 20C37 19 38 17 34 14C30 11 26 7 23 2Z"
        fill="#C9A45C"
        fillOpacity="0.2"
        stroke="#C9A45C"
        strokeWidth="1.1"
      />
      <circle cx="23" cy="15" r="1.2" fill="#C9A45C" />
    </svg>
  )
}

export default function InteractiveItemsReel() {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const scrollerRef = useRef(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeftPos = useRef(0)
  const hasMoved = useRef(false)
  const resumeTimeoutRef = useRef(null)

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < maxScroll - 10)
    if (maxScroll > 0) {
      setScrollProgress(Math.min(100, Math.max(0, (el.scrollLeft / maxScroll) * 100)))
    }
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    updateScrollState()
    const handleScroll = () => updateScrollState()
    el.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', updateScrollState, { passive: true })
    return () => {
      el.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState])

  // Pause helper for manual interactions (arrows, touch, drag)
  const pauseAutoScrollTemporarily = useCallback((delay = 4500) => {
    setIsPaused(true)
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false)
    }, delay)
  }, [])

  // ── Auto-scroll items automatically every 3.2s ──
  useEffect(() => {
    if (isPaused) return

    const timer = setInterval(() => {
      const el = scrollerRef.current
      if (!el || isDragging.current) return

      const maxScroll = el.scrollWidth - el.clientWidth
      if (maxScroll <= 0) return

      // If at or near the end, loop smoothly back to beginning
      if (el.scrollLeft >= maxScroll - 20) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        const firstChild = el.firstElementChild
        const step = firstChild ? firstChild.offsetWidth + 16 : 240
        // If remaining scroll is less than a step, scroll to end
        if (el.scrollLeft + step >= maxScroll - 20) {
          el.scrollTo({ left: maxScroll, behavior: 'smooth' })
        } else {
          el.scrollBy({ left: step, behavior: 'smooth' })
        }
      }
    }, 3200)

    return () => {
      clearInterval(timer)
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    }
  }, [isPaused])

  const scrollByAmount = (direction) => {
    const el = scrollerRef.current
    if (!el) return
    const firstChild = el.firstElementChild
    const step = firstChild ? (firstChild.offsetWidth + 16) * 1.5 : (el.clientWidth * 0.72)
    const scrollOffset = direction * step
    el.scrollBy({ left: scrollOffset, behavior: 'smooth' })
    pauseAutoScrollTemporarily(5000)
  }

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    if (!scrollerRef.current) return
    isDragging.current = true
    hasMoved.current = false
    startX.current = e.pageX - scrollerRef.current.offsetLeft
    scrollLeftPos.current = scrollerRef.current.scrollLeft
    scrollerRef.current.style.cursor = 'grabbing'
    pauseAutoScrollTemporarily(6000)
  }

  const handleMouseMove = (e) => {
    if (!isDragging.current || !scrollerRef.current) return
    const x = e.pageX - scrollerRef.current.offsetLeft
    const walk = (x - startX.current) * 1.3
    if (Math.abs(walk) > 5) hasMoved.current = true
    scrollerRef.current.scrollLeft = scrollLeftPos.current - walk
  }

  const handleMouseUp = () => {
    isDragging.current = false
    if (scrollerRef.current) {
      scrollerRef.current.style.cursor = 'grab'
    }
    pauseAutoScrollTemporarily(3500)
  }

  return (
    <section className="relative py-8 sm:py-10 md:py-12 overflow-hidden border-y border-[#E6C687]/35 select-none bg-[#FFFDF8]">
      {/* ══ PALATIAL BOUTIQUE SHOWCASE BACKGROUND ══════════════════ */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="w-full h-full bg-cover bg-center transition-all duration-700"
          style={{
            backgroundImage: "url('/images/shop_by_collection_bg.jpg')",
            filter: 'contrast(1.02) saturate(1.06) brightness(1.02)',
          }}
        />
        {/* Soft luxury ivory vignette overlays ensuring crisp typography */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFFDF8]/45 via-[#FFFDF8]/20 to-[#FFFDF8]/45 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF8]/85 via-transparent to-[#FFFDF8]/90 pointer-events-none" />
      </div>

      <div className="w-full max-w-[1320px] mx-auto px-[clamp(16px,3vw,40px)] relative z-10">
        {/* ══ 3-COLUMN HEADER SECTION (RESPONSIVE EDITORIAL COMPOSITION) ═════ */}
        <div className="relative mb-6 sm:mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 items-center gap-3 sm:gap-4">
            {/* Left Column: AGVIA Brand & Tradition Meets Modern Style (Desktop) */}
            <div className="hidden lg:flex flex-col items-start pl-2">
              <div className="flex items-center gap-2 mb-1 text-[#5A1020]">
                <GoldLotusSvg />
              </div>
              <h3
                style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}
                className="text-2xl font-bold tracking-[0.22em] text-[#5A1020] uppercase leading-none"
              >
                AGVIA
              </h3>
              <p
                style={{ fontFamily: "'Lato', 'Manrope', 'Inter', sans-serif" }}
                className="text-[8.5px] uppercase tracking-[0.3em] text-[#5A1020]/75 font-semibold mt-1"
              >
                Women's Wear Boutique
              </p>

              <div className="w-16 h-[1px] bg-[#C9A45C]/40 my-2" />

              <div className="text-[10px] uppercase tracking-[0.2em] font-medium leading-tight text-[#5A1020]/80">
                <p>Tradition</p>
                <p className="text-[#C9A45C] font-semibold my-0.5">Meets</p>
                <p>Modern Style</p>
              </div>
            </div>

            {/* Center Columns: Main Title & Subtitle */}
            <div className="lg:col-span-2 text-center">
              {/* Gold Lotus Icon Above Tag */}
              <GoldLotusSvg />

              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 my-1">
                <span
                  style={{ fontFamily: "'Lato', 'Manrope', 'Inter', sans-serif" }}
                  className="text-[10px] min-[375px]:text-[11px] sm:text-[11.5px] font-bold uppercase tracking-[0.3em] min-[375px]:tracking-[0.35em] text-[#C9A45C]"
                >
                  ✦ EXPLORE OUR BOUTIQUE ✦
                </span>
              </div>

              {/* Main Title with Fluid Typography */}
              <h2
                style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}
                className="text-[1.65rem] min-[375px]:text-3xl sm:text-4xl md:text-[2.65rem] font-bold text-[#211D1E] tracking-tight leading-tight"
              >
                Shop by{' '}
                <span
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  className="italic font-normal text-[#5A1020]"
                >
                  Collection
                </span>
              </h2>

              {/* Subtitle */}
              <p
                style={{ fontFamily: "'Lato', 'Inter', sans-serif" }}
                className="text-xs sm:text-[13px] text-[#211D1E]/70 mt-1 max-w-md mx-auto leading-relaxed px-2"
              >
                Discover beautifully curated ethnic wear for every occasion.
              </p>
            </div>

            {/* Right Column: "Elegance in Every Detail ♡" Calligraphy Script (Desktop) */}
            <div className="hidden lg:flex justify-end pr-3">
              <div className="text-right">
                <p
                  style={{ fontFamily: "'Alex Brush', 'Cormorant Garamond', cursive" }}
                  className="text-3xl lg:text-[2.2rem] text-[#8B4A5A] tracking-wide transform -rotate-3 select-none leading-tight"
                >
                  Elegance
                </p>
                <p
                  style={{ fontFamily: "'Alex Brush', 'Cormorant Garamond', cursive" }}
                  className="text-2xl lg:text-[1.85rem] text-[#C9A45C] tracking-wide transform -rotate-3 select-none leading-none -mt-1"
                >
                  in Every Detail ♡
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ══ ARCHED CARDS CAROUSEL ROW WITH TOUCH-SCROLL & NAVIGATION ═══════ */}
        <div
          className="relative group/carousel"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Circular Left Arrow Button (Visible on sm+ screens, comfortable 44px touch target) */}
          <button
            onClick={() => scrollByAmount(-1)}
            disabled={!canScrollLeft}
            aria-label="Previous collection"
            className={`hidden sm:flex absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 border border-[#E6C687]/60 shadow-[0_6px_22px_rgba(90,16,32,0.16)] backdrop-blur-md items-center justify-center text-[#5A1020] transition-all duration-300 hover:scale-110 hover:bg-[#5A1020] hover:text-white hover:border-[#5A1020] ${
              canScrollLeft
                ? 'opacity-90 hover:opacity-100 cursor-pointer'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Circular Right Arrow Button (Visible on sm+ screens, comfortable 44px touch target) */}
          <button
            onClick={() => scrollByAmount(1)}
            disabled={!canScrollRight}
            aria-label="Next collection"
            className={`hidden sm:flex absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 border border-[#E6C687]/60 shadow-[0_6px_22px_rgba(90,16,32,0.16)] backdrop-blur-md items-center justify-center text-[#5A1020] transition-all duration-300 hover:scale-110 hover:bg-[#5A1020] hover:text-white hover:border-[#5A1020] ${
              canScrollRight
                ? 'opacity-90 hover:opacity-100 cursor-pointer'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronRight size={20} />
          </button>

          {/* Mobile Quick Tap Arrow Controls (Comfortable 44px touch targets) */}
          <div className="flex sm:hidden justify-end items-center gap-2 mb-2 px-1">
            <button
              onClick={() => scrollByAmount(-1)}
              disabled={!canScrollLeft}
              aria-label="Previous collection"
              className="touch-target w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/95 border border-[#E6C687]/60 shadow-sm flex items-center justify-center text-[#5A1020] disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scrollByAmount(1)}
              disabled={!canScrollRight}
              aria-label="Next collection"
              className="touch-target w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/95 border border-[#E6C687]/60 shadow-sm flex items-center justify-center text-[#5A1020] disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Scrolling Row: Fluid 1.2–2 cards visible on mobile with partial cue peek and scroll-snap */}
          <div
            ref={scrollerRef}
            className="flex gap-3.5 sm:gap-4 md:gap-4.5 overflow-x-auto pb-4 pt-1 px-1 snap-x snap-mandatory scroll-smooth touch-pan-x"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              cursor: 'grab',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={() => pauseAutoScrollTemporarily(6000)}
            onTouchEnd={() => pauseAutoScrollTemporarily(3500)}
          >
            {BOUTIQUE_COLLECTIONS.map((col) => (
              <div key={col.id} className="snap-start shrink-0">
                <Link
                  to={col.link}
                  onClick={(e) => {
                    if (hasMoved.current) e.preventDefault()
                  }}
                  className="group block w-[60vw] min-w-[190px] max-w-[245px] sm:w-[185px] md:w-[195px] lg:w-[210px] xl:w-[220px] select-none"
                >
                  {/* Card Container with Arched Top */}
                  <div className={`bg-white rounded-t-[84px] sm:rounded-t-[96px] md:rounded-t-[105px] rounded-b-2xl overflow-hidden transition-all duration-300 flex flex-col ${
                    col.featured
                      ? 'border-2 border-[#C9A45C] shadow-[0_16px_45px_rgba(201,164,92,0.28)] ring-4 ring-[#C9A45C]/20 -translate-y-1 group-hover:-translate-y-2'
                      : 'border border-[#E6C687]/45 shadow-[0_8px_24px_rgba(90,16,32,0.08)] group-hover:shadow-[0_16px_38px_rgba(90,16,32,0.18)] group-hover:border-[#C9A45C] group-hover:-translate-y-1.5'
                  }`}>
                    {/* Arched Top Image */}
                    <div className="relative aspect-[3/4.2] overflow-hidden rounded-t-[84px] sm:rounded-t-[96px] md:rounded-t-[105px] bg-[#EFE8DD]">
                      <ReliableImage
                        src={col.image}
                        alt={col.name}
                        sizes="(max-width: 640px) 245px, (max-width: 1024px) 210px, 220px"
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                      />

                      {/* Soft luxury base vignette */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-65 group-hover:opacity-40 transition-opacity duration-300" />

                      {/* Circular Center Artisanal Badge Icon sitting on the junction */}
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E6C687]/70 shadow-md flex items-center justify-center text-[#5A1020] group-hover:scale-110 group-hover:border-[#5A1020] transition-all duration-300">
                        <CategoryIcon type={col.iconType} />
                      </div>
                    </div>

                    {/* Bottom Card Info: Title, Subtitle, Styles count & Circular Arrow Button */}
                    <div className="pt-6 pb-3 px-3 sm:px-3.5 bg-white text-center flex flex-col justify-between flex-1">
                      <div>
                        <h3
                          style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}
                          className="text-[14.5px] sm:text-[15.5px] font-bold text-[#211D1E] group-hover:text-[#5A1020] transition-colors leading-tight truncate"
                        >
                          {col.name}
                        </h3>
                        <p
                          style={{ fontFamily: "'Lato', 'Inter', sans-serif" }}
                          className="text-[10px] text-[#211D1E]/60 font-medium tracking-wide leading-tight mt-0.5 truncate"
                        >
                          {col.subtitle}
                        </p>
                      </div>

                      {/* Bottom Row: Styles Count & Circular Arrow Button */}
                      <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-[#E6C687]/25">
                        <span
                          style={{ fontFamily: "'Lato', 'Inter', sans-serif" }}
                          className="text-[10.5px] sm:text-[11px] font-bold text-[#211D1E]/75 tracking-tight"
                        >
                          {col.styles}
                        </span>

                        <div className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full bg-[#5A1020] text-white flex items-center justify-center group-hover:bg-[#8B0000] group-hover:scale-110 transition-all duration-300 shadow-sm shrink-0">
                          <ArrowRight size={12} className="stroke-[2.2]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* ══ SLIM GOLD HORIZONTAL SCROLL PROGRESS BAR ═══════════════ */}
        <div className="w-36 sm:w-48 h-1 bg-[#E6C687]/35 rounded-full mx-auto mt-4 mb-4 overflow-hidden">
          <div
            className="h-full bg-[#5A1020] rounded-full transition-all duration-300"
            style={{ width: `${Math.max(15, scrollProgress)}%` }}
          />
        </div>

        {/* ══ ROYAL CRIMSON "VIEW FULL COLLECTION →" CTA BUTTON ═════ */}
        <div className="flex items-center justify-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[#C9A45C]">
            <span className="text-[9px]">✦</span>
            <span className="w-10 md:w-16 h-[1px] bg-gradient-to-r from-transparent to-[#C9A45C]" />
          </div>

          <Link
            to="/products"
            style={{ fontFamily: "'Lato', 'Manrope', 'Inter', sans-serif" }}
            className="inline-flex items-center justify-center gap-2 bg-[#5A1020] hover:bg-[#78152B] text-white font-semibold text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase px-7 sm:px-9 py-3 rounded-full shadow-[0_6px_20px_rgba(90,16,32,0.22)] hover:shadow-[0_10px_26px_rgba(90,16,32,0.32)] hover:scale-105 active:scale-98 transition-all duration-200 min-h-[48px]"
          >
            <span>VIEW FULL COLLECTION</span>
            <ArrowRight size={13} className="stroke-[2.2]" />
          </Link>

          <div className="hidden sm:flex items-center gap-1.5 text-[#C9A45C]">
            <span className="w-10 md:w-16 h-[1px] bg-gradient-to-l from-transparent to-[#C9A45C]" />
            <span className="text-[9px]">✦</span>
          </div>
        </div>
      </div>
    </section>
  )
}
