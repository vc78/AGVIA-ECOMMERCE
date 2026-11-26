import { Link } from 'react-router-dom'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { MessageCircle } from 'lucide-react'
import SEOHead from '../../components/common/SEOHead'
import { BUSINESS, buildWhatsAppUrl } from '../../constants/business'

export default function Offers() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Offers', url: '/offers' }
  ]

  return (
    <div className="min-h-screen bg-[#FBF5EA] text-[#38271F] font-body">
      <SEOHead
        title="Offers & Enquiries"
        description={`Enquire directly with ${BUSINESS.name} for festive collections, bulk orders, and pricing.`}
        canonicalUrl="/offers"
        type="website"
        breadcrumbs={breadcrumbs}
      />
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-24 text-center">
        <span className="text-[9px] tracking-[0.3em] font-bold text-[#B58A45] uppercase block mb-3">
          {BUSINESS.name}
        </span>
        <h1 className="font-display text-4xl md:text-5xl text-[#651B2B] font-bold mb-6">
          Direct Weaver Pricing & Enquiries
        </h1>
        <p className="text-sm text-[#38271F]/75 max-w-xl mx-auto leading-relaxed mb-8">
          We bring Dharmavaram silk sarees, Kanchi-style silk sarees, and traditional handloom weaves directly from our looms to your hands. Any verified seasonal privileges or promotional codes published by {BUSINESS.name} appear here or are shared directly on WhatsApp.
        </p>

        <div className="bg-white border border-[#B58A45]/25 rounded-3xl p-8 shadow-sm space-y-5">
          <p className="text-xs text-[#38271F]/70">
            For current weave pricing or wedding & bulk saree enquiries, contact us directly:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={buildWhatsAppUrl(`Namaste ${BUSINESS.name}, I would like to enquire about saree pricing and current handloom availability.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2 text-xs"
            >
              <MessageCircle size={15} /> Enquire on WhatsApp ({BUSINESS.phoneDisplay})
            </a>
            <Link to="/products" className="btn-outline text-xs">
              Explore Collections
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
