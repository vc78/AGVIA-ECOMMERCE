import { useEffect, useState, useRef } from 'react'
import { IndianRupee, ShoppingBag, Users, Package, RefreshCw, Radio, FileText } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import StatCard from '../../components/admin/StatCard'
import SalesChart from '../../components/admin/SalesChart'
import DataTable from '../../components/admin/DataTable'
import { adminService } from '../../services/adminService'
import { exportOrdersPDF } from '../../utils/pdfExportUtils'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [liveSync, setLiveSync] = useState(true)
  const [lastSyncTime, setLastSyncTime] = useState(new Date())
  const pollRef = useRef(null)

  const loadStats = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await adminService.getDashboardStats()
      setStats(data)
      setError(null)
      setLastSyncTime(new Date())
    } catch (err) {
      console.error(err)
      if (!silent) {
        setError('Failed to load dashboard metrics. Please verify backend connection.')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
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
    if (!stats?.recentOrders || stats.recentOrders.length === 0) {
      toast.error('No recent orders available to export.')
      return
    }
    toast.loading('Generating orders PDF report...', { id: 'dash-pdf' })
    try {
      await exportOrdersPDF(stats.recentOrders)
      toast.success(`Exported ${stats.recentOrders.length} recent orders to branded PDF!`, {
        id: 'dash-pdf',
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF document.', { id: 'dash-pdf' })
    }
  }

  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (r) => <span className="font-mono font-bold text-xs text-[#5A1020] whitespace-nowrap">{r.id}</span>
    },
    { 
      key: 'customer', 
      label: 'Patron',
      render: (r) => <span className="font-bold text-xs text-[#211D1E] whitespace-nowrap block truncate max-w-[120px]">{r.customer}</span>
    },
    {
      key: 'total',
      label: 'Total',
      render: (r) => <span className="font-bold text-[#5A1020] whitespace-nowrap text-xs">₹{Number(r.total).toLocaleString('en-IN')}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
          {r.status}
        </span>
      )
    },
  ]

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 select-none font-body">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A1020]">Atelier Overview</h2>
          <p className="text-xs text-[#211D1E]/60 mt-1">Real-time boutique metrics, patron activity, and atelier order performance.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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

      {loading ? (
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
          {/* Responsive KPI Grid: 2 cols on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 font-body">
            <StatCard 
              label="Total Revenue" 
              value={`₹${Number(stats.totalRevenue).toLocaleString('en-IN')}`} 
              icon={IndianRupee} 
              trend="+14% this month" 
            />
            <StatCard 
              label="Atelier Orders" 
              value={stats.totalOrders} 
              icon={ShoppingBag} 
              trend="Active couture bookings" 
            />
            <StatCard 
              label="Registered Patrons" 
              value={stats.totalCustomers} 
              icon={Users} 
              trend="Loyal clientele" 
            />
            <StatCard 
              label="Active Silhouettes" 
              value={stats.totalProducts} 
              icon={Package} 
              trend="Live atelier collection" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 font-body">
            <div className="lg:col-span-2">
              <SalesChart data={stats.salesTrend} />
            </div>
            <div>
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
                rows={stats.recentOrders} 
                emptyMessage="No recent transactions." 
                exportFilename="agvia_recent_orders"
                searchable={false}
              />
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
