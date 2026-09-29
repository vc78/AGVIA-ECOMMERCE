import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Truck,
  CreditCard,
  Percent,
  Check,
  Heart,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Lock,
  Package,
  RotateCcw,
} from 'lucide-react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { useCart } from '../../hooks/useCart'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import ReliableImage from '../../components/common/ReliableImage'
import api from '../../services/api'
import { trackCheckoutStarted } from '../../services/analytics'

// Curated styles for "You May Also Like" carousel matching screenshot exactly
const RECOMMENDED_STYLES = [
  {
    id: 1,
    name: 'AGVIA Classic Silk Saree',
    price: 4999,
    image: '/images/classic_silk_saree.jpg',
    category: 'Sarees',
    subtitle: 'Pure gold zari borders',
    badge: 'Bestseller',
  },
  {
    id: 10,
    name: 'AGVIA Bridal Dupatta',
    price: 1299,
    image: '/images/bridal_dupatta.jpg',
    category: 'Dupattas',
    subtitle: 'Heritage gold border',
    badge: 'Bridal',
  },
  {
    id: 4,
    name: 'AGVIA Everyday Kurta Set',
    price: 1999,
    image: '/images/everyday_kurta_set.jpg',
    category: 'Kurtas',
    subtitle: 'Artisanal silk craft',
    badge: 'Trending',
  },
  {
    id: 2,
    name: 'AGVIA Floral Organza Saree',
    price: 3999,
    image: '/images/floral_organza_saree.jpg',
    category: 'Sarees',
    subtitle: 'Blush floral sheer weave',
    badge: 'New Arrival',
  },
  {
    id: 7,
    name: 'AGVIA Evening Gown',
    price: 3499,
    image: '/images/evening_gown.jpg',
    category: 'Dresses & Gowns',
    subtitle: 'Corseted modern silhouette',
    badge: 'Exclusive',
  },
]

// Sample boutique attributes to enrich display if items don't have them
const SAMPLE_ATTRIBUTES = [
  {
    colorName: 'Blush Pink',
    swatches: ['#E8B4B8', '#E6C687', '#C8D5B9'],
    size: 'Free Size',
    badge: 'Bestseller',
    badgeIcon: '👑',
  },
  {
    colorName: 'Navy Blue',
    swatches: ['#1E3A5F', '#E6C687', '#E5E0D8'],
    size: 'M',
    badge: 'New Arrival',
    badgeIcon: '✨',
  },
  {
    colorName: 'Mehendi Green',
    swatches: ['#6B705C', '#E6C687', '#E8B4B8'],
    size: 'Free Size',
    badge: 'Trending',
    badgeIcon: '🔥',
  },
]

