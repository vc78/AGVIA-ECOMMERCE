import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin, MessageCircle, Calendar, Award, Layers } from 'lucide-react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import ReliableImage from '../../components/common/ReliableImage'
import SEOHead from '../../components/common/SEOHead'
import { BUSINESS, buildWhatsAppUrl } from '../../constants/business'

const HERITAGE_POINTS = [
  {
    icon: Layers,
    title: 'Direct Weaver Connection',
    desc: 'Bringing handloom sarees directly from our Dharmavaram weaving looms to customers without unnecessary middlemen.',
  },
  {
    icon: Award,
    title: '15 Years of Weaving Experience',
    desc: 'Rooted in fifteen years of hands-on weaving practice focused on traditional silk designs and intricate border details.',
  },
  {
    icon: Calendar,
    title: 'Established Since 2019',
    desc: 'Operating as Lokesh Lingam Weaver since 2019, serving saree patrons with Dharmavaram and Kanchi-style handloom collections.',
  },
  {
    icon: MapPin,
    title: 'Dharmavaram Silk Heritage',
    desc: 'Based in Dharmavaram, Andhra Pradesh, India – 515671, a celebrated centre of traditional handloom silk weaving.',
  },
]

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const whatsappUrl = buildWhatsAppUrl(
    'Namaste Lokesh Lingam Weaver, I would like to learn more about your Dharmavaram handloom sarees.'
  )

  return (
    <div className="min-h-screen bg-[#FBF5EA] text-[#38271F] font-body">
      <SEOHead
        title="About Us — Our Weaving Heritage"
        description="Rooted in Dharmavaram weaving traditions, Lokesh Lingam Weaver brings 15 years of weaving experience and handloom saree collections directly from our looms since 2019."
        canonicalUrl="/about"
      />
      <Navbar />

      {/* Hero Banner */}
      <section className="relative min-h-[420px] sm:min-h-[480px] bg-[#651B2B] text-[#FBF5EA] overflow-hidden flex items-center">
        <div className="absolute inset-0">
          <ReliableImage
            src="/images/dharmavaram_loom_heritage.jpg"
            alt="Traditional Dharmavaram handloom weaving"
            priority
            sizes="100vw"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#38271F]/95 via-[#651B2B]/80 to-transparent" />
        </div>

        <div className="container-luxury relative z-10 py-14 sm:py-20">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B58A45]/20 border border-[#B58A45]/50 text-[#E7D4B9] text-[10px] font-bold uppercase tracking-[0.24em]">
              Direct Handloom Weaver • Dharmavaram
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-[#FBF5EA] leading-tight">
              OUR WEAVING HERITAGE
            </h1>
            <p className="text-sm sm:text-base text-[#E7D4B9] leading-relaxed">
              {BUSINESS.description}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/products" className="btn-accent">
                Explore Collections <ArrowRight size={14} />
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#E7D4B9]/60 text-[#FBF5EA] hover:bg-[#FBF5EA] hover:text-[#651B2B] text-xs font-bold uppercase tracking-wider transition-all"
              >
                <MessageCircle size={14} /> Contact on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Experience & Establishment Distinction */}
      <section className="py-14 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-6 space-y-5"
          >
            <span className="text-[10px] tracking-[0.28em] font-bold text-[#B58A45] uppercase block">
              ✦ Lokesh Lingam Weaver ✦
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#651B2B] leading-tight">
              From Dharmavaram Looms to Your Wardrobe
            </h2>
            <p className="text-sm text-[#38271F]/80 leading-relaxed">
              Rooted in the weaving traditions of Dharmavaram, Andhra Pradesh,{' '}
              <strong className="text-[#651B2B]">Lokesh Lingam Weaver</strong> focuses on
              Dharmavaram silk sarees, Kanchi-style silk sarees, and traditional handloom weaves.
            </p>
            <p className="text-sm text-[#38271F]/80 leading-relaxed">
              Backed by <strong className="text-[#651B2B]">15 years of weaving experience</strong>,
              our work emphasizes classic motifs, fine border craftsmanship, and direct connection
              between the weaver and the customer. The business was established{' '}
              <strong className="text-[#651B2B]">in 2019</strong> to bring these handloom collections
              directly to saree lovers.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-white border border-[#E7D4B9] rounded-2xl p-4">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#651B2B] block">
                  15 Years
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B58A45]">
                  Weaving Experience
                </span>
              </div>
              <div className="bg-white border border-[#E7D4B9] rounded-2xl p-4">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#651B2B] block">
                  Since 2019
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B58A45]">
                  Business Established
                </span>
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl overflow-hidden border border-[#E7D4B9] shadow-sm aspect-[4/3] sm:col-span-2">
              <ReliableImage
                src="/images/dharmavaram_loom_heritage.jpg"
                alt="Wooden handloom weaving Dharmavaram silk saree"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden border border-[#E7D4B9] shadow-sm aspect-[4/3]">
              <ReliableImage
                src="/images/dharmavaram_collections_showcase.jpg"
                alt="Traditional Dharmavaram and Kanchi-style handloom sarees"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden border border-[#E7D4B9] shadow-sm aspect-[4/3]">
              <ReliableImage
                src="/images/dharmavaram_hero_campaign.jpg"
                alt="Draped Dharmavaram handloom silk saree"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us / Heritage Pillars */}
      <section className="py-14 bg-[#E7D4B9]/35 border-y border-[#E7D4B9]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-[10px] tracking-[0.28em] font-bold text-[#B58A45] uppercase block mb-2">
              ✦ Why Choose Us ✦
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#651B2B]">
              Direct Weaver Values
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HERITAGE_POINTS.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="bg-white border border-[#E7D4B9] rounded-2xl p-6 text-center shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#651B2B] text-[#E7D4B9] flex items-center justify-center mx-auto mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#651B2B] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#38271F]/75 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
