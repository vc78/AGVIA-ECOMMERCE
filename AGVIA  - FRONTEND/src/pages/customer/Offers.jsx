import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { Ticket, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

const OFFERS = [
  { code: 'AZADI15', title: 'Independence Celebration', desc: '15% Off storewide for new and returning patrons.', validity: 'Valid till August 15, 2026' },
  { code: 'SILK200', title: 'Silk Heritage Delight', desc: '₹200 Off premium handcrafted pure Kanjeevaram & Banarasi silk sarees.', validity: 'Valid till August 30, 2026' },
  { code: 'AGVIA25', title: 'Bridal Grandeur', desc: '25% Off bespoke bridal trousseau, lehengas, and couture festive edits.', validity: 'Valid till November 5, 2026' }
]

export default function Offers() {
  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {})
    toast.success(`Coupon code ${code} copied!`, {
      style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
    })
  }

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#3A2D23] font-body">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-24">
        <span className="text-[9px] tracking-[0.3em] font-bold text-[#B8860B] uppercase block text-center mb-3">✦ Exclusive Perks ✦</span>
        <h1 className="font-display text-4xl md:text-5xl text-[#8B0000] font-bold text-center mb-12">Boutique Offers</h1>
        
        <div className="space-y-6">
          {OFFERS.map((o) => (
            <div key={o.code} className="bg-white border border-[#B8860B]/15 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-[#8B0000]/10 p-3 rounded-2xl text-[#8B0000] shrink-0">
                  <Ticket size={24} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#8B0000]">{o.title}</h3>
                  <p className="text-xs text-[#3A2D23]/60 mt-1 max-w-lg leading-relaxed">{o.desc}</p>
                  <span className="text-[10px] text-amber-600 block mt-2 font-bold uppercase tracking-wider">{o.validity}</span>
                </div>
              </div>
              
              <button 
                onClick={() => copyCode(o.code)}
                className="flex items-center justify-center gap-2 border-2 border-dashed border-[#B8860B]/30 hover:border-[#8B0000] text-[#8B0000] font-display font-bold text-lg px-6 py-3.5 rounded-2xl transition-all group shrink-0"
              >
                {o.code}
                <Copy size={16} className="text-[#B8860B] group-hover:scale-110 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}
