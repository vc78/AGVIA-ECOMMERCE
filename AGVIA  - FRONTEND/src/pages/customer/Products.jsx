import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Search, Grid, List, SlidersHorizontal, ChevronRight, X, Star, Sparkles, Award } from 'lucide-react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import SweetCard from '../../components/customer/SweetCard'
import { productService } from '../../services/productService'
import { useCart } from '../../hooks/useCart'
import { motion, AnimatePresence } from 'framer-motion'
import { ProductCardSkeleton } from '../../components/common/SkeletonLoaders'
import ReliableImage from '../../components/common/ReliableImage'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlSearch = searchParams.get('search') || ''
  const urlCategory = searchParams.get('category') || 'All'

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(urlCategory)
  const [search, setSearch] = useState(urlSearch)
  const [priceRange, setPriceRange] = useState(25000)
  const [sortBy, setSortBy] = useState('popular')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [loading, setLoading] = useState(true)
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)

  // Compute total active filters for badge counter and responsive indicator
  const activeFilterCount =
    (activeCategory !== 'All' ? 1 : 0) +
    (search ? 1 : 0) +
    (priceRange !== 25000 ? 1 : 0)

  const { addToCart } = useCart()

  // Sync category & search query from URL parameters
  useEffect(() => {
    setSearch(urlSearch)
  }, [urlSearch])

  useEffect(() => {
    setActiveCategory(urlCategory)
  }, [urlCategory])

  useEffect(() => {
    productService.getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    setLoading(true)
    productService
      .getAll({ category: activeCategory === 'All' ? undefined : activeCategory, search: search || undefined })
      .then((list) => {
        // Filter by price client-side for immediate responsive experience
        let filtered = list.filter((p) => p.price <= priceRange)
        
        // Apply sorting
        if (sortBy === 'price-low') {
          filtered.sort((a, b) => a.price - b.price)
        } else if (sortBy === 'price-high') {
          filtered.sort((a, b) => b.price - a.price)
        } else if (sortBy === 'rating') {
          filtered.sort((a, b) => b.rating - a.rating)
        }
        
        setProducts(filtered)
      })
      .finally(() => setLoading(false))
  }, [activeCategory, search, priceRange, sortBy])

  // Prevent background scrolling when mobile filter drawer is open
  useEffect(() => {
    if (showFiltersMobile) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showFiltersMobile])

  const handleAdd = (product) => {
    addToCart(product)
    toast.success(`${product.name} added to cart!`, {
      style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
    })
  }

  const clearFilters = () => {
    setActiveCategory('All')
    setSearch('')
    setPriceRange(25000)
    setSortBy('popular')
    setSearchParams({})
  }

  return (
    <div className="relative min-h-screen bg-[#FFFDF8] text-[#3A2D23] font-body">
      <Navbar />

      {/* Streamlined Boutique Header */}
      <section className="bg-gradient-to-r from-[#5A1020] via-[#7A1F32] to-[#4A0D1A] text-white pt-5 sm:pt-6 pb-4 sm:pb-5 px-[clamp(16px,3vw,40px)] relative overflow-hidden select-none border-b border-[#C9A45C]/30 shadow-sm">
        <div className="max-w-[1320px] mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[9px] tracking-[0.25em] text-[#C9A45C] font-bold uppercase mb-1">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={11} />
              <span className="text-white/70">Collections</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-white font-bold leading-tight flex items-center gap-2">
              The Atelier <span className="italic font-normal text-[#C9A45C]">Collections</span>
            </h1>
            <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-lg leading-relaxed">
              Curated drapes of pure handloom silk, hand-embroidered bridal lehengas, regal anarkalis, and occasion gowns.
            </p>
          </div>

          {/* Quick Category Badges in Header */}
          <div className="w-full min-w-0 overflow-x-auto scrollbar-none no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-center gap-2.5 min-w-max">
              {['All', ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat)
                    setSearchParams(cat === 'All' ? {} : { category: cat })
                  }}
                  className={`shrink-0 min-h-[38px] text-[11.5px] font-bold tracking-wider px-4 py-2 rounded-full transition-all whitespace-nowrap flex items-center justify-center select-none ${
                    activeCategory === cat
                      ? 'bg-[#C9A45C] text-[#211D1E] shadow-md font-extrabold ring-1 ring-[#C9A45C]'
                      : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/20 active:scale-95'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Listing Area */}
      <section className="container-luxury py-4 sm:py-5 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          
          {/* 1. FILTER SIDEBAR (Desktop) */}
          <aside className="hidden lg:col-span-3 lg:block space-y-3.5 select-none">
            <div className="flex items-center justify-between border-b border-[#C9A45C]/20 pb-2">
              <span className="font-serif text-sm tracking-wider text-[#5A1020] font-bold uppercase flex items-center gap-1.5">
                <SlidersHorizontal size={14} /> Filters
              </span>
              {(activeCategory !== 'All' || search || priceRange !== 25000) && (
                <button onClick={clearFilters} className="text-[9.5px] tracking-wider text-[#C9A45C] hover:text-[#5A1020] font-bold uppercase transition-colors">
                  Reset All
                </button>
              )}
            </div>

            {/* Category Selector */}
            <div className="space-y-2.5">
              <h4 className="font-serif text-xs tracking-widest text-[#5A1020] font-bold uppercase">Collections</h4>
              <div className="flex flex-col gap-1">
                {['All', ...categories].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat)
                      setSearchParams(cat === 'All' ? {} : { category: cat })
                    }}
                    className={`text-left text-xs tracking-wider py-1.5 px-3 rounded-lg transition-all ${
                      activeCategory === cat
                        ? 'bg-[#5A1020] text-[#FAF7F2] font-bold shadow-xs'
                        : 'text-[#211D1E]/70 hover:text-[#5A1020] hover:bg-[#F2ECE4]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <h4 className="font-serif text-xs tracking-widest text-[#5A1020] font-bold uppercase">Max Price</h4>
                <span className="font-serif text-xs text-[#C9A45C] font-bold">₹{priceRange}</span>
              </div>
              <input
                type="range"
                min={500}
                max={25000}
                step={250}
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-[#5A1020]"
              />
              <div className="flex justify-between text-[9.5px] text-[#211D1E]/50 font-sans">
                <span>₹500</span>
                <span>₹25,000</span>
              </div>
            </div>

            {/* Quality Guarantee badge */}
            <div className="border border-[#C9A45C]/20 rounded-xl p-3.5 bg-white shadow-xs select-none">
              <span className="text-[8.5px] text-[#C9A45C] font-bold uppercase tracking-widest block">Atelier Guarantee</span>
              <h5 className="font-serif text-xs text-[#5A1020] mt-1.5 font-bold flex items-center gap-1">
                <Award size={13} className="text-[#C9A45C]" /> Certified Pure Silk
              </h5>
              <p className="text-[9.5px] text-[#211D1E]/60 leading-normal mt-1 font-sans">
                Every ensemble is certified handloom silk, embroidered with genuine zardozi threads and tailored to perfection.
              </p>
            </div>
          </aside>

          {/* 2. PRODUCT GRID CONTAINER */}
          <div className="lg:col-span-9 space-y-4">
            
            {/* Header controls toolbar */}
            <div className="space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3 border-b border-[#B8860B]/10 pb-3 select-none">
              
              {/* Search Bar - full width on mobile, constrained on desktop */}
              <div className="relative w-full sm:max-w-xs">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3A2D23]/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder="SEARCH SILHOUETTES..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 rounded-xl border border-[#B8860B]/20 bg-white text-xs tracking-wider placeholder-[#3A2D23]/30 focus:outline-none focus:border-[#5A1020] focus:ring-1 focus:ring-[#5A1020] transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3A2D23]/40 hover:text-[#5A1020] p-1"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Action Controls: Filters, Sort, View Toggle */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                
                {/* Mobile Filter Button - perfectly fitted luxury pill button */}
                <button
                  onClick={() => setShowFiltersMobile(true)}
                  aria-label="Open boutique filters"
                  className="lg:hidden flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-w-[90px] max-w-[140px] sm:max-w-none border border-[#5A1020]/25 bg-gradient-to-b from-white to-[#FAF6F0] hover:to-[#F2ECE4] active:scale-[0.98] rounded-xl px-3 py-2 min-h-[42px] text-xs font-bold text-[#5A1020] transition-all shadow-2xs whitespace-nowrap shrink-0 touch-target"
                >
                  <SlidersHorizontal size={14} className="text-[#C9A45C] shrink-0" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#5A1020] text-white text-[9.5px] font-extrabold flex items-center justify-center ml-0.5 shadow-xs">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort selection */}
                <div className="flex-1 sm:flex-none flex items-center gap-1 border border-[#B8860B]/20 bg-white rounded-xl px-2.5 py-1 min-h-[42px] shadow-2xs min-w-0">
                  <span className="hidden min-[480px]:inline text-[9.5px] tracking-wider text-[#3A2D23]/45 uppercase font-bold shrink-0">
                    Sort:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full sm:w-auto bg-transparent text-[11px] sm:text-xs font-medium text-[#3A2D23]/80 focus:outline-none uppercase cursor-pointer truncate"
                  >
                    <option value="popular">Popularity</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>

                {/* Grid View toggle controls */}
                <div className="shrink-0 flex items-center gap-0.5 border border-[#B8860B]/20 rounded-xl p-1 bg-white min-h-[42px] shadow-2xs">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`touch-target w-8 h-8 rounded-lg transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-[#5A1020] text-white shadow-xs' : 'text-[#3A2D23]/50 hover:text-[#5A1020]'}`}
                    title="Grid View"
                  >
                    <Grid size={15} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`touch-target w-8 h-8 rounded-lg transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-[#5A1020] text-white shadow-xs' : 'text-[#3A2D23]/50 hover:text-[#5A1020]'}`}
                    title="List View"
                  >
                    <List size={15} />
                  </button>
                </div>

              </div>

            </div>

            {/* Active filters summary */}
            {(activeCategory !== 'All' || search || priceRange !== 25000) && (
              <div className="flex items-center gap-2 flex-wrap select-none pt-0.5">
                <span className="text-[10px] text-[#3A2D23]/40 font-bold uppercase">Active:</span>
                {activeCategory !== 'All' && (
                  <span className="text-[10px] bg-[#8B0000]/5 text-[#8B0000] px-3 py-1 rounded-full flex items-center gap-1.5 border border-[#B8860B]/10 font-bold">
                    {activeCategory}
                    <button onClick={() => { setActiveCategory('All'); setSearchParams({}) }}><X size={10} /></button>
                  </span>
                )}
                {search && (
                  <span className="text-[10px] bg-[#8B0000]/5 text-[#8B0000] px-3 py-1 rounded-full flex items-center gap-1.5 border border-[#B8860B]/10 font-bold">
                    Query: {search}
                    <button onClick={() => setSearch('')}><X size={10} /></button>
                  </span>
                )}
                {priceRange !== 25000 && (
                  <span className="text-[10px] bg-[#8B0000]/5 text-[#8B0000] px-3 py-1 rounded-full flex items-center gap-1.5 border border-[#B8860B]/10 font-bold">
                    Under ₹{priceRange}
                    <button onClick={() => setPriceRange(25000)}><X size={10} /></button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="text-[10px] text-[#C9A45C] hover:text-[#5A1020] font-bold uppercase underline ml-1"
                >
                  Clear All
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5 lg:gap-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <ProductCardSkeleton key={idx} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 md:py-10 border border-dashed border-[#C9A45C]/30 rounded-2xl bg-white select-none shadow-xs">
                <p className="font-serif text-base italic text-[#5A1020] font-bold">No Silhouettes Found</p>
                <p className="text-xs text-[#211D1E]/60 mt-1 font-sans">Adjust your filters or try a different search keyword.</p>
                <button onClick={clearFilters} className="btn-primary mt-4">
                  Show All Silhouettes
                </button>
              </div>
            ) : (
              /* GRID OR LIST VIEW RENDERING */
              <motion.div
                layout
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5 lg:gap-4'
                    : 'space-y-3.5'
                }
              >
                {products.map((product) => {
                  if (viewMode === 'grid') {
                    return <SweetCard key={product.id} product={product} onAdd={() => handleAdd(product)} />
                  } else {
                    /* Custom Luxury List Item Card */
                    return (
                      <motion.div
                        layout
                        key={product.id}
                        className="bg-white border border-[#C9A45C]/15 hover:border-[#C9A45C]/40 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row gap-3 sm:gap-3.5 hover:shadow-[0_12px_36px_rgba(201,164,92,0.1)] transition-all duration-300 relative group"
                      >
                        {product.bestseller && (
                          <span className="absolute top-3 left-3 z-10 bg-[#5A1020] text-white text-[7px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full shadow-md">
                            Atelier Edit
                          </span>
                        )}

                        <div className="w-full sm:w-28 h-36 rounded-xl overflow-hidden shrink-0 bg-[#F2ECE4] border border-[#C9A45C]/15">
                          <Link to={`/products/${product.id}`} className="block h-full">
                            <ReliableImage
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            />
                          </Link>
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <span className="text-[8.5px] uppercase tracking-[0.25em] text-[#C9A45C] font-semibold">
                                  {product.category}
                                </span>
                                <Link to={`/products/${product.id}`}>
                                  <h3 className="font-serif text-sm sm:text-base text-[#5A1020] font-bold mt-0.5 hover:text-[#C9A45C] transition-colors leading-snug">
                                    {product.name}
                                  </h3>
                                </Link>
                              </div>
                              <p className="font-serif text-base font-bold text-[#8B0000] shrink-0 text-right">
                                ₹{product.price}
                                <span className="text-[9px] text-[#3A2D23]/40 font-body font-normal block"> / {product.unit}</span>
                              </p>
                            </div>
                            {product.description && (
                              <p className="text-[11px] text-[#3A2D23]/60 leading-normal mt-1 max-w-xl line-clamp-2">
                                {product.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#C9A45C]/15">
                            <div className="flex items-center gap-1">
                              <Star size={11} fill="#B8860B" className="text-[#B8860B]" />
                              <span className="text-[10px] text-[#3A2D23]/50 font-bold">{product.rating} Rating</span>
                            </div>
                            
                            <div className="flex gap-2">
                              <Link
                                to={`/products/${product.id}`}
                                className="btn-outline !py-1 !px-3 text-[9.5px] flex items-center justify-center font-bold tracking-wider"
                              >
                                View
                              </Link>
                              <button
                                onClick={() => handleAdd(product)}
                                className="btn-primary !py-1 !px-3 text-[9.5px] flex items-center justify-center font-bold tracking-wider"
                              >
                                Add to box
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  }
                })}
              </motion.div>
            )}
          </div>

        </div>
      </section>

      {/* MOBILE FILTERS DRAWER */}
      <AnimatePresence>
        {showFiltersMobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFiltersMobile(false)}
              className="fixed inset-0 z-50 bg-black lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.35 }}
              className="fixed inset-y-0 left-0 z-50 w-full max-w-[min(340px,calc(100vw-32px))] bg-[#FFFDF8] p-5 flex flex-col justify-between lg:hidden shadow-luxury"
            >
              <div className="space-y-6 overflow-y-auto">
                <div className="flex justify-between items-center border-b border-[#C9A45C]/20 pb-3">
                  <span className="font-serif text-lg tracking-wider text-[#5A1020] font-bold uppercase flex items-center gap-2">
                    <SlidersHorizontal size={16} /> Filters
                  </span>
                  <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="text-[10px] tracking-wider text-[#C9A45C] hover:text-[#5A1020] font-bold uppercase underline"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      onClick={() => setShowFiltersMobile(false)}
                      aria-label="Close filters"
                      className="touch-target w-9 h-9 min-w-[36px] min-h-[36px] rounded-full hover:bg-[#F2ECE4] text-[#5A1020] flex items-center justify-center transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Mobile Categories */}
                <div className="space-y-3">
                  <h4 className="font-serif text-xs tracking-widest text-[#5A1020] font-bold uppercase">Collections</h4>
                  <div className="flex flex-wrap gap-2">
                    {['All', ...categories].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setActiveCategory(cat)
                          setSearchParams(cat === 'All' ? {} : { category: cat })
                          setShowFiltersMobile(false)
                        }}
                        className={`touch-target min-h-[40px] text-[11px] tracking-wider px-3.5 py-2 rounded-full border transition-all ${
                          activeCategory === cat ? 'bg-[#5A1020] text-[#FFFDF8] border-[#5A1020] font-bold shadow-xs' : 'border-[#C9A45C]/30 text-[#211D1E]/80 hover:bg-[#F2ECE4]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Price */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-serif text-xs tracking-widest text-[#5A1020] font-bold uppercase">Max Price</h4>
                    <span className="font-serif text-xs text-[#C9A45C] font-bold">₹{priceRange.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={25000}
                    step={250}
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full accent-[#5A1020]"
                  />
                  <div className="flex justify-between text-[10px] text-[#211D1E]/50 font-sans">
                    <span>₹500</span>
                    <span>₹25,000</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#C9A45C]/20 flex items-center gap-2.5">
                <button
                  onClick={() => {
                    clearFilters()
                    setShowFiltersMobile(false)
                  }}
                  className="btn-outline flex-1 text-center min-h-[46px] text-xs font-bold tracking-wider uppercase touch-target"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setShowFiltersMobile(false)}
                  className="btn-primary flex-1 text-center min-h-[46px] text-xs font-bold tracking-wider uppercase touch-target"
                >
                  Apply {products.length > 0 ? `(${products.length})` : ''}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}
