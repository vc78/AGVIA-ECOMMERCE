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
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['All', ...categories.slice(0, 5)].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat)
                  setSearchParams(cat === 'All' ? {} : { category: cat })
                }}
                className={`min-h-[38px] text-[11px] font-bold tracking-wider px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap touch-target ${
                  activeCategory === cat
                    ? 'bg-[#C9A45C] text-[#211D1E] shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/15'
                }`}
              >
                {cat}
              </button>
            ))}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#B8860B]/10 pb-2.5 select-none">
              
              {/* Search Bar */}
              <div className="relative w-full sm:max-w-xs">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3A2D23]/40" />
                <input
                  type="text"
                  placeholder="SEARCH SELECTION..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-9 py-1.5 rounded-xl border border-[#B8860B]/20 bg-white text-xs tracking-wider placeholder-[#3A2D23]/30 focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3A2D23]/40 hover:text-[#8B0000]">
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3.5 sm:gap-4">
                
                {/* Sort selection */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9.5px] tracking-widest text-[#3A2D23]/40 uppercase font-bold">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-[11px] tracking-wider text-[#3A2D23]/80 focus:outline-none uppercase border-b border-[#B8860B]/20 pb-0.5"
                  >
                    <option value="popular">Popularity</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>

                {/* Grid View toggle controls */}
                <div className="flex items-center gap-1 border border-[#B8860B]/20 rounded-xl p-1 bg-white">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`touch-target w-9 h-9 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#5A1020] text-white shadow-xs' : 'text-[#3A2D23]/50 hover:text-[#5A1020]'}`}
                    title="Grid View"
                  >
                    <Grid size={15} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`touch-target w-9 h-9 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#5A1020] text-white shadow-xs' : 'text-[#3A2D23]/50 hover:text-[#5A1020]'}`}
                    title="List View"
                  >
                    <List size={15} />
                  </button>
                </div>

                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowFiltersMobile(true)}
                  className="lg:hidden flex items-center justify-center gap-1.5 border border-[#B8860B]/20 bg-white rounded-xl px-3.5 min-h-[44px] text-xs font-semibold text-[#5A1020] hover:border-[#5A1020] touch-target shadow-xs"
                >
                  <SlidersHorizontal size={14} /> <span>Filters</span>
                </button>
              </div>

            </div>

            {/* Active filters summary */}
            {(activeCategory !== 'All' || search || priceRange !== 2000) && (
              <div className="flex items-center gap-2 flex-wrap select-none">
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
                {priceRange !== 2000 && (
                  <span className="text-[10px] bg-[#8B0000]/5 text-[#8B0000] px-3 py-1 rounded-full flex items-center gap-1.5 border border-[#B8860B]/10 font-bold">
                    Under ₹{priceRange}
                    <button onClick={() => setPriceRange(2000)}><X size={10} /></button>
                  </span>
                )}
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
                  <button onClick={() => setShowFiltersMobile(false)} className="touch-target w-10 h-10 min-w-[40px] min-h-[40px] rounded-full hover:bg-[#F2ECE4] text-[#5A1020] flex items-center justify-center">
                    <X size={18} />
                  </button>
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
                  <div className="flex justify-between text-[10px] text-[#211D1E]/50 font-sans">
                    <span>₹500</span>
                    <span>₹25,000</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#C9A45C]/20">
                <button onClick={() => setShowFiltersMobile(false)} className="btn-primary w-full text-center min-h-[48px] text-xs font-bold tracking-widest uppercase touch-target">
                  Apply Filters
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
