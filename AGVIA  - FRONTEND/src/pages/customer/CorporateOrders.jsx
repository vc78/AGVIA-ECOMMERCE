import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { Award, Crown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CorporateOrders() {
  const handleSubmit = (e) => {
    e.preventDefault()
    toast.success("Thank you for your inquiry! Our corporate and VIP styling concierge will share our luxury lookbook.", {
      style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
    })
    e.target.reset()
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#211D1E] font-body selection:bg-[#C9A45C]/30">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-24 text-center">
        <div className="w-16 h-16 rounded-full bg-[#5A1020]/10 text-[#5A1020] flex items-center justify-center mx-auto mb-6">
          <Crown size={32} className="text-[#C9A45C]" />
        </div>
        <span className="text-[9px] tracking-[0.3em] font-bold text-[#C9A45C] uppercase block mb-3">✦ Executive & Celebratory Gifting ✦</span>
        <h1 className="font-serif text-4xl md:text-5xl text-[#5A1020] font-bold mb-6">Corporate & Festive Gifting</h1>
        <p className="text-xs text-[#211D1E]/70 max-w-lg mx-auto leading-relaxed mb-12">
          Delight executive partners, leadership teams, and VIP clients with bespoke silk stoles, handloom saree collections, and custom-branded AGVIA gift sets.
        </p>

        <form onSubmit={handleSubmit} className="bg-white border border-[#C9A45C]/20 rounded-3xl p-6 md:p-8 max-w-lg mx-auto shadow-sm text-left space-y-4">
          <h3 className="font-serif text-lg text-[#5A1020] font-bold border-b border-[#C9A45C]/15 pb-3">Corporate Wardrobe Inquiry</h3>
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Contact name" className="input-field" />
            <input required type="email" placeholder="Corporate email" className="input-field" />
          </div>
          <input required placeholder="Organization / Company name" className="input-field" />
          <input required placeholder="Estimated quantity (minimum 10 pieces)" className="input-field" />
          <textarea required rows={4} placeholder="Mention custom branding, embroidery monogramming, or delivery deadlines..." className="input-field" />
          <button type="submit" className="btn-primary w-full text-xs font-bold tracking-widest uppercase py-3.5">
            Submit Luxury Inquiry
          </button>
        </form>
      </div>
      <Footer />
    </div>
  )
}
