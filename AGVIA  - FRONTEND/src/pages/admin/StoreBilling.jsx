import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Search, Plus, Minus, Trash2, Printer, Download, CheckCircle2,
  Receipt, CreditCard, Banknote, QrCode, ArrowRight, User, Phone,
  Mail, MapPin, Sparkles, RefreshCw, AlertCircle, ShoppingBag,
  Share2, X, Percent, Tag, Calculator, ShieldCheck, Clock
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { adminService } from '../../services/adminService'
import { exportOrderParcelReceiptPDF } from '../../utils/pdfExportUtils'
import { resolveImageUrl } from '../../utils/media'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'

export default function StoreBilling() {
  // Catalog state
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [categories, setCategories] = useState([])

  // Bill items state: array of { id, productId, name, sku, image, unitPrice, originalPrice, quantity, variantId, colorName, maxStock, itemDiscount }
  const [billItems, setBillItems] = useState([])

  // Customer / Patron details
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  })

  // Payment & Concession state
  const [paymentMethod, setPaymentMethod] = useState('CASH') // 'CASH' | 'UPI' | 'CARD' | 'SPLIT'
  const [discountType, setDiscountType] = useState('FLAT') // 'FLAT' | 'PERCENT'
  const [discountValue, setDiscountValue] = useState(0)
  const [discountReason, setDiscountReason] = useState('')
  const [cashTendered, setCashTendered] = useState('')
  const [includeGst, setIncludeGst] = useState(false) // Whether 5% GST is separated or included
  const [gstRate, setGstRate] = useState(5)

  // Checkout submission & invoice modal state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedOrder, setCompletedOrder] = useState(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')

  // Recent in-store transactions history
  const [recentBills, setRecentBills] = useState([])
  const [loadingRecent, setLoadingRecent] = useState(false)
  const [activeTab, setActiveTab] = useState('POS') // 'POS' | 'HISTORY'

  // Load catalog on mount
  useEffect(() => {
    loadProducts()
    loadCategories()
    loadRecentBills()
  }, [])

  const loadProducts = async () => {
    setLoadingProducts(true)
    try {
      const data = await adminService.getProducts({ size: 1000 })
      const list = Array.isArray(data) ? data : data?.content || []
      setProducts(list)
    } catch (err) {
      console.error('[StoreBilling] Failed to load catalog:', err)
      toast.error('Failed to load atelier catalog')
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadCategories = async () => {
    try {
      const cats = await adminService.getCategories()
      if (Array.isArray(cats)) setCategories(cats)
    } catch (err) {
      console.warn('[StoreBilling] Could not fetch categories:', err)
    }
  }

  const loadRecentBills = async () => {
    setLoadingRecent(true)
    try {
      const res = await adminService.getOrders({ size: 50, sortBy: 'id', direction: 'desc' })
      const list = res?.content || (Array.isArray(res) ? res : [])
      // Filter for in-store walk-in bills
      const posOrders = list.filter(o => 
        (o.notes && o.notes.includes('IN_STORE_POS')) || 
        (o.orderNumber && o.orderNumber.startsWith('POS-')) ||
        (o.shippingAddress && o.shippingAddress.includes('Walk-in'))
      )
      setRecentBills(posOrders)
    } catch (err) {
      console.warn('[StoreBilling] Could not fetch recent bills:', err)
    } finally {
      setLoadingRecent(false)
    }
  }

  // Filtered catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCat =
        selectedCategory === 'ALL' ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase()

      return matchesSearch && matchesCat
    })
  }, [products, searchQuery, selectedCategory])

  // Category list
  const categoryNames = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean))
    return ['ALL', ...Array.from(set)]
  }, [products])

  // Add product to active bill
  const handleAddToBill = (product, variant = null) => {
    const variantId = variant?.id || null
    const colorName = variant?.colorName || null
    const itemSku = variant?.sku || product.sku || 'AGV-POS'
    const unitPrice = variant?.price ?? product.price ?? 0
    const maxStock = variant?.stockQuantity ?? product.stock ?? product.stockQuantity ?? 99

    setBillItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.productId === product.id && item.variantId === variantId
      )

      if (existingIdx > -1) {
        const updated = [...prev]
        const currentQty = updated[existingIdx].quantity
        if (currentQty >= maxStock) {
          toast.error(`Only ${maxStock} in stock for this silhouette!`)
          return prev
        }
        updated[existingIdx].quantity += 1
        return updated
      }

      const newItem = {
        key: `${product.id}-${variantId || 'base'}`,
        productId: product.id,
        name: product.name,
        sku: itemSku,
        image: resolveImageUrl(variant?.primaryImageUrl || product.image),
        unitPrice: Number(unitPrice),
        originalPrice: Number(unitPrice),
        quantity: 1,
        variantId,
        colorName,
        maxStock,
        itemDiscount: 0
      }

      toast.success(`Added ${product.name} to bill`, {
        duration: 1500,
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '10px' }
      })

      return [...prev, newItem]
    })
  }

  // Update item quantity
  const handleUpdateQty = (key, delta) => {
    setBillItems((prev) =>
      prev
        .map((item) => {
          if (item.key === key) {
            const newQty = item.quantity + delta
            if (newQty <= 0) return null
            if (newQty > item.maxStock) {
              toast.error(`Maximum available stock is ${item.maxStock}`)
              return item
            }
            return { ...item, quantity: newQty }
          }
          return item
        })
        .filter(Boolean)
    )
  }

  // Update item custom unit price (Owner price override)
  const handleUpdatePrice = (key, newPrice) => {
    const val = Math.max(0, parseFloat(newPrice) || 0)
    setBillItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, unitPrice: val } : item))
    )
  }

  // Update line item discount
  const handleUpdateItemDiscount = (key, discountAmt) => {
    const val = Math.max(0, parseFloat(discountAmt) || 0)
    setBillItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, itemDiscount: val } : item))
    )
  }

  // Remove item
  const handleRemoveItem = (key) => {
    setBillItems((prev) => prev.filter((item) => item.key !== key))
  }

  // Clear bill
  const handleClearBill = () => {
    if (billItems.length === 0) return
    if (window.confirm('Clear current active bill?')) {
      setBillItems([])
      setDiscountValue(0)
      setDiscountReason('')
      setCashTendered('')
    }
  }

  // Financial calculations
  const subtotal = useMemo(() => {
    return billItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity - (item.itemDiscount || 0),
      0
    )
  }, [billItems])

  const calculatedDiscount = useMemo(() => {
    if (!discountValue || discountValue <= 0) return 0
    if (discountType === 'PERCENT') {
      return (subtotal * discountValue) / 100
    }
    return Math.min(subtotal, Number(discountValue))
  }, [subtotal, discountType, discountValue])

  const taxableAmount = Math.max(0, subtotal - calculatedDiscount)

  const taxAmount = useMemo(() => {
    if (!includeGst) return 0
    return Math.round((taxableAmount * gstRate) / 100)
  }, [includeGst, taxableAmount, gstRate])

  const grandTotal = Math.round(taxableAmount + taxAmount)

  // Cash change calculator
  const changeDue = useMemo(() => {
    const tendered = parseFloat(cashTendered) || 0
    return Math.max(0, tendered - grandTotal)
  }, [cashTendered, grandTotal])

  // Submit in-store purchase
  const handleGenerateBill = async () => {
    if (billItems.length === 0) {
      toast.error('Please add at least one silhouette to the bill.')
      return
    }

    setIsSubmitting(true)

    const payload = {
      customerName: customer.name.trim() || 'Walk-in Patron',
      customerPhone: customer.phone.trim() || '',
      customerEmail: customer.email.trim() || '',
      customerAddress: customer.address.trim() || '',
      paymentMethod,
      paymentStatus: 'SUCCESS',
      customDiscount: calculatedDiscount,
      discountReason: discountReason.trim() || (calculatedDiscount > 0 ? 'In-Store Atelier Concession' : ''),
      taxAmount,
      notes: customer.notes.trim() || '',
      items: billItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.name,
        sku: item.sku,
        colorName: item.colorName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.itemDiscount || 0
      }))
    }

    try {
      const order = await adminService.createPosBill(payload)
      setCompletedOrder(order)

      // Generate instant QR Code for invoice verification
      const siteOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://agvia.vercel.app'
      const invoiceRef = order.orderNumber || `#${order.id}`
      const verifyUrl = `${siteOrigin}/track-order?order=${encodeURIComponent(invoiceRef)}`
      try {
        const qr = await QRCode.toDataURL(verifyUrl, { width: 260, margin: 1 })
        setQrCodeDataUrl(qr)
      } catch (e) {}

      setShowInvoiceModal(true)
      toast.success(`Bill ${order.orderNumber} generated successfully!`, {
        duration: 4000,
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })

      // Reset active bill
      setBillItems([])
      setDiscountValue(0)
      setDiscountReason('')
      setCashTendered('')
      setCustomer({ name: '', phone: '', email: '', address: '', notes: '' })

      // Reload recent history and inventory
      loadRecentBills()
      loadProducts()
    } catch (err) {
      console.error('[StoreBilling] Bill generation failed:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to generate in-store bill'
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Download PDF
  const handleDownloadPdf = async (order = completedOrder) => {
    if (!order) return
    try {
      toast.loading('Generating official branded tax invoice...', { id: 'pos-pdf' })
      await exportOrderParcelReceiptPDF(order)
      toast.success('Tax invoice PDF downloaded!', { id: 'pos-pdf' })
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF document', { id: 'pos-pdf' })
    }
  }

  // Print Invoice directly
  const handlePrint = () => {
    window.print()
  }

  // WhatsApp Share Invoice Link
  const handleShareWhatsApp = (order = completedOrder) => {
    if (!order) return
    const phone = order.contactPhone || customer.phone
    const trackingRef = order.orderNumber || `#${order.id}`
    const amount = Number(order.finalAmount || 0).toLocaleString('en-IN')
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://agvia.vercel.app'
    const link = `${origin}/track-order?order=${encodeURIComponent(trackingRef)}`
    
    const message = encodeURIComponent(
      `Namaste from AGVIA Haute Couture Atelier!\n\nThank you for visiting our boutique. Your in-store purchase bill #${trackingRef} for ₹${amount} is confirmed.\n\nView and download your digital tax invoice:\n${link}\n\nWe look forward to styling you again.`
    )

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : ''
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${message}`
      : `https://wa.me/?text=${message}`
    
    window.open(waUrl, '_blank')
  }

  return (
    <AdminLayout>
      <div className="font-body text-[#211D1E] pb-12">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 select-none">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#5A1020] text-[#FAF7F2] text-[10px] font-bold uppercase tracking-wider">
                Storefront POS
              </span>
              <span className="text-xs text-[#C9A45C] font-semibold tracking-wide">
                • Walk-in Customer Billing
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A1020] mt-1">
              Atelier Counter Billing
            </h1>
            <p className="text-xs text-[#211D1E]/60">
              Live in-store invoicing, custom patron concessions, real-time inventory deduction & branded receipt generation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('POS')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'POS'
                  ? 'bg-[#5A1020] text-white shadow-sm'
                  : 'bg-white border border-[#C9A45C]/30 text-[#5A1020] hover:bg-[#5A1020]/5'
              }`}
            >
              <Calculator size={13} />
              <span>Billing Counter</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('HISTORY')
                loadRecentBills()
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'HISTORY'
                  ? 'bg-[#5A1020] text-white shadow-sm'
                  : 'bg-white border border-[#C9A45C]/30 text-[#5A1020] hover:bg-[#5A1020]/5'
              }`}
            >
              <Receipt size={13} />
              <span>In-Store Bills ({recentBills.length})</span>
            </button>
          </div>
        </div>

        {activeTab === 'HISTORY' ? (
          /* Recent In-Store Bills List */
          <div className="bg-white rounded-2xl border border-[#C9A45C]/25 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-[#5A1020]">
                Recent In-Store Walk-in Invoices
              </h3>
              <button
                onClick={loadRecentBills}
                disabled={loadingRecent}
                className="btn-outline !py-1.5 !px-3 text-xs flex items-center gap-1"
              >
                <RefreshCw size={12} className={loadingRecent ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingRecent ? (
              <div className="py-12 text-center text-xs text-neutral-400">Loading in-store bills...</div>
            ) : recentBills.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                No walk-in in-store bills generated yet. Generate your first in-store transaction at the counter!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#5A1020] uppercase font-bold border-b border-[#C9A45C]/20">
                    <tr>
                      <th className="py-3 px-3">Invoice #</th>
                      <th className="py-3 px-3">Patron Name</th>
                      <th className="py-3 px-3">Contact</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Payment</th>
                      <th className="py-3 px-3 text-right">Total</th>
                      <th className="py-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
                    {recentBills.map((b) => (
                      <tr key={b.id} className="hover:bg-[#FAF7F2]/50">
                        <td className="py-3 px-3 font-bold text-[#5A1020]">{b.orderNumber}</td>
                        <td className="py-3 px-3 font-sans font-semibold text-neutral-800">{b.userName || 'Walk-in Patron'}</td>
                        <td className="py-3 px-3 text-neutral-600">{b.contactPhone || '—'}</td>
                        <td className="py-3 px-3 text-neutral-500">{b.createdAt ? b.createdAt.split('T')[0] : 'Today'}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {b.paymentMethod || 'CASH'} • PAID
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#5A1020] text-xs">
                          ₹{Number(b.finalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setCompletedOrder(b)
                                setShowInvoiceModal(true)
                              }}
                              title="View Invoice"
                              className="p-1 rounded-lg border border-[#C9A45C]/40 text-[#5A1020] hover:bg-[#5A1020] hover:text-white"
                            >
                              <Printer size={12} />
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(b)}
                              title="Download PDF"
                              className="p-1 rounded-lg border border-[#C9A45C]/40 text-[#5A1020] hover:bg-[#5A1020] hover:text-white"
                            >
                              <Download size={12} />
                            </button>
                            <button
                              onClick={() => handleShareWhatsApp(b)}
                              title="Send on WhatsApp"
                              className="p-1 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                            >
                              <Share2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Main POS Split Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Product Selection Catalog (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Search & Category Bar */}
              <div className="bg-white rounded-2xl border border-[#C9A45C]/25 p-4 shadow-xs space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by silhouette name, SKU (e.g. AGV-SAR-001), or fabric..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 focus:border-[#C9A45C] focus:ring-2 focus:ring-[#C9A45C]/20 text-xs transition-all font-body"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
                  {categoryNames.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-[#5A1020] text-white shadow-2xs'
                          : 'bg-[#FAF7F2] text-[#211D1E]/70 hover:bg-[#5A1020]/10 border border-[#C9A45C]/20'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              <div className="bg-white rounded-2xl border border-[#C9A45C]/25 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3 text-xs text-neutral-500">
                  <span>Available Silhouettes ({filteredProducts.length})</span>
                  <span className="text-[11px] text-[#C9A45C] font-semibold">Click to add to bill</span>
                </div>

                {loadingProducts ? (
                  <div className="py-16 text-center text-xs text-neutral-400">Loading catalog...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-16 text-center text-xs text-neutral-400">
                    No silhouettes found matching your search.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[640px] overflow-y-auto pr-1">
                    {filteredProducts.map((product) => {
                      const stock = product.stock ?? product.stockQuantity ?? 0
                      const isOutOfStock = stock <= 0
                      const hasVariants = product.variants && product.variants.length > 0

                      return (
                        <div
                          key={product.id}
                          className={`group relative rounded-xl border p-2.5 flex flex-col justify-between transition-all bg-[#FAF7F2]/40 ${
                            isOutOfStock
                              ? 'opacity-60 border-neutral-200'
                              : 'hover:border-[#C9A45C] hover:shadow-md border-[#C9A45C]/20'
                          }`}
                        >
                          <div>
                            <div className="aspect-square w-full rounded-lg overflow-hidden bg-neutral-100 mb-2 relative">
                              <img
                                src={resolveImageUrl(product.image)}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                              {isOutOfStock ? (
                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider">
                                  Out of Stock
                                </span>
                              ) : (
                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#1A0B10]/80 text-[#C9A45C] text-[9px] font-bold">
                                  {stock} in stock
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] font-serif font-bold text-[#5A1020] line-clamp-1 leading-tight">
                              {product.name}
                            </p>
                            <p className="text-[9.5px] font-mono text-neutral-500 mt-0.5">
                              {product.sku || 'AGV'} • {product.category}
                            </p>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-neutral-200/60 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-[#5A1020]">
                                ₹{Number(product.price || 0).toLocaleString('en-IN')}
                              </span>
                            </div>

                            {hasVariants ? (
                              <button
                                onClick={() => handleAddToBill(product, product.variants[0])}
                                disabled={isOutOfStock}
                                className="px-2.5 py-1 rounded-lg bg-[#5A1020] hover:bg-[#72152b] text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-2xs disabled:bg-neutral-300"
                                title="Add with default variant"
                              >
                                + Add
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAddToBill(product)}
                                disabled={isOutOfStock}
                                className="px-2.5 py-1 rounded-lg bg-[#5A1020] hover:bg-[#72152b] text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-2xs disabled:bg-neutral-300"
                              >
                                + Add
                              </button>
                            )}
                          </div>

                          {/* Variant Pills if available */}
                          {hasVariants && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {product.variants.slice(0, 3).map((v) => (
                                <button
                                  key={v.id}
                                  onClick={() => handleAddToBill(product, v)}
                                  className="text-[9px] px-1.5 py-0.5 rounded border border-[#C9A45C]/40 bg-white hover:bg-[#5A1020] hover:text-white transition-all text-[#5A1020]"
                                >
                                  {v.colorName || v.sku || 'Var'}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Bill, Custom Pricing & Checkout (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Customer Details Card */}
              <div className="bg-white rounded-2xl border border-[#C9A45C]/30 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-[#C9A45C]/20 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#5A1020]">
                    <User size={13} className="text-[#C9A45C]" />
                    <span>Walk-in Patron Details</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">Optional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      placeholder="e.g. Sumanth Rao"
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 text-xs focus:border-[#C9A45C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 text-xs focus:border-[#C9A45C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                      Email (For E-Receipt)
                    </label>
                    <input
                      type="email"
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      placeholder="patron@gmail.com"
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 text-xs focus:border-[#C9A45C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                      City / Notes
                    </label>
                    <input
                      type="text"
                      value={customer.notes}
                      onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                      placeholder="e.g. Hyderabad / Alteration"
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 text-xs focus:border-[#C9A45C]"
                    />
                  </div>
                </div>
              </div>

              {/* Active Bill Items */}
              <div className="bg-white rounded-2xl border border-[#C9A45C]/30 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-[#C9A45C]/20 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#5A1020]">
                    <ShoppingBag size={13} className="text-[#C9A45C]" />
                    <span>Bill Items ({billItems.length})</span>
                  </div>
                  {billItems.length > 0 && (
                    <button
                      onClick={handleClearBill}
                      className="text-[10px] text-red-600 hover:text-red-800 font-bold uppercase"
                    >
                      Clear Bill
                    </button>
                  )}
                </div>

                {billItems.length === 0 ? (
                  <div className="py-10 text-center text-xs text-neutral-400">
                    <Receipt size={28} className="mx-auto text-neutral-300 mb-2" />
                    <p>Bill is currently empty.</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Click silhouettes on the left to add items.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                    {billItems.map((item) => (
                      <div
                        key={item.key}
                        className="p-2.5 rounded-xl border border-neutral-200/80 bg-[#FAF7F2]/40 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-9 h-9 rounded-md object-cover border border-neutral-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#5A1020] truncate font-serif leading-tight">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-neutral-500 font-mono">
                                {item.sku} {item.colorName ? `• ${item.colorName}` : ''}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item.key)}
                            className="text-neutral-400 hover:text-red-600 p-1"
                            title="Remove"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Price, Qty & Discount Controls */}
                        <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-neutral-200/50">
                          {/* Unit price editor */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-neutral-500">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdatePrice(item.key, e.target.value)}
                              className="w-16 px-1.5 py-0.5 text-xs font-bold text-[#5A1020] rounded border border-neutral-200 text-center"
                              title="Owner custom price override"
                            />
                            {item.unitPrice !== item.originalPrice && (
                              <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded">
                                Custom
                              </span>
                            )}
                          </div>

                          {/* Qty Stepper */}
                          <div className="flex items-center gap-1 border border-neutral-300 rounded-lg px-1.5 py-0.5 bg-white">
                            <button
                              onClick={() => handleUpdateQty(item.key, -1)}
                              className="text-neutral-500 hover:text-[#5A1020] p-0.5"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="font-mono font-bold text-xs px-1.5">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQty(item.key, 1)}
                              className="text-neutral-500 hover:text-[#5A1020] p-0.5"
                            >
                              <Plus size={11} />
                            </button>
                          </div>

                          {/* Line total */}
                          <div className="text-right font-bold text-xs text-[#5A1020]">
                            ₹{Number(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Calculation & Concession Box */}
              <div className="bg-[#FAF7F2] rounded-2xl border border-[#C9A45C]/35 p-4 shadow-xs space-y-3">
                {/* Custom Concession / Discount Input */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-[#5A1020] uppercase flex items-center gap-1">
                      <Tag size={11} className="text-[#C9A45C]" />
                      <span>Owner Concession / Discount</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDiscountType('FLAT')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          discountType === 'FLAT' ? 'bg-[#5A1020] text-white' : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        ₹ Flat
                      </button>
                      <button
                        onClick={() => setDiscountType('PERCENT')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          discountType === 'PERCENT' ? 'bg-[#5A1020] text-white' : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        % Off
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === 'FLAT' ? 'Discount Amount (₹)' : 'Discount % (e.g. 10)'}
                      className="px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs bg-white"
                    />
                    <input
                      type="text"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder="Reason (e.g. Festival Concession)"
                      className="px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs bg-white"
                    />
                  </div>
                </div>

                {/* GST Toggle */}
                <div className="flex items-center justify-between text-xs py-1.5 border-t border-b border-[#C9A45C]/20">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-semibold text-neutral-700">
                    <input
                      type="checkbox"
                      checked={includeGst}
                      onChange={(e) => setIncludeGst(e.target.checked)}
                      className="rounded border-neutral-300 text-[#5A1020] focus:ring-[#C9A45C]"
                    />
                    <span>Add 5% GST to invoice</span>
                  </label>
                  {includeGst && (
                    <span className="font-mono text-xs font-semibold text-neutral-700">
                      +₹{taxAmount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Totals Summary */}
                <div className="space-y-1.5 text-xs font-body">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal</span>
                    <span className="font-mono font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {calculatedDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Concession ({discountReason || 'Discount'})</span>
                      <span className="font-mono font-bold">-₹{calculatedDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {includeGst && (
                    <div className="flex justify-between text-neutral-600">
                      <span>GST (5%)</span>
                      <span className="font-mono font-bold">+₹{taxAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-2 border-t border-[#C9A45C]/30 text-[#5A1020]">
                    <span className="font-serif font-bold text-sm uppercase">Total Payable</span>
                    <span className="font-serif font-bold text-xl sm:text-2xl text-[#5A1020]">
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="pt-2 border-t border-[#C9A45C]/20 space-y-2">
                  <label className="block text-[10px] font-bold text-[#5A1020] uppercase tracking-wider">
                    Select In-Store Payment Mode
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'CASH', label: 'Cash', icon: Banknote },
                      { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                      { id: 'CARD', label: 'Card POS', icon: CreditCard }
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPaymentMethod(id)}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-xs font-bold transition-all ${
                          paymentMethod === id
                            ? 'bg-[#5A1020] text-white border-[#5A1020] shadow-2xs'
                            : 'bg-white border-[#C9A45C]/30 text-neutral-700 hover:bg-[#5A1020]/5'
                        }`}
                      >
                        <Icon size={16} className={paymentMethod === id ? 'text-[#C9A45C]' : 'text-neutral-500'} />
                        <span className="mt-1 text-[11px]">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Cash tender calculator */}
                  {paymentMethod === 'CASH' && (
                    <div className="p-2.5 bg-white rounded-xl border border-neutral-200 mt-2 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-neutral-600">Cash Tendered by Customer:</span>
                        <input
                          type="number"
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          placeholder="₹ Amount"
                          className="w-24 px-2 py-1 rounded border border-neutral-300 text-xs text-right font-mono font-bold"
                        />
                      </div>
                      {parseFloat(cashTendered) > 0 && (
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100 font-bold">
                          <span className="text-emerald-700">Change Due to Customer:</span>
                          <span className="text-emerald-800 font-mono text-sm">
                            ₹{changeDue.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Final Submit Button */}
                <button
                  onClick={handleGenerateBill}
                  disabled={isSubmitting || billItems.length === 0}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#5A1020] hover:bg-[#72152b] text-[#FAF7F2] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-50 disabled:pointer-events-none mt-3"
                >
                  <Receipt size={16} className="text-[#C9A45C]" />
                  <span>
                    {isSubmitting ? 'Generating Invoice...' : `Generate Bill • ₹${grandTotal.toLocaleString('en-IN')}`}
                  </span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice & Bill Success Modal */}
        {showInvoiceModal && completedOrder && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-[#C9A45C]/40 shadow-2xl overflow-hidden my-6">
              {/* Modal Top Banner */}
              <div className="bg-gradient-to-r from-[#1A0B10] via-[#5A1020] to-[#1A0B10] text-[#FAF7F2] p-5 text-center relative">
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="absolute top-4 right-4 text-white/60 hover:text-white"
                >
                  <X size={18} />
                </button>
                <div className="w-12 h-12 mx-auto rounded-full bg-[#C9A45C]/20 border border-[#C9A45C] flex items-center justify-center mb-2">
                  <CheckCircle2 size={24} className="text-[#C9A45C]" />
                </div>
                <h3 className="font-serif text-lg font-bold">In-Store Tax Invoice Generated</h3>
                <p className="text-[11px] text-[#FAF7F2]/80 font-mono mt-0.5">
                  Invoice #{completedOrder.orderNumber}
                </p>
              </div>

              {/* Invoice Content */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto font-body text-xs">
                {/* Store Branding & QR */}
                <div className="flex items-start justify-between border-b border-neutral-200 pb-3">
                  <div>
                    <h4 className="font-serif text-base font-bold text-[#5A1020]">AGVIA ATELIER</h4>
                    <p className="text-[10px] text-neutral-500">Luxury Women's Wear Boutique</p>
                    <p className="text-[9px] text-neutral-400 font-mono mt-0.5">
                      GSTIN: 36AAHCA1234F1Z5 • CIN: U18101TG2026PTC099882
                    </p>
                  </div>

                  {qrCodeDataUrl && (
                    <img src={qrCodeDataUrl} alt="Verify QR" className="w-16 h-16 border border-neutral-200 rounded p-1" />
                  )}
                </div>

                {/* Customer & Payment Info */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#FAF7F2] p-3 rounded-xl border border-[#C9A45C]/20">
                  <div>
                    <span className="text-neutral-500 block text-[9.5px] uppercase font-bold">Patron Name:</span>
                    <span className="font-bold text-neutral-800">{completedOrder.userName || 'Walk-in Patron'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9.5px] uppercase font-bold">Contact:</span>
                    <span className="font-mono text-neutral-800">{completedOrder.contactPhone || 'In-Store'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9.5px] uppercase font-bold">Payment Method:</span>
                    <span className="font-bold text-emerald-800">{completedOrder.paymentMethod} (PAID)</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9.5px] uppercase font-bold">Date & Time:</span>
                    <span className="font-mono text-neutral-800">
                      {completedOrder.createdAt ? completedOrder.createdAt.replace('T', ' ').slice(0, 19) : 'Just Now'}
                    </span>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#FAF7F2] font-bold text-neutral-700 border-b border-neutral-200">
                      <tr>
                        <th className="py-2 px-2.5">Item</th>
                        <th className="py-2 px-2 text-center">Qty</th>
                        <th className="py-2 px-2 text-right">Price</th>
                        <th className="py-2 px-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-mono">
                      {(completedOrder.items || []).map((it) => (
                        <tr key={it.id || it.productName}>
                          <td className="py-2 px-2.5 font-sans font-medium text-neutral-800">
                            {it.productName}
                            {it.colorName ? ` (${it.colorName})` : ''}
                          </td>
                          <td className="py-2 px-2 text-center">{it.quantity}</td>
                          <td className="py-2 px-2 text-right">₹{Number(it.price || 0).toLocaleString('en-IN')}</td>
                          <td className="py-2 px-2.5 text-right font-bold text-[#5A1020]">
                            ₹{Number(it.subtotal || it.price * it.quantity || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Final Amount Breakdown */}
                <div className="space-y-1 text-xs pt-2 font-mono">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal:</span>
                    <span>₹{Number(completedOrder.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {Number(completedOrder.discountAmount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount Concession:</span>
                      <span>-₹{Number(completedOrder.discountAmount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-[#5A1020] pt-1.5 border-t border-neutral-200">
                    <span className="font-sans uppercase">Grand Total (PAID):</span>
                    <span>₹{Number(completedOrder.finalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Actions: Print, PDF, WhatsApp */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-neutral-200">
                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#C9A45C]/40 bg-[#FAF7F2] hover:bg-[#5A1020] text-[#5A1020] hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    <Printer size={14} />
                    <span>Print Bill</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(completedOrder)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#5A1020] hover:bg-[#72152b] text-white font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={() => handleShareWhatsApp(completedOrder)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-emerald-500 bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    <Share2 size={14} />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end">
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-5 py-2 bg-neutral-800 hover:bg-neutral-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Close & New Bill
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

