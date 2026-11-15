import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight, Play } from 'lucide-react'

// ── Official NOOLU Campaign Carousel Configuration ──────────────────────────
export const NOOLU_HERO_SLIDES = [
  {
    id: 'noolu-signature-edition',
    slideNumber: '01',
    eyebrow: 'THE NOOLU SIGNATURE EDITION',
    headlineMain: 'Heritage Weaves,',
    headlineEmphasis: 'Contemporary Grace.',
    description: "A curated collection of timeless Indian textiles for life's special moments.",
    primaryCta: {
      text: 'Explore Collections',
      link: '/products',
    },
    secondaryCta: {
      text: 'Our Weaving Story',
      actionType: 'modal', // Triggers the heritage atelier story modal
      link: '/about',
    },
    desktopImage: '/images/noolu_hero_slide_01.webp',
    desktopFallback: '/images/noolu_hero_slide_01.jpg',
    mobileImage: '/images/noolu_hero_slide_01_mobile.webp',
    mobileFallback: '/images/noolu_hero_slide_01_mobile.jpg',
    altText: 'NOOLU Signature Heritage Collection — Indian model in deep maroon silk saree with antique gold zari in royal sandstone palace courtyard',
    focalPosition: 'object-[right_center] sm:object-[center_20%] lg:object-[center_15%]',
    accentColor: '#F5B900', // Loom Gold
  },
  {
    id: 'festive-weaves-edit',
    slideNumber: '02',
    eyebrow: 'THE FESTIVE WEAVES EDIT',
    headlineMain: 'An Elegance That',
    headlineEmphasis: 'Never Fades.',
    description: 'Discover beautiful Indian attire for celebrations, traditions and unforgettable occasions.',
    primaryCta: {
      text: 'Explore Festive Collection',
      link: '/products?category=Sarees',
    },
    secondaryCta: {
      text: 'Discover NOOLU',
      actionType: 'link',
      link: '/about',
    },
    desktopImage: '/images/noolu_hero_slide_02.webp',
    desktopFallback: '/images/noolu_hero_slide_02.jpg',
    mobileImage: '/images/noolu_hero_slide_02_mobile.webp',
    mobileFallback: '/images/noolu_hero_slide_02_mobile.jpg',
    altText: 'NOOLU Festive Weaves Edit — Seated model in ruby-burgundy Banarasi silk saree with floral gold jaal and traditional brass lamps',
    focalPosition: 'object-[right_center] sm:object-[center_25%] lg:object-[center_20%]',
    accentColor: '#C98D91', // Muted Rose
  },
  {
    id: 'timeless-dressing',
    slideNumber: '03',
    eyebrow: 'THE ART OF TIMELESS DRESSING',
    headlineMain: 'Tradition, Woven',
    headlineEmphasis: 'into Every Moment.',
    description: 'Explore a beautiful expression of Indian textile heritage and contemporary style.',
    primaryCta: {
      text: 'Discover Collections',
      link: '/products',
    },
    secondaryCta: {
      text: 'Our Story',
      actionType: 'link',
      link: '/about',
    },
    desktopImage: '/images/noolu_hero_slide_03.webp',
    desktopFallback: '/images/noolu_hero_slide_03.jpg',
    mobileImage: '/images/noolu_hero_slide_03_mobile.webp',
    mobileFallback: '/images/noolu_hero_slide_03_mobile.jpg',
    altText: 'NOOLU The Art of Timeless Dressing — Model in ivory raw silk saree with muted rose and antique gold zari in sunlit contemporary arcade',
    focalPosition: 'object-[right_center] sm:object-[center_20%] lg:object-[center_15%]',
    accentColor: '#F5B900', // Loom Gold
  },
]

const SLIDE_DURATION = 6000 // 6 seconds per slide

