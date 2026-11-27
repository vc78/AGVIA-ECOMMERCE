import { Link } from 'react-router-dom'
import { Star, Plus, Eye, Heart, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import ReliableImage from '../common/ReliableImage'
import ProductShareButton from '../common/ProductShareButton'
import { trackWishlist } from '../../services/analytics'

export default function SweetCard({ product, onAdd, onAddToCart, priority = false }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [adding, setAdding] = useState(false)
  const [activeVariantIdx, setActiveVariantIdx] = useState(0)

  if (!product) return null

  const variants = Array.isArray(product.variants) && product.variants.length > 0 ? product.variants : []
  const activeVariant = variants[activeVariantIdx] || null

  const categoryName = typeof product.category === 'object'
    ? (product.category?.name || '')
    : (product.category || product.categoryName || '')
  const numReviews = product.numReviews ?? 0
  const hasRating = numReviews > 0 && (product.rating || product.avgRating)
  const ratingVal = hasRating ? (product.rating ?? product.avgRating) : null
  const unitVal = product.unit || 'piece'
  const imgUrl = activeVariant?.primaryImageUrl || product.image || product.imageUrl || '/images/classic_silk_saree.jpg'
  const isBestseller = product.bestseller ?? product.isBestseller ?? false
  const displayPrice = activeVariant?.effectivePrice ?? (activeVariant?.price || product.price)

  const productUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/products/${product.id}${activeVariant ? `?color=${activeVariant.colorName.toLowerCase().replace(/\s+/g, '-')}` : ''}`
    : `https://agvia.in/products/${product.id}`
  const whatsappMsg = encodeURIComponent(
    `Namaste AGVIA Atelier Concierge ✨\n\nI would like to enquire about this silhouette:\n👗 *${product.name}*\n🏷️ Category: ${categoryName || 'Luxury Couture'}\n💰 Price: ₹${Number(product.price).toLocaleString('en-IN')}\n🔗 View Piece: ${productUrl}\n\nPlease share availability, size options, and bespoke styling assistance.`
  )
  const whatsappUrl = `https://wa.me/919032306961?text=${whatsappMsg}`

  const handleAdd = () => {
    const fn = onAdd || onAddToCart
    if (!fn) return
    setAdding(true)
    fn(product)
    setTimeout(() => setAdding(false), 800)
  }

  return (
    <div className="bg-white border border-[#C9A45C]/15 rounded-2xl overflow-hidden group hover:border-[#C9A45C]/40 hover:shadow-[0_16px_48px_rgba(201,164,92,0.14)] transition-all duration-400 flex flex-col h-full">

      {/* Image */}
      <div className="relative overflow-hidden aspect-[3/4] bg-[#F2ECE4]">
        {/* Badges */}
        {isBestseller && (
          <span className="absolute top-3 left-3 z-10 bg-[#5A1020] text-white text-[7.5px] font-bold uppercase tracking-[0.25em] px-2.5 py-1 rounded-full shadow-md">
            Atelier Edit
          </span>
        )}
        <button
          onClick={e => {
            e.preventDefault()
            setIsFavorite(v => {
              const next = !v
              trackWishlist(product, next)
              return next
            })
          }}
          className="absolute top-2.5 right-2.5 z-10 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-white shadow-sm active:scale-90"
          aria-label="Wishlist"
        >
          <Heart size={15} fill={isFavorite ? '#5A1020' : 'none'} className={isFavorite ? 'text-[#5A1020]' : 'text-[#211D1E]/50'} />
        </button>

        {/* Photo */}
        <Link to={`/products/${product.id}`} className="block w-full h-full">
          <ReliableImage
            src={imgUrl}
            alt={product.name}
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2.5">
          <Link
            to={`/products/${product.id}`}
            className="w-10 h-10 rounded-full bg-white text-[#5A1020] flex items-center justify-center hover:bg-[#5A1020] hover:text-white transition-all shadow-md translate-y-5 group-hover:translate-y-0 duration-400"
            title="View Details"
          >
            <Eye size={15} />
          </Link>
          <ProductShareButton
            product={product}
            variant="icon"
            className="translate-y-5 group-hover:translate-y-0 duration-400 delay-50"
          />
          <button
            onClick={handleAdd}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md translate-y-5 group-hover:translate-y-0 duration-400 delay-75 ${
              adding ? 'bg-green-700 text-white scale-110' : 'bg-[#C9A45C] text-[#211D1E] hover:bg-[#5A1020] hover:text-white'
            }`}
            title="Add to Bag"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {categoryName && (
            <p className="font-sans text-[8.5px] uppercase tracking-[0.25em] text-[#C9A45C] font-semibold mb-1">
              {categoryName}
            </p>
          )}
          <Link to={`/products/${product.id}`}>
            <h3 className="font-serif text-[13px] sm:text-sm text-[#5A1020] font-bold hover:text-[#C9A45C] transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 mt-1">
            {hasRating ? (
              <>
                <Star size={10} fill="#C9A45C" className="text-[#C9A45C]" />
                <span className="font-sans text-[9.5px] text-[#211D1E]/60">
                  {ratingVal} {categoryName ? `· ${categoryName}` : ''}
                </span>
              </>
            ) : (
              <span className="font-sans text-[9px] uppercase tracking-wider text-[#C9A45C] font-medium">
                New {categoryName ? `· ${categoryName}` : ''}
              </span>
            )}
          </div>

          {/* Color Variants Swatches Row (Requirement 22) */}
          {variants.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2" onClick={e => e.preventDefault()}>
              <div className="flex items-center gap-1">
                {variants.slice(0, 5).map((v, i) => (
                  <button
                    key={v.id || i}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setActiveVariantIdx(i)
                    }}
                    title={v.colorName}
                    className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                      activeVariantIdx === i
                        ? 'border-[#5A1020] scale-125 ring-1 ring-[#5A1020]/40'
                        : 'border-black/20 hover:scale-110 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: v.colorCode || '#800020' }}
                  />
                ))}
              </div>
              <span className="text-[9px] font-sans font-medium text-[#211D1E]/60 ml-0.5">
                {variants.length} Colors
              </span>
            </div>
          )}

          {product.description && (
            <p className="text-[10.5px] text-[#211D1E]/65 mt-1.5 line-clamp-1 leading-normal font-sans">
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#C9A45C]/15 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-serif text-sm sm:text-base font-bold text-[#5A1020]">₹{Number(displayPrice).toLocaleString('en-IN')}</span>
              <span className="text-[9.5px] text-[#211D1E]/40 font-sans ml-1">/ {unitVal}</span>
            </div>
            <motion.button
              onClick={handleAdd}
              whileTap={{ scale: 0.92 }}
              className={`flex items-center gap-1 font-sans text-[10px] sm:text-[9.5px] tracking-wider font-bold uppercase transition-all px-3 py-1.5 min-h-[34px] rounded-full border ${
                adding
                  ? 'bg-green-700 text-white border-green-700'
                  : 'text-[#5A1020] border-[#5A1020]/30 hover:bg-[#5A1020] hover:text-white hover:border-[#5A1020] active:bg-[#5A1020] active:text-white'
              }`}
            >
              {adding ? '✓ Added' : <><Plus size={12} /> Add</>}
            </motion.button>
          </div>

          {/* Action Row: WhatsApp Concierge + Direct Share */}
          <div className="flex items-center gap-1.5 min-w-0">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#128C7E] hover:text-white bg-[#25D366]/10 hover:bg-[#25D366] border border-[#25D366]/30 hover:border-[#25D366] transition-all duration-300 shadow-2xs active:scale-98"
              title={`Enquire about ${product.name} on WhatsApp`}
            >
              <MessageCircle size={12} className="shrink-0" />
              <span className="truncate">WhatsApp</span>
            </a>
            <ProductShareButton product={product} variant="button" className="!px-2 sm:!px-2.5 !py-1.5 shrink-0 text-[9px] sm:text-xs" />
          </div>
        </div>
      </div>
    </div>
  )
}
