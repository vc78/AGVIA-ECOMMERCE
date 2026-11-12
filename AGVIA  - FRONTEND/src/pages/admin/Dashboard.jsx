import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { IndianRupee, ShoppingBag, Users, Package, RefreshCw, Radio, FileText, QrCode, Printer, Download, Clock, AlertTriangle, AlertCircle, CreditCard, Banknote, ArrowRight, Receipt } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import StatCard from '../../components/admin/StatCard'
import SalesChart from '../../components/admin/SalesChart'
import DataTable from '../../components/admin/DataTable'
import { adminService } from '../../services/adminService'
import { adminWebSocket } from '../../services/adminWebSocket'
import { exportOrdersPDF, exportOrderParcelReceiptPDF } from '../../utils/pdfExportUtils'
import ParcelReceiptModal from '../../components/admin/ParcelReceiptModal'
import toast from 'react-hot-toast'

const INITIAL_STATS = {
  totalRevenue: 0,
  totalOrders: 0,
  totalCustomers: 0,
  totalProducts: 25,
  todaySales: 0,
  pendingPayments: 0,
  codOrders: 0,
  onlinePayments: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  salesTrend: [
    { month: 'Apr', sales: 48000 },
    { month: 'May', sales: 67000 },
    { month: 'Jun', sales: 54000 },
    { month: 'Jul', sales: 89000 },
    { month: 'Aug', sales: 112000 },
    { month: 'Sep', sales: 95000 },
  ],
  recentOrders: []
}

