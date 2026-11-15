import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const TESTIMONIALS = [
  {
    name: 'Radhika Reddy',
    city: 'HYDERABAD',
    rating: 5,
    quote: 'My wedding reception lehenga from AGVIA drew endless compliments. The zardozi intricacy and bespoke drape were completely unmatched.',
    avatar: '/images/kanjeevaram_gold_silk_saree.jpg',
  },
  {
    name: 'Meera Nambiar',
    city: 'BENGALURU',
    rating: 5,
    quote: 'The pure silk saree I received feels like an heirloom. The weight of the silk and real gold zari border are extraordinary.',
    avatar: '/images/pastel_banarasi_georgette_saree.jpg',
  },
  {
    name: 'Pooja Singhania',
    city: 'MUMBAI',
    rating: 5,
    quote: "AGVIA's concierge team assisted me with made-to-measure styling and dispatch. The velvet keepsake packaging was royal.",
    avatar: '/images/rose_gold_zardozi_lehenga.jpg',
  },
  {
    name: 'Ananya Sharma',
    city: 'DELHI',
    rating: 5,
    quote: 'The Chikankari anarkali I ordered was breathtakingly beautiful. Every detail was perfect — from the fabric to the finishing.',
    avatar: '/images/chikankari_angrakha_anarkali.jpg',
  },
  {
    name: 'Priya Krishnamurthy',
    city: 'CHENNAI',
    rating: 5,
    quote: 'Ordered the Kanjeevaram saree for my wedding. It was a dream — the temple border had such fine zari work, absolutely heirloom quality.',
    avatar: '/images/mulberry_tissue_silk_saree.jpg',
  },
]

// Flower garland SVG — top-left corner hanging arrangement
function FlowerGarlandLeft() {
  return (
    <svg viewBox="0 0 280 420" fill="none" className="absolute top-0 left-0 h-full w-[16%] sm:w-[22%] pointer-events-none hidden md:block" aria-hidden="true">
      {/* Hanging vine stem */}
      <path d="M30,0 C40,80 20,160 50,240 C70,300 40,360 60,420" stroke="#C8A882" strokeWidth="1.2" fill="none" opacity="0.5" />
      <path d="M70,0 C80,60 55,140 80,220 C100,280 75,350 90,420" stroke="#D4B896" strokeWidth="1" fill="none" opacity="0.4" />
      {/* Large pink blossoms */}
      {[
        { cx: 55, cy: 60, r: 32 },
        { cx: 30, cy: 140, r: 26 },
        { cx: 80, cy: 210, r: 30 },
        { cx: 45, cy: 290, r: 24 },
        { cx: 90, cy: 370, r: 28 },
      ].map((b, i) => (
        <g key={i}>
          {[0,60,120,180,240,300].map((deg) => {
            const rad = (deg * Math.PI) / 180
            const px = b.cx + b.r * 0.6 * Math.cos(rad)
            const py = b.cy + b.r * 0.6 * Math.sin(rad)
            return (
              <ellipse key={deg} cx={px} cy={py} rx={b.r * 0.45} ry={b.r * 0.28}
                fill="#F5B8C4" opacity="0.72" transform={`rotate(${deg + 30} ${px} ${py})`} />
            )
          })}
          <circle cx={b.cx} cy={b.cy} r={b.r * 0.22} fill="#FADADD" opacity="0.9" />
          <circle cx={b.cx} cy={b.cy} r={b.r * 0.1} fill="#E8A0A8" opacity="0.8" />
        </g>
      ))}
      {/* Small buds */}
      {[[120,95],[20,180],[110,260],[60,340]].map(([cx,cy], i) => (
        <g key={`bud-${i}`}>
          <ellipse cx={cx} cy={cy} rx="10" ry="7" fill="#F9CDD5" opacity="0.65" transform={`rotate(${i*45} ${cx} ${cy})`} />
          <ellipse cx={cx} cy={cy+4} rx="8" ry="6" fill="#F5B8C4" opacity="0.55" transform={`rotate(${i*45+90} ${cx} ${cy+4})`} />
        </g>
      ))}
      {/* Leaf accents */}
      {[[40,110],[90,185],[35,265],[100,315]].map(([cx,cy], i) => (
        <ellipse key={`leaf-${i}`} cx={cx} cy={cy} rx="12" ry="5"
          fill="#B8C9A0" opacity="0.45" transform={`rotate(${-30 + i*20} ${cx} ${cy})`} />
      ))}
      {/* Scattered petals */}
      {[[150,80],[180,170],[140,260],[200,340]].map(([cx,cy], i) => (
        <ellipse key={`pet-${i}`} cx={cx} cy={cy} rx="6" ry="3.5"
          fill="#FADADD" opacity="0.5" transform={`rotate(${i*55} ${cx} ${cy})`} />
      ))}
    </svg>
  )
}

