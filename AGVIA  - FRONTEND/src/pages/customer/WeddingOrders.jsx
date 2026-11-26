import { useState } from 'react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { Crown, Sparkles, MessageCircle } from 'lucide-react'
import SEOHead from '../../components/common/SEOHead'
import { BUSINESS, buildWhatsAppUrl } from '../../constants/business'
import { safeOpenWindow } from '../../utils/windowManager'

export default function WeddingOrders() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [requirements, setRequirements] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const msg = [
      `Namaste ${BUSINESS.name},`,
      `I would like to enquire about wedding handloom sarees:`,
      name ? `Name: ${name}` : null,
      phone ? `Phone: ${phone}` : null,
      eventDate ? `Event Date: ${eventDate}` : null,
      requirements ? `Preferences: ${requirements}` : null,
    ].filter(Boolean).join('\n')
    safeOpenWindow(buildWhatsAppUrl(msg), 'llw_wedding_whatsapp', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-[#FBF5EA] text-[#38271F]">
      <SEOHead title="Wedding Handloom Sarees" canonicalUrl="/wedding-orders" />
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-full bg-[#651B2B]/10 flex items-center justify-center mx-auto mb-5 border border-[#B58A45]/25">
            <Crown size={26} className="text-[#B58A45]" />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#B58A45] block mb-3">
            {BUSINESS.name} · {BUSINESS.location.short}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#651B2B] font-bold mb-4 leading-tight">
            Wedding &amp; Bridal Handloom Sarees
          </h1>
          <p className="text-xs sm:text-sm text-[#38271F]/75 max-w-xl mx-auto leading-relaxed">
            Explore Dharmavaram silk sarees, Kanchi-style silk sarees, and traditional handloom weaves directly from {BUSINESS.name} with {BUSINESS.experienceClaim}. Send your wedding requirements directly via WhatsApp.
          </p>
        </div>

        <div className="bg-white border border-[#B58A45]/25 rounded-3xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#651B2B] to-[#38271F] px-6 py-4 flex items-center gap-3">
            <Sparkles size={16} className="text-[#E7D4B9]" />
            <h3 className="font-serif text-white font-bold text-base sm:text-lg tracking-wide">
              Wedding Saree WhatsApp Enquiry
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-7 md:p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#B58A45]">
                  Your Name *
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="input-field"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#B58A45]">
                  Phone / WhatsApp *
                </label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your 10-digit mobile number"
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#B58A45]">
                Event Date
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#B58A45]">
                Saree Preferences *
              </label>
              <textarea
                required
                rows={4}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Share preferred saree categories (Dharmavaram silk, Kanchi-style silk, traditional weaves), colours, and quantity..."
                className="input-field resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#651B2B] hover:bg-[#4E1320] text-white font-bold text-xs uppercase tracking-widest py-4 rounded-full transition-all shadow-md flex items-center justify-center gap-2"
            >
              <MessageCircle size={15} />
              Enquire on WhatsApp ({BUSINESS.phoneDisplay})
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
