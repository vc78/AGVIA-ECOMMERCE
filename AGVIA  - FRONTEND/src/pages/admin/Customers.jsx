import { useEffect, useState, useCallback, useRef } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import DataTable from '../../components/admin/DataTable'
import { adminService } from '../../services/adminService'
import { exportCustomersPDF } from '../../utils/pdfExportUtils'
import { Download, FileText, Users, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const POLL_INTERVAL = 15000 // 15 seconds

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const intervalRef = useRef(null)

  const fetchCustomers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setIsRefreshing(true)
    try {
      const data = await adminService.getCustomers()
      setCustomers(data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      console.error(err)
      if (!silent) setError('Failed to load customers. Please verify backend connection.')
    } finally {
      if (!silent) setLoading(false)
      else setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers(false)

    intervalRef.current = setInterval(() => {
      fetchCustomers(true)
    }, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchCustomers])

  const handleExportCustomers = async () => {
    if (customers.length === 0) {
      toast.error('No patron records available to export.')
      return
    }
    try {
      toast.loading('Compiling luxury patron directory PDF...', { id: 'pdf-customers' })
      await exportCustomersPDF(customers)
      toast.success(`Exported ${customers.length} patrons to official PDF!`, {
        id: 'pdf-customers',
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to export patrons PDF.', { id: 'pdf-customers' })
    }
  }

  const columns = [
    { 
      key: 'name', 
      label: 'Patron Name',
      render: (r) => <span className="font-bold text-xs text-[#5A1020]">{r.name}</span>
    },
    { 
      key: 'email', 
      label: 'Email',
      render: (r) => <span className="text-xs text-[#211D1E]/70 font-mono">{r.email}</span>
    },
    {
      key: 'phone', 
      label: 'Contact',
      render: (r) => r.phone ? <span className="font-mono text-xs">{r.phone}</span> : <span className="text-[#211D1E]/30 italic text-xs">—</span>
    },
    {
      key: 'orders', 
      label: 'Orders',
      render: (r) => (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#C9A45C]/15 text-[#5A1020] font-bold text-xs">
          {r.orders}
        </span>
      )
    },
    {
      key: 'spent', 
      label: 'Lifetime Spend',
      render: (r) => (
        <span className="font-bold text-emerald-700 text-xs">
          ₹{(r.spent || 0).toLocaleString('en-IN')}
        </span>
      )
    },
    { 
      key: 'joined', 
      label: 'Member Since',
      render: (r) => <span className="text-xs text-[#211D1E]/60">{r.joined || '—'}</span>
    },
    {
      key: 'status', 
      label: 'Client Tier',
      render: (r) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
          r.orders > 0
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {r.orders > 0 ? 'Active Patron' : 'New Client'}
        </span>
      )
    },
  ]

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 select-none font-body">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A1020]">Patron & Client Directory</h2>
          <p className="text-xs text-[#211D1E]/60 mt-1">
            Register of AGVIA atelier patrons, lifetime wardrobe purchases, and account details.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Export Button */}
          <button
            onClick={handleExportCustomers}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#C9A45C]/40 bg-[#FFFDF8] hover:bg-[#5A1020] text-[#5A1020] hover:text-white text-xs font-bold uppercase tracking-wider transition-all shadow-2xs touch-target"
            title="Download Luxury Patrons PDF"
          >
            <FileText size={13} />
            <span>Export Patrons (PDF)</span>
          </button>

          <button
            onClick={() => fetchCustomers(true)}
            disabled={isRefreshing}
            className="btn-outline !py-2 !px-3 sm:!px-4 text-xs font-bold tracking-widest flex items-center gap-1.5 touch-target"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards (Responsive grid on mobile) */}
      {!loading && !error && customers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 font-body">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#C9A45C]/20 p-4 sm:p-5 shadow-sm">
            <p className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider mb-1">Total Patrons</p>
            <p className="text-2xl font-serif font-bold text-[#5A1020]">{customers.length}</p>
          </div>
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#C9A45C]/20 p-4 sm:p-5 shadow-sm">
            <p className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider mb-1">Active Wardrobe Buyers</p>
            <p className="text-2xl font-serif font-bold text-emerald-700">
              {customers.filter(c => c.orders > 0).length}
            </p>
          </div>
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#C9A45C]/20 p-4 sm:p-5 shadow-sm">
            <p className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider mb-1">Cumulative Wardrobe Spend</p>
            <p className="text-2xl font-serif font-bold text-[#5A1020]">
              ₹{customers.reduce((s, c) => s + (c.spent || 0), 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center font-body text-xs text-[#211D1E]/50 animate-pulse">
          Loading atelier patron directory…
        </div>
      ) : error ? (
        <div className="py-16 text-center font-body text-sm text-red-600 font-semibold border border-red-200/20 bg-red-50/10 rounded-3xl p-6">
          {error}
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          rows={customers} 
          title="Registered Patrons"
          emptyMessage="No customers registered yet." 
          exportFilename="agvia_patrons_directory"
        />
      )}
    </AdminLayout>
  )
}
