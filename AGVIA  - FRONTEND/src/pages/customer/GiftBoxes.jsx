import { Link } from 'react-router-dom'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { Gift, MessageCircle, ArrowRight } from 'lucide-react'
import SEOHead from '../../components/common/SEOHead'
import { BUSINESS, buildWhatsAppUrl } from '../../constants/business'

export default function GiftBoxes() {
  return (
    <div className="min-h-screen bg-[#FBF5EA] font-body text-[#38271F]">
      <SEOHead title="Festive & Gifting Enquiries" canonicalUrl="/gift-boxes" />
      <Navbar />

      <div
        className="relative overflow-hidden text-center py-16 px-4"
        style={{ background: 'linear-gradient(160deg,#651B2B 0%,#38271F 100%)' }}
      >
        <svg viewBox="0 0 900 60" className="absolute bottom-0 left-0 w-full" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,60 Q450,0 900,60" fill="#FBF5EA" />
        </svg>
        <div className="relative z-10">
          <span className="text-[9px] tracking-[0.35em] font-bold text-[#B58A45] uppercase block mb-3">
            {BUSINESS.name} · {BUSINESS.location.short}
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-white font-bold mb-3">
            Wedding &amp; Festive Gifting
          </h1>
          <p className="font-sans text-xs text-white/75 max-w-lg mx-auto leading-relaxed">
            Connect directly with Lokesh Lingam Weaver for traditional Dharmavaram silk sarees and festive handloom gifting enquiries.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white border border-[#B58A45]/25 rounded-3xl p-8 md:p-10 text-center shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-full bg-[#651B2B]/10 text-[#651B2B] flex items-center justify-center mx-auto">
            <Gift size={26} />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#651B2B] font-bold">
            Direct Gifting &amp; Saree Selection
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#38271F]/75 max-w-xl mx-auto leading-relaxed">
            Looking to select Dharmavaram silk sarees, Kanchi-style silk sarees, or traditional handloom weaves for a family celebration or wedding gift? Contact us on WhatsApp to view available colours and pricing.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <a
              href={buildWhatsAppUrl(`Namaste ${BUSINESS.name}, I would like to enquire about handloom sarees for gifting.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#651B2B] hover:bg-[#4E1320] text-white font-bold text-xs px-6 py-3 rounded-full transition-colors"
            >
              <MessageCircle size={15} /> Enquire on WhatsApp ({BUSINESS.phoneDisplay})
            </a>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 border border-[#B58A45] text-[#651B2B] hover:bg-[#E7D4B9]/30 font-bold text-xs px-6 py-3 rounded-full transition-colors"
            >
              Browse Collections <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