// Mirror image right side
function FlowerGarlandRight() {
  return (
    <svg viewBox="0 0 280 420" fill="none" className="absolute top-0 right-0 h-full w-[16%] sm:w-[22%] pointer-events-none hidden md:block" style={{ transform: 'scaleX(-1)' }} aria-hidden="true">
      <path d="M30,0 C40,80 20,160 50,240 C70,300 40,360 60,420" stroke="#C8A882" strokeWidth="1.2" fill="none" opacity="0.5" />
      <path d="M70,0 C80,60 55,140 80,220 C100,280 75,350 90,420" stroke="#D4B896" strokeWidth="1" fill="none" opacity="0.4" />
      {[
        { cx: 55, cy: 60, r: 32 },
        { cx: 30, cy: 140, r: 26 },
        { cx: 80, cy: 210, r: 30 },
        { cx: 45, cy: 290, r: 24 },
        { cx: 90, cy: 370, r: 28 },
      ].map((b, i) => (
        <g key={i}>
          {[0,60,120,180,240,300].map((deg) => {
            const rad = (deg * Math.PI) / 180
            const px = b.cx + b.r * 0.6 * Math.cos(rad)
            const py = b.cy + b.r * 0.6 * Math.sin(rad)
            return (
              <ellipse key={deg} cx={px} cy={py} rx={b.r * 0.45} ry={b.r * 0.28}
                fill="#F5B8C4" opacity="0.72" transform={`rotate(${deg + 30} ${px} ${py})`} />
            )
          })}
          <circle cx={b.cx} cy={b.cy} r={b.r * 0.22} fill="#FADADD" opacity="0.9" />
          <circle cx={b.cx} cy={b.cy} r={b.r * 0.1} fill="#E8A0A8" opacity="0.8" />
        </g>
      ))}
      {[[120,95],[20,180],[110,260],[60,340]].map(([cx,cy], i) => (
        <g key={`bud-${i}`}>
          <ellipse cx={cx} cy={cy} rx="10" ry="7" fill="#F9CDD5" opacity="0.65" transform={`rotate(${i*45} ${cx} ${cy})`} />
          <ellipse cx={cx} cy={cy+4} rx="8" ry="6" fill="#F5B8C4" opacity="0.55" transform={`rotate(${i*45+90} ${cx} ${cy+4})`} />
        </g>
      ))}
      {[[40,110],[90,185],[35,265],[100,315]].map(([cx,cy], i) => (
        <ellipse key={`leaf-${i}`} cx={cx} cy={cy} rx="12" ry="5"
          fill="#B8C9A0" opacity="0.45" transform={`rotate(${-30 + i*20} ${cx} ${cy})`} />
      ))}
      {[[150,80],[180,170],[140,260],[200,340]].map(([cx,cy], i) => (
        <ellipse key={`pet-${i}`} cx={cx} cy={cy} rx="6" ry="3.5"
          fill="#FADADD" opacity="0.5" transform={`rotate(${i*55} ${cx} ${cy})`} />
      ))}
    </svg>
  )
}

// Floor rangoli SVG
function FloorRangoli() {
  return (
    <svg viewBox="0 0 400 100" fill="none" className="w-full max-w-sm mx-auto opacity-60 pointer-events-none" aria-hidden="true">
      {/* Outer ring */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x = 200 + 45 * Math.cos(rad)
        const y = 50 + 22 * Math.sin(rad)
        return <ellipse key={deg} cx={x} cy={y} rx="12" ry="6"
          fill="#C9A45C" opacity="0.35" transform={`rotate(${deg} ${x} ${y})`} />
      })}
      {/* Middle ring */}
      {[0,45,90,135,180,225,270,315].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x = 200 + 28 * Math.cos(rad)
        const y = 50 + 13 * Math.sin(rad)
        return <ellipse key={deg} cx={x} cy={y} rx="8" ry="4"
          fill="#9B2043" opacity="0.4" transform={`rotate(${deg} ${x} ${y})`} />
      })}
      {/* Inner ring */}
      {[0,60,120,180,240,300].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x = 200 + 14 * Math.cos(rad)
        const y = 50 + 7 * Math.sin(rad)
        return <ellipse key={deg} cx={x} cy={y} rx="5" ry="3"
          fill="#C9A45C" opacity="0.6" transform={`rotate(${deg} ${x} ${y})`} />
      })}
      <circle cx="200" cy="50" r="5" fill="#9B2043" opacity="0.7" />
      <circle cx="200" cy="50" r="2" fill="#C9A45C" opacity="0.9" />
      {/* Scattered rose petals on floor */}
      {[[80,70],[130,85],[160,75],[240,80],[270,72],[320,88],[350,68]].map(([cx,cy],i) => (
        <ellipse key={i} cx={cx} cy={cy} rx="6" ry="3.5" fill="#F5C2C7"
          opacity="0.55" transform={`rotate(${i*30} ${cx} ${cy})`} />
      ))}
    </svg>
  )
}

