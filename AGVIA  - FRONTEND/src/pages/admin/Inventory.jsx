import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import DataTable from '../../components/admin/DataTable'
import { adminService } from '../../services/adminService'
import { exportInventoryPDF } from '../../utils/pdfExportUtils'
import { RefreshCw, AlertTriangle, CheckCircle2, FileText } from 'lucide-react'

export default function Inventory() {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    adminService.getInventory()
      .then(setInventory)
      .catch((err) => {
        console.error(err)
        toast.error('Failed to load atelier inventory.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleUpdate = async (id, value) => {
    const stock = Number(value)
    if (Number.isNaN(stock) || stock < 0) {
      toast.error('Stock must be a valid non-negative number.')
      return
    }
    try {
      await adminService.updateStock(id, stock)
      setInventory((list) => list.map((i) => (i.id === id ? { ...i, stock } : i)))
      toast.success('Atelier stock level updated successfully', {
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to update stock in database.')
    }
  }

  const handleExport = async () => {
    if (inventory.length === 0) {
      toast.error('No inventory records available to export.')
      return
    }
    toast.loading('Generating branded inventory PDF...', { id: 'inv-pdf' })
    try {
      await exportInventoryPDF(inventory)
      toast.success(`Exported ${inventory.length} inventory records to branded PDF!`, {
        id: 'inv-pdf',
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF document.', { id: 'inv-pdf' })
    }
  }

  const columns = [
    {
      key: 'image',
      label: 'Photo',
      render: (r) => (
        <img
          src={(r.image || '/images/classic_silk_saree.jpg').replace(/\.(jpg|jpeg|png)$/i, '-400.webp')}
          alt={r.name}
          width={40}
          height={56}
          loading="lazy"
          decoding="async"
          className="w-10 h-14 rounded-xl object-cover border border-[#C9A45C]/25 shadow-2xs"
          onError={(e) => { e.target.src = '/images/classic_silk_saree-400.webp' }}
        />
      ),
    },
    {
      key: 'name',
      label: 'Couture Silhouette',
      render: (r) => (
        <div className="min-w-[140px]">
          <span className="font-serif font-bold text-[#5A1020] text-xs sm:text-sm block">{r.name}</span>
          <span className="text-[10px] text-[#211D1E]/40 font-mono">SKU: {r.sku}</span>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Couture Line',
      render: (r) => (
        <span className="text-xs text-[#211D1E]/75 font-semibold whitespace-nowrap">{r.category}</span>
      )
    },
    {
      key: 'stock',
      label: 'Inventory Count',
      render: (r) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <input
            type="number"
            defaultValue={r.stock}
            min="0"
            onBlur={(e) => {
              if (Number(e.target.value) !== r.stock) {
                handleUpdate(r.id, e.target.value)
              }
            }}
            className="w-20 sm:w-24 px-2.5 py-1.5 rounded-xl border border-[#C9A45C]/35 bg-white text-[#211D1E] font-bold focus:outline-none focus:border-[#5A1020] focus:ring-1 focus:ring-[#5A1020] text-xs font-mono touch-target"
          />
          <span className="text-[10px] text-[#211D1E]/50">{r.unit || 'piece'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Inventory Health',
      render: (r) => (
        <div className="whitespace-nowrap">
          {r.stock <= (r.lowStockThreshold || 10) ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-red-50 text-red-700 border-red-200">
              <AlertTriangle size={10} /> Low Stock Alert ({r.stock})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 size={10} /> Optimal ({r.stock})
            </span>
          )}
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 select-none font-body">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A1020]">Inventory & Stock Control</h2>
          <p className="text-xs text-[#211D1E]/60 mt-1">Real-time atelier inventory levels, unit management, and low stock threshold alerts.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Export Inventory Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#C9A45C]/40 bg-[#FFFDF8] hover:bg-[#5A1020] text-[#5A1020] hover:text-white text-xs font-bold uppercase tracking-wider transition-all shadow-2xs touch-target"
            title="Download Branded Inventory PDF"
          >
            <FileText size={13} className="text-[#C9A45C]" />
            <span>Export Stock (PDF)</span>
          </button>

          <button
            onClick={load}
            disabled={loading}
            className="btn-outline !py-2 !px-3 sm:!px-4 text-xs font-bold tracking-widest flex items-center gap-1.5 touch-target"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> 
            <span className="hidden sm:inline">Sync Inventory</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#211D1E]/50 animate-pulse font-body">
          Synchronizing atelier inventory balances...
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          rows={inventory} 
          title="Atelier Fabric & Stock"
          emptyMessage="No inventory records found in atelier catalogue." 
          exportFilename="agvia_fabric_inventory"
        />
      )}
    </AdminLayout>
  )
}
