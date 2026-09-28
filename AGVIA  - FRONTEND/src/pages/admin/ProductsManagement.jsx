import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Pencil, Trash2, PlusSquare, RefreshCw, Download, FileText } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import DataTable from '../../components/admin/DataTable'
import { adminService } from '../../services/adminService'
import { exportProductsPDF } from '../../utils/pdfExportUtils'


export default function ProductsManagement() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    adminService.getProducts()
      .then(setProducts)
      .catch((err) => {
        console.error(err)
        toast.error('Failed to load atelier collection.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate "${name}" from the atelier catalogue?`)) return
    try {
      await adminService.deleteProduct(id)
      toast.success('Silhouette deactivated successfully', {
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
      setProducts((p) => p.filter((prod) => prod.id !== id))
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete silhouette.')
    }
  }

  const handleExport = async () => {
    if (products.length === 0) {
      toast.error('No products available to export.')
      return
    }
    try {
      toast.loading('Compiling luxury catalogue PDF...', { id: 'pdf-prods' })
      await exportProductsPDF(products)
      toast.success(`Exported ${products.length} silhouettes to official PDF!`, {
        id: 'pdf-prods',
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to export catalog PDF.', { id: 'pdf-prods' })
    }
  }

  const columns = [
    {
      key: 'image',
      label: 'Photo',
      render: (r) => (
        <img
          src={r.image || '/images/classic_silk_saree.jpg'}
          alt={r.name}
          className="w-10 h-14 sm:w-12 sm:h-16 rounded-xl object-cover border border-[#C9A45C]/25 shadow-2xs"
          onError={(e) => { e.target.src = '/images/classic_silk_saree.jpg' }}
        />
      ),
    },
    {
      key: 'name',
      label: 'Silhouette Name',
      render: (r) => (
        <div className="min-w-[140px]">
          <span className="font-serif font-bold text-[#5A1020] text-xs sm:text-sm block">{r.name}</span>
          {r.sku && <span className="text-[10px] text-[#211D1E]/45 font-mono">SKU: {r.sku}</span>}
        </div>
      ),
    },
    { 
      key: 'category', 
      label: 'Couture Line',
      render: (r) => <span className="text-xs text-[#211D1E]/75 font-semibold whitespace-nowrap">{r.category}</span>
    },
    {
      key: 'price',
      label: 'Pricing',
      render: (r) => (
        <div className="whitespace-nowrap">
          <span className="font-bold text-[#5A1020] text-xs sm:text-sm">₹{r.price?.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-[#211D1E]/50 ml-1">/ {r.unit || 'piece'}</span>
          {r.discountPrice && (
            <span className="block text-[10px] text-emerald-700 font-bold">Offer: ₹{r.discountPrice?.toLocaleString('en-IN')}</span>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stock Status',
      render: (r) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
          Number(r.stock) > 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {r.stock} in stock
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Link
            to={`/admin/products/edit/${r.id}`}
            className="w-8 h-8 rounded-xl bg-[#C9A45C]/15 text-[#5A1020] hover:bg-[#5A1020] hover:text-white border border-[#C9A45C]/30 transition-all flex items-center justify-center touch-target"
            title="Edit Silhouette"
          >
            <Pencil size={13} />
          </Link>
          <button
            onClick={() => handleDelete(r.id, r.name)}
            className="w-8 h-8 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 transition-all flex items-center justify-center touch-target"
            title="Deactivate Silhouette"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 select-none font-body">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A1020]">Atelier Catalogue</h2>
          <p className="text-xs text-[#211D1E]/60 mt-1">Manage luxury garments, sarees, and couture in the AGVIA collection.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Export Collection Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#C9A45C]/40 bg-[#FFFDF8] hover:bg-[#5A1020] text-[#5A1020] hover:text-white text-xs font-bold uppercase tracking-wider transition-all shadow-2xs touch-target"
            title="Download Luxury Catalogue PDF"
          >
            <FileText size={13} />
            <span>Export Catalog (PDF)</span>
          </button>

          <button
            onClick={load}
            disabled={loading}
            className="btn-outline !py-2 !px-3 sm:!px-4 text-xs font-bold tracking-widest flex items-center gap-1.5 touch-target"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> 
            <span className="hidden sm:inline">Sync</span>
          </button>

          <Link
            to="/admin/products/add"
            className="btn-primary !py-2 !px-4 text-xs tracking-wider uppercase flex items-center gap-1.5 touch-target"
          >
            <PlusSquare size={14} className="shrink-0" /> 
            <span>Add Silhouette</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#211D1E]/50 animate-pulse font-body">
          Syncing atelier collection...
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          rows={products} 
          title="Active Atelier Silhouettes"
          emptyMessage="No silhouettes yet — add your first couture piece."
          exportFilename="agvia_couture_collection"
        />
      )}
    </AdminLayout>
  )
}
