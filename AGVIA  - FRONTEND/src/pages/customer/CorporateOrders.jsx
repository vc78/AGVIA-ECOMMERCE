import { useState } from 'react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { Crown, MessageCircle } from 'lucide-react'
import SEOHead from '../../components/common/SEOHead'
import { BUSINESS, buildWhatsAppUrl } from '../../constants/business'
import { safeOpenWindow } from '../../utils/windowManager'

export default function CorporateOrders() {
  const [name, setName] = useState('')
  const [org, setOrg] = useState('')
  const [qty, setQty] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const msg = [
      `Namaste ${BUSINESS.name},`,
      `I would like to make a bulk / festive saree enquiry:`,
      name ? `Name: ${name}` : null,
      org ? `Organization / Event: ${org}` : null,
      qty ? `Estimated Quantity: ${qty}` : null,
      notes ? `Requirements: ${notes}` : null,
    ].filter(Boolean).join('\n')
    safeOpenWindow(buildWhatsAppUrl(msg), 'llw_bulk_whatsapp', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-[#FBF5EA] text-[#38271F] font-body">
      <SEOHead title="Bulk & Festive Gifting Enquiries" canonicalUrl="/corporate-orders" />
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-24 text-center">
        <div className="w-16 h-16 rounded-full bg-[#651B2B]/10 text-[#651B2B] flex items-center justify-center mx-auto mb-6">
          <Crown size={32} className="text-[#B58A45]" />
        </div>
        <span className="text-[9px] tracking-[0.3em] font-bold text-[#B58A45] uppercase block mb-3">
          {BUSINESS.name} · {BUSINESS.location.short}
        </span>
        <h1 className="font-serif text-4xl md:text-5xl text-[#651B2B] font-bold mb-6">
          Bulk &amp; Festive Gifting Enquiries
        </h1>
        <p className="text-xs text-[#38271F]/75 max-w-lg mx-auto leading-relaxed mb-12">
          Connect directly with {BUSINESS.name} for festive events, ceremonies, and bulk Dharmavaram handloom saree orders. Submit your details below to open a pre-filled WhatsApp enquiry directly with us.
        </p>

        <form onSubmit={handleSubmit} className="bg-white border border-[#B58A45]/25 rounded-3xl p-6 md:p-8 max-w-lg mx-auto shadow-sm text-left space-y-4">
          <h3 className="font-serif text-lg text-[#651B2B] font-bold border-b border-[#B58A45]/15 pb-3">
            Bulk Order WhatsApp Enquiry
          </h3>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="input-field" />
          <input required value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Organization or occasion name" className="input-field" />
          <input required value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Estimated saree quantity" className="input-field" />
          <textarea required rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Mention saree types (Dharmavaram silk, Kanchi-style, traditional weaves) and colour preferences..." className="input-field" />
          <button type="submit" className="btn-primary w-full text-xs font-bold tracking-widest uppercase py-3.5 inline-flex items-center justify-center gap-2">
            <MessageCircle size={15} /> Send Enquiry via WhatsApp
          </button>
        </form>
      </div>
      <Footer />
    </div>
  )
}