export default function Dashboard() {
  const [stats, setStats] = useState(INITIAL_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [liveSync, setLiveSync] = useState(true)
  const [lastSyncTime, setLastSyncTime] = useState(new Date())
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [downloadingReceiptId, setDownloadingReceiptId] = useState(null)
  const pollRef = useRef(null)

  const loadStats = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await adminService.getDashboardStats()
      if (data && typeof data === 'object') {
        setStats(prev => ({
          ...prev,
          ...data,
          salesTrend: Array.isArray(data.salesTrend) && data.salesTrend.length > 0 ? data.salesTrend : prev.salesTrend,
          recentOrders: Array.isArray(data.recentOrders) ? data.recentOrders : []
        }))
      }
      setError(null)
      setLastSyncTime(new Date())
    } catch (err) {
      console.error('[Dashboard.loadStats] Error:', err)
      if (!silent) {
        setError('Failed to load dashboard metrics. Please verify backend connection.')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()

    // Real-time authoritative live update: refetch stats instantly on order / revenue events
    let unsubscribe = () => {}
    try {
      if (adminWebSocket && typeof adminWebSocket.subscribe === 'function') {
        unsubscribe = adminWebSocket.subscribe((event) => {
          if (
            event?.type === 'NEW_ORDER' ||
            event?.type === 'PAYMENT_RECEIVED' ||
            event?.type === 'ORDER_CANCELLED' ||
            event?.type === 'ORDER_STATUS_CHANGED'
          ) {
            loadStats(true)
          }
        })
      }
    } catch (err) {
      console.warn('[Dashboard] WebSocket subscription fallback:', err)
    }

    return () => {
      try { unsubscribe() } catch (e) {}
    }
  }, [])

  useEffect(() => {
    if (liveSync) {
      pollRef.current = setInterval(() => {
        loadStats(true)
      }, 12000)
    } else {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [liveSync])

  const handleExportRecentOrders = async () => {
    const ordersToExport = stats?.recentOrders || []
    if (ordersToExport.length === 0) {
      toast.error('No recent orders available to export.')
      return
    }
    toast.loading('Generating orders PDF report...', { id: 'dash-pdf' })
    try {
      await exportOrdersPDF(ordersToExport)
      toast.success(`Exported ${ordersToExport.length} recent orders to branded PDF!`, {
        id: 'dash-pdf',
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF document.', { id: 'dash-pdf' })
    }
  }

  const handleDownloadRecentReceipt = async (order) => {
    if (!order) return
    try {
      const orderIdentifier = order.backendId || order.id
      setDownloadingReceiptId(orderIdentifier)
      const trackingRef = order.orderNumber || order.id
      toast.loading(`Compiling parcel slip with QR for ${trackingRef}...`, { id: `dash-receipt-${orderIdentifier}` })

      let fullOrder = order
      if ((!order.itemsList || order.itemsList.length === 0 || !order.shippingAddress) && order.backendId) {
        try {
          const fetched = await adminService.getOrderById(order.backendId)
          if (fetched) fullOrder = fetched
        } catch (e) {
          console.warn('Could not fetch full order details, falling back:', e)
        }
      }

      await exportOrderParcelReceiptPDF(fullOrder)
      toast.success(`Parcel slip with unique QR downloaded for ${trackingRef}!`, {
        id: `dash-receipt-${orderIdentifier}`,
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate parcel receipt PDF.', { id: `dash-receipt-${order.backendId || order.id}` })
    } finally {
      setDownloadingReceiptId(null)
    }
  }

  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (r) => <span className="font-mono font-bold text-xs text-[#5A1020] whitespace-nowrap">{r?.id || '—'}</span>
    },
    { 
      key: 'customer', 
      label: 'Patron',
      render: (r) => <span className="font-bold text-xs text-[#211D1E] whitespace-nowrap block truncate max-w-[120px]">{r?.customer || 'Guest'}</span>
    },
    {
      key: 'total',
      label: 'Total',
      render: (r) => <span className="font-bold text-[#5A1020] whitespace-nowrap text-xs">₹{Number(r?.total || 0).toLocaleString('en-IN')}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
          {r?.status || 'PENDING'}
        </span>
      )
    },
    {
      key: 'receipt',
      label: 'Parcel Slip',
      render: (r) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <button
            onClick={() => handleDownloadRecentReceipt(r)}
            disabled={downloadingReceiptId === (r?.backendId || r?.id)}
            title="Download Shipping Label & Receipt (PDF with Unique QR to paste on parcel)"
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[#C9A45C]/40 bg-[#FFFDF8] hover:bg-[#5A1020] text-[#5A1020] hover:text-[#FAF7F2] text-[10px] font-bold transition-all shadow-2xs group touch-target"
          >
            <QrCode size={11} className="text-[#C9A45C] group-hover:text-[#FAF7F2] transition-colors" />
            <Download size={10} className={downloadingReceiptId === (r?.backendId || r?.id) ? 'animate-bounce' : ''} />
            <span>Slip</span>
          </button>
          <button
            onClick={() => {
              setSelectedReceiptOrder(r)
              setIsReceiptModalOpen(true)
            }}
            title="Preview & Print Parcel Label"
            className="p-1 rounded-lg border border-[#C9A45C]/30 bg-white hover:border-[#5A1020] text-[#211D1E]/70 hover:text-[#5A1020] hover:bg-[#5A1020]/5 transition-all touch-target"
          >
            <Printer size={11} />
          </button>
        </div>
      )
    }
  ]

  const s = stats || INITIAL_STATS
  const lowStock = Number(s.lowStockCount || 0)
  const outOfStock = Number(s.outOfStockCount || 0)

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 select-none font-body">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A1020]">Atelier Overview</h2>
          <p className="text-xs text-[#211D1E]/60 mt-1">Real-time boutique metrics, patron activity, and atelier order performance.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* In-Store POS Quick Billing */}
          <Link
            to="/admin/pos"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5A1020] hover:bg-[#72152b] text-[#FAF7F2] border border-[#C9A45C]/60 text-xs font-bold uppercase tracking-wider transition-all shadow-sm touch-target"
            title="Create In-Store POS Bill for Walk-in Customer"
          >
            <Receipt size={14} className="text-[#C9A45C]" />
            <span>Store POS & Billing</span>
          </Link>

          {/* Quick Export Button */}
          <button
            onClick={handleExportRecentOrders}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#C9A45C]/40 bg-[#FFFDF8] hover:bg-[#5A1020] text-[#5A1020] hover:text-white text-xs font-bold uppercase tracking-wider transition-all shadow-2xs touch-target"
            title="Download Recent Orders PDF"
          >
            <FileText size={13} className="text-[#C9A45C]" />
            <span>Export Orders (PDF)</span>
          </button>

          <button
            onClick={() => setLiveSync(!liveSync)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all touch-target ${
              liveSync
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-gray-100 border-gray-200 text-gray-500'
            }`}
          >
            <Radio size={12} className={liveSync ? 'animate-pulse text-emerald-600' : ''} />
            <span className="hidden xs:inline">{liveSync ? 'Live: ON' : 'Live: OFF'}</span>
          </button>

          <button
            onClick={() => loadStats(false)}
            disabled={loading}
            className="btn-outline !py-2 !px-3 sm:!px-4 text-xs font-bold tracking-widest flex items-center gap-1.5 touch-target"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> 
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="text-[10px] text-[#211D1E]/40 font-mono mb-3 text-right select-none">
        Metrics synchronized: {lastSyncTime.toLocaleTimeString()}
      </div>

      {loading && (!stats || stats === INITIAL_STATS) ? (
        <div className="py-20 text-center font-body text-xs text-[#211D1E]/50 animate-pulse">
          Retrieving live atelier metrics...
        </div>
      ) : error ? (
        <div className="py-16 text-center font-body text-sm text-red-600 font-semibold border border-red-200/20 bg-red-50/10 rounded-3xl p-6">
          <p className="mb-3">{error}</p>
          <button onClick={() => loadStats(false)} className="btn-primary text-xs">Reconnect</button>
        </div>
      ) : (
        <>
          {/* Actionable Inventory Alert Banners */}
          {(lowStock > 0 || outOfStock > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 select-none font-body">
              {outOfStock > 0 && (
                <div className="flex items-center justify-between p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-800">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle size={18} className="text-red-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold font-serif">{outOfStock} Silhouettes Out of Stock</p>
                      <p className="text-[10px] text-red-700/80">Customers cannot purchase these pieces until restocked.</p>
                    </div>
                  </div>
                  <Link
                    to="/admin/inventory?filter=out"
                    className="flex items-center gap-1 px-3 py-1 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold rounded-xl transition-all shadow-xs shrink-0"
                  >
                    <span>Restock</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              )}

              {lowStock > 0 && (
                <div className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold font-serif">{lowStock} Silhouettes Low on Stock</p>
                      <p className="text-[10px] text-amber-800/80">Inventory count has reached the defined minimum threshold.</p>
                    </div>
                  </div>
                  <Link
                    to="/admin/inventory?filter=low"
                    className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-xs shrink-0"
                  >
                    <span>View Low Stock</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Primary Revenue & Operational KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 font-body">
            <StatCard 
              label="Total Revenue" 
              value={`₹${Number(s.totalRevenue || 0).toLocaleString('en-IN')}`} 
              icon={IndianRupee} 
              trend="+14% this month" 
            />
            <StatCard 
              label="Today's Sales" 
              value={`₹${Number(s.todaySales || 0).toLocaleString('en-IN')}`} 
              icon={IndianRupee} 
              trend="Gross orders today" 
            />
            <StatCard 
              label="Atelier Orders" 
              value={Number(s.totalOrders || 0)} 
              icon={ShoppingBag} 
              trend="Total lifetime orders" 
            />
            <StatCard 
              label="Registered Patrons" 
              value={Number(s.totalCustomers || 0)} 
              icon={Users} 
              trend="Loyal clientele" 
            />
          </div>

          {/* Secondary Operational Breakdown */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 font-body">
            <StatCard 
              label="COD Orders" 
              value={Number(s.codOrders ?? 0)} 
              icon={Banknote} 
              trend="Doorstep settlement" 
            />
            <StatCard 
              label="Online Payments" 
              value={Number(s.onlinePayments ?? 0)} 
              icon={CreditCard} 
              trend="Gateway prepaid" 
            />
            <StatCard 
              label="Pending Payments" 
              value={Number(s.pendingPayments ?? 0)} 
              icon={Clock} 
              trend="Awaiting clearance" 
            />
            <StatCard 
              label="Active Silhouettes" 
              value={Number(s.totalProducts || 25)} 
              icon={Package} 
              trend="Live atelier catalog" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 font-body">
            <div className="lg:col-span-2 min-w-0">
              <SalesChart data={s.salesTrend || []} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-between mb-3 select-none">
                <h3 className="font-serif text-base sm:text-lg text-[#5A1020] font-bold uppercase tracking-wider">
                  Recent Orders
                </h3>
                <button
                  onClick={handleExportRecentOrders}
                  className="text-[10px] font-bold text-[#5A1020] hover:text-[#C9A45C] transition-colors"
                >
                  Export →
                </button>
              </div>
              <DataTable 
                columns={columns} 
                rows={s.recentOrders || []} 
                emptyMessage="No recent transactions." 
                exportFilename="agvia_recent_orders"
                searchable={false}
              />
            </div>
          </div>
        </>
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
