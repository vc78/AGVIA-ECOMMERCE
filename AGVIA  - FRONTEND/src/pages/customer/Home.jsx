import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowRight,
  MessageCircle,
  MapPin,
  Award,
  Layers,
  Calendar,
  Sparkles,
  CheckCircle2,
  Instagram,
  Phone,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import SweetCard from '../../components/customer/SweetCard'
import TestimonialsCarousel from '../../components/customer/TestimonialsCarousel'
import ReliableImage from '../../components/common/ReliableImage'
import SEOHead from '../../components/common/SEOHead'
import { productService } from '../../services/productService'
import { useCart } from '../../hooks/useCart'
import { BUSINESS, buildWhatsAppUrl } from '../../constants/business'

const CORE_COLLECTIONS = [
  {
    key: 'dharmavaram',
    title: 'Dharmavaram Silk Sarees',
    description:
      'Traditional Dharmavaram silk sarees crafted with rich border detailing and classic handloom silk textures.',
    path: '/products?category=Dharmavaram+Silk+Sarees',
    image: '/images/dharmavaram_hero_campaign.jpg',
    tag: 'Signature Handloom',
  },
  {
    key: 'kanchi',
    title: 'Kanchi-Style Silk Sarees',
    description:
      'Kanchi-style silk sarees featuring traditional korvai-inspired borders, temple motifs, and festive richness.',
    path: '/products?category=Kanchi-Style+Silk+Sarees',
    image: '/images/dharmavaram_collections_showcase.jpg',
    tag: 'Traditional Zari',
  },
  {
    key: 'traditional',
    title: 'Traditional Handloom Weaves',
    description:
      'Handloom sarees woven directly on traditional looms with intricate motifs and timeless Indian heritage aesthetics.',
    path: '/products?category=Traditional+Handloom+Weaves',
    image: '/images/dharmavaram_loom_heritage.jpg',
    tag: 'Direct From Looms',
  },
]

const WHY_CHOOSE_POINTS = [
  {
    icon: Layers,
    title: 'Direct Weaver Connection',
    desc: 'Bringing handloom collections directly from our looms in Dharmavaram to your hands.',
  },
  {
    icon: Award,
    title: '15 Years of Weaving Experience',
    desc: 'Crafted with dedication, heritage, and fifteen years of hands-on weaving expertise.',
  },
  {
    icon: Sparkles,
    title: 'Dharmavaram Silk Heritage',
    desc: 'Rooted in the traditional silk weaving culture of Dharmavaram, Andhra Pradesh.',
  },
  {
    icon: CheckCircle2,
    title: 'Traditional Weaving Collections',
    desc: 'Focused on Dharmavaram silk sarees, Kanchi-style silk sarees, and traditional handloom weaves.',
  },
]

