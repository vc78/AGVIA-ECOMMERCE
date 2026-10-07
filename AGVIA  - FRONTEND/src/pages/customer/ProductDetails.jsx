import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Star, Minus, Plus, ArrowLeft, ShieldCheck, Heart, Truck, HelpCircle, ChevronDown, CheckCircle, Zap, MessageCircle, Trash2, Loader2 } from 'lucide-react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import SweetCard from '../../components/customer/SweetCard'
import { productService } from '../../services/productService'
import { authService } from '../../services/authService'
import { useCart } from '../../hooks/useCart'
import { motion, AnimatePresence } from 'framer-motion'
import ReliableImage from '../../components/common/ReliableImage'
import { ProductDetailsSkeleton } from '../../components/common/SkeletonLoaders'
import ProductShareButton from '../../components/common/ProductShareButton'
import { getProductShareUrl } from '../../utils/shareUtils'
import { trackProductView, trackAddToCart, trackCheckoutStarted } from '../../services/analytics'
import SEOHead from '../../components/common/SEOHead'
import { getFriendlyErrorMessage, logDeveloperError } from '../../services/errorMessageService'

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const [product, setProduct] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [activeImage, setActiveImage] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])
  const [qty, setQty] = useState(1)
  const [selectedSize, setSelectedSize] = useState('M')
  const [reviews, setReviews] = useState([])
  const [related, setRelated] = useState([])
  const [isFavorite, setIsFavorite] = useState(false)
  const { addToCart } = useCart()

  // Review submission state
  const [reviewerName, setReviewerName] = useState('')
  const [newComment, setNewComment] = useState('')
  const [newRating, setNewRating] = useState(5)
  const [submitting, setSubmitting] = useState(false)

  // Review deletion state
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  // Accordion details mapping
  const [accordionOpen, setAccordionOpen] = useState({ craftsmanship: true, sizing: false, shipping: false })

  useEffect(() => {
    window.scrollTo(0, 0)
    productService.getById(id).then((prod) => {
      setProduct(prod)
      if (prod) {
        trackProductView(prod)

        // Handle variant initialization from URL parameter (?color=maroon) or first variant
        if (prod.variants && prod.variants.length > 0) {
          const urlParam = new URLSearchParams(window.location.search).get('color')
          let matched = null
          if (urlParam) {
            matched = prod.variants.find(
              v => v.colorName.toLowerCase().replace(/\s+/g, '-') === urlParam.toLowerCase()
            )
          }
          const chosen = matched || prod.variants[0]
          setSelectedVariant(chosen)

          if (chosen.images && chosen.images.length > 0) {
            const urls = chosen.images.map(img => img.imageUrl)
            setGalleryImages(urls)
            const prim = chosen.images.find(img => img.isPrimary) || chosen.images[0]
            setActiveImage(prim.imageUrl)
          } else {
            setGalleryImages([prod.image])
            setActiveImage(prod.image)
          }
        } else {
          setGalleryImages([prod.image])
          setActiveImage(prod.image)
        }
      }
    })
    productService.getRelated(id, 4).then((list) => {
      setRelated(list)
    })
    productService.getReviews(id).then(setReviews)
  }, [id])

  const handleSelectVariant = (variant) => {
    setSelectedVariant(variant)
    if (variant.images && variant.images.length > 0) {
      const urls = variant.images.map(img => img.imageUrl)
      setGalleryImages(urls)
      const prim = variant.images.find(img => img.isPrimary) || variant.images[0]
      setActiveImage(prim.imageUrl)
    } else {
      setGalleryImages([product.image])
      setActiveImage(product.image)
    }

    // Preserve selected variant in URL without reloading
    const url = new URL(window.location.href)
    url.searchParams.set('color', variant.colorName.toLowerCase().replace(/\s+/g, '-'))
    window.history.replaceState({}, '', url.toString())
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between font-sans">
        <Navbar />
        <div className="flex-1 pt-24 pb-12">
          <ProductDetailsSkeleton />
        </div>
        <Footer />
      </div>
    )
  }

  // Dynamic values derived from selected variant or base product
  const displayPrice = selectedVariant?.effectivePrice ?? (selectedVariant?.price || product.price)
  const displaySku = selectedVariant?.sku || product.sku
  const displayStock = selectedVariant ? selectedVariant.stockQuantity : product.stock
  const displayThreshold = selectedVariant ? (selectedVariant.lowStockThreshold || 5) : (product.lowStockThreshold || 5)
  const displayPaymentOption = (() => {
    if (product.paymentOption === 'COD_ONLY' || product.paymentOption === 'ONLINE_ONLY') {
      return product.paymentOption
    }
    return selectedVariant?.paymentOption || product.paymentOption || 'COD_AND_ONLINE'
  })()
  const isOutOfStock = displayStock <= 0
  const isLowStock = displayStock > 0 && displayStock <= displayThreshold

  const handleAdd = () => {
    const itemToAdd = {
      ...product,
      id: product.id,
      productId: product.id,
      variantId: selectedVariant ? selectedVariant.id : null,
      colorName: selectedVariant ? selectedVariant.colorName : null,
      colorCode: selectedVariant ? selectedVariant.colorCode : null,
      sku: displaySku,
      price: displayPrice,
      image: activeImage || selectedVariant?.primaryImageUrl || product.image,
      paymentOption: displayPaymentOption,
      codAllowed: displayPaymentOption !== 'ONLINE_ONLY',
      onlineAllowed: displayPaymentOption !== 'COD_ONLY',
      product: {
        ...product,
        paymentOption: displayPaymentOption,
        codAllowed: displayPaymentOption !== 'ONLINE_ONLY',
        onlineAllowed: displayPaymentOption !== 'COD_ONLY',
      },
      size: selectedSize
    }
    addToCart(itemToAdd, qty)
    trackAddToCart(product, qty)
    const colorLabel = selectedVariant ? ` (${selectedVariant.colorName})` : ''
    toast.success(`${qty} × ${product.name}${colorLabel} added to bag!`, {
      style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
    })
  }

  const handleBuyNow = () => {
    const itemToAdd = {
      ...product,
      id: product.id,
      productId: product.id,
      variantId: selectedVariant ? selectedVariant.id : null,
      colorName: selectedVariant ? selectedVariant.colorName : null,
      colorCode: selectedVariant ? selectedVariant.colorCode : null,
      sku: displaySku,
      price: displayPrice,
      image: activeImage || selectedVariant?.primaryImageUrl || product.image,
      paymentOption: displayPaymentOption,
      codAllowed: displayPaymentOption !== 'ONLINE_ONLY',
      onlineAllowed: displayPaymentOption !== 'COD_ONLY',
      product: {
        ...product,
        paymentOption: displayPaymentOption,
        codAllowed: displayPaymentOption !== 'ONLINE_ONLY',
        onlineAllowed: displayPaymentOption !== 'COD_ONLY',
      },
      size: selectedSize
    }
    addToCart(itemToAdd, qty)
    trackAddToCart(product, qty)
    trackCheckoutStarted(qty, displayPrice * qty)
    navigate('/checkout')
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) {
      toast.error('Please share your review thoughts.')
      return
    }
    setSubmitting(true)
    try {
      const customerName = reviewerName.trim() || user?.name || user?.fullName || 'Patron'
      const saved = await productService.submitReview(id, {
        customer: customerName,
        rating: newRating,
        comment: newComment.trim(),
        date: new Date().toISOString().slice(0, 10),
      })
      if (user?.id && !saved.userId) {
        saved.userId = user.id
      }
      setReviews((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)])
      setNewComment('')
      toast.success('Thank you for sharing your experience!', {
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      logDeveloperError('ProductDetails.handleReviewSubmit', err)
      toast.error(getFriendlyErrorMessage(err, "We couldn't submit your review right now. Please try again."))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to delete your review.')
      return
    }
    setDeletingId(reviewId)
    try {
      await productService.deleteReview(reviewId, id)
      setReviews((prev) => prev.filter((r) => r.id !== reviewId))
      setConfirmDeleteId(null)
      toast.success('Your review has been removed.', {
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      logDeveloperError('ProductDetails.handleDeleteReview', err)
      const status = err?.response?.status
      if (status === 403) {
        toast.error("You don't have permission to remove this review.")
      } else if (status === 401) {
        toast.error('Your session has expired. Please sign in again.')
      } else {
        toast.error(getFriendlyErrorMessage(err, "We couldn't remove this review. Please try again."))
      }
    } finally {
      setDeletingId(null)
    }
  }

  // Luxury fashion garment details
  const detailsMock = {
    craftsmanship: '100% Certified Pure Handloom Silk and delicate organza weave. Embellished with hand-embroidered zardozi, fine cutdana beads, and antique gold metallic threads by generational master craftsmen.',
    sizing: 'Tailored with comfortable ease. Blouse and choli sets include 2-inch interior seam allowances for custom fitting. Dry clean only. Model is 5\'9" wearing size S.',
    shipping: 'Delivered in our signature AGVIA embroidered keepsake box with protective muslin garment bags. Complimentary express courier across India in 3-5 business days. 7-day atelier exchange policy.',
  }

  const toggleAccordion = (tab) => {
    setAccordionOpen({ ...accordionOpen, [tab]: !accordionOpen[tab] })
  }

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'Free Size']

  const productRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
    : undefined

  const productSchemaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `Handcrafted ${product.name} from AGVIA's luxury ${product.category} collection.`,
    image: product.image ? (product.image.startsWith('http') ? product.image : `https://agviaboutique.com${product.image}`) : undefined,
    sku: product.sku || `AGVIA-${product.id}`,
    brand: {
      '@type': 'Brand',
      name: 'AGVIA'
    },
    category: product.category,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability: (product.stockQuantity ?? 10) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://agviaboutique.com/products/${product.id}`,
      seller: {
        '@type': 'Organization',
        name: 'AGVIA'
      }
    },
    ...(reviews.length > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: productRating,
        reviewCount: reviews.length
      }
    } : {})
  }

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Silhouettes', url: '/products' },
    { name: product.category || 'Collection', url: `/products?category=${encodeURIComponent(product.category || '')}` },
    { name: product.name, url: `/products/${product.id}` }
  ]

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#211D1E] font-sans">
      <SEOHead
        title={product.name}
        description={product.description || `Discover the handcrafted ${product.name} in ${product.category}. Tailored from pure fabrics with bespoke detailing at AGVIA.`}
        canonicalUrl={`/products/${product.id}`}
        image={product.image}
        type="product"
        structuredData={productSchemaJsonLd}
        breadcrumbs={breadcrumbItems}
      />
      <Navbar />

      <div className="w-full max-w-[1320px] mx-auto px-[clamp(16px,3vw,40px)] pt-5 sm:pt-6 pb-20 sm:pb-12">
        
        {/* Navigation Breadcrumb */}
        <Link to="/products" className="flex items-center gap-1.5 text-[#C9A45C] hover:text-[#5A1020] text-[10px] tracking-[0.2em] font-bold uppercase mb-4 w-fit transition-colors min-h-[36px]">
          <ArrowLeft size={12} /> Back to All Silhouettes
        </Link>

        {/* Product Details Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Column: Premium Zoom Image Gallery */}
          <div className="lg:col-span-6 relative">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-[#C9A45C]/20 shadow-sm bg-[#F2ECE4] relative group">
              <ReliableImage
                src={activeImage || product.image}
                alt={selectedVariant ? `${product.name} - ${selectedVariant.colorName}` : product.name}
                priority={true}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="touch-target absolute top-3.5 right-3.5 z-10 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center text-[#211D1E] hover:text-[#5A1020] transition-colors shadow-xs active:scale-95"
                aria-label="Wishlist"
              >
                <Heart size={16} fill={isFavorite ? '#5A1020' : 'none'} className={isFavorite ? 'text-[#5A1020]' : ''} />
              </button>
            </div>
            
            {/* Multiple Variant Image Thumbnails Gallery */}
            {galleryImages && galleryImages.length > 1 && (
              <div className="flex gap-2.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-20 rounded-xl overflow-hidden relative cursor-pointer transition-all bg-[#F2ECE4] shrink-0 border-2 ${
                      activeImage === img
                        ? 'border-[#5A1020] ring-2 ring-[#5A1020]/20 scale-105'
                        : 'border-[#C9A45C]/30 hover:border-[#5A1020] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <ReliableImage
                      src={img}
                      alt={`View ${idx + 1}`}
                      sizes="80px"
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Garment Descriptions & Purchase */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[8.5px] text-[#C9A45C] font-bold tracking-[0.25em] uppercase block">
                    {product.category}
                  </span>
                  <h1 className="font-serif text-2xl md:text-3xl text-[#5A1020] mt-1 font-bold leading-tight">
                    {product.name}
                  </h1>
                </div>
                <ProductShareButton product={product} variant="icon" className="shrink-0 mt-1" />
              </div>

              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#C9A45C]">
                <div className="flex text-[#C9A45C]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} fill={i < Math.round(product.rating || 4.8) ? '#C9A45C' : 'none'} className="text-[#C9A45C]" />
                  ))}
                </div>
                <span className="text-[#211D1E]/60 text-[11px] font-medium">({product.rating || 4.8} / 5 · {reviews.length} reviews)</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 pb-3 border-b border-[#C9A45C]/15">
                <span className="font-serif text-2xl md:text-3xl text-[#5A1020] font-bold">₹{displayPrice}</span>
                <span className="text-[11px] text-[#211D1E]/50">inclusive of all taxes</span>
                
                <div className="sm:ml-auto flex flex-wrap items-center gap-1.5">
                  {/* Stock Status Badge */}
                  {isOutOfStock ? (
                    <span className="text-[8.5px] bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                      🔴 Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="text-[8.5px] bg-[#FEF08A] text-[#854D0E] border border-[#FACC15] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold animate-pulse">
                      ⚠ Only {displayStock} Left in Atelier
                    </span>
                  ) : (
                    <span className="text-[8.5px] bg-[#DEF7EC] text-[#03543F] border border-[#31C48D] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                      ✓ In Stock · Ready to Dispatch
                    </span>
                  )}

                  {/* Payment Acceptance Badge */}
                  {displayPaymentOption === 'ONLINE_ONLY' ? (
                    <span className="text-[8.5px] bg-[#EBF5FF] text-[#1E429F] border border-[#3F83F8] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                      ⚡ For this product only Online Payment applicable
                    </span>
                  ) : displayPaymentOption === 'COD_ONLY' ? (
                    <span className="text-[8.5px] bg-[#FDF6B2] text-[#723B13] border border-[#E3A008] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                      💵 For this product only COD applicable
                    </span>
                  ) : (
                    <span className="text-[8.5px] bg-[#FAF7F2] text-[#5A1020] border border-[#C9A45C]/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                      ✓ COD & Online Accepted
                    </span>
                  )}
                </div>
              </div>

              {/* Color Swatch Selection (Section 9 & 10) */}
              {product.variants && product.variants.length > 0 && (
                <div className="mt-4 p-3.5 bg-white/80 rounded-2xl border border-[#C9A45C]/25">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] tracking-wider uppercase text-[#C9A45C] font-bold">
                      Color Palette: <span className="text-[#5A1020] font-serif font-bold text-xs capitalize">{selectedVariant?.colorName}</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">SKU: {displaySku}</span>
                  </div>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Product color swatches">
                    {product.variants.map((v) => {
                      const isSel = selectedVariant?.id ? selectedVariant.id === v.id : selectedVariant?.sku === v.sku
                      return (
                        <button
                          key={v.id || v.sku}
                          type="button"
                          role="radio"
                          aria-checked={isSel}
                          aria-label={`Select ${v.colorName}`}
                          onClick={() => handleSelectVariant(v)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                            isSel
                              ? 'border-[#5A1020] bg-[#5A1020] text-white shadow-xs'
                              : 'border-gray-200 bg-white text-[#211D1E] hover:border-[#C9A45C]'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: v.colorCode || '#800020' }}
                          />
                          <span>{v.colorName}</span>
                          {isSel && <span className="text-white text-xs">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Payment Acceptance Notification Banner */}
              <div className="mt-3">
                {displayPaymentOption === 'COD_ONLY' ? (
                  <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-900 flex items-start gap-2.5 text-xs">
                    <span className="text-base leading-none">💵</span>
                    <div>
                      <strong className="font-semibold block text-amber-950">For this product, only Cash on Delivery (COD) is applicable</strong>
                      <span className="text-[11px] text-amber-800/90 leading-tight block mt-0.5">
                        Online payment is unavailable for this silhouette. You can pay with cash upon doorstep delivery.
                      </span>
                    </div>
                  </div>
                ) : displayPaymentOption === 'ONLINE_ONLY' ? (
                  <div className="p-3 rounded-xl bg-blue-50/90 border border-blue-300 text-blue-900 flex items-start gap-2.5 text-xs">
                    <span className="text-base leading-none">⚡</span>
                    <div>
                      <strong className="font-semibold block text-blue-950">For this product, only Online Payment is applicable</strong>
                      <span className="text-[11px] text-blue-800/90 leading-tight block mt-0.5">
                        Cash on Delivery (COD) is unavailable for this silhouette. Please checkout securely via UPI, Cards, or Netbanking.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#C9A45C]/30 text-[#5A1020] flex items-center gap-2 text-xs">
                    <span className="text-sm">✓</span>
                    <span className="text-[11.5px] font-medium text-[#211D1E]/80">
                      Both <strong>Cash on Delivery (COD)</strong> and <strong>Online Payment</strong> are applicable for this silhouette.
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 text-xs leading-relaxed text-[#211D1E]/85 tracking-wide whitespace-pre-line bg-white/70 border border-[#C9A45C]/20 rounded-2xl p-4 shadow-2xs font-sans">
                {product.description}
              </div>

              {/* Size Selector */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[8.5px] tracking-wider uppercase text-[#C9A45C] font-bold">Select Size</span>
                  <span className="text-[9.5px] text-[#5A1020] underline cursor-pointer">Size Guide</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`px-3.5 py-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-xs font-semibold tracking-wider transition-all border ${
                        selectedSize === sz
                          ? 'bg-[#5A1020] text-white border-[#5A1020] shadow-xs'
                          : 'bg-white text-[#211D1E]/70 border-[#C9A45C]/30 hover:border-[#5A1020]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Qty & Add to Bag */}
            <div className="mt-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3.5 sm:gap-4">
                <div>
                  <span className="text-[8.5px] tracking-wider uppercase text-[#C9A45C] font-bold block mb-1">Quantity</span>
                  <div className="flex items-center border border-[#C9A45C]/40 rounded-full bg-white w-fit overflow-hidden h-11 min-h-[44px]">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="touch-target px-3.5 h-full min-w-[44px] hover:bg-[#F2ECE4] text-[#211D1E]/70 transition-colors flex items-center justify-center active:scale-95"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-3.5 font-serif font-bold text-sm text-[#211D1E] select-none">{qty}</span>
                    <button
                      onClick={() => setQty((q) => q + 1)}
                      className="touch-target px-3.5 h-full min-w-[44px] hover:bg-[#F2ECE4] text-[#211D1E]/70 transition-colors flex items-center justify-center active:scale-95"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={handleAdd}
                    disabled={isOutOfStock}
                    className="btn-primary flex-1 text-center flex items-center justify-center gap-1.5 min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isOutOfStock ? 'Out of Stock' : <>Add to Bag <Plus size={14} /></>}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="bg-[#C9A45C] hover:bg-[#b08b47] text-[#211D1E] font-sans text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-full transition-all flex items-center justify-center gap-1.5 shadow-xs min-h-[48px] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap size={14} fill="currentColor" /> {isOutOfStock ? 'Unavailable' : 'Buy Now'}
                  </button>
                </div>
              </div>

              {/* Action Buttons: WhatsApp Concierge + Share Silhouette */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-3">
                <a
                  href={`https://wa.me/919032306961?text=${encodeURIComponent(
                    `Namaste AGVIA Atelier Concierge ✨\n\nI would like to enquire about ordering this silhouette:\n👗 Silhouette: *${product.name}*\n🏷️ Category: ${product.category || 'Atelier Couture'}\n💰 Price: ₹${Number(product.price).toLocaleString('en-IN')}\n📏 Selected Size: ${selectedSize}\n🔢 Quantity: ${qty}\n🔗 Product Link: ${getProductShareUrl(product.id)}\n\nPlease share availability, delivery timeline, and bespoke customization details.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#25D366] hover:bg-[#20ba5a] shadow-md hover:shadow-lg transition-all duration-300 active:scale-98 min-h-[46px]"
                  title="Instant WhatsApp Concierge"
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp Enquire</span>
                </a>
                <ProductShareButton product={product} variant="detail" className="flex-1 justify-center min-h-[46px]" />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[9.5px] text-[#211D1E]/60 font-semibold pt-1">
                <span className="flex items-center gap-1"><ShieldCheck size={13} className="text-[#C9A45C]" /> 100% Certified Pure Handloom</span>
                <span className="flex items-center gap-1"><Truck size={13} className="text-[#C9A45C]" /> Complimentary Insured Express Delivery</span>
              </div>
            </div>

            {/* Product Details Accordion */}
            <div className="mt-6 border-t border-[#C9A45C]/20 pt-4 space-y-2.5">
              {[
                { id: 'craftsmanship', label: 'Fabric & Craftsmanship' },
                { id: 'sizing', label: 'Size & Fit Details' },
                { id: 'shipping', label: 'Atelier Packaging & Shipping' }
              ].map((acc) => (
                <div key={acc.id} className="border-b border-[#C9A45C]/15 pb-2.5">
                  <button
                    onClick={() => toggleAccordion(acc.id)}
                    className="flex justify-between items-center w-full text-left font-serif text-xs tracking-wider text-[#5A1020] font-bold uppercase py-0.5"
                  >
                    <span>{acc.label}</span>
                    <ChevronDown size={14} className={`transform transition-transform text-[#C9A45C] ${accordionOpen[acc.id] ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {accordionOpen[acc.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs text-[#211D1E]/70 leading-relaxed pt-3">
                          {detailsMock[acc.id]}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 sm:mt-10 border-t border-[#C9A45C]/20 pt-6 sm:pt-7 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Reviews list */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl text-[#5A1020] font-bold">Patron Reviews</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex text-[#C9A45C]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} fill={i < Math.round(product.rating || 4.8) ? '#C9A45C' : 'none'} className="text-[#C9A45C]" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#211D1E]">{product.rating || 4.8} / 5</span>
                  <span className="text-xs text-[#211D1E]/60">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                </div>
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs italic text-[#211D1E]/50">No reviews listed yet. Be the first to share your couture experience.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => {
                  const canDelete = isAuthenticated && (
                    (user?.id && r.userId && Number(user.id) === Number(r.userId)) ||
                    (r.userId == null && user?.name && r.customer === user.name) ||
                    user?.role === 'ADMIN'
                  )
                  const isDeleting = deletingId === r.id
                  const isConfirming = confirmDeleteId === r.id

                  return (
                    <div key={r.id} className="border border-[#C9A45C]/20 rounded-xl p-3.5 sm:p-4 bg-white shadow-xs transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-[#211D1E]">{r.customer}</span>
                          {r.verified && (
                            <span className="inline-flex items-center gap-1 text-[8.5px] text-[#5A1020] font-bold bg-[#5A1020]/10 px-2 py-0.5 rounded-full">
                              <CheckCircle size={9} className="text-[#5A1020]" /> Verified Patron
                            </span>
                          )}
                          {isAuthenticated && user?.id && r.userId && Number(user.id) === Number(r.userId) && (
                            <span className="text-[8px] bg-[#C9A45C]/25 text-[#5A1020] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9.5px] text-[#211D1E]/50">{r.date}</span>
                          {canDelete && (
                            isConfirming ? (
                              <div className="flex items-center gap-1 bg-red-50 p-1 px-1.5 rounded-lg border border-red-200">
                                <span className="text-[10px] text-red-700 font-semibold">Delete?</span>
                                <button
                                  type="button"
                                  disabled={isDeleting}
                                  onClick={() => handleDeleteReview(r.id)}
                                  className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded flex items-center gap-1 disabled:opacity-50"
                                >
                                  {isDeleting ? <Loader2 size={10} className="animate-spin" /> : 'Yes'}
                                </button>
                                <button
                                  type="button"
                                  disabled={isDeleting}
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] rounded"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(r.id)}
                                className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors touch-target min-w-[28px] min-h-[28px] flex items-center justify-center"
                                title="Delete your review"
                                aria-label="Delete review"
                              >
                                <Trash2 size={13} />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    <div className="flex text-[#C9A45C] mt-1 mb-2">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} size={10} fill="#C9A45C" className="text-[#C9A45C]" />
                      ))}
                    </div>
                    <p className="text-xs text-[#211D1E]/80 leading-normal font-sans">
                      {r.comment}
                    </p>
                  </div>
                )
              })}
            </div>
            )}
          </div>

          {/* Write review form */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-[#C9A45C]/20 shadow-xs h-fit">
            <h3 className="font-serif text-lg text-[#5A1020] font-bold mb-3">Share Your Experience</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div>
                <span className="text-[8.5px] tracking-wider uppercase text-[#C9A45C] font-bold block mb-1">Your Name</span>
                <input
                  type="text"
                  placeholder="e.g. Pooja Reddy"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="input-field bg-[#FAF7F2] text-xs"
                />
              </div>

              <div>
                <span className="text-[8.5px] tracking-wider uppercase text-[#C9A45C] font-bold block mb-1">Your Rating</span>
                <div className="flex gap-1 text-[#C9A45C]">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewRating(idx + 1)}
                      className="p-0.5 hover:scale-110 transition-transform"
                    >
                      <Star size={16} fill={idx < newRating ? '#C9A45C' : 'none'} className="text-[#C9A45C]" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[8.5px] tracking-wider uppercase text-[#C9A45C] font-bold block mb-1">Your Thoughts</span>
                <textarea
                  required
                  rows={3}
                  placeholder="Share details on drape, fabric handfeel, zardozi embroidery finish, sizing fit..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="input-field bg-[#FAF7F2]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full text-center disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>

        </div>

        {/* Related silhouettes */}
        {related.length > 0 && (
          <div className="mt-10 sm:mt-12 border-t border-[#C9A45C]/20 pt-7 sm:pt-8">
            <h2 className="font-serif text-xl md:text-2xl text-[#5A1020] font-bold mb-5 text-center">You May Also Adore</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 lg:gap-4">
              {related.map((p) => (
                <SweetCard key={p.id} product={p} onAdd={addToCart} />
              ))}
            </div>
          </div>
        )}

      </div>

      <Footer />
    </div>
  )
}
