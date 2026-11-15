import { useEffect, useState, useRef, useMemo } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import DataTable from '../../components/admin/DataTable'
import { adminService } from '../../services/adminService'
import { adminWebSocket } from '../../services/adminWebSocket'
import { exportOrdersPDF, exportOrderParcelReceiptPDF } from '../../utils/pdfExportUtils'
import { generateAndDownloadOrdersExcel } from '../../utils/excelExportUtils'
import { RefreshCw, Radio, Download, FileText, Filter, ShoppingBag, QrCode, Printer, FileSpreadsheet, Database, Calendar } from 'lucide-react'
import ParcelReceiptModal from '../../components/admin/ParcelReceiptModal'

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  { value: 'PROCESSING', label: 'Processing', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  { value: 'PREPARING', label: 'Preparing', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  { value: 'READY', label: 'Ready', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { value: 'SHIPPED', label: 'Shipped', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-50 text-green-800 border-green-200' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-50 text-red-800 border-red-200' },
  { value: 'REFUNDED', label: 'Refunded', color: 'bg-purple-50 text-purple-900 border-purple-300' }
]

export default function OrdersManagement() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [liveSync, setLiveSync] = useState(true)
  const [lastSyncTime, setLastSyncTime] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [downloadingReceiptId, setDownloadingReceiptId] = useState(null)
  const [excelLoading, setExcelLoading] = useState(false)
  const [regeneratingExcel, setRegeneratingExcel] = useState(false)
  const pollTimerRef = useRef(null)

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const params = { size: 1000 }
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (paymentMethodFilter !== 'ALL') params.paymentMethod = paymentMethodFilter
      if (paymentStatusFilter !== 'ALL') params.paymentStatus = paymentStatusFilter
      if (dateFilter === 'CUSTOM') {
        if (customStartDate) params.startDate = customStartDate
        if (customEndDate) params.endDate = customEndDate
      } else if (dateFilter !== 'ALL') {
        params.dateRange = dateFilter
      }
      const data = await adminService.getOrders(params)
      setOrders(data)
      setError(null)
      setLastSyncTime(new Date())
    } catch (err) {
      console.error(err)
      if (!silent) {
        setError('Failed to load orders. Please verify backend connectivity.')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()

    // Real-time authoritative live update: refetch orders instantly on incoming events
    const unsubscribe = adminWebSocket.subscribe((event) => {
      if (
        event.type === 'NEW_ORDER' ||
        event.type === 'ORDER_STATUS_CHANGED' ||
        event.type === 'ORDER_CANCELLED' ||
        event.type === 'PAYMENT_RECEIVED'
      ) {
        if (event.type === 'NEW_ORDER') {
          const num = event.metadata?.orderNumber || event.referenceId || 'New'
          toast.success(`✨ Real-Time: Order #${num} entered registry!`, {
            id: `rt-order-${num}`,
            duration: 5000,
            style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px', border: '1px solid #C9A45C' }
          })
        }
        loadOrders(true)
      }
    })

    return () => unsubscribe()
  }, [])

  // Live polling effect
  useEffect(() => {
    if (liveSync) {
      pollTimerRef.current = setInterval(() => {
        loadOrders(true)
      }, 10000)
    } else {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [liveSync])

  const handleStatusChange = async (id, status) => {
    try {
      await adminService.updateOrderStatus(id, status)
      setOrders((list) => list.map((o) => (o.id === id ? { ...o, status: status.toUpperCase() } : o)))
      toast.success(`Order marked as ${status}`, {
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to update order status.')
    }
  }

  const handleExportOrders = async () => {
    if (orders.length === 0) {
      toast.error('No orders available to export.')
      return
    }
    try {
      toast.loading('Compiling luxury orders dispatch PDF...', { id: 'pdf-orders' })
      const list = filteredOrders.length > 0 ? filteredOrders : orders
      await exportOrdersPDF(list, statusFilter)
      toast.success(`Exported ${list.length} orders to official PDF!`, {
        id: 'pdf-orders',
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to export orders PDF.', { id: 'pdf-orders' })
    }
  }

  const handleDownloadExcel = async () => {
    try {
      setExcelLoading(true)
      toast.loading('Compiling AGVIA_ORDERS.xlsx...', { id: 'excel-orders' })

      const params = {}
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (dateFilter === 'TODAY') {
        const todayStr = new Date().toISOString().slice(0, 10)
        params.startDate = todayStr
        params.endDate = todayStr
      } else if (dateFilter === 'YESTERDAY') {
        const y = new Date()
        y.setDate(y.getDate() - 1)
        const yStr = y.toISOString().slice(0, 10)
        params.startDate = yStr
        params.endDate = yStr
      } else if (dateFilter === '7DAYS') {
        const d = new Date()
        d.setDate(d.getDate() - 7)
        params.startDate = d.toISOString().slice(0, 10)
      } else if (dateFilter === '30DAYS') {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        params.startDate = d.toISOString().slice(0, 10)
      } else if (dateFilter === 'CUSTOM') {
        if (customStartDate) params.startDate = customStartDate
        if (customEndDate) params.endDate = customEndDate
      }

      // 1. Attempt authoritative server-side download first
      try {
        await adminService.downloadOrdersExcel(params)
        toast.success('Downloaded official AGVIA_ORDERS.xlsx from server!', {
          id: 'excel-orders',
          style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
        })
        return
      } catch (serverErr) {
        console.warn('Server download endpoint unreachable, generating real-time Excel directly from live orders:', serverErr)
      }

      // 2. Resilient fallback: Generate directly from real-time live orders in browser
      const list = filteredOrders.length > 0 ? filteredOrders : orders
      generateAndDownloadOrdersExcel(list)
      toast.success(`Generated AGVIA_ORDERS.xlsx (${list.length} orders) in real-time!`, {
        id: 'excel-orders',
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Failed to generate Excel report.', { id: 'excel-orders' })
    } finally {
      setExcelLoading(false)
    }
  }

  const handleRegenerateExcel = async () => {
    try {
      setRegeneratingExcel(true)
      toast.loading('Regenerating AGVIA_ORDERS.xlsx...', { id: 'regen-excel' })
      try {
        const status = await adminService.regenerateOrdersExcel()
        toast.success(`Excel report refreshed from MySQL (${status?.totalOrdersInMySQL || orders.length} orders)!`, {
          id: 'regen-excel',
          style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
        })
        return
      } catch (e) {
        console.warn('Server regenerate call pending/offline, generating live report locally:', e)
      }
      
      const list = filteredOrders.length > 0 ? filteredOrders : orders
      generateAndDownloadOrdersExcel(list)
      toast.success(`Excel registry generated (${list.length} live orders)!`, {
        id: 'regen-excel',
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to regenerate Excel report.', { id: 'regen-excel' })
    } finally {
      setRegeneratingExcel(false)
    }
  }

  const handleDownloadReceipt = async (order) => {
    try {
      setDownloadingReceiptId(order.id)
      const trackingRef = order.orderNumber || `#${order.id}`
      toast.loading(`Compiling parcel slip with QR for ${trackingRef}...`, { id: `receipt-${order.id}` })
      
      let fullOrder = order
      if ((!order.itemsList || order.itemsList.length === 0 || !order.shippingAddress) && order.id) {
        try {
          const fetched = await adminService.getOrderById(order.id)
          if (fetched) fullOrder = fetched
        } catch (e) {
          console.warn('Could not fetch full order details, falling back:', e)
        }
      }

      await exportOrderParcelReceiptPDF(fullOrder)
      toast.success(`Parcel slip with unique QR downloaded for ${trackingRef}!`, {
        id: `receipt-${order.id}`,
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate parcel receipt PDF.', { id: `receipt-${order.id}` })
    } finally {
      setDownloadingReceiptId(null)
    }
  }

  const handleOpenReceiptModal = async (order) => {
    setSelectedReceiptOrder(order)
    setIsReceiptModalOpen(true)
  }

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return orders.filter(o => {
      // 1. Order Status filter
      if (statusFilter !== 'ALL' && String(o.status || '').toUpperCase() !== statusFilter) {
        return false
      }
      // 2. Payment Method filter
      if (paymentMethodFilter !== 'ALL') {
        const pm = String(o.paymentMethod || '').toUpperCase()
        if (paymentMethodFilter === 'COD' && pm !== 'COD') return false
        if (paymentMethodFilter === 'RAZORPAY' && pm !== 'RAZORPAY' && pm !== 'ONLINE') return false
      }
      // 3. Payment Status filter
      if (paymentStatusFilter !== 'ALL') {
        const ps = String(o.payment || o.paymentStatus || '').toUpperCase()
        if (paymentStatusFilter === 'PENDING' && !ps.includes('PENDING')) return false
        if (paymentStatusFilter === 'SUCCESS' && (!ps.includes('SUCCESS') && !ps.includes('COLLECTED') && !ps.includes('PAID'))) return false
        if (paymentStatusFilter === 'FAILED' && !ps.includes('FAILED')) return false
      }
      // 4. Date filter
      if (dateFilter !== 'ALL') {
        const dateVal = o.createdAt || o.date
        if (dateVal) {
          const d = new Date(dateVal)
          d.setHours(0, 0, 0, 0)
          if (dateFilter === 'TODAY' && d.getTime() !== today.getTime()) return false
          if (dateFilter === 'YESTERDAY' && d.getTime() !== yesterday.getTime()) return false
          if (dateFilter === '7DAYS' && d.getTime() < sevenDaysAgo.getTime()) return false
          if (dateFilter === '30DAYS' && d.getTime() < thirtyDaysAgo.getTime()) return false
          if (dateFilter === 'CUSTOM') {
            if (customStartDate) {
              const start = new Date(customStartDate)
              start.setHours(0, 0, 0, 0)
              if (d.getTime() < start.getTime()) return false
            }
            if (customEndDate) {
              const end = new Date(customEndDate)
              end.setHours(23, 59, 59, 999)
              if (d.getTime() > end.getTime()) return false
            }
          }
        }
      }
      // 5. Keyword search filter
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase()
        const orderNum = String(o.orderNumber || o.id || '').toLowerCase()
        const customer = String(o.customer || o.userName || '').toLowerCase()
        const email = String(o.userEmail || o.email || '').toLowerCase()
        const phone = String(o.contactPhone || o.phone || '').toLowerCase()
        if (!orderNum.includes(term) && !customer.includes(term) && !email.includes(term) && !phone.includes(term)) {
          return false
        }
      }
      return true
    })
  }, [orders, statusFilter, paymentMethodFilter, paymentStatusFilter, dateFilter, customStartDate, customEndDate, searchTerm])

  const columns = [
    {
      key: 'orderNumber',
      label: 'Order ID',
      render: (r) => (
        <span className="font-mono font-bold text-xs bg-[#C9A45C]/15 text-[#5A1020] px-2.5 py-1 rounded-lg border border-[#C9A45C]/25 whitespace-nowrap">
          {r.orderNumber || `#${r.id}`}
        </span>
      )
    },
    {
      key: 'customer',
      label: 'Patron',
      render: (r) => (
        <div className="min-w-[120px]">
          <span className="font-bold text-xs text-[#211D1E] block truncate">{r.customer}</span>
        </div>
      )
    },
    { 
      key: 'date', 
      label: 'Placement Date',
      render: (r) => <span className="text-xs text-[#211D1E]/70 whitespace-nowrap">{r.date || '—'}</span>
    },
    {
      key: 'items',
      label: 'Ordered Items & Variants',
      render: (r) => (
        <div className="min-w-[180px] max-w-[260px]">
          <span className="text-xs font-semibold text-[#211D1E]/80 whitespace-nowrap block">
            {r.items} item(s)
          </span>
          {Array.isArray(r.itemsList) && r.itemsList.length > 0 && (
            <div className="space-y-1.5 mt-1">
              {r.itemsList.slice(0, 3).map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs bg-[#FAF7F2] p-1 rounded-lg border border-[#C9A45C]/15">
                  {it.imageUrl && (
                    <img
                      src={it.imageUrl}
                      alt=""
                      className="w-7 h-9 object-cover rounded shrink-0 border border-[#C9A45C]/20 bg-white"
                    />
                  )}
                  <div className="min-w-0 flex-1 leading-tight">
                    <span className="font-bold text-[11px] text-[#211D1E] truncate block">{it.productName || it.name}</span>
                    <div className="flex items-center gap-1.5 text-[9.5px] text-[#211D1E]/60 flex-wrap">
                      {it.colorName && (
                        <span className="font-semibold text-[#5A1020] bg-[#5A1020]/10 px-1 py-0.2 rounded">
                          {it.colorName}
                        </span>
                      )}
                      {it.sku && <span className="font-mono text-[9px] text-gray-500">[{it.sku}]</span>}
                      <span>× {it.quantity || it.qty || 1}</span>
                    </div>
                  </div>
                </div>
              ))}
              {r.itemsList.length > 3 && (
                <span className="text-[10px] text-[#C9A45C] font-semibold block">+{r.itemsList.length - 3} more items</span>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'total',
      label: 'Total & Billing',
      render: (r) => (
        <div className="whitespace-nowrap">
          <span className="font-bold text-sm text-[#5A1020] block">₹{Number(r.total ?? 0).toLocaleString('en-IN')}</span>
          {r.couponCode && Number(r.discountAmount || 0) > 0 && (
            <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 block w-fit mt-0.5">
              {r.couponCode} (-₹{r.discountAmount})
            </span>
          )}
        </div>
      )
    },
    {
      key: 'payment',
      label: 'Payment Method',
      render: (r) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
          String(r.payment).toUpperCase().includes('SUCCESS') || String(r.payment).toUpperCase().includes('PAID')
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {r.payment}
        </span>
      )
    },
    {
      key: 'notificationStatus',
      label: 'Dispatch Update',
      render: (r) => {
        const notif = String(r.notificationStatus || 'NOT_DISPATCHED').toUpperCase()
        const isSent = notif === 'SENT'
        const isFailed = notif === 'FAILED'
        return (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap inline-flex items-center gap-1 ${
            isSent
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : isFailed
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}>
            {isSent ? 'Email Sent ✉️' : isFailed ? 'Email Failed ⚠️' : 'Email Pending ⏳'}
          </span>
        )
      }
    },
    {
      key: 'status',
      label: 'Status Action',
      render: (r) => {
        const currentUpper = String(r.status || 'PENDING').toUpperCase()
        const matchOption = STATUS_OPTIONS.find(o => o.value === currentUpper) || STATUS_OPTIONS[0]
        return (
          <select
            value={currentUpper}
            onChange={(e) => handleStatusChange(r.id, e.target.value)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${matchOption.color}`}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )
      },
    },
    {
      key: 'parcelReceipt',
      label: 'Parcel Receipt (QR)',
      render: (r) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <button
            onClick={() => handleDownloadReceipt(r)}
            disabled={downloadingReceiptId === r.id}
            title="Download Shipping Label & Receipt (PDF with Unique QR to paste on parcel)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#C9A45C]/40 bg-[#FFFDF8] hover:bg-[#5A1020] text-[#5A1020] hover:text-[#FAF7F2] text-xs font-bold transition-all shadow-2xs group touch-target"
          >
            <QrCode size={13} className="text-[#C9A45C] group-hover:text-[#FAF7F2] transition-colors" />
            <Download size={11} className={downloadingReceiptId === r.id ? 'animate-bounce' : ''} />
            <span className="text-[10px] uppercase tracking-wider">Slip (PDF)</span>
          </button>

          <button
            onClick={() => handleOpenReceiptModal(r)}
            title="Preview & Print Parcel Label"
            className="p-1.5 rounded-xl border border-[#C9A45C]/30 bg-white hover:border-[#5A1020] text-[#211D1E]/70 hover:text-[#5A1020] hover:bg-[#5A1020]/5 transition-all touch-target"
          >
            <Printer size={13} />
          </button>
        </div>
      )
    },
  ]

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 select-none font-body">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A1020]">Order Dispatch Hub</h2>
          <p className="text-xs text-[#211D1E]/60 mt-1">Real-time storefront order tracking, payment confirmation, and status dispatch.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Export Orders Button */}
          <button
            onClick={handleExportOrders}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#C9A45C]/40 bg-[#FFFDF8] hover:bg-[#5A1020] text-[#5A1020] hover:text-white text-xs font-bold uppercase tracking-wider transition-all shadow-2xs touch-target"
            title="Download Luxury Orders PDF"
          >
            <FileText size={13} />
            <span>Orders (PDF)</span>
          </button>

          {/* Download AGVIA_ORDERS.xlsx */}
          <button
            onClick={handleDownloadExcel}
            disabled={excelLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-600/40 bg-emerald-50/70 hover:bg-emerald-700 text-emerald-800 hover:text-white text-xs font-bold uppercase tracking-wider transition-all shadow-2xs touch-target"
            title="Download Official AGVIA_ORDERS.xlsx (Primary Source: MySQL)"
          >
            <FileSpreadsheet size={13} className={excelLoading ? 'animate-bounce' : 'text-emerald-700'} />
            <span>AGVIA_ORDERS.xlsx</span>
          </button>

          {/* Regenerate Excel from MySQL */}
          <button
            onClick={handleRegenerateExcel}
            disabled={regeneratingExcel}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-[#C9A45C]/35 bg-[#FFFDF8] hover:border-[#5A1020] text-[#5A1020] text-xs font-bold uppercase tracking-wider transition-all shadow-2xs touch-target"
            title="Force Regenerate AGVIA_ORDERS.xlsx from MySQL Database"
          >
            <Database size={13} className={regeneratingExcel ? 'animate-spin text-[#C9A45C]' : 'text-[#C9A45C]'} />
            <span className="hidden md:inline">Regen Excel</span>
          </button>

          {/* Live Sync Indicator */}
          <button
            onClick={() => setLiveSync(!liveSync)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all touch-target ${
              liveSync
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-gray-100 border-gray-200 text-gray-500'
            }`}
          >
            <Radio size={12} className={liveSync ? 'animate-pulse text-emerald-600' : ''} />
            <span className="hidden xs:inline">{liveSync ? 'Live Sync: ON' : 'Live Sync: OFF'}</span>
          </button>

          <button
            onClick={() => loadOrders(false)}
            disabled={loading}
            className="btn-outline !py-2 !px-3 sm:!px-4 text-xs font-bold tracking-widest flex items-center gap-1.5 touch-target"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> 
            <span className="hidden sm:inline">Sync Now</span>
          </button>
        </div>
      </div>

      {/* Multi-faceted Search & Operational Filter Bar */}
      <div className="bg-white border border-[#C9A45C]/20 rounded-2xl p-4 shadow-sm mb-4 space-y-3 font-body">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Keyword Search */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Search Orders</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Order ID, patron, phone, email..."
              className="w-full px-3 py-1.5 rounded-xl border border-[#C9A45C]/30 text-xs focus:outline-none focus:border-[#5A1020]"
            />
          </div>

          {/* Payment Method Filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-[#C9A45C]/30 text-xs bg-white focus:outline-none focus:border-[#5A1020]"
            >
              <option value="ALL">All Methods (COD & Online)</option>
              <option value="COD">Cash on Delivery (COD)</option>
              <option value="RAZORPAY">Razorpay / Online</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Payment Status</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-[#C9A45C]/30 text-xs bg-white focus:outline-none focus:border-[#5A1020]"
            >
              <option value="ALL">All Payment States</option>
              <option value="SUCCESS">Success / Collected</option>
              <option value="PENDING">Pending Verification</option>
              <option value="FAILED">Failed / Declined</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-[#C9A45C]/30 text-xs bg-white focus:outline-none focus:border-[#5A1020]"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today's Orders</option>
              <option value="YESTERDAY">Yesterday's Orders</option>
              <option value="7DAYS">Last 7 Days</option>
              <option value="30DAYS">Last 30 Days</option>
              <option value="CUSTOM">📅 Custom Calendar Range</option>
            </select>
          </div>

          {/* Custom Calendar Date Pickers */}
          {dateFilter === 'CUSTOM' && (
            <div className="col-span-full bg-[#FAF7F2] p-3 rounded-xl border border-[#C9A45C]/30 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#5A1020] text-white flex items-center justify-center">
                  <Calendar size={14} />
                </div>
                <span className="text-xs font-bold text-[#5A1020]">Select Calendar Window:</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-[#211D1E]/60">Start Date:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1 text-xs border rounded-lg bg-white border-[#C9A45C]/40 text-[#211D1E] focus:outline-none focus:border-[#5A1020]"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-[#211D1E]/60">End Date:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1 text-xs border rounded-lg bg-white border-[#C9A45C]/40 text-[#211D1E] focus:outline-none focus:border-[#5A1020]"
                  />
                </div>
                {(customStartDate || customEndDate) && (
                  <button
                    type="button"
                    onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                    className="text-[10px] font-bold text-[#5A1020] uppercase underline hover:text-[#8B0000]"
                  >
                    Reset Dates
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#C9A45C]/15 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A45C] shrink-0 mr-1 flex items-center gap-1">
              <Filter size={12} /> Status:
            </span>
            {['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all whitespace-nowrap touch-target ${
                  statusFilter === st
                    ? 'bg-[#5A1020] text-[#FAF7F2] shadow-xs'
                    : 'bg-[#FAF7F2] border border-[#C9A45C]/20 text-[#211D1E]/70 hover:bg-white hover:text-[#5A1020]'
                }`}
              >
                {st} {st !== 'ALL' && `(${orders.filter(o => String(o.status || '').toUpperCase() === st).length})`}
              </button>
            ))}
          </div>

          {(searchTerm || statusFilter !== 'ALL' || paymentMethodFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || dateFilter !== 'ALL' || customStartDate || customEndDate) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('ALL')
                setPaymentMethodFilter('ALL')
                setPaymentStatusFilter('ALL')
                setDateFilter('ALL')
                setCustomStartDate('')
                setCustomEndDate('')
              }}
              className="text-[10px] font-bold text-[#5A1020] hover:text-[#C9A45C] underline uppercase tracking-wider whitespace-nowrap"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-[#211D1E]/60 font-body mb-3 select-none flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#5A1020] bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#C9A45C]/20 flex items-center gap-1">
            <Calendar size={11} className="text-[#C9A45C]" />
            {dateFilter === 'ALL' && 'All-Time Records'}
            {dateFilter === 'TODAY' && "Today's Orders"}
            {dateFilter === 'YESTERDAY' && "Yesterday's Orders"}
            {dateFilter === '7DAYS' && 'Last 7 Days'}
            {dateFilter === '30DAYS' && 'Last 30 Days'}
            {dateFilter === 'CUSTOM' && (
              customStartDate || customEndDate
                ? `${customStartDate || 'Any'} to ${customEndDate || 'Today'}`
                : 'Pick Custom Calendar Dates'
            )}
          </span>
          <span>({filteredOrders.length} orders shown)</span>
        </div>
        <span className="font-mono text-[#211D1E]/40">
          Last updated: {lastSyncTime.toLocaleTimeString()}
        </span>
      </div>

      {loading ? (
        <div className="py-20 text-center font-body text-xs text-[#211D1E]/50 animate-pulse">
          Connecting to atelier order dispatch queue...
        </div>
      ) : error ? (
        <div className="py-16 text-center font-body text-sm text-red-600 font-semibold border border-red-200 bg-red-50/50 rounded-3xl p-6">
          <p className="mb-3">{error}</p>
          <button onClick={() => loadOrders(false)} className="btn-primary text-xs">Retry Connection</button>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          rows={filteredOrders} 
          title="Atelier Dispatches"
          emptyMessage="No customer orders recorded in this filter view."
          exportFilename="agvia_atelier_orders"
        />
      )}

      {/* Parcel Packing Slip & Receipt Modal with Unique QR */}
      <ParcelReceiptModal
        order={selectedReceiptOrder}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </AdminLayout>
  )
}
