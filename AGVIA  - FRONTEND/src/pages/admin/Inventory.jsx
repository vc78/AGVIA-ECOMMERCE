import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import DataTable from '../../components/admin/DataTable'
import { adminService } from '../../services/adminService'
import { RefreshCw, AlertTriangle, CheckCircle2, PackageCheck } from 'lucide-react'

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

  const columns = [
    {
      key: 'image',
      label: '',
      render: (r) => (
        <img
          src={r.image || '/images/classic_silk_saree.jpg'}
          alt={r.name}
          className="w-10 h-14 rounded-lg object-cover border border-[#C9A45C]/20 shadow-sm"
          onError={(e) => { e.target.src = '/images/classic_silk_saree.jpg' }}
        />
      ),
    },
    {
      key: 'name',
      label: 'Couture Silhouette',
      render: (r) => (
        <div>
          <span className="font-serif font-semibold text-[#5A1020] text-sm block">{r.name}</span>
          <span className="text-[10px] text-[#211D1E]/40 font-mono">SKU: {r.sku}</span>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Couture Line',
      render: (r) => (
        <span className="text-xs text-[#211D1E]/70 font-semibold">{r.category}</span>
      )
    },
    {
      key: 'stock',
      label: 'Current Inventory Level',
      render: (r) => (
        <div className="flex items-center gap-2">
          <input
            type="number"
            defaultValue={r.stock}
            min="0"
            onBlur={(e) => {
              if (Number(e.target.value) !== r.stock) {
                handleUpdate(r.id, e.target.value)
              }
            }}
            className="w-24 px-3 py-1.5 rounded-xl border border-[#C9A45C]/30 bg-white text-[#211D1E] font-semibold focus:outline-none focus:border-[#5A1020] focus:ring-1 focus:ring-[#5A1020] text-xs font-mono"
          />
          <span className="text-[10px] text-[#211D1E]/50">{r.unit || 'piece'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Inventory Health',
      render: (r) => (
        r.stock <= (r.lowStockThreshold || 10) ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-red-50 text-red-700 border-red-200">
            <AlertTriangle size={10} /> Low Stock Alert
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 size={10} /> In Stock ({r.stock})
          </span>
        )
      ),
    },
  ]

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 select-none font-body">
        <div>
          <h2 className="font-serif text-3xl font-bold text-[#5A1020]">Atelier Inventory & Stock Control</h2>
          <p className="text-xs text-[#211D1E]/60 mt-1">Real-time atelier inventory levels, unit management, and low stock threshold alerts.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="btn-outline !py-2.5 !px-4 text-xs font-bold tracking-widest flex items-center gap-2"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Sync Inventory
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#211D1E]/50 animate-pulse font-body">
          Synchronizing atelier inventory balances...
        </div>
      ) : (
        <DataTable columns={columns} rows={inventory} emptyMessage="No inventory records found in atelier catalogue." />
      )}
    </AdminLayout>
  )
}