export default function HeroCarousel({ onOpenStoryModal }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)

  const carouselRef = useRef(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const timerRef = useRef(null)
  const progressIntervalRef = useRef(null)
  const startTimeRef = useRef(Date.now())

  const totalSlides = NOOLU_HERO_SLIDES.length
  const currentSlide = NOOLU_HERO_SLIDES[currentIdx]

  // Check prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Transition to specific slide
  const goToSlide = useCallback((newIdx, newDirection = 1) => {
    setDirection(newDirection)
    setCurrentIdx(newIdx)
    setProgress(0)
    startTimeRef.current = Date.now()
  }, [])

  const nextSlide = useCallback(() => {
    goToSlide((currentIdx + 1) % totalSlides, 1)
  }, [currentIdx, totalSlides, goToSlide])

  const prevSlide = useCallback(() => {
    goToSlide((currentIdx - 1 + totalSlides) % totalSlides, -1)
  }, [currentIdx, totalSlides, goToSlide])

  // Timer loop & smooth animated progress bar
  useEffect(() => {
    if (isPaused) {
      clearInterval(timerRef.current)
      clearInterval(progressIntervalRef.current)
      return
    }

    startTimeRef.current = Date.now()
    setProgress(0)

    // Progress tick every 50ms for buttery-smooth bar
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const currentPct = Math.min((elapsed / SLIDE_DURATION) * 100, 100)
      setProgress(currentPct)
    }, 50)

    // Slide advancement timer
    timerRef.current = setTimeout(() => {
      nextSlide()
    }, SLIDE_DURATION)

    return () => {
      clearTimeout(timerRef.current)
      clearInterval(progressIntervalRef.current)
    }
  }, [currentIdx, isPaused, nextSlide])

  // Pause on visibility change (when tab is inactive/minimized)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true)
      } else {
        setIsPaused(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      prevSlide()
    } else if (e.key === 'ArrowRight') {
      nextSlide()
    }
  }

  // Touch swipe support for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    const swipeThreshold = 50 // Minimum swipe distance in px
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        nextSlide() // Swiped left -> next
      } else {
        prevSlide() // Swiped right -> prev
      }
    }
  }

  // Animation variants
  const slideVariants = {
    enter: (dir) => ({
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 1.05,
      x: prefersReducedMotion ? 0 : dir * 60,
    }),
    center: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        duration: prefersReducedMotion ? 0.3 : 1.1,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: (dir) => ({
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.98,
      x: prefersReducedMotion ? 0 : -dir * 50,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.9,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  }

  return (
    <section
      ref={carouselRef}
      role="region"
      aria-label="NOOLU Featured Collections Carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-[580px] sm:min-h-[640px] md:min-h-[720px] lg:min-h-[820px] xl:min-h-[880px] w-full flex flex-col justify-between overflow-hidden bg-[#1E070F] text-white select-none focus:outline-none"
    >
      {/* ── Background Slides with Framer Motion ── */}
      <AnimatePresence initial={false} custom={direction} mode="sync">
        <motion.div
          key={currentSlide.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 z-0 overflow-hidden"
        >
          <picture className="w-full h-full block">
            {/* Mobile portrait crop for small screens */}
            <source
              media="(max-width: 640px)"
              type="image/webp"
              srcSet={currentSlide.mobileImage}
            />
            <source
              media="(max-width: 640px)"
              type="image/jpeg"
              srcSet={currentSlide.mobileFallback}
            />
            {/* Desktop wide editorial for tablets & desktops */}
            <source
              type="image/webp"
              srcSet={currentSlide.desktopImage}
            />
            <img
              src={currentSlide.desktopFallback}
              alt={currentSlide.altText}
              loading={currentIdx === 0 ? 'eager' : 'lazy'}
              fetchpriority={currentIdx === 0 ? 'high' : 'auto'}
              decoding={currentIdx === 0 ? 'sync' : 'async'}
              width={1920}
              height={900}
              className={`w-full h-full object-cover filter contrast-[1.04] brightness-[0.94] ${currentSlide.focalPosition}`}
            />
          </picture>

          {/* Luxury Editorial Overlay Gradients for Perfect Text Legibility */}
          {/* Left-to-right soft scrim for desktop text column */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#180309]/95 via-[#180309]/65 to-transparent sm:w-4/5 lg:w-[62%]" />
          
          {/* Subtle mobile bottom vignette to guarantee CTA contrast on portrait view */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#140207] via-[#140207]/40 to-transparent sm:hidden" />
          
          {/* Subtle top bar shadow */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/55 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* ── Slide Navigation Floating Arrows (Glassmorphic) ── */}
      <div className="absolute inset-y-0 left-3 sm:left-6 flex items-center z-20 pointer-events-none">
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-[#800020]/90 text-white/80 hover:text-white border border-white/20 hover:border-[#F5B900] backdrop-blur-md flex items-center justify-center transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:scale-110 active:scale-95"
        >
          <ChevronLeft size={20} className="stroke-[2.5]" />
        </button>
      </div>

      <div className="absolute inset-y-0 right-3 sm:right-6 flex items-center z-20 pointer-events-none">
        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-[#800020]/90 text-white/80 hover:text-white border border-white/20 hover:border-[#F5B900] backdrop-blur-md flex items-center justify-center transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:scale-110 active:scale-95"
        >
          <ChevronRight size={20} className="stroke-[2.5]" />
        </button>
      </div>

      {/* ── Editorial Content Area (Left Negative Space) ── */}
      <div className="relative z-10 w-full container-luxury flex-1 flex items-center py-6 sm:py-12 md:py-16">
        <div className="w-full max-w-2xl text-left">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4 sm:space-y-5"
            >
              {/* Lotus Monogram & Eyebrow */}
              <div className="inline-flex items-center gap-2 text-[#F5B900] tracking-[0.28em] text-[10px] sm:text-[11px] font-bold uppercase">
                <svg
                  className="w-4 h-4 fill-current shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2C12 2 10 7 10 11C10 13.2 10.9 15.1 12 16.5C13.1 15.1 14 13.2 14 11C14 7 12 2 12 2ZM7.5 7.5C7.5 7.5 6.5 12 8 15.5C8.8 14.8 9.5 13.7 9.8 12.3C9.2 10.7 8.4 9 7.5 7.5ZM16.5 7.5C15.6 9 14.8 10.7 14.2 12.3C14.5 13.7 15.2 14.8 16 15.5C17.5 12 16.5 7.5 16.5 7.5ZM4 13C4 13 4 16.5 6.5 19C7.2 17.8 8.1 16.8 9 16C7.5 14.8 5.8 13.8 4 13ZM20 13C18.2 13.8 16.5 14.8 15 16C15.9 16.8 16.8 17.8 17.5 19C20 16.5 20 13 20 13ZM12 18C10.5 18 8 19 6 21H18C16 19 13.5 18 12 18Z" />
                </svg>
                <span>{currentSlide.eyebrow}</span>
              </div>

              {/* Main Editorial Headline */}
              <h1 className="font-serif text-[clamp(2.3rem,5.6vw,4.6rem)] font-bold text-white leading-[1.06] tracking-tight filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
                <span className="block">{currentSlide.headlineMain}</span>
                <span
                  style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
                  className="italic font-normal text-[clamp(2.6rem,6.4vw,5.2rem)] text-[#FFF8EB] block -mt-1 sm:-mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[#FFF8EB] via-[#F5B900] to-[#FFF8EB]"
                >
                  {currentSlide.headlineEmphasis}
                </span>
              </h1>

              {/* Descriptive Copy */}
              <p className="font-sans text-xs sm:text-[14px] text-white/90 max-w-lg leading-relaxed tracking-wide font-normal">
                {currentSlide.description}
              </p>

              {/* Action Buttons (CTAs) */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to={currentSlide.primaryCta.link}
                  className="inline-flex items-center justify-center gap-2.5 bg-[#800020] hover:bg-[#9E0028] text-white font-bold text-[11px] sm:text-xs tracking-[0.16em] uppercase px-7 sm:px-8 py-3.5 rounded-full shadow-[0_8px_25px_rgba(128,0,32,0.6)] border border-[#F5B900]/30 hover:scale-105 active:scale-95 transition-all duration-200 min-h-[48px]"
                >
                  <span>{currentSlide.primaryCta.text}</span>
                  <ArrowRight size={13} className="stroke-[2.5]" />
                </Link>

                {currentSlide.secondaryCta.actionType === 'modal' ? (
                  <button
                    onClick={() => {
                      if (typeof onOpenStoryModal === 'function') {
                        onOpenStoryModal()
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2.5 bg-black/40 hover:bg-black/60 border border-white/35 hover:border-[#F5B900] text-white font-semibold text-[11px] sm:text-xs tracking-[0.12em] uppercase px-6 py-3.5 rounded-full backdrop-blur-md transition-all duration-200 active:scale-95 min-h-[48px]"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#F5B900]/25 flex items-center justify-center text-[#F5B900] text-[9px] pl-0.5">
                      <Play size={10} className="fill-current" />
                    </span>
                    <span>{currentSlide.secondaryCta.text}</span>
                  </button>
                ) : (
                  <Link
                    to={currentSlide.secondaryCta.link}
                    className="inline-flex items-center justify-center gap-2.5 bg-black/40 hover:bg-black/60 border border-white/35 hover:border-[#F5B900] text-white font-semibold text-[11px] sm:text-xs tracking-[0.12em] uppercase px-6 py-3.5 rounded-full backdrop-blur-md transition-all duration-200 active:scale-95 min-h-[48px]"
                  >
                    <span>{currentSlide.secondaryCta.text}</span>
                  </Link>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Slide Progress Timeline & Numbered Index Controls ── */}
      <div className="relative z-20 w-full container-luxury pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-white/15 pt-3">
          {/* Slide Number Counter */}
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-white/70">
            <span className="text-[#F5B900] font-bold text-sm">{currentSlide.slideNumber}</span>
            <span className="text-white/40">/</span>
            <span>0{totalSlides}</span>
            <span className="hidden sm:inline-block ml-3 text-[10px] tracking-wider uppercase text-white/50 font-sans">
              • {currentSlide.eyebrow}
            </span>
          </div>

          {/* Segmented Timeline Progress Bars */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {NOOLU_HERO_SLIDES.map((s, idx) => {
              const isActive = idx === currentIdx
              const isPassed = idx < currentIdx

              return (
                <button
                  key={s.id}
                  onClick={() => goToSlide(idx, idx > currentIdx ? 1 : -1)}
                  aria-label={`Go to slide ${idx + 1}: ${s.eyebrow}`}
                  className="group py-2 flex items-center cursor-pointer flex-1 sm:flex-initial"
                >
                  <div className="h-1.5 w-full sm:w-20 md:w-28 rounded-full bg-white/20 overflow-hidden relative transition-all duration-300 group-hover:bg-white/35">
                    {/* Active Fill Bar */}
                    <div
                      className={`h-full bg-gradient-to-r from-[#F5B900] to-[#FFF8EB] rounded-full transition-all duration-75 ${
                        isActive
                          ? ''
                          : isPassed
                          ? 'w-full'
                          : 'w-0'
                      }`}
                      style={{
                        width: isActive ? `${progress}%` : isPassed ? '100%' : '0%',
                      }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
