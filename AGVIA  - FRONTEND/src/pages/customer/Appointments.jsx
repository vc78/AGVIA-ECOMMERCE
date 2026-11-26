import { MapPin, Phone, MessageCircle, Award } from 'lucide-react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import SEOHead from '../../components/common/SEOHead'
import { BUSINESS, buildWhatsAppUrl } from '../../constants/business'

export default function Appointments() {
  return (
    <div className="min-h-screen bg-[#FBF5EA] text-[#38271F] font-body">
      <SEOHead title="Direct Weaver Connect" canonicalUrl="/appointments" />
      <Navbar />

      <section className="bg-gradient-to-r from-[#651B2B] via-[#4E1320] to-[#38271F] text-white py-12 px-[clamp(16px,3vw,40px)] border-b border-[#B58A45]/30">
        <div className="max-w-[1100px] mx-auto text-center space-y-3">
          <span className="text-[10px] text-[#E7D4B9] font-bold tracking-[0.3em] uppercase block">
            {BUSINESS.businessType} · {BUSINESS.establishedClaim}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white font-bold">
            Connect With {BUSINESS.name}
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
            Speak directly with {BUSINESS.name} in Dharmavaram about Dharmavaram silk sarees, Kanchi-style silk sarees, and traditional handloom weaves.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#B58A45]/25 rounded-2xl p-6 shadow-xs space-y-2">
            <Award size={20} className="text-[#B58A45]" />
            <h3 className="font-serif text-lg font-bold text-[#651B2B]">Dharmavaram Looms</h3>
            <p className="text-xs text-[#38271F]/75 leading-relaxed">
              Backed by {BUSINESS.experienceClaim}, crafting handloom sarees in Dharmavaram.
            </p>
          </div>
          <div className="bg-white border border-[#B58A45]/25 rounded-2xl p-6 shadow-xs space-y-2">
            <MessageCircle size={20} className="text-[#B58A45]" />
            <h3 className="font-serif text-lg font-bold text-[#651B2B]">WhatsApp Preview</h3>
            <p className="text-xs text-[#38271F]/75 leading-relaxed">
              Request saree photographs, weave details, and availability directly on {BUSINESS.phoneDisplay}.
            </p>
          </div>
          <div className="bg-white border border-[#B58A45]/25 rounded-2xl p-6 shadow-xs space-y-2">
            <Phone size={20} className="text-[#B58A45]" />
            <h3 className="font-serif text-lg font-bold text-[#651B2B]">Direct Call</h3>
            <p className="text-xs text-[#38271F]/75 leading-relaxed">
              Reach {BUSINESS.name} directly at {BUSINESS.phoneDisplay} to discuss custom or wedding enquiries.
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#B58A45]/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-serif text-xl font-bold text-[#651B2B]">{BUSINESS.name}</h4>
            <p className="text-xs text-[#38271F]/80 flex items-center justify-center md:justify-start gap-1.5">
              <MapPin size={13} className="text-[#B58A45] shrink-0" />
              <span>{BUSINESS.location.fullAddress}</span>
            </p>
            <p className="text-[11px] text-[#38271F]/65 pt-0.5">
              Instagram: {BUSINESS.social.instagramHandle} · Phone / WhatsApp: {BUSINESS.phoneDisplay}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={buildWhatsAppUrl(`Namaste ${BUSINESS.name}, I would like to connect regarding handloom sarees.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs !py-2.5 !px-5"
            >
              WhatsApp {BUSINESS.phoneDisplay}
            </a>
            <a href={`tel:${BUSINESS.contact.phoneRaw}`} className="btn-outline text-xs !py-2.5 !px-5">
              Call Now
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
