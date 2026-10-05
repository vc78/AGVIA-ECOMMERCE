import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ReliableImage from '../../components/common/ReliableImage'
import SEOHead from '../../components/common/SEOHead'

const CATS = [
  {
    name: 'Sarees',
    image: '/images/classic_silk_saree.jpg',
    desc: 'Heirloom Kanjeevaram, organza, and silk weaves designed for festivals and celebrations.',
    path: '/products?category=Sarees'
  },
  {
    name: 'Lehengas',
    image: '/images/wedding_lehenga.jpg',
    desc: 'Regal bridal trousseau and festive lehengas handcrafted with intricate embroidery.',
    path: '/products?category=Lehengas'
  },
  {
    name: 'Anarkalis & Kurtas',
    image: '/images/anarkali_set.jpg',
    desc: 'Graceful flowing Anarkalis, raw silk kurtas, and handcrafted celebration sets.',
    path: '/products?category=Anarkalis+%26+Kurtas'
  },
  {
    name: 'Dresses & Gowns',
    image: '/images/evening_gown.jpg',
    desc: 'Sculpted cocktail gowns, corset drape dresses, and modern evening silhouettes.',
    path: '/products?category=Dresses+%26+Gowns'
  },
  {
    name: 'Western Wear',
    image: '/images/coord_set.jpg',
    desc: 'Modern matching co-ord sets and stylish silhouettes for clean contemporary looks.',
    path: '/products?category=Western+Wear'
  },
  {
    name: 'Kurtis',
    image: '/images/festive_kurti.jpg',
    desc: 'Easy-to-wear festive and everyday kurtis with subtle ethnic craftsmanship.',
    path: '/products?category=Kurtis'
  },
  {
    name: 'Dupattas',
    image: '/images/bridal_dupatta.jpg',
    desc: 'Embellished and sheer bridal dupattas to complete festive and wedding ensembles.',
    path: '/products?category=Dupattas'
  }
]

export default function Categories() {
  const categoryItemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AGVIA Couture Categories',
    itemListElement: CATS.map((cat, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: cat.name,
      description: cat.desc,
      url: `https://agviaboutique.com${cat.path}`
    }))
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Categories', url: '/categories' }
  ]

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#211D1E] font-body selection:bg-[#C9A45C]/30">
      <SEOHead
        title="Couture Categories & Collections"
        description="Explore luxury Indian designer categories at AGVIA. Handcrafted silk sarees, bridal lehengas, bespoke anarkalis, festive kurtis, and modern gowns."
        canonicalUrl="/categories"
        type="website"
        structuredData={categoryItemListSchema}
        breadcrumbs={breadcrumbs}
      />
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-24">
        <span className="text-[9px] tracking-[0.3em] font-bold text-[#C9A45C] uppercase block text-center mb-3">✦ Atelier Collections ✦</span>
        <h1 className="font-serif text-4xl md:text-5xl text-[#5A1020] font-bold text-center mb-12">Couture Categories</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CATS.map((cat, idx) => (
            <div key={idx} className="bg-white border border-[#C9A45C]/20 hover:border-[#C9A45C]/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_16px_48px_rgba(201,164,92,0.12)] transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="h-64 overflow-hidden bg-[#FAF7F2] border-b border-[#C9A45C]/15 relative">
                  <ReliableImage
                    src={cat.image}
                    alt={cat.name}
                    priority={idx < 3}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl text-[#5A1020] font-bold mb-2">{cat.name}</h3>
                  <p className="text-xs text-[#211D1E]/70 leading-relaxed font-body">{cat.desc}</p>
                </div>
              </div>
              <div className="p-6 pt-0">
                <Link to={cat.path} className="inline-flex items-center gap-2 text-xs font-bold text-[#C9A45C] hover:text-[#5A1020] uppercase tracking-widest transition-colors font-sans">
                  Explore Silhouette <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}