export default function Cart() {
  const { items, updateQty, removeFromCart, addToCart, clearCart, subtotal } = useCart()
  const navigate = useNavigate()

  // Selection state for cart items (all selected by default)
  const [selectedIds, setSelectedIds] = useState({})
  // Wishlist state for toggling hearts
  const [wishlistMap, setWishlistMap] = useState({})

  // Coupon states
  const [couponCode, setCouponCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const [appliedCouponCode, setAppliedCouponCode] = useState('')
  const [validating, setValidating] = useState(false)

  // Carousel ref for "You May Also Like"
  const carouselRef = useRef(null)

  // Keep selectedIds in sync with items
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = { ...prev }
      items.forEach((item) => {
        if (next[item.id] === undefined) {
          next[item.id] = true // select by default
        }
      })
      // remove old keys
      Object.keys(next).forEach((key) => {
        if (!items.find((i) => String(i.id) === String(key))) {
          delete next[key]
        }
      })
      return next
    })
  }, [items])

  const allSelected = useMemo(() => {
    if (items.length === 0) return false
    return items.every((i) => selectedIds[i.id])
  }, [items, selectedIds])

  const selectedItems = useMemo(() => {
    return items.filter((i) => selectedIds[i.id])
  }, [items, selectedIds])

  const selectedSubtotal = useMemo(() => {
    return selectedItems.reduce((acc, i) => acc + i.price * i.qty, 0)
  }, [selectedItems])

  const deliveryFee = selectedItems.length > 0 ? (selectedSubtotal >= 999 ? 0 : 50) : 0
  const discount = discountAmount
  const total = Math.max(0, selectedSubtotal + deliveryFee - discount)

  const handleToggleSelectAll = () => {
    const nextVal = !allSelected
    const next = {}
    items.forEach((i) => {
      next[i.id] = nextVal
    })
    setSelectedIds(next)
  }

  const handleToggleSelectItem = (id) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleRemoveSelected = () => {
    const idsToRemove = Object.keys(selectedIds).filter((id) => selectedIds[id])
    if (idsToRemove.length === 0) {
      toast('No items selected to remove', { icon: 'ℹ️' })
      return
    }
    idsToRemove.forEach((id) => removeFromCart(Number(id) || id))
    toast.success(`${idsToRemove.length} item(s) removed`)
  }

  const handleToggleWishlist = (id) => {
    setWishlistMap((prev) => {
      const isFav = !prev[id]
      toast(isFav ? 'Added to Wishlist' : 'Removed from Wishlist', {
        icon: isFav ? '❤️' : '🤍',
        style: { background: '#5A1020', color: '#FFFDF8', borderRadius: '12px' },
      })
      return { ...prev, [id]: isFav }
    })
  }

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault()
    const code = couponCode.trim().toUpperCase()
    if (!code) return

    setValidating(true)
    try {
      const { data } = await api.get('/coupons/validate', {
        params: { code, orderAmount: selectedSubtotal },
      })
      const result = data?.data
      if (result?.valid) {
        setDiscountAmount(Number(result.discountAmount || 0))
        setAppliedCoupon(`${result.code} (-₹${result.discountAmount})`)
        setAppliedCouponCode(result.code)
        toast.success(result.message || `Coupon ${result.code} applied!`, {
          style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' },
        })
        setCouponCode('')
      } else {
        toast.error(result?.message || 'Invalid or expired promo code.')
      }
    } catch {
      // Fallback demo / offline coupon support
      if (code === 'CIRCLE15' || code === 'AGVIA15' || code === 'AGVIAVIP10' || code === 'AGVIA10' || code === 'WELCOME10') {
        const pct = (code === 'CIRCLE15' || code === 'AGVIA15') ? 0.15 : 0.10
        const disc = Math.round(selectedSubtotal * pct)
        setDiscountAmount(disc)
        setAppliedCoupon(`${code} (-₹${disc.toLocaleString('en-IN')})`)
        setAppliedCouponCode(code)
        toast.success(`Coupon ${code} applied successfully! (${Math.round(pct * 100)}% OFF)`, {
          style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' },
        })
        setCouponCode('')
      } else {
        toast.error('Invalid or expired coupon code. Try CIRCLE15 or AGVIAVIP10')
      }
    } finally {
      setValidating(false)
    }
  }

  const handleRemoveCoupon = () => {
    setDiscountAmount(0)
    setAppliedCoupon('')
    setAppliedCouponCode('')
    toast.success('Coupon removed')
  }

  // Load sample items if cart is empty so user can see the exact design
  const handleLoadSampleItems = () => {
    clearCart()
    addToCart(
      {
        id: 1,
        name: 'Blush Heritage Organza Saree',
        price: 12500,
        image: '/images/classic_silk_saree.jpg',
        category: 'Organza Sarees',
        unit: 'piece',
      },
      1
    )
    addToCart(
      {
        id: 4,
        name: 'Royal Indigo Chanderi Suit',
        price: 8900,
        image: '/images/evening_gown.jpg',
        category: 'Chanderi Suits',
        unit: 'set',
      },
      1
    )
    addToCart(
      {
        id: 9,
        name: 'Mehendi Green Georgette Saree',
        price: 10800,
        image: '/images/festive_kurti.jpg',
        category: 'Georgette Sarees',
        unit: 'piece',
      },
      2
    )
    toast.success('Loaded boutique pieces into your bag!')
  }

  const scrollCarousel = (dir) => {
    if (!carouselRef.current) return
    carouselRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#211D1E] font-sans antialiased selection:bg-[#5A1020] selection:text-white">
      <Navbar />

      <main className="w-full max-w-[1320px] mx-auto px-[clamp(16px,3vw,40px)] py-5 sm:py-6 md:py-8 pb-20 sm:pb-8">
        {/* ══ TOP HEADER & PROGRESS STEPPER ═════════════════════════ */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#E6C687]/30">
            {/* Left: Your Cart Title */}
            <div>
              <h1
                style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}
                className="text-2xl md:text-3xl font-bold text-[#211D1E] tracking-tight leading-tight"
              >
                Your{' '}
                <span
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  className="italic font-normal text-[#8B0000]"
                >
                  Cart
                </span>
              </h1>
              <p
                style={{ fontFamily: "'Lato', 'Inter', sans-serif" }}
                className="text-xs text-[#211D1E]/65 mt-0.5"
              >
                Handpicked pieces, ready to be yours.
              </p>
              {/* Gold underline motif */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-8 h-[1.5px] bg-[#C9A45C]" />
                <span className="w-1.5 h-1.5 rotate-45 bg-[#C9A45C]" />
                <span className="w-3 h-[1.5px] bg-[#C9A45C]/50" />
              </div>
            </div>

            {/* Center: 3-Step Luxury Stepper */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-4 self-center my-1 lg:my-0">
              {/* Step 1: Cart (Active) */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-[#5A1020] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(90,16,32,0.2)] ring-1.5 ring-[#C9A45C]/40">
                  <ShoppingBag size={14} />
                </div>
                <span
                  style={{ fontFamily: "'Lato', sans-serif" }}
                  className="text-[10px] sm:text-[11px] font-bold text-[#5A1020] tracking-wide"
                >
                  1. Cart
                </span>
              </div>

              {/* Connector */}
              <div className="w-8 sm:w-12 h-[1.5px] bg-[#C9A45C]/40 mb-3" />

              {/* Step 2: Details */}
              <div className="flex flex-col items-center gap-1 opacity-60">
                <div className="w-8 h-8 rounded-full bg-white border border-[#C9A45C]/40 text-[#211D1E]/60 flex items-center justify-center shadow-2xs">
                  <Truck size={14} />
                </div>
                <span
                  style={{ fontFamily: "'Lato', sans-serif" }}
                  className="text-[10px] sm:text-[11px] font-medium text-[#211D1E]/70"
                >
                  2. Details
                </span>
              </div>

              {/* Connector */}
              <div className="w-8 sm:w-12 h-[1.5px] bg-[#C9A45C]/40 mb-3" />

              {/* Step 3: Payment */}
              <div className="flex flex-col items-center gap-1 opacity-60">
                <div className="w-8 h-8 rounded-full bg-white border border-[#C9A45C]/40 text-[#211D1E]/60 flex items-center justify-center shadow-2xs">
                  <CreditCard size={14} />
                </div>
                <span
                  style={{ fontFamily: "'Lato', sans-serif" }}
                  className="text-[10px] sm:text-[11px] font-medium text-[#211D1E]/70"
                >
                  3. Payment
                </span>
              </div>
            </div>

            {/* Right: Style Your Story in Calligraphy Script */}
            <div className="hidden lg:flex items-center justify-end">
              <span
                style={{ fontFamily: "'Alex Brush', 'Cormorant Garamond', cursive" }}
                className="text-4xl text-[#C9A45C] tracking-wide transform -rotate-3 select-none"
              >
                Style Your Story
              </span>
            </div>
          </div>
        </div>

        {/* ══ EMPTY CART FALLBACK ═══════════════════════════════════ */}
        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E6C687]/30 p-10 md:p-16 text-center shadow-sm max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#C9A45C]/30 text-[#8B0000] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={28} />
            </div>
            <h2
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              className="text-2xl md:text-3xl font-bold text-[#211D1E] mb-2"
            >
              Your wardrobe bag is currently empty
            </h2>
            <p className="text-xs sm:text-sm text-[#211D1E]/60 max-w-md mx-auto mb-6">
              Explore our handcrafted sarees, bespoke lehengas, and couture evening wear.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/products"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#5A1020] text-white font-semibold text-xs tracking-wider uppercase hover:bg-[#8B0000] transition-colors shadow-md"
              >
                Explore Collection
              </Link>
              <button
                type="button"
                onClick={handleLoadSampleItems}
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#C9A45C] text-[#5A1020] font-semibold text-xs tracking-wider uppercase hover:bg-[#FAF7F2] transition-colors"
              >
                ✨ Load Sample Designer Bag
              </button>
            </div>
          </div>
        ) : (
          /* ══ TWO COLUMN CART LAYOUT ═══════════════════════════════ */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
            {/* ── LEFT COLUMN: Cart Items & Bulk Actions ── */}
            <div className="lg:col-span-8 space-y-3">
              {/* Selection Bar */}
              <div className="bg-white rounded-xl p-3 border border-[#E6C687]/30 shadow-xs flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleToggleSelectAll}
                    className="w-3.5 h-3.5 rounded text-[#5A1020] accent-[#5A1020] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs sm:text-[13px] font-bold text-[#211D1E]">
                    Select All{' '}
                    <span className="font-normal text-[#211D1E]/60 text-xs">
                      ({items.length} item{items.length !== 1 ? 's' : ''})
                    </span>
                  </span>
                </label>

                <button
                  onClick={handleRemoveSelected}
                  className="flex items-center gap-1 text-xs text-[#211D1E]/60 hover:text-red-700 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Remove Selected</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2.5">
                <AnimatePresence>
                  {items.map((item, idx) => {
                    const isChecked = !!selectedIds[item.id]
                    const attr = SAMPLE_ATTRIBUTES[idx % SAMPLE_ATTRIBUTES.length]
                    const colorName = item.color || attr.colorName
                    const swatches = attr.swatches
                    const sizeLabel = item.size || attr.size
                    const badgeText = item.badge || attr.badge
                    const badgeIcon = attr.badgeIcon
                    const isWishlisted = !!wishlistMap[item.id]

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.3 }}
                        key={item.id}
                        className={`bg-white rounded-xl p-3 sm:p-3.5 border transition-all duration-300 relative shadow-xs hover:shadow-md ${
                          isChecked ? 'border-[#E6C687]/40 ring-1 ring-[#E6C687]/30' : 'border-gray-200/80 opacity-80'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3.5">
                          {/* Checkbox */}
                          <div className="shrink-0 self-start sm:self-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectItem(item.id)}
                              className="w-3.5 h-3.5 rounded text-[#5A1020] accent-[#5A1020] focus:ring-0 cursor-pointer"
                            />
                          </div>

                          {/* Thumbnail Image */}
                          <div className="relative w-20 h-24 sm:w-22 sm:h-28 rounded-lg overflow-hidden bg-[#FAF7F2] border border-[#E6C687]/30 shrink-0 shadow-xs">
                            <ReliableImage
                              src={item.image}
                              alt={item.name}
                              sizes="96px"
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Middle Details */}
                          <div className="flex-1 min-w-0">
                            <h3
                              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                              className="text-sm sm:text-base font-bold text-[#211D1E] leading-snug line-clamp-1"
                            >
                              {item.name}
                            </h3>
                            <p className="text-[11px] text-[#211D1E]/60 mt-0.5 line-clamp-1">
                              {item.category || 'Luxury Silhouettes'}
                            </p>

                            {/* Color attribute & swatches */}
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#211D1E]/75">
                              <span className="text-[10.5px] font-medium text-[#211D1E]/70">
                                Colour: <strong className="font-semibold text-[#211D1E]">{colorName}</strong>
                              </span>
                              <div className="flex items-center gap-1 ml-1">
                                {swatches.map((color, sIdx) => (
                                  <span
                                    key={sIdx}
                                    style={{ backgroundColor: color }}
                                    className={`w-3 h-3 rounded-full inline-block border border-white shadow-xs ${
                                      sIdx === 0 ? 'ring-1.5 ring-offset-1 ring-[#C9A45C]' : 'opacity-70'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Size attribute */}
                            <p className="text-[10.5px] text-[#211D1E]/70 mt-0.5">
                              Size: <span className="font-semibold text-[#211D1E]">{sizeLabel}</span>
                            </p>
                          </div>

                          {/* Right Controls: Badge, Price, Quantity, Wishlist, Trash */}
                          <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 sm:gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E6C687]/20 w-full sm:w-auto">
                            {/* Badge */}
                            {badgeText && (
                              <span
                                style={{ fontFamily: "'Lato', sans-serif" }}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#FDF3E7] text-[#B8860B] border border-[#B8860B]/20"
                              >
                                <span>{badgeIcon}</span> {badgeText}
                              </span>
                            )}

                            {/* Price */}
                            <div
                              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                              className="text-lg sm:text-xl font-bold text-[#211D1E] text-right"
                            >
                              ₹{(item.price * item.qty).toLocaleString('en-IN')}
                            </div>

                            {/* Quantity Pill Selector */}
                            <div className="flex items-center border border-[#E6C687]/50 rounded-lg bg-white overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateQty(item.id, item.qty - 1)}
                                className="w-7 h-7 flex items-center justify-center text-[#211D1E]/70 hover:bg-[#FAF7F2] transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-[#211D1E]">
                                {item.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQty(item.id, item.qty + 1)}
                                className="w-7 h-7 flex items-center justify-center text-[#211D1E]/70 hover:bg-[#FAF7F2] transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            {/* Wishlist and Delete Icons */}
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => handleToggleWishlist(item.id)}
                                className="p-1.5 rounded-full hover:bg-[#FAF7F2] text-[#211D1E]/60 transition-colors"
                                title="Add to wishlist"
                              >
                                <Heart
                                  size={15}
                                  className={isWishlisted ? 'fill-[#8B0000] text-[#8B0000]' : 'text-[#211D1E]/50'}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  removeFromCart(item.id)
                                  toast.success(`${item.name} removed from bag`)
                                }}
                                className="p-1.5 rounded-full hover:bg-red-50 text-[#211D1E]/50 hover:text-red-700 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Order Summary Card & Coupon ── */}
            <div className="lg:col-span-4 space-y-4">
              {/* Order Summary Card */}
              <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E6C687]/35 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#E6C687]/20">
                  <h2
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    className="text-lg font-bold text-[#211D1E]"
                  >
                    Order Summary
                  </h2>
                  <span className="text-[11px] text-[#211D1E]/60 font-medium">
                    {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Subtotals */}
                <div className="space-y-2 text-xs text-[#211D1E]/75">
                  <div className="flex justify-between items-center">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#211D1E]">
                      ₹{selectedSubtotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Delivery Charges</span>
                    <span className="font-semibold text-emerald-700">
                      {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
                    </span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-emerald-800 font-semibold">
                      <span>Privilege Discount</span>
                      <span>-₹{discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="border-t border-[#E6C687]/25 pt-2.5 flex justify-between items-baseline">
                    <span
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      className="text-base font-bold text-[#211D1E]"
                    >
                      Total
                    </span>
                    <span
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      className="text-xl font-bold text-[#5A1020]"
                    >
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Primary Action Button: Proceed to Checkout */}
                <button
                  type="button"
                  disabled={selectedItems.length === 0}
                  onClick={() => {
                    trackCheckoutStarted(selectedItems.length, total)
                    navigate('/checkout', {
                      state: {
                        discount,
                        couponCode: appliedCouponCode,
                        subtotal: selectedSubtotal,
                        deliveryFee,
                        selectedItems,
                      },
                    })
                  }}
                  className={`w-full py-3 px-5 rounded-full font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-300 shadow-sm min-h-[48px] ${
                    selectedItems.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#5A1020] text-white hover:bg-[#8B0000] hover:shadow-md active:scale-[0.99]'
                  }`}
                >
                  <Lock size={13} />
                  Proceed to Checkout <ArrowRight size={13} />
                </button>

                {/* Secondary Action Button: Continue Shopping */}
                <Link
                  to="/products"
                  className="w-full py-2.5 px-4 rounded-full border border-[#5A1020]/25 text-[#5A1020] hover:border-[#5A1020] hover:bg-[#FAF7F2] font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all duration-200 min-h-[44px]"
                >
                  ← Continue Shopping
                </Link>

                {/* Coupon Code Section */}
                <div className="pt-1">
                  <div className="p-2.5 rounded-lg border border-[#E6C687]/30 bg-[#FAF7F2]/60 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-[#C9A45C]/20 text-[#8B0000] flex items-center justify-center shrink-0">
                        <Percent size={10} />
                      </div>
                      <span className="text-[11px] font-bold text-[#211D1E]">Apply Coupon Code</span>
                    </div>

                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/60 rounded-lg p-2.5 text-xs text-emerald-800">
                        <span>Applied: <strong>{appliedCoupon}</strong></span>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-red-700 underline font-bold text-[10px] uppercase ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#E6C687]/40 bg-white uppercase focus:outline-none focus:border-[#5A1020]"
                        />
                        <button
                          type="submit"
                          disabled={validating}
                          className="px-4 py-2 rounded-lg bg-[#5A1020] text-white hover:bg-[#8B0000] text-xs font-semibold tracking-wider transition-colors shrink-0"
                        >
                          {validating ? '...' : 'Apply'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* 3 Trust Badges */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E6C687]/20 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E6C687]/40 text-[#C9A45C] flex items-center justify-center">
                      <ShieldCheck size={15} />
                    </div>
                    <span className="text-[10px] font-medium text-[#211D1E]/75 leading-tight">
                      Secure Checkout
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E6C687]/40 text-[#C9A45C] flex items-center justify-center">
                      <Truck size={15} />
                    </div>
                    <span className="text-[10px] font-medium text-[#211D1E]/75 leading-tight">
                      Free Shipping
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E6C687]/40 text-[#C9A45C] flex items-center justify-center">
                      <RotateCcw size={15} />
                    </div>
                    <span className="text-[10px] font-medium text-[#211D1E]/75 leading-tight">
                      Easy Returns
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ BOTTOM SECTION: "YOU MAY ALSO LIKE" CAROUSEL ════════════ */}
        <section className="mt-7 sm:mt-9 pt-5 sm:pt-6 border-t border-[#E6C687]/30">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h2
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                className="text-xl sm:text-2xl font-bold text-[#5A1020]"
              >
                You May Also Like
              </h2>
              <p className="text-[11px] text-[#211D1E]/60 mt-0.5">
                More styles to complete your look
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/products"
                className="text-xs font-semibold text-[#8B0000] hover:text-[#C9A45C] transition-colors flex items-center gap-1"
              >
                View All <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Carousel with Navigation Arrows */}
          <div className="relative group/rec">
            {/* Left Button */}
            <button
              onClick={() => scrollCarousel(-1)}
              className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 border border-[#E6C687]/50 shadow-md flex items-center justify-center text-[#5A1020] hover:bg-[#5A1020] hover:text-white transition-all"
              aria-label="Previous suggestions"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Right Button */}
            <button
              onClick={() => scrollCarousel(1)}
              className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 border border-[#E6C687]/50 shadow-md flex items-center justify-center text-[#5A1020] hover:bg-[#5A1020] hover:text-white transition-all"
              aria-label="Next suggestions"
            >
              <ChevronRight size={16} />
            </button>

            {/* Carousel Container */}
            <div
              ref={carouselRef}
              className="flex gap-3 sm:gap-3.5 md:gap-4 overflow-x-auto pb-3 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {RECOMMENDED_STYLES.map((prod) => (
                <div
                  key={prod.id}
                  className="shrink-0 w-[180px] sm:w-[200px] md:w-[220px] bg-white rounded-xl overflow-hidden border border-[#E6C687]/30 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  {/* Image with Heart Icon */}
                  <div className="relative aspect-[3/3.8] overflow-hidden bg-[#FAF7F2]">
                    <ReliableImage
                      src={prod.image}
                      alt={prod.name}
                      sizes="220px"
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => handleToggleWishlist(`rec-${prod.id}`)}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-[#211D1E]/60 hover:text-red-700 transition-colors shadow-xs"
                    >
                      <Heart
                        size={13}
                        className={wishlistMap[`rec-${prod.id}`] ? 'fill-[#8B0000] text-[#8B0000]' : ''}
                      />
                    </button>
                  </div>

                  {/* Info and Add to Cart */}
                  <div className="p-3.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                        className="text-sm font-bold text-[#211D1E] truncate group-hover:text-[#8B0000] transition-colors"
                      >
                        {prod.name}
                      </h4>
                      <p
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                        className="text-sm font-bold text-[#5A1020] mt-0.5"
                      >
                        ₹{prod.price.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          addToCart({
                            id: prod.id,
                            name: prod.name,
                            price: prod.price,
                            image: prod.image,
                            category: prod.category,
                            unit: 'piece',
                          })
                          toast.success(`${prod.name} added to cart!`, {
                            style: { background: '#5A1020', color: '#FFFDF8', borderRadius: '12px' },
                          })
                        }}
                        className="w-8 h-8 rounded-full bg-[#5A1020] hover:bg-[#8B0000] text-white flex items-center justify-center shadow-xs transition-colors"
                        title="Add to Cart"
                      >
                        <ShoppingCart size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleWishlist(`rec-${prod.id}`)}
                        className="w-7 h-7 rounded-full border border-gray-200 hover:border-[#5A1020] flex items-center justify-center text-[#211D1E]/50 hover:text-[#8B0000] transition-colors"
                      >
                        <Heart
                          size={12}
                          className={wishlistMap[`rec-${prod.id}`] ? 'fill-[#8B0000] text-[#8B0000]' : ''}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
