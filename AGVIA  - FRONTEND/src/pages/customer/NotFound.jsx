import { Link } from 'react-router-dom'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { ShoppingBag, ArrowLeft, Sparkles, Home } from 'lucide-react'
import SEOHead from '../../components/common/SEOHead'
import { BUSINESS } from '../../constants/business'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FBF5EA] text-[#38271F] font-body flex flex-col justify-between selection:bg-[#B58A45]/30">
      <SEOHead
        title="Page Not Found"
        description={`The page you are looking for is unavailable. Explore ${BUSINESS.name} handloom saree collections.`}
        noindex={true}
      />
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-20 px-6 relative overflow-hidden">
        <div className="max-w-2xl w-full text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#651B2B]/5 border border-[#B58A45]/35 text-[#651B2B] text-xs font-bold tracking-[0.25em] uppercase">
            <Sparkles size={13} className="text-[#B58A45]" />
            Dharmavaram Handlooms
          </div>

          <div className="space-y-3">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-[#651B2B]">
              Oops! We couldn't find that page.
            </h1>
            <p className="font-sans text-sm sm:text-base text-[#38271F]/75 max-w-md mx-auto leading-relaxed">
              Let's get you back to {BUSINESS.name}. The page you are looking for may have moved or is no longer available.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#651B2B] text-[#FBF5EA] hover:bg-[#4E1320] text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Home size={15} />
              Go Home
            </Link>

            <Link
              to="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-[#B58A45] text-[#651B2B] hover:bg-[#B58A45]/10 text-xs font-bold uppercase tracking-wider transition-all duration-200"
            >
              <ShoppingBag size={15} />
              Explore Collections
            </Link>
          </div>

          <div className="pt-8 border-t border-[#B58A45]/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#651B2B] font-medium">
            <Link to="/categories" className="hover:underline hover:text-[#B58A45] transition-colors py-1">
              All Categories
            </Link>
            <Link to="/about" className="hover:underline hover:text-[#B58A45] transition-colors py-1">
              About Us
            </Link>
            <Link to="/track-order" className="hover:underline hover:text-[#B58A45] transition-colors py-1">
              Track Order
            </Link>
            <Link to="/contact" className="hover:underline hover:text-[#B58A45] transition-colors py-1">
              Contact Us
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
