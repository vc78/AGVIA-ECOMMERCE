import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ReliableImage from '../../components/common/ReliableImage'
import SEOHead from '../../components/common/SEOHead'
import { BUSINESS } from '../../constants/business'

const CATS = [
  {
    name: 'Dharmavaram Silk Sarees',
    image: '/images/dharmavaram_hero_campaign.jpg',
    desc: 'Traditional Dharmavaram handloom silk sarees featuring rich borders and timeless weave textures.',
    path: '/products?category=Dharmavaram+Silk+Sarees',
  },
  {
    name: 'Kanchi-Style Silk Sarees',
    image: '/images/dharmavaram_collections_showcase.jpg',
    desc: 'Kanchi-style silk sarees woven with classic zari temple borders and traditional motifs.',
    path: '/products?category=Kanchi-Style+Silk+Sarees',
  },
  {
    name: 'Traditional Handloom Weaves',
    image: '/images/dharmavaram_loom_heritage.jpg',
    desc: 'Traditional handloom sarees brought directly from our looms in Dharmavaram.',
    path: '/products?category=Traditional+Handloom+Weaves',
  },
]

export default function Categories() {
  const siteOrigin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : BUSINESS.seo.siteUrl

  const categoryItemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${BUSINESS.name} Handloom Categories`,
    itemListElement: CATS.map((cat, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: cat.name,
      description: cat.desc,
      url: `${siteOrigin}${cat.path}`,
    })),
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Categories', url: '/categories' },
  ]

  return (
    <div className="min-h-screen bg-[#FBF5EA] text-[#38271F] font-body">
      <SEOHead
        title="Handloom Saree Categories"
        description="Explore Dharmavaram silk sarees, Kanchi-style silk sarees and traditional handloom weaves from Lokesh Lingam Weaver."
        canonicalUrl="/categories"
        type="website"
        structuredData={categoryItemListSchema}
        breadcrumbs={breadcrumbs}
      />
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-24">
        <span className="text-[10px] tracking-[0.3em] font-bold text-[#B58A45] uppercase block text-center mb-3">
          ✦ Handloom Collections ✦
        </span>
        <h1 className="font-serif text-4xl md:text-5xl text-[#651B2B] font-bold text-center mb-12">
          Handloom Saree Categories
        </h1>

        <div className="grid md:grid-cols-3 gap-8">
          {CATS.map((cat, idx) => (
            <div
              key={cat.name}
              className="bg-white border border-[#E7D4B9] hover:border-[#B58A45] rounded-3xl overflow-hidden shadow-sm hover:shadow-luxury transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="h-64 overflow-hidden bg-[#FBF5EA] border-b border-[#E7D4B9] relative">
                  <ReliableImage
                    src={cat.image}
                    alt={cat.name}
                    priority={idx < 3}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h2 className="font-serif text-2xl text-[#651B2B] font-bold mb-2">{cat.name}</h2>
                  <p className="text-xs sm:text-sm text-[#38271F]/75 leading-relaxed font-body">
                    {cat.desc}
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0">
                <Link
                  to={cat.path}
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#651B2B] hover:text-[#B58A45] uppercase tracking-widest transition-colors font-sans"
                >
                  Explore Sarees <ArrowRight size={14} />
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
