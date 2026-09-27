import { useState, useEffect } from 'react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import SweetCard from '../../components/customer/SweetCard'
import { productService } from '../../services/productService'
import { useCart } from '../../hooks/useCart'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'

export default function Wishlist() {
  const [items, setItems] = useState([])
  const { addToCart } = useCart()

  useEffect(() => {
    productService.getAll().then((list) => {
      // Mock some items in wishlist
      setItems(list.slice(0, 2))
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#3A2D23] font-body">
      <Navbar />
      <div className="container-luxury py-6 sm:py-8 md:py-12">
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#5A1020] font-bold mb-6 select-none">
          Your Wishlist
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-12 md:py-16 border border-dashed border-[#C9A45C]/25 rounded-3xl bg-white select-none shadow-sm">
            <Heart size={36} className="text-[#C9A45C]/35 mx-auto mb-3" />
            <p className="font-serif text-lg italic text-[#5A1020] font-bold">Your wishlist is empty.</p>
            <p className="text-xs text-[#3A2D23]/50 mt-1.5 mb-6">Save your favorite silhouettes for later.</p>
            <Link to="/products" className="btn-primary min-h-[44px] touch-target">Browse Boutique</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 md:gap-5">
            {items.map((p) => (
              <SweetCard key={p.id} product={p} onAdd={addToCart} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
