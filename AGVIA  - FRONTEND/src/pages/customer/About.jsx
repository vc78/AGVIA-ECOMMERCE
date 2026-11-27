import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award,
  Sparkles,
  ShieldCheck,
  Heart,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Gem,
  Scissors,
  Crown
} from 'lucide-react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import ReliableImage from '../../components/common/ReliableImage'

const ABOUT_SLIDES = [
  {
    id: 1,
    year: 'Est. 2012',
    tagline: '✦ THE ATELIER HERITAGE ✦',
    title: 'The Timeless Wefts of Royal Hyderabad',
    subtitle: 'From bespoke handloom Kanjeevaram weaves to regal bridal couture, our Jubilee Hills atelier crafts heirlooms of graceful Indian femininity.',
    image: '/images/classic_silk_saree.jpg',
    stat: '12+ Years',
    statDesc: 'Atelier Excellence'
  },
  {
    id: 2,
    year: 'Silk Mark Certified',
    tagline: '✦ PURE NOBLE FIBERS ✦',
    title: 'Pure Mulberry Silks & Real Metallic Zari',
    subtitle: 'We source genuine Silk Mark certified weaves, handloom organza, and real electroplated silver and gold zari. Zero synthetic polyesters, zero compromise.',
    image: '/images/wedding_lehenga.jpg',
    stat: '100% Pure',
    statDesc: 'Handloom & Certified Silk'
  },
  {
    id: 3,
    year: 'Haute Karigari',
    tagline: '✦ MASTER ARTISAN GUILD ✦',
    title: 'Hundreds of Hours of Hand Embroidery',
    subtitle: 'Our generational artisans hand-knot intricate zardozi, gota patti, dabka, and pearl embroidery onto bespoke silhouettes designed for weddings and grand celebrations.',
    image: '/images/anarkali_set.jpg',
    stat: '400+ Hours',
    statDesc: 'Craftsmanship Per Ensemble'
  }
]

const TIMELINE_MILESTONES = [
  {
    year: '2012',
    title: 'The Jubilee Hills Atelier',
    description: 'Founded in Hyderabad as an exclusive salon for bespoke handloom Kanjeevaram and Banarasi bridal trousseaus.',
    icon: Crown
  },
  {
    year: '2016',
    title: 'The Royal Zardozi Guild',
    description: 'United master hand-embroiderers and zardozi karigars to create custom hand-stitched bridal lehengas with royal Mughal and Deccani motifs.',
    icon: Award
  },
  {
    year: '2020',
    title: 'Contemporary Couture & Fusion',
    description: 'Introduced sculpted evening gowns, drape anarkalis, and pre-stitched festive sarees tailored for modern Indian women globally.',
    icon: Sparkles
  },
  {
    year: '2024 & Beyond',
    title: 'The Digital Haute Boutique',
    description: 'Blending high-touch atelier styling with bespoke digital tailoring, global insured delivery, and curated luxury bridal edits.',
    icon: ShieldCheck
  }
]

const PILLARS_OF_COUTURE = [
  {
    icon: Gem,
    title: 'Certified Handloom Silks',
    desc: 'Silk Mark certified pure mulberry, katan, and organza silks woven on traditional Indian pit looms.'
  },
  {
    icon: Sparkles,
    title: 'Authentic Hand Zardozi',
    desc: 'Painstaking needlework using French wire, dabka, resham, and seed pearls with zero machine shortcuts.'
  },
  {
    icon: Scissors,
    title: 'Bespoke Atelier Fit',
    desc: 'Each garment is tailored with generous internal seam allowances and structured canvas corsetry for sculpted comfort.'
  },
  {
    icon: Clock,
    title: 'Heirloom Keepsake Packaging',
    desc: 'Preserved in breathable muslin bags and gold-embossed AGVIA archival boxes designed to last generations.'
  }
]

