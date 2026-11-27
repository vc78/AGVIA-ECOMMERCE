import { Link } from 'react-router-dom'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { ShoppingBag, ArrowLeft, Sparkles, Home } from 'lucide-react'
import SEOHead from '../../components/common/SEOHead'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#211D1E] font-body flex flex-col justify-between selection:bg-[#C9A45C]/30">
      <SEOHead
        title="Page Not Found"
        description="The page you are looking for is unavailable. Explore AGVIA's luxury handcrafted fashion collections."
        noindex={true}
      />
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-20 px-6 relative overflow-hidden">
        {/* Subtle decorative radial background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,164,92,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-2xl w-full text-center relative z-10 space-y-8">
          {/* Gold flourish badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5A1020]/5 border border-[#C9A45C]/30 text-[#7B1030] text-xs font-bold tracking-[0.25em] uppercase">
            <Sparkles size={13} className="text-[#C9A45C]" />
            Atelier Curations
          </div>

          <div className="space-y-3">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-[#5A1020]">
              Oops! We couldn't find that page.
            </h1>
            <p className="font-sans text-sm sm:text-base text-[#211D1E]/70 max-w-md mx-auto leading-relaxed">
              Let's get you back to AGVIA. The silhouette or boutique page you are seeking may have moved or is no longer available.
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#5A1020] text-[#FAF7F2] hover:bg-[#3D0C18] text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Home size={15} />
              Go Home
            </Link>

            <Link
              to="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-[#C9A45C] text-[#5A1020] hover:bg-[#C9A45C]/10 text-xs font-bold uppercase tracking-wider transition-all duration-200"
            >
              <ShoppingBag size={15} />
              Continue Shopping
            </Link>
          </div>

          {/* Helpful Navigation Links */}
          <div className="pt-8 border-t border-[#C9A45C]/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#5A1020] font-medium">
            <Link to="/categories" className="hover:underline hover:text-[#C9A45C] transition-colors py-1">
              ✦ All Categories
            </Link>
            <Link to="/offers" className="hover:underline hover:text-[#C9A45C] transition-colors py-1">
              ✦ Offers & Curations
            </Link>
            <Link to="/track-order" className="hover:underline hover:text-[#C9A45C] transition-colors py-1">
              ✦ Track Order
            </Link>
            <Link to="/contact" className="hover:underline hover:text-[#C9A45C] transition-colors py-1">
              ✦ Concierge Desk
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