export default function Home() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()

  useEffect(() => {
    let isMounted = true
    Promise.allSettled([productService.getAll(), productService.getCategories()])
      .then(([prodRes, catRes]) => {
        if (!isMounted) return
        if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value)) {
          setProducts(prodRes.value)
        }
        if (catRes.status === 'fulfilled' && Array.isArray(catRes.value)) {
          setCategories(catRes.value)
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const handleAdd = (product) => {
    addToCart(product)
    toast.success(`${product.name} added to bag`, {
      style: { background: '#651B2B', color: '#FBF5EA', borderRadius: '12px' },
    })
  }

  // Show Festive Collection card ONLY if live inventory supports a Festive category/product
  const hasFestiveInventory =
    categories.some((c) => c.toLowerCase().includes('festive')) ||
    products.some((p) => (p.category || '').toLowerCase().includes('festive'))

  const collectionCards = hasFestiveInventory
    ? [
        ...CORE_COLLECTIONS,
        {
          key: 'festive',
          title: 'Festive Collections',
          description: 'Curated festive handloom sarees currently available in our live inventory.',
          path: '/products?category=Festive',
          image: '/images/dharmavaram_collections_showcase.jpg',
          tag: 'Live Inventory',
        },
      ]
    : CORE_COLLECTIONS

  const heroWhatsappUrl = buildWhatsAppUrl(
    'Namaste Lokesh Lingam Weaver, I would like to order or enquire about your Dharmavaram handloom sarees.'
  )

  return (
    <div className="relative min-h-screen bg-[#FBF5EA] text-[#38271F] overflow-x-hidden pb-14 sm:pb-0">
      <SEOHead
        title="Lokesh Lingam Weaver | Dharmavaram Handloom Sarees"
        description={BUSINESS.seo.defaultDescription}
        canonicalUrl="/"
        image="/images/dharmavaram_hero_campaign.jpg"
        type="website"
      />

      <Navbar />

      {/* ════════════════════════════════════════════════════════════════
          1. HOMEPAGE HERO SECTION
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[540px] sm:min-h-[620px] lg:min-h-[680px] flex flex-col justify-between overflow-hidden bg-[#38271F]">
        <div className="absolute inset-0 z-0">
          <picture>
            <source
              type="image/webp"
              srcSet="/images/dharmavaram_hero_campaign-600.webp 600w, /images/dharmavaram_hero_campaign-900.webp 900w, /images/dharmavaram_hero_campaign.webp 1376w"
              sizes="100vw"
            />
            <img
              src="/images/dharmavaram_hero_campaign.jpg"
              alt="Authentic Dharmavaram Handloom Silk Saree — Lokesh Lingam Weaver"
              loading="eager"
              fetchpriority="high"
              decoding="sync"
              width={1376}
              height={768}
              className="w-full h-full object-cover object-center brightness-[0.88]"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r from-[#38271F]/95 via-[#651B2B]/70 to-transparent lg:w-4/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#38271F]/90 via-transparent to-black/25" />
        </div>

        <div className="relative z-10 w-full container-luxury flex-1 flex items-center py-12 sm:py-16">
          <div className="max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#651B2B]/80 border border-[#B58A45]/60 text-[#E7D4B9] tracking-[0.22em] text-[10px] font-bold uppercase backdrop-blur-sm">
              <span>Direct Handloom Weaver • Dharmavaram, AP</span>
            </div>

            <h1 className="font-display text-[clamp(2rem,4.6vw,4rem)] font-bold text-[#FBF5EA] leading-[1.08] tracking-tight">
              AUTHENTIC DHARMAVARAM HANDLOOM SAREES
            </h1>

            <p className="font-sans text-sm sm:text-base text-[#E7D4B9] max-w-xl leading-relaxed">
              Discover the beauty of traditional Dharmavaram weaving. Crafted with dedication,
              heritage and 15 years of weaving experience, bringing handloom sarees directly from
              our looms to your hands.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 bg-[#651B2B] hover:bg-[#4A111D] text-[#FBF5EA] border border-[#B58A45]/60 font-bold text-xs tracking-[0.16em] uppercase px-7 py-3.5 rounded-full shadow-lg transition-all min-h-[48px]"
              >
                <span>EXPLORE COLLECTIONS</span>
                <ArrowRight size={14} />
              </Link>

              <a
                href={heroWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#B58A45] hover:bg-[#FBF5EA] text-[#38271F] font-bold text-xs tracking-[0.16em] uppercase px-7 py-3.5 rounded-full shadow-lg transition-all min-h-[48px]"
              >
                <MessageCircle size={15} />
                <span>ORDER ON WHATSAPP</span>
              </a>
            </div>
          </div>
        </div>

        {/* Verified Highlights Strip */}
        <div className="relative z-20 w-full container-luxury pb-6">
          <div className="bg-[#38271F]/80 backdrop-blur-md border border-[#B58A45]/40 rounded-2xl py-3.5 px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-4 text-[#FBF5EA]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#651B2B] border border-[#B58A45]/60 flex items-center justify-center text-[#E7D4B9] shrink-0">
                <Layers size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-serif text-sm font-bold text-[#FBF5EA] truncate">
                  Direct Handloom Weaver
                </p>
                <p className="text-[10.5px] text-[#E7D4B9]/80 truncate">
                  From our looms to you
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#651B2B] border border-[#B58A45]/60 flex items-center justify-center text-[#E7D4B9] shrink-0">
                <Award size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-serif text-sm font-bold text-[#FBF5EA] truncate">
                  15 Years Experience
                </p>
                <p className="text-[10.5px] text-[#E7D4B9]/80 truncate">
                  Traditional weaving craft
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#651B2B] border border-[#B58A45]/60 flex items-center justify-center text-[#E7D4B9] shrink-0">
                <Calendar size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-serif text-sm font-bold text-[#FBF5EA] truncate">
                  Since 2019
                </p>
                <p className="text-[10.5px] text-[#E7D4B9]/80 truncate">
                  Lokesh Lingam Weaver
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#651B2B] border border-[#B58A45]/60 flex items-center justify-center text-[#E7D4B9] shrink-0">
                <MapPin size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-serif text-sm font-bold text-[#FBF5EA] truncate">
                  Dharmavaram, AP
                </p>
                <p className="text-[10.5px] text-[#E7D4B9]/80 truncate">
                  India – 515671
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          2. COLLECTION CATEGORIES SECTION
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-18 bg-[#FBF5EA]">
        <div className="container-luxury">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="section-eyebrow">✦ Handloom Categories ✦</span>
            <h2 className="section-title mt-1">Our Saree Collections</h2>
            <p className="section-description">
              Explore Dharmavaram silk sarees, Kanchi-style silk sarees, and traditional handloom weaves.
            </p>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-3 ${
              collectionCards.length === 4 ? 'lg:grid-cols-4' : ''
            } gap-6`}
          >
            {collectionCards.map((col, idx) => (
              <motion.div
                key={col.key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.45 }}
                className="bg-white border border-[#E7D4B9] hover:border-[#B58A45] rounded-3xl overflow-hidden shadow-sm hover:shadow-luxury transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-64 overflow-hidden bg-[#E7D4B9]/40">
                    <ReliableImage
                      src={col.image}
                      alt={col.title}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#651B2B]/90 text-[#FBF5EA] text-[9.5px] font-bold uppercase tracking-wider border border-[#B58A45]/40">
                      {col.tag}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-2xl font-bold text-[#651B2B] mb-2">
                      {col.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#38271F]/75 leading-relaxed">
                      {col.description}
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <Link
                    to={col.path}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#651B2B] hover:text-[#B58A45] transition-colors"
                  >
                    <span>Explore Collection</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          3. LIVE SAREE CATALOGUE (REAL INVENTORY ONLY)
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 bg-white border-y border-[#E7D4B9]">
        <div className="container-luxury">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-3 border-b border-[#E7D4B9]">
            <div>
              <span className="section-eyebrow">✦ Handloom Catalogue ✦</span>
              <h2 className="section-title mt-1">Featured Handloom Sarees</h2>
              <p className="section-description !mx-0 !mt-1">
                Available sarees listed directly from our store inventory.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#651B2B] hover:text-[#B58A45] transition-colors"
            >
              <span>View All Sarees</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="aspect-[3/4] rounded-2xl bg-[#FBF5EA] animate-pulse border border-[#E7D4B9]"
                />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.slice(0, 8).map((p) => (
                <SweetCard key={p.id} product={p} onAdd={() => handleAdd(p)} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-[#FBF5EA] border border-[#E7D4B9] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-[#B58A45]/30 aspect-[16/10]">
                <ReliableImage
                  src="/images/dharmavaram_collections_showcase.jpg"
                  alt="Dharmavaram handloom silk saree collection"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="lg:col-span-7 space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#B58A45] block">
                  Direct Loom Catalogue
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#651B2B]">
                  Request Current Loom Sarees &amp; Pricing on WhatsApp
                </h3>
                <p className="text-xs sm:text-sm text-[#38271F]/80 leading-relaxed">
                  Our latest Dharmavaram silk sarees, Kanchi-style silk sarees, and traditional
                  handloom weaves are shared directly with customers from our Dharmavaram looms.
                  Message us on WhatsApp or visit our Instagram page for current pieces and pricing.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <a
                    href={heroWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    <MessageCircle size={15} />
                    <span>Enquire on WhatsApp</span>
                  </a>
                  <a
                    href={BUSINESS.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline"
                  >
                    <Instagram size={15} />
                    <span>View {BUSINESS.social.instagramHandle}</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          4. ABOUT THE WEAVER SECTION
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-20 bg-[#FBF5EA]">
        <div className="container-luxury">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden border-2 border-[#B58A45]/40 shadow-luxury aspect-[16/11]">
                <ReliableImage
                  src="/images/dharmavaram_loom_heritage.jpg"
                  alt="Traditional Dharmavaram wooden handloom weaving"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-6 space-y-5">
              <span className="section-eyebrow">✦ About the Weaver ✦</span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#651B2B] leading-tight">
                OUR WEAVING HERITAGE
              </h2>
              <p className="font-sans text-sm sm:text-base text-[#38271F]/85 leading-relaxed">
                “Rooted in the weaving traditions of Dharmavaram, Lokesh Lingam Weaver celebrates the
                beauty of Indian handloom sarees. With 15 years of weaving experience, our focus is
                on traditional designs, intricate details and bringing handloom collections directly
                from the weaver to the customer.”
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-white border border-[#E7D4B9] rounded-2xl p-4">
                  <p className="font-serif text-xl font-bold text-[#651B2B]">
                    15 Years of Weaving Experience
                  </p>
                  <p className="text-xs text-[#38271F]/70 mt-1">
                    Focused on traditional Dharmavaram &amp; Kanchi-style handloom craftsmanship.
                  </p>
                </div>
                <div className="bg-white border border-[#E7D4B9] rounded-2xl p-4">
                  <p className="font-serif text-xl font-bold text-[#651B2B]">
                    Established Since 2019
                  </p>
                  <p className="text-xs text-[#38271F]/70 mt-1">
                    Serving handloom saree patrons directly from Dharmavaram, Andhra Pradesh.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/about" className="btn-outline">
                  <span>Read Our Heritage</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          5. WHY CHOOSE US (VERIFIED BUSINESS FACTS ONLY)
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-16 bg-[#651B2B] text-[#FBF5EA]">
        <div className="container-luxury">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#E7D4B9] block mb-2">
              ✦ Why Choose Us ✦
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#FBF5EA]">
              Lokesh Lingam Weaver
            </h2>
            <p className="text-xs sm:text-sm text-[#E7D4B9]/85 mt-2">
              {BUSINESS.location.fullAddress} • {BUSINESS.businessType}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY_CHOOSE_POINTS.map((point) => {
              const Icon = point.icon
              return (
                <div
                  key={point.title}
                  className="rounded-2xl bg-[#4A111D]/80 border border-[#B58A45]/40 p-6 space-y-3"
                >
                  <div className="w-11 h-11 rounded-full bg-[#B58A45]/20 border border-[#B58A45] flex items-center justify-center text-[#E7D4B9]">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#FBF5EA]">{point.title}</h3>
                  <p className="text-xs text-[#E7D4B9]/85 leading-relaxed">{point.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          6. CUSTOMER PROOF & INSTAGRAM HIGHLIGHTS
      ════════════════════════════════════════════════════════════════ */}
      <TestimonialsCarousel />

      {/* ════════════════════════════════════════════════════════════════
          7. DIRECT CONTACT CALLOUT
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-[#E7D4B9]/40 border-t border-[#E7D4B9]">
        <div className="container-luxury flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#651B2B]">
              Direct Handloom Weaver • {BUSINESS.location.fullAddress}
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#651B2B]">
              Speak Directly With Lokesh Lingam Weaver
            </h3>
            <p className="text-xs sm:text-sm text-[#38271F]/75">
              Phone &amp; WhatsApp: {BUSINESS.contact.phone} • Instagram:{' '}
              {BUSINESS.social.instagramHandle}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 shrink-0">
            <a href={`tel:${BUSINESS.contact.phoneRaw}`} className="btn-outline">
              <Phone size={14} />
              <span>Call Now</span>
            </a>
            <a
              href={heroWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <MessageCircle size={14} />
              <span>WhatsApp Enquiry</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
