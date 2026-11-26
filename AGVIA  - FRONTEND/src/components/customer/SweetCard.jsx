import { Link } from 'react-router-dom'
import { Star, Plus, Eye, Heart, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import ReliableImage from '../common/ReliableImage'
import ProductShareButton from '../common/ProductShareButton'
import { trackWishlist } from '../../services/analytics'
import { BUSINESS, buildWhatsAppUrl } from '../../constants/business'

export default function SweetCard({ product, onAdd, onAddToCart, priority = false }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [adding, setAdding] = useState(false)
  const [activeVariantIdx, setActiveVariantIdx] = useState(0)

  if (!product) return null

  const variants = Array.isArray(product.variants) && product.variants.length > 0 ? product.variants : []
  const activeVariant = variants[activeVariantIdx] || null

  const categoryName =
    typeof product.category === 'object'
      ? product.category?.name || ''
      : product.category || product.categoryName || ''

  const numReviews = Number(product.numReviews ?? 0)
  const hasRating = numReviews > 0 && (product.rating || product.avgRating)
  const ratingVal = hasRating ? (product.rating ?? product.avgRating) : null
  const unitVal = product.unit || 'saree'
  const imgUrl =
    activeVariant?.primaryImageUrl ||
    product.image ||
    product.imageUrl ||
    '/images/dharmavaram_collections_showcase.jpg'

  const rawPrice = activeVariant?.effectivePrice ?? activeVariant?.price ?? product.price
  const hasPrice = rawPrice !== null && rawPrice !== undefined && Number(rawPrice) > 0
  const actualStock =
    activeVariant && activeVariant.stockQuantity != null
      ? Number(activeVariant.stockQuantity)
      : product.stock != null
      ? Number(product.stock)
      : product.stockQuantity != null
      ? Number(product.stockQuantity)
      : null

  const isOutOfStock = actualStock !== null && actualStock <= 0
  const availabilityLabel =
    actualStock === null
      ? 'Check Availability'
      : actualStock <= 0
      ? 'Out of Stock'
      : actualStock <= (product.lowStockThreshold ?? 5)
      ? `Limited Availability (${actualStock} left)`
      : 'Available'

  const productUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/products/${product.id}${
          activeVariant ? `?color=${encodeURIComponent(activeVariant.colorName.toLowerCase().replace(/\s+/g, '-'))}` : ''
        }`
      : `/products/${product.id}`

  const whatsappUrl = buildWhatsAppUrl(
    `Namaste ${BUSINESS.name},\n\nI would like to enquire about this saree:\n*${product.name}*${
      categoryName ? `\nCategory: ${categoryName}` : ''
    }${activeVariant?.colorName ? `\nColour/Variant: ${activeVariant.colorName}` : ''}${
      hasPrice ? `\nListed Price: ₹${Number(rawPrice).toLocaleString('en-IN')}` : ''
    }\nLink: ${productUrl}\n\nPlease share availability and order details.`
  )

  const handleAdd = () => {
    if (isOutOfStock || !hasPrice) return
    const fn = onAdd || onAddToCart
    if (!fn) return
    setAdding(true)
    fn(
      activeVariant
        ? {
            ...product,
            variantId: activeVariant.id,
            colorName: activeVariant.colorName,
            colorCode: activeVariant.colorCode,
            price: Number(rawPrice),
            image: imgUrl,
          }
        : product
    )
    setTimeout(() => setAdding(false), 800)
  }

  return (
    <div className="bg-white border border-[#E7D4B9] rounded-2xl overflow-hidden group hover:border-[#B58A45] hover:shadow-[0_16px_42px_rgba(101,27,43,0.10)] transition-all duration-400 flex flex-col h-full">
      {/* Product Image */}
      <div className="relative overflow-hidden aspect-[3/4] bg-[#FBF5EA]">
        <span
          className={`absolute top-3 left-3 z-10 text-[9px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full shadow-sm ${
            isOutOfStock
              ? 'bg-[#38271F]/85 text-[#FBF5EA]'
              : 'bg-[#65704B] text-[#FBF5EA]'
          }`}
        >
          {availabilityLabel}
        </span>

        <button
          onClick={(e) => {
            e.preventDefault()
            setIsFavorite((v) => {
              const next = !v
              trackWishlist(product, next)
              return next
            })
          }}
          className="absolute top-2.5 right-2.5 z-10 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-white shadow-sm active:scale-90"
          aria-label="Wishlist"
        >
          <Heart
            size={15}
            fill={isFavorite ? '#651B2B' : 'none'}
            className={isFavorite ? 'text-[#651B2B]' : 'text-[#38271F]/60'}
          />
        </button>

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
        <div className="absolute inset-0 bg-[#38271F]/30 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2.5">
          <Link
            to={`/products/${product.id}`}
            className="w-10 h-10 rounded-full bg-[#FBF5EA] text-[#651B2B] flex items-center justify-center hover:bg-[#651B2B] hover:text-[#FBF5EA] transition-all shadow-md"
            title="View Product"
          >
            <Eye size={15} />
          </Link>
          <ProductShareButton product={product} variant="icon" />
          {hasPrice && !isOutOfStock && (
            <button
              onClick={handleAdd}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${
                adding
                  ? 'bg-[#65704B] text-white scale-110'
                  : 'bg-[#B58A45] text-[#38271F] hover:bg-[#651B2B] hover:text-[#FBF5EA]'
              }`}
              title="Add to Bag"
            >
              <Plus size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {categoryName && (
            <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-[#B58A45] font-bold mb-1">
              {categoryName}
            </p>
          )}
          <Link to={`/products/${product.id}`}>
            <h3 className="font-serif text-sm sm:text-base text-[#651B2B] font-bold hover:text-[#B58A45] transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>

          {hasRating && (
            <div className="flex items-center gap-1 mt-1">
              <Star size={11} fill="#B58A45" className="text-[#B58A45]" />
              <span className="font-sans text-[10px] text-[#38271F]/70">
                {ratingVal} ({numReviews})
              </span>
            </div>
          )}

          {/* Available Colour / Variant Swatches */}
          {variants.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2" onClick={(e) => e.preventDefault()}>
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
                        ? 'border-[#651B2B] scale-125 ring-1 ring-[#651B2B]/40'
                        : 'border-black/20 hover:scale-110 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: v.colorCode || '#651B2B' }}
                  />
                ))}
              </div>
              <span className="text-[9.5px] font-sans font-medium text-[#38271F]/70 ml-0.5 truncate">
                {activeVariant?.colorName || `${variants.length} Colours`}
              </span>
            </div>
          )}

          {product.description && (
            <p className="text-[11px] text-[#38271F]/70 mt-1.5 line-clamp-2 leading-normal font-sans">
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#E7D4B9] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              {hasPrice ? (
                <>
                  <span className="font-serif text-base font-bold text-[#651B2B]">
                    ₹{Number(rawPrice).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-[#38271F]/50 font-sans ml-1">/ {unitVal}</span>
                </>
              ) : (
                <span className="font-sans text-[11px] font-semibold text-[#651B2B]">
                  Enquire on WhatsApp for price
                </span>
              )}
            </div>

            {hasPrice && !isOutOfStock && (
              <motion.button
                onClick={handleAdd}
                whileTap={{ scale: 0.92 }}
                className={`flex items-center gap-1 font-sans text-[10px] tracking-wider font-bold uppercase transition-all px-3 py-1.5 min-h-[34px] rounded-full border ${
                  adding
                    ? 'bg-[#65704B] text-white border-[#65704B]'
                    : 'text-[#651B2B] border-[#651B2B]/35 hover:bg-[#651B2B] hover:text-[#FBF5EA]'
                }`}
              >
                {adding ? '✓ Added' : <><Plus size={12} /> Add</>}
              </motion.button>
            )}
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <Link
              to={`/products/${product.id}`}
              className="py-1.5 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-[#651B2B] bg-[#FBF5EA] hover:bg-[#E7D4B9] border border-[#E7D4B9] transition-all text-center shrink-0"
            >
              View Product
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-[#128C7E] hover:text-white bg-[#25D366]/10 hover:bg-[#25D366] border border-[#25D366]/30 transition-all"
              title={`WhatsApp enquiry for ${product.name}`}
            >
              <MessageCircle size={12} className="shrink-0" />
              <span className="truncate">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