// Arch-shaped card SVG clip path
function ArchCard({ children, active }) {
  return (
    <div
      className="relative flex flex-col items-center"
      style={{ minHeight: 320 }}
    >
      {/* Gold arch SVG border */}
      <svg
        viewBox="0 0 260 320"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`arch-grad-${active}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E6C687" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#C9A45C" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#E6C687" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {/* Arch path */}
        <path
          d="M8,320 L8,110 Q8,8 130,8 Q252,8 252,110 L252,320 Z"
          fill={active ? 'rgba(255,248,240,0.92)' : 'rgba(255,252,247,0.80)'}
          stroke={`url(#arch-grad-${active})`}
          strokeWidth={active ? '1.8' : '1'}
        />
        {/* Top arch ornament */}
        <circle cx="130" cy="8" r="5" fill="#C9A45C" opacity="0.8" />
        {/* Corner flourishes */}
        <path d="M8,130 C18,120 28,115 38,120" stroke="#C9A45C" strokeWidth="0.8" fill="none" opacity="0.6" />
        <path d="M252,130 C242,120 232,115 222,120" stroke="#C9A45C" strokeWidth="0.8" fill="none" opacity="0.6" />
        {/* Bottom mini flourish */}
        <path d="M100,312 Q130,305 160,312" stroke="#C9A45C" strokeWidth="0.8" fill="none" opacity="0.5" />
        <circle cx="130" cy="308" r="2.5" fill="#C9A45C" opacity="0.6" />
      </svg>
      {/* Card content */}
      <div className="relative z-10 flex flex-col items-center px-4 sm:px-7 pt-6 sm:pt-8 pb-6 sm:pb-7 w-full h-full text-center">
        {children}
      </div>
    </div>
  )
}

export default function TestimonialsCarousel() {
  const [idx, setIdx] = useState(1) // start at center
  const [dir, setDir] = useState(0)
  const total = TESTIMONIALS.length
  const timerRef = useRef(null)
  const touchStartX = useRef(null)

  const restart = () => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setDir(1)
      setIdx(i => (i + 1) % total)
    }, 5000)
  }

  useEffect(() => {
    restart()
    return () => clearInterval(timerRef.current)
  }, [])

  const prev = () => { setDir(-1); setIdx(i => (i - 1 + total) % total); restart() }
  const next = () => { setDir(1); setIdx(i => (i + 1) % total); restart() }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 40) {
      next()
    } else if (diff < -40) {
      prev()
    }
    touchStartX.current = null
  }

  // Show 3 cards: prev, current, next
  const cards = [-1, 0, 1].map(offset => {
    const i = (idx + offset + total) % total
    return { ...TESTIMONIALS[i], offset }
  })

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #FDF5EE 0%, #FAF0E8 40%, #F5E8DC 100%)',
        minHeight: 520,
      }}
    >
      {/* Arch background watermark */}
      <div className="absolute inset-0 pointer-events-none">
        <svg viewBox="0 0 1200 520" className="w-full h-full opacity-[0.07]" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {[180,500,820].map((x, i) => (
            <path key={i}
              d={`M${x-120},520 L${x-120},180 Q${x-120},${i===1?40:60} ${x},${i===1?40:60} Q${x+120},${i===1?40:60} ${x+120},180 L${x+120},520`}
              fill="none" stroke="#9B2043" strokeWidth="2"
            />
          ))}
        </svg>
      </div>

      {/* SVG Flower garlands */}
      <FlowerGarlandLeft />
      <FlowerGarlandRight />

      {/* Section Header */}
      <div className="relative z-10 text-center pt-8 sm:pt-10 pb-5 sm:pb-6 px-4">
        <span className="inline-flex items-center gap-2 text-[#9B2043] text-[9.5px] sm:text-[10px] font-bold tracking-[0.32em] uppercase mb-2 sm:mb-3">
          <span className="block w-6 sm:w-8 h-px bg-[#C9A45C]/60" />
          ✦ PATRON EXPERIENCES ✦
          <span className="block w-6 sm:w-8 h-px bg-[#C9A45C]/60" />
        </span>
        <h2 className="font-serif text-2xl xs:text-3xl sm:text-4xl lg:text-5xl text-[#211D1E] font-bold leading-tight">
          Voices of{' '}
          <span
            style={{ fontFamily: "'Alex Brush','Cormorant Garamond',cursive" }}
            className="italic font-normal text-[#7B1030] text-3xl xs:text-4xl sm:text-5xl lg:text-6xl"
          >
            Elegance
          </span>
        </h2>
        <p className="font-sans text-[11.5px] sm:text-sm text-[#211D1E]/60 mt-1.5 sm:mt-2 max-w-lg mx-auto leading-relaxed px-2">
          From royal wedding galas to intimate soirees — draped in timeless AGVIA grace.
        </p>
      </div>

      {/* Carousel with Touch Swipe Support */}
      <div 
        className="relative z-10 flex items-center justify-center gap-1.5 xs:gap-3 sm:gap-5 px-2 xs:px-4 sm:px-16 pb-6 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left arrow */}
        <button
          onClick={prev}
          className="shrink-0 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/90 border border-[#C9A45C]/40 shadow-md flex items-center justify-center text-[#7B1030] hover:bg-[#7B1030] hover:text-white hover:border-[#7B1030] transition-all"
          aria-label="Previous"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Cards Container */}
        <div className="flex items-end justify-center gap-3 sm:gap-4 flex-1 min-w-0 max-w-3xl">
          {cards.map(({ name, city, rating, quote, avatar, offset }) => {
            const isCenter = offset === 0
            return (
              <motion.div
                key={name}
                animate={{
                  scale: isCenter ? 1 : 0.88,
                  opacity: isCenter ? 1 : 0.65,
                  y: isCenter ? 0 : 18,
                }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={`${isCenter ? 'w-full max-w-[min(320px,calc(100vw-88px))] sm:w-[38%] sm:max-w-[280px] shrink' : 'hidden sm:block w-[28%] max-w-[210px] shrink-0'}`}
              >
                <ArchCard active={isCenter}>
                  <div className={`relative mb-2.5 sm:mb-3 ${isCenter ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-12 h-12'} rounded-full overflow-hidden border-2 border-[#C9A45C]/60 shadow-md shrink-0`}>
                    <img
                      src={avatar.replace(/\.(jpg|jpeg|png)$/i, '-400.webp')}
                      alt={name}
                      width={64}
                      height={64}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>

                  {/* Stars */}
                  <div className="flex gap-0.5 mb-1.5 sm:mb-2">
                    {[...Array(rating)].map((_, s) => (
                      <Star key={s} size={isCenter ? 11 : 9} className="text-[#C9A45C] fill-[#C9A45C]" />
                    ))}
                  </div>

                  {/* Quote mark */}
                  <span
                    className="text-[#C9A45C] leading-none mb-0.5 sm:mb-1 block"
                    style={{ fontFamily: 'Georgia, serif', fontSize: isCenter ? 36 : 28, lineHeight: 0.8 }}
                  >
                    "
                  </span>

                  {/* Quote text */}
                  <p className={`font-sans italic text-[#211D1E]/75 text-center leading-relaxed mb-2.5 sm:mb-3 ${isCenter ? 'text-[11.5px] sm:text-[12px]' : 'text-[10px] sm:text-[10.5px]'}`}>
                    {quote}
                  </p>

                  {/* Divider flourish */}
                  <div className="flex items-center gap-1.5 mb-1.5 sm:mb-2 w-full max-w-[140px]">
                    <span className="block flex-1 h-px bg-[#C9A45C]/30" />
                    <span className="text-[#C9A45C] text-[8px]">✦</span>
                    <span className="block flex-1 h-px bg-[#C9A45C]/30" />
                  </div>

                  {/* Name */}
                  <p className={`font-serif font-bold text-[#7B1030] text-center ${isCenter ? 'text-[13px] sm:text-sm' : 'text-xs'}`}>
                    {name}
                  </p>
                  <p className="font-sans text-[8px] sm:text-[8.5px] tracking-[0.22em] text-[#211D1E]/45 text-center mt-0.5">
                    {city}
                  </p>
                </ArchCard>
              </motion.div>
            )
          })}
        </div>

        {/* Right arrow */}
        <button
          onClick={next}
          className="shrink-0 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/90 border border-[#C9A45C]/40 shadow-md flex items-center justify-center text-[#7B1030] hover:bg-[#7B1030] hover:text-white hover:border-[#7B1030] transition-all"
          aria-label="Next"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="relative z-10 flex justify-center gap-2 pb-5">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDir(i > idx ? 1 : -1); setIdx(i); restart() }}
            className={`rounded-full transition-all duration-300 ${
              i === idx
                ? 'w-5 h-2 bg-[#9B2043]'
                : 'w-2 h-2 bg-[#C9A45C]/40 hover:bg-[#C9A45C]/70'
            }`}
            aria-label={`Go to testimonial ${i + 1}`}
          />
        ))}
      </div>

      {/* Floor rangoli */}
      <div className="relative z-10 pb-6">
        <FloorRangoli />
      </div>
    </section>
  )
}
