import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { Ruler } from 'lucide-react'

const SAREE_DATA = [
  { size:'XS / 32', bust:'80–82',waist:'64–66',hip:'86–88',blouse:'32'},
  { size:'S / 34', bust:'84–86',waist:'68–70',hip:'90–92',blouse:'34'},
  { size:'M / 36', bust:'88–90',waist:'72–74',hip:'94–96',blouse:'36'},
  { size:'L / 38', bust:'92–94',waist:'76–78',hip:'98–100',blouse:'38'},
  { size:'XL / 40', bust:'96–98',waist:'80–82',hip:'102–104',blouse:'40'},
  { size:'XXL / 42', bust:'100–102',waist:'84–86',hip:'106–108',blouse:'42'},
  { size:'3XL / 44', bust:'104–108',waist:'88–92',hip:'110–114',blouse:'44'},
]

const LEHENGA_DATA = [
  { size:'XS',waist:'62–64',hip:'86–88',length:'40–42',skirt:'Full 3m'},
  { size:'S', waist:'66–68',hip:'90–92',length:'40–42',skirt:'Full 3m'},
  { size:'M', waist:'70–72',hip:'94–96',length:'40–44',skirt:'Full 3m'},
  { size:'L', waist:'74–76',hip:'98–100',length:'40–44',skirt:'Full 4m'},
  { size:'XL',waist:'78–80',hip:'102–104',length:'42–44',skirt:'Full 4m'},
  { size:'XXL',waist:'82–86',hip:'106–110',length:'42–44',skirt:'Full 4m'},
]

const HOW_ROWS = [
  { point:'Bust', how:'Measure around the fullest part of your chest, keeping the tape parallel to the ground.' },
  { point:'Waist', how:'Measure around your natural waistline — the narrowest part of your torso.' },
  { point:'Hip', how:'Measure around the fullest part of your hips, approx 20 cm below your waist.' },
  { point:'Length', how:'Measure from shoulder (or waist for skirts) down to where you want the garment to end.' },
]

function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#C9A45C]/20 shadow-sm mb-10">
      <table className="w-full text-[11.5px] font-sans">
        <thead>
          <tr style={{ background:'linear-gradient(90deg,#3D0C18,#5A1020)' }}>
            {headers.map(h => (
              <th key={h} className="text-left px-4 py-3 text-[#E6C687] font-bold tracking-wider uppercase text-[10px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]'}>
              {Object.values(row).map((v, j) => (
                <td key={j} className={`px-4 py-3 text-[#211D1E]/75 ${j===0?'font-bold text-[#5A1020]':''}`}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SizeGuide() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] font-body text-[#211D1E]">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden text-center py-16 px-4"
        style={{ background:'linear-gradient(160deg,#3D0C18 0%,#1E0509 100%)' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,164,92,0.15),transparent_60%)]"/>
        <svg viewBox="0 0 900 60" className="absolute bottom-0 left-0 w-full" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,60 Q450,0 900,60" fill="#FAF7F2"/>
        </svg>
        <div className="relative z-10">
          <Ruler className="mx-auto mb-3 text-[#C9A45C]" size={30}/>
          <span className="text-[9px] tracking-[0.35em] font-bold text-[#C9A45C] uppercase block mb-3">✦ Perfect Fit ✦</span>
          <h1 className="font-serif text-3xl sm:text-5xl text-white font-bold mb-3">Size Guide</h1>
          <p className="font-sans text-xs text-white/60 max-w-lg mx-auto leading-relaxed">
            All measurements are in centimetres. For the most accurate fit, have someone assist you while measuring. Still unsure? WhatsApp our styling team.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-12 pb-24">

        {/* How to measure */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-serif text-lg font-bold text-[#5A1020]">How to Take Measurements</span>
            <span className="flex-1 h-px bg-[#C9A45C]/25"/>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {HOW_ROWS.map((r) => (
              <div key={r.point} className="bg-white border border-[#C9A45C]/20 rounded-xl p-4 shadow-sm flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#5A1020]/10 flex items-center justify-center shrink-0">
                  <Ruler size={14} className="text-[#C9A45C]"/>
                </div>
                <div>
                  <p className="font-serif text-sm font-bold text-[#5A1020] mb-0.5">{r.point}</p>
                  <p className="font-sans text-[11.5px] text-[#211D1E]/65 leading-relaxed">{r.how}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saree / Blouse table */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-serif text-base font-bold text-[#5A1020]">Sarees & Blouse Sizing (cm)</span>
            <span className="flex-1 h-px bg-[#C9A45C]/25"/>
          </div>
          <Table
            headers={['Size','Bust','Waist','Hip','Blouse Size']}
            rows={SAREE_DATA.map(r=>({ size:r.size, bust:r.bust, waist:r.waist, hip:r.hip, blouse:r.blouse }))}
          />
        </div>

        {/* Lehenga table */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-serif text-base font-bold text-[#5A1020]">Lehenga & Anarkali Sizing (cm)</span>
            <span className="flex-1 h-px bg-[#C9A45C]/25"/>
          </div>
          <Table
            headers={['Size','Waist','Hip','Length','Skirt Flair']}
            rows={LEHENGA_DATA.map(r=>({ size:r.size, waist:r.waist, hip:r.hip, length:r.length, skirt:r.skirt }))}
          />
        </div>

        {/* Tips */}
        <div className="bg-[#5A1020]/6 border border-[#C9A45C]/20 rounded-2xl p-6 mb-8">
          <h3 className="font-serif text-sm font-bold text-[#5A1020] mb-3">💡 Sizing Tips</h3>
          <ul className="font-sans text-[12px] text-[#211D1E]/70 space-y-2 list-disc pl-4">
            <li>All AGVIA lehengas and anarkalis include 3–4 inch seam allowance for easy tailoring.</li>
            <li>For sarees, one size fits most (standard 5.5m length). Petite customers can request 5m.</li>
            <li>If you are between sizes, we recommend sizing up for comfort.</li>
            <li>For bespoke orders, share your exact measurements via WhatsApp for a perfect fit.</li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="font-sans text-xs text-[#211D1E]/55 mb-3">Still unsure about your size?</p>
          <a href="https://wa.me/919032306961" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#7B1030] hover:bg-[#9B2043] text-white font-bold text-xs px-6 py-3 rounded-full transition-colors">
            Chat with a Stylist on WhatsApp
          </a>
        </div>
      </div>
      <Footer />
    </div>
  )
}
