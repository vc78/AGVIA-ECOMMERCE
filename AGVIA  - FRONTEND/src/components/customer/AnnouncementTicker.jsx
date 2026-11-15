import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, Copy, Check, Truck, ShieldCheck, Flame, Gift, 
  ChevronLeft, ChevronRight, Pause, Play, Tag, Volume2, ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const ANNOUNCEMENTS = [
  {
    id: 1,
    icon: Sparkles,
    category: 'NEW SEASON EDIT',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    title: 'The Royal Autumn Couture Edit — Handcrafted Sarees & Lehengas',
    details: 'Pure mulberry silks, delicate zardozi embroidery, and flowing chanderi silhouettes designed in Hyderabad.',
    link: '/products',
    linkText: 'Explore Couture',
    code: null,
  },
  {
    id: 2,
    icon: Tag,
    category: 'BOUTIQUE PRIVILEGE',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    title: 'Enjoy 15% Off Your First AGVIA Boutique Wardrobe Order',
    details: 'Valid across our entire festive edit, bridal collection, and artisanal silk creations.',
    link: '/products',
    linkText: 'Shop Collection',
    code: 'AGVIA15',
  },
  {
    id: 3,
    icon: Truck,
    category: 'LUXURY DISPATCH',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    title: 'Complimentary Express Shipping on Orders Above ₹2,499 Across India',
    details: 'Every piece is packaged in our signature keepsake box with garment dust cover.',
    link: '/products',
    linkText: 'Discover Now',
    code: null,
  },
  {
    id: 4,
    icon: Gift,
    category: 'WEDDING EDIT',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    title: 'Curated Bridal Trousseau & Bridesmaid Hampers Available',
    details: 'Personalized styling recommendations, custom blouse tailoring, and heirloom jewelry styling.',
    link: '/products?category=Wedding+Edit',
    linkText: 'View Wedding Edit',
    code: 'BRIDAL10',
  },
  {
    id: 5,
    icon: ShieldCheck,
    category: 'HERITAGE WEAVE',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    title: '100% Certified Pure Handloom Silks & Organic Natural Dyes',
    details: 'Supporting generational Indian karigars and master weavers across Kanchipuram, Banaras, and Hyderabad.',
    link: '/about',
    linkText: 'Read Our Story',
    code: null,
  }
]

