import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import SEOHead from '../../components/common/SEOHead'
import BrandLogo from '../../components/common/BrandLogo'
import { MapPin, Phone, MessageCircle, Instagram, ExternalLink, ArrowRight } from 'lucide-react'
import { BUSINESS, buildWhatsAppUrl } from '../../constants/business'

export default function Contact() {
  const whatsappUrl = buildWhatsAppUrl(
    'Namaste Lokesh Lingam Weaver, I would like to enquire about your Dharmavaram handloom sarees.'
  )

  return (
    <div className="min-h-screen bg-[#FBF5EA] text-[#38271F] font-body flex flex-col justify-between">
      <SEOHead
        title="Contact Us"
        description={`Contact ${BUSINESS.name} in ${BUSINESS.location.fullAddress}. Call or WhatsApp ${BUSINESS.contact.phone} or follow ${BUSINESS.social.instagramHandle} on Instagram.`}
        canonicalUrl="/contact"
      />
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-20 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[10px] tracking-[0.3em] font-bold text-[#B58A45] uppercase block mb-2">
            ✦ Direct Weaver Contact ✦
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#651B2B] font-bold">
            Contact Lokesh Lingam Weaver
          </h1>
          <p className="text-xs sm:text-sm text-[#38271F]/75 mt-3 leading-relaxed">
            Reach us directly on phone, WhatsApp, or Instagram for Dharmavaram silk sarees,
            Kanchi-style silk sarees, and traditional handloom weaves.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Left Card: Official Contact Information */}
          <div className="md:col-span-7 bg-white border border-[#E7D4B9] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-4 pb-5 border-b border-[#E7D4B9]">
              <BrandLogo variant="light" size="md" />
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#651B2B]">
                  {BUSINESS.name}
                </h2>
                <p className="text-xs text-[#6E5A4F] font-medium">
                  {BUSINESS.businessType} • {BUSINESS.establishedClaim}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#FBF5EA] border border-[#E7D4B9]/70">
                <MapPin size={18} className="text-[#651B2B] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B58A45] block">
                    Location
                  </span>
                  <p className="font-semibold text-[#38271F] mt-0.5">
                    {BUSINESS.location.fullAddress}
                  </p>
                </div>
              </div>

              <a
                href={`tel:${BUSINESS.contact.phoneRaw}`}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#FBF5EA] hover:bg-[#E7D4B9]/45 border border-[#E7D4B9]/70 transition-colors"
              >
                <Phone size={18} className="text-[#651B2B] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B58A45] block">
                    Phone
                  </span>
                  <p className="font-semibold text-[#38271F] mt-0.5">
                    {BUSINESS.contact.phone}
                  </p>
                </div>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#FBF5EA] hover:bg-[#E7D4B9]/45 border border-[#E7D4B9]/70 transition-colors"
              >
                <MessageCircle size={18} className="text-[#65704B] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B58A45] block">
                    WhatsApp
                  </span>
                  <p className="font-semibold text-[#38271F] mt-0.5">
                    {BUSINESS.contact.whatsapp}
                  </p>
                </div>
              </a>

              <a
                href={BUSINESS.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#FBF5EA] hover:bg-[#E7D4B9]/45 border border-[#E7D4B9]/70 transition-colors"
              >
                <Instagram size={18} className="text-[#651B2B] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B58A45] block">
                    Instagram
                  </span>
                  <p className="font-semibold text-[#38271F] mt-0.5">
                    {BUSINESS.social.instagramHandle}
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* Right Card: Direct WhatsApp & Instagram Actions */}
          <div className="md:col-span-5 bg-[#651B2B] text-[#FBF5EA] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between border border-[#B58A45]/40">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#E7D4B9] block">
                Direct Enquiry
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FBF5EA]">
                Enquire Directly on WhatsApp
              </h2>
              <p className="text-xs sm:text-sm text-[#E7D4B9]/90 leading-relaxed">
                Message us directly on WhatsApp for available saree photos, colour options, pricing,
                and order assistance directly from Dharmavaram.
              </p>
            </div>

            <div className="space-y-3 pt-6">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-[#B58A45] hover:bg-[#FBF5EA] text-[#38271F] font-bold text-xs uppercase tracking-wider transition-all"
              >
                <MessageCircle size={15} />
                <span>Chat on WhatsApp</span>
                <ArrowRight size={14} />
              </a>

              <a
                href={`tel:${BUSINESS.contact.phoneRaw}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full border border-[#E7D4B9]/50 hover:bg-white/10 text-[#FBF5EA] font-semibold text-xs uppercase tracking-wider transition-all"
              >
                <Phone size={14} />
                <span>Call {BUSINESS.contact.phone}</span>
              </a>

              <a
                href={BUSINESS.location.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 pt-2 text-[11px] font-semibold text-[#E7D4B9] hover:text-white transition-colors"
              >
                <span>View Dharmavaram on Map</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
