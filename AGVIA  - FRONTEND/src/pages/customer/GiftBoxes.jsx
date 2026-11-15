import { Link } from 'react-router-dom'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { Gift, Star, Package, Truck, ArrowRight, Sparkles } from 'lucide-react'

const GIFT_OPTIONS = [
  {
    name: 'Royal Bridal Trousseau Box',
    price: '₹ 299',
    desc: 'Champagne gold metallic foil box with archival velvet ribbon, rose-petal potpourri sachet and calligraphed gift card.',
    badge: 'Most Popular',
    color: '#7B1030',
  },
  {
    name: 'Keepsake Silk Wrap',
    price: '₹ 149',
    desc: 'Pure ivory cotton muslin wrap with hand-stamped AGVIA wax seal — breathable, archival and reusable.',
    badge: null,
    color: '#C9A45C',
  },
  {
    name: 'Premium Gift Hamper',
    price: '₹ 499',
    desc: 'Embossed wooden trunk with brass hardware containing fragrant attar vial, silk blouse swatch and personalised note.',
    badge: 'Limited Edition',
    color: '#3D0C18',
  },
]

export default function GiftBoxes() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] font-body text-[#211D1E]">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden text-center py-16 px-4"
        style={{ background: 'linear-gradient(160deg,#3D0C18 0%,#1E0509 100%)' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,164,92,0.15),transparent_60%)]"/>
        <svg viewBox="0 0 900 60" className="absolute bottom-0 left-0 w-full" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,60 Q450,0 900,60" fill="#FAF7F2"/>
        </svg>
        <div className="relative z-10">
          <span className="text-[9px] tracking-[0.35em] font-bold text-[#C9A45C] uppercase block mb-3">✦ Bespoke Keepsake Packaging ✦</span>
          <h1 className="font-serif text-3xl sm:text-5xl text-white font-bold mb-3">Heirloom Gift Boxes</h1>
          <p className="font-sans text-xs text-white/60 max-w-lg mx-auto leading-relaxed">
            Every AGVIA ensemble is a celebration. Dress it accordingly — in packaging worthy of the occasion.
          </p>
        </div>
      </div>

      {/* Feature strip */}
      <div className="bg-[#5A1020] py-4">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap justify-center gap-8">
          {[
            { icon: Gift, text: 'Complimentary on orders above ₹3,000' },
            { icon: Package, text: 'Acid-free archival packaging' },
            { icon: Truck, text: 'Delivered gift-ready' },
            { icon: Star, text: 'Personalised calligraphy card' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-white/85">
              <Icon size={15} className="text-[#C9A45C] shrink-0"/>
              <span className="font-sans text-[11.5px]">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gift options */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <span className="text-[9px] tracking-[0.3em] font-bold text-[#C9A45C] uppercase">✦ Gift Packaging Options ✦</span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#5A1020] font-bold mt-2">Select Your Keepsake</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {GIFT_OPTIONS.map((g) => (
            <div key={g.name} className="relative bg-white border border-[#C9A45C]/20 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col">
              {g.badge && (
                <span className="absolute top-4 right-4 text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
                  style={{ background: g.color, color: '#fff' }}>
                  {g.badge}
                </span>
              )}
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ background: g.color + '18' }}>
                <Gift size={26} style={{ color: g.color }}/>
              </div>
              <h3 className="font-serif text-base font-bold text-[#5A1020] mb-2">{g.name}</h3>
              <p className="font-sans text-[11.5px] text-[#211D1E]/65 leading-relaxed flex-1 mb-4">{g.desc}</p>
              <div className="flex items-center justify-between">
                <span className="font-serif text-lg font-bold" style={{ color: g.color }}>{g.price}</span>
                <button className="text-[10.5px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full border transition-all"
                  style={{ borderColor: g.color, color: g.color }}>
                  Add to Order
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#3D0C18] to-[#5A1020] rounded-3xl p-10 text-center text-white">
          <Sparkles className="mx-auto mb-3 text-[#C9A45C]" size={28}/>
          <h3 className="font-serif text-2xl font-bold mb-2">Looking for the Perfect Gift?</h3>
          <p className="font-sans text-xs text-white/65 max-w-md mx-auto mb-6">
            Our styling concierge can curate a bespoke gift set for any occasion — wedding, anniversary, festive gifting or corporate trousseau.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="https://wa.me/919032306961" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#C9A45C] hover:bg-[#E6C687] text-[#1E0509] font-bold text-xs px-6 py-3 rounded-full transition-colors">
              WhatsApp for Custom Gift
            </a>
            <Link to="/products" className="inline-flex items-center gap-2 border border-white/30 hover:border-white text-white font-bold text-xs px-6 py-3 rounded-full transition-colors">
              Browse Collections <ArrowRight size={13}/>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
