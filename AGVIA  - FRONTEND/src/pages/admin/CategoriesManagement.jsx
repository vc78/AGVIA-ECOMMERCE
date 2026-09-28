import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import DataTable from '../../components/admin/DataTable'
import { adminService } from '../../services/adminService'
import { exportTableToPDF } from '../../utils/pdfExportUtils'
import toast from 'react-hot-toast'
import { Trash2, RefreshCw, Layers, FileText } from 'lucide-react'

export default function CategoriesManagement() {
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await adminService.getCategories()
      setCats(data.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description || '—',
        count: c.productCount ?? 0,
        active: c.active ? 'Active' : 'Inactive'
      })))
    } catch (err) {
      console.error(err)
      toast.error('Could not load categories from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await adminService.createCategory({ name, description })
      toast.success('Category created successfully!', {
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
      setName('')
      setDescription('')
      loadCategories()
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Failed to create category.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, catName) => {
    if (!window.confirm(`Are you sure you want to deactivate "${catName}"?`)) return
    try {
      await adminService.deleteCategory(id)
      toast.success('Category removed successfully.')
      setCats(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error(err)
      toast.error('Failed to remove category.')
    }
  }

  const handleExport = async () => {
    if (cats.length === 0) {
      toast.error('No categories available to export.')
      return
    }
    toast.loading('Generating categories PDF...', { id: 'cats-pdf' })
    try {
      const exportCols = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Couture Line' },
        { key: 'description', label: 'Description' },
        { key: 'count', label: 'Pieces Count' }
      ]
      await exportTableToPDF('AGVIA Couture Lines & Categories', exportCols, cats, 'agvia_categories')
      toast.success(`Exported ${cats.length} categories to branded PDF!`, {
        id: 'cats-pdf',
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF document.', { id: 'cats-pdf' })
    }
  }

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'name',
      label: 'Couture Line',
      render: (r) => <span className="font-serif font-bold text-[#5A1020] text-xs sm:text-sm whitespace-nowrap">{r.name}</span>
    },
    { 
      key: 'description', 
      label: 'Description',
      render: (r) => <span className="text-xs text-[#211D1E]/70 max-w-[200px] truncate block">{r.description}</span>
    },
    {
      key: 'count',
      label: 'Silhouettes',
      render: (r) => <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A45C]/15 text-[#5A1020] whitespace-nowrap">{r.count} pieces</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <button
          onClick={() => handleDelete(r.id, r.name)}
          className="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center touch-target"
          title="Delete Category"
        >
          <Trash2 size={13} />
        </button>
      )
    }
  ]

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 select-none font-body">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A1020]">Categories Hub</h2>
          <p className="text-xs text-[#211D1E]/60 mt-1">Manage luxury couture lines and collections in real-time.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#C9A45C]/40 bg-[#FFFDF8] hover:bg-[#5A1020] text-[#5A1020] hover:text-white text-xs font-bold uppercase tracking-wider transition-all shadow-2xs touch-target"
            title="Download Categories PDF"
          >
            <FileText size={13} className="text-[#C9A45C]" />
            <span>Export Categories (PDF)</span>
          </button>

          <button
            onClick={loadCategories}
            disabled={loading}
            className="btn-outline !py-2 !px-3 sm:!px-4 text-xs font-bold tracking-widest flex items-center gap-1.5 touch-target"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> 
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 font-body">
        <div className="lg:col-span-8 bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 shadow-sm">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#211D1E]/50 animate-pulse font-body">
              Syncing categories from catalogue...
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              rows={cats} 
              title="Atelier Categories"
              emptyMessage="No categories created yet." 
              exportFilename="agvia_categories"
            />
          )}
        </div>

        <div className="lg:col-span-4 bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm h-fit select-none">
          <h3 className="font-serif text-base font-bold text-[#5A1020] mb-4 flex items-center gap-2">
            <Layers size={16} className="text-[#C9A45C]" /> Add New Category
          </h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider block">Category Title</label>
              <input
                required
                placeholder="e.g. Wedding & Festive Edit"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider block">Description</label>
              <textarea
                rows={3}
                placeholder="Brief summary of couture silhouette, fabrics, and styling..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="btn-primary w-full disabled:opacity-60 text-xs font-bold tracking-widest touch-target"
            >
              {saving ? 'Creating Category...' : 'Save Category'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}