export default function About() {
  const [slideIdx, setSlideIdx] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!isAutoPlay) return
    timerRef.current = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % ABOUT_SLIDES.length)
    }, 6000)
    return () => clearInterval(timerRef.current)
  }, [isAutoPlay])

  const nextSlide = () => {
    setSlideIdx((prev) => (prev + 1) % ABOUT_SLIDES.length)
  }

  const prevSlide = () => {
    setSlideIdx((prev) => (prev - 1 + ABOUT_SLIDES.length) % ABOUT_SLIDES.length)
  }

  const currentSlide = ABOUT_SLIDES[slideIdx]

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#211D1E] font-body selection:bg-[#C9A45C]/30">
      <Navbar />

      {/* ══ 1. LANDING SLIDESHOW HERO ══════════════════════════════ */}
      <section
        onMouseEnter={() => setIsAutoPlay(false)}
        onMouseLeave={() => setIsAutoPlay(true)}
        className="relative min-h-[580px] md:min-h-[660px] bg-[#2E050E] text-white overflow-hidden flex items-center"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <ReliableImage
              src={currentSlide.image}
              alt={currentSlide.title}
              priority={slideIdx === 0}
              sizes="100vw"
              className="w-full h-full object-cover opacity-35 filter brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#2E050E] via-[#2E050E]/85 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Animated Text Content */}
          <div className="lg:col-span-8 space-y-6">
            <motion.div
              key={`tag-${currentSlide.id}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C9A45C]/20 border border-[#C9A45C]/40 text-[#C9A45C] text-[10px] font-bold uppercase tracking-[0.25em]"
            >
              <Sparkles size={11} />
              {currentSlide.tagline}
            </motion.div>

            <motion.h1
              key={`title-${currentSlide.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-[#FAF7F2] leading-[1.08] tracking-tight"
            >
              {currentSlide.title}
            </motion.h1>

            <motion.p
              key={`sub-${currentSlide.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-xs md:text-sm text-[#FAF7F2]/85 max-w-xl leading-relaxed font-body"
            >
              {currentSlide.subtitle}
            </motion.p>

            {/* Slide Action & Stat Badge */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <Link
                to="/products"
                className="bg-[#C9A45C] hover:bg-[#FAF7F2] text-[#2E050E] font-body text-xs font-bold uppercase tracking-wider px-7 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-black/30 hover:scale-105"
              >
                Explore The Atelier Edit <ArrowRight size={14} />
              </Link>

              <div className="border-l border-white/20 pl-6 py-1">
                <span className="font-serif text-2xl font-bold text-[#C9A45C] block leading-none">
                  {currentSlide.stat}
                </span>
                <span className="text-[10px] text-white/70 tracking-widest uppercase font-semibold">
                  {currentSlide.statDesc}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Slide Controller & Preview */}
          <div className="lg:col-span-4 flex flex-col justify-end items-start lg:items-end space-y-6">
            
            {/* Slide indicator dots */}
            <div className="flex items-center gap-2.5">
              {ABOUT_SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setSlideIdx(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    slideIdx === idx
                      ? 'w-10 h-2 bg-[#C9A45C]'
                      : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Left/Right Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={prevSlide}
                className="w-11 h-11 rounded-full border border-white/20 bg-white/5 hover:bg-[#C9A45C] hover:text-[#2E050E] hover:border-[#C9A45C] text-white flex items-center justify-center transition-all shadow-md"
                aria-label="Previous slide"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={nextSlide}
                className="w-11 h-11 rounded-full border border-white/20 bg-white/5 hover:bg-[#C9A45C] hover:text-[#2E050E] hover:border-[#C9A45C] text-white flex items-center justify-center transition-all shadow-md"
                aria-label="Next slide"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

        </div>

        {/* Ambient bottom golden divider */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9A45C]/40 to-transparent" />
      </section>

      {/* ══ 2. THREE DECADES TIMELINE ══════════════════════════════ */}
      <section className="py-20 md:py-28 max-w-6xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] tracking-[0.3em] font-bold text-[#C9A45C] uppercase block mb-2">
            ✦ Generational Haute Couture ✦
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-[#5A1020] font-bold leading-tight">
            How Heritage Became Timeless Couture
          </h2>
          <p className="text-xs text-[#211D1E]/70 mt-3 leading-relaxed">
            Every creation at AGVIA is born from an uncompromising devotion to authentic Indian looms, pure handcraft, and modern regal silhouettes.
          </p>
        </div>

        {/* Vertical/Grid Milestones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIMELINE_MILESTONES.map((milestone, idx) => (
            <motion.div
              key={milestone.year}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ y: -6 }}
              className="bg-white border border-[#C9A45C]/20 hover:border-[#C9A45C]/60 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-serif text-2xl font-bold text-[#5A1020]">
                    {milestone.year}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-[#5A1020]/10 text-[#5A1020] flex items-center justify-center">
                    <milestone.icon size={16} />
                  </div>
                </div>

                <h3 className="font-serif font-bold text-base text-[#211D1E] mb-2 leading-snug">
                  {milestone.title}
                </h3>
                <p className="text-xs text-[#211D1E]/70 leading-relaxed font-body">
                  {milestone.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#C9A45C]/15 flex items-center gap-1.5 text-[9px] text-[#C9A45C] font-bold uppercase tracking-wider">
                <CheckCircle size={10} /> Atelier Milestone
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ 3. THE 4 PILLARS OF ARTISANAL PURITY ════════════════════ */}
      <section className="py-20 bg-gradient-to-b from-[#F2ECE4]/60 to-[#FAF7F2] border-y border-[#C9A45C]/20">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-[10px] tracking-[0.3em] font-bold text-[#C9A45C] uppercase block mb-2">
              ✦ The AGVIA Creed ✦
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-[#5A1020] font-bold leading-tight">
              Pillars of Haute Couture Integrity
            </h2>
            <p className="text-xs text-[#211D1E]/70 mt-2">
              No machine approximations. No synthetic adulterations. Only pure handloom fibers and master craftsmanship.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS_OF_COUTURE.map((pillar, idx) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
                className="bg-white/90 backdrop-blur-sm border border-[#C9A45C]/20 rounded-3xl p-6 text-center shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#5A1020] text-[#FAF7F2] flex items-center justify-center mx-auto mb-4 shadow-md shadow-[#5A1020]/20">
                  <pillar.icon size={20} className="text-[#C9A45C]" />
                </div>
                <h3 className="font-serif font-bold text-sm text-[#5A1020] mb-2 uppercase tracking-wide">
                  {pillar.title}
                </h3>
                <p className="text-xs text-[#211D1E]/70 leading-relaxed font-body">
                  {pillar.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. CALL TO ACTION ══════════════════════════════════════ */}
      <section className="py-20 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-[#5A1020] to-[#2E050E] text-white rounded-3xl p-10 md:p-14 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#C9A45C]/15 filter blur-[60px]" />
          
          <span className="text-[10px] font-bold tracking-[0.3em] text-[#C9A45C] uppercase block mb-3">
            ✦ Bespoke Elegance ✦
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold leading-tight mb-4">
            Curate Your Bridal & Festive Trousseau
          </h2>
          <p className="text-xs md:text-sm text-white/80 max-w-md mx-auto leading-relaxed mb-8 font-body">
            Every creation is hand-finished with custom alterations, wrapped in heirloom muslin, and delivered in our signature keepsake box.
          </p>

          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-[#C9A45C] hover:bg-[#FAF7F2] text-[#2E050E] font-body text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-full transition-all shadow-lg hover:scale-105"
          >
            Explore The Boutique Edit <ArrowRight size={14} />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