export default function AnnouncementTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)
  const [expandedItem, setExpandedItem] = useState(null)
  const [mode, setMode] = useState('marquee') // 'marquee' or 'carousel'
  const autoAdvanceRef = useRef(null)

  // Auto advance in carousel mode or periodic highlight
  useEffect(() => {
    if (mode === 'carousel' && !isPaused && !expandedItem) {
      autoAdvanceRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length)
      }, 5000)
    }
    return () => clearInterval(autoAdvanceRef.current)
  }, [mode, isPaused, expandedItem])

  const handleCopy = (code, e) => {
    e?.stopPropagation()
    navigator.clipboard.writeText(code).catch(() => {})
    setCopiedCode(code)
    toast.success(`Coupon code "${code}" copied to clipboard!`, {
      style: {
        background: '#2D0A0A',
        color: '#FFFDF8',
        border: '1px solid #B8860B',
        borderRadius: '12px',
        fontWeight: '600',
        fontSize: '12px',
      },
      icon: '✨',
    })
    setTimeout(() => setCopiedCode(null), 3000)
  }

  const prevAnnouncement = () => {
    setMode('carousel')
    setCurrentIndex((prev) => (prev - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length)
  }

  const nextAnnouncement = () => {
    setMode('carousel')
    setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length)
  }

  const currentItem = ANNOUNCEMENTS[currentIndex]
  const CurrentIcon = currentItem.icon

  return (
    <>
      {/* Top Banner Container */}
      <div 
        className="relative bg-gradient-to-r from-[#1b0808] via-[#4a0810] to-[#1a0f28] text-white border-b border-[#B8860B]/30 select-none shadow-md z-30 transition-all duration-300"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Subtle Ambient Shimmer Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(218,165,32,0.08)_50%,transparent_75%)] bg-[length:250%_100%] animate-pulse pointer-events-none" />

        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 flex items-center justify-between gap-3 text-xs">
          
          {/* Left Live Indicator & Mode Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="hidden sm:inline-block text-[9px] tracking-[0.25em] font-extrabold uppercase text-[#E6C687] bg-white/10 px-2 py-0.5 rounded-full border border-[#B8860B]/30 shadow-inner">
              LIVE UPDATES
            </span>

            {/* Carousel / Marquee mode switch */}
            <button
              onClick={() => setMode(mode === 'marquee' ? 'carousel' : 'marquee')}
              title={mode === 'marquee' ? 'Switch to Step-by-Step View' : 'Switch to Continuous Stream'}
              className="text-[9px] uppercase tracking-wider text-white/60 hover:text-white bg-black/20 hover:bg-black/40 px-2 py-0.5 rounded border border-white/10 transition-colors hidden md:inline-flex items-center gap-1"
            >
              <Tag size={9} />
              {mode === 'marquee' ? 'Interactive View' : 'Stream View'}
            </button>
          </div>

          {/* Center Content: Marquee or Focused Carousel */}
          <div className="flex-1 overflow-hidden mx-2 relative min-h-[26px] flex items-center justify-center">
            {mode === 'marquee' ? (
              /* CONTINUOUS SMOOTH MARQUEE STREAM */
              <div
                className={`flex shrink-0 items-center gap-12 whitespace-nowrap will-change-transform ${
                  isPaused ? '' : 'animate-marquee'
                }`}
                style={{ animationDuration: '30s' }}
              >
                {[...ANNOUNCEMENTS, ...ANNOUNCEMENTS].map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <div 
                      key={idx} 
                      className="inline-flex items-center gap-2.5 text-[11px] tracking-wide font-body group cursor-pointer"
                      onClick={() => setExpandedItem(item)}
                    >
                      <span className={`inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                        <Icon size={9} />
                        {item.category}
                      </span>

                      <span className="text-white/90 font-medium group-hover:text-[#E6C687] transition-colors">
                        {item.title}
                      </span>

                      {item.code && (
                        <button
                          onClick={(e) => handleCopy(item.code, e)}
                          className="inline-flex items-center gap-1 bg-[#B8860B] hover:bg-[#d49b13] text-[#2D1B69] hover:text-black font-extrabold text-[9px] uppercase tracking-widest px-2 py-0.5 rounded shadow transition-all active:scale-95"
                          title={`Copy code ${item.code}`}
                        >
                          {copiedCode === item.code ? (
                            <>
                              <Check size={10} className="text-emerald-950 font-bold" />
                              <span>COPIED</span>
                            </>
                          ) : (
                            <>
                              <span>{item.code}</span>
                              <Copy size={9} />
                            </>
                          )}
                        </button>
                      )}

                      <span className="text-[#E6C687]/40 text-xs pl-2">✦</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* STEP-BY-STEP FOCUSED CAROUSEL MODE */
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentItem.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-2.5 text-center cursor-pointer"
                  onClick={() => setExpandedItem(currentItem)}
                >
                  <span className={`inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${currentItem.badgeColor}`}>
                    <CurrentIcon size={10} />
                    {currentItem.category}
                  </span>

                  <span className="text-white/95 font-medium hover:text-[#E6C687] transition-colors truncate max-w-xs sm:max-w-md md:max-w-xl text-[11px]">
                    {currentItem.title}
                  </span>

                  {currentItem.code && (
                    <button
                      onClick={(e) => handleCopy(currentItem.code, e)}
                      className="inline-flex items-center gap-1 bg-[#B8860B] hover:bg-[#d49b13] text-[#2D1B69] font-extrabold text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded shadow transition-all active:scale-95"
                    >
                      {copiedCode === currentItem.code ? (
                        <>
                          <Check size={10} className="text-emerald-950 font-bold" />
                          <span>COPIED</span>
                        </>
                      ) : (
                        <>
                          <span>USE {currentItem.code}</span>
                          <Copy size={9} />
                        </>
                      )}
                    </button>
                  )}

                  <span className="hidden sm:inline-block text-[9px] text-amber-300/80 hover:text-amber-200 underline underline-offset-2">
                    Details →
                  </span>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Right Interactive Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Previous announcement */}
            <button
              onClick={prevAnnouncement}
              aria-label="Previous announcement"
              className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Previous Announcement"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Pause / Resume Button */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              aria-label={isPaused ? "Play ticker" : "Pause ticker"}
              className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title={isPaused ? "Resume Ticker" : "Pause Ticker"}
            >
              {isPaused ? <Play size={12} /> : <Pause size={12} />}
            </button>

            {/* Next announcement */}
            <button
              onClick={nextAnnouncement}
              aria-label="Next announcement"
              className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Next Announcement"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Announcement Modal Card */}
      <AnimatePresence>
        {expandedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-[#FFFDF8] border border-[#B8860B]/40 rounded-3xl p-6 shadow-2xl text-[#3A2D23] overflow-hidden"
            >
              {/* Header decorative accent */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#8B0000] via-[#B8860B] to-[#2D1B69]" />

              <div className="flex items-start justify-between mt-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${expandedItem.badgeColor}`}>
                  <expandedItem.icon size={12} />
                  {expandedItem.category}
                </span>

                <button
                  onClick={() => setExpandedItem(null)}
                  className="w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#3A2D23]/70 hover:text-black transition-colors"
                >
                  ✕
                </button>
              </div>

              <h3 className="font-display text-xl font-bold text-[#8B0000] mb-2 leading-snug">
                {expandedItem.title}
              </h3>

              <p className="font-body text-xs text-[#3A2D23]/80 leading-relaxed mb-6">
                {expandedItem.details}
              </p>

              {expandedItem.code && (
                <div className="flex items-center justify-between p-3.5 bg-[#FFF9ED] border-2 border-dashed border-[#B8860B]/40 rounded-2xl mb-6">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-[#B8860B] font-bold block">
                      Promotion Coupon
                    </span>
                    <span className="font-mono text-xl font-bold text-[#8B0000] tracking-wider">
                      {expandedItem.code}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(expandedItem.code)}
                    className="flex items-center gap-1.5 bg-[#8B0000] hover:bg-[#a61515] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    {copiedCode === expandedItem.code ? (
                      <>
                        <Check size={14} className="text-green-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Link
                  to={expandedItem.link}
                  onClick={() => setExpandedItem(null)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#8B0000] hover:bg-[#a61515] text-white font-bold text-xs uppercase tracking-widest py-3 rounded-full transition-all shadow-md"
                >
                  {expandedItem.linkText} <ArrowRight size={13} />
                </Link>
                <button
                  onClick={() => setExpandedItem(null)}
                  className="text-xs text-[#3A2D23]/60 hover:text-black px-4 py-3"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
