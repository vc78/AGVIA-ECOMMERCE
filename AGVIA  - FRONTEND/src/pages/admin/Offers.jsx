import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import AdminLayout from '../../components/admin/AdminLayout'
import DataTable from '../../components/admin/DataTable'
import { adminService } from '../../services/adminService'
import { exportTableToPDF } from '../../utils/pdfExportUtils'

export default function Offers() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', code: '', discount: '', expires: '' })

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminService.getOffers()
      setOffers(data)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Failed to load festival offers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (id) => {
    try {
      await adminService.toggleOffer(id)
      setOffers((list) => list.map((o) => (o.id === id ? { ...o, active: !o.active } : o)))
      toast.success('Offer status updated', {
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      toast.error('Failed to update offer status.')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const offer = await adminService.createOffer({ ...form, active: true })
      setOffers((list) => [offer, ...list])
      toast.success('Offer created successfully', {
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
      setForm({ title: '', code: '', discount: '', expires: '' })
      setShowForm(false)
    } catch (err) {
      toast.error('Failed to create offer.')
    }
  }

  const handleExport = async () => {
    if (offers.length === 0) {
      toast.error('No offers available to export.')
      return
    }
    toast.loading('Generating promotional offers PDF...', { id: 'offers-pdf' })
    try {
      const cols = [
        { key: 'id', label: 'Offer ID' },
        { key: 'title', label: 'Offer Campaign' },
        { key: 'code', label: 'Promo Code' },
        { key: 'discount', label: 'Benefit' },
        { key: 'expires', label: 'Expiry Date' },
        { key: 'statusText', label: 'Status' }
      ]
      const sanitizedOffers = offers.map(o => ({
        ...o,
        statusText: o.active ? 'Active' : 'Inactive'
      }))
      await exportTableToPDF('AGVIA Seasonal & Festival Offers', cols, sanitizedOffers, 'agvia_festival_offers')
      toast.success(`Exported ${offers.length} offers to branded PDF!`, {
        id: 'offers-pdf',
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF document.', { id: 'offers-pdf' })
    }
  }

  const columns = [
    { 
      key: 'title', 
      label: 'Offer Campaign',
      render: (r) => <span className="font-serif font-bold text-[#5A1020] text-xs sm:text-sm whitespace-nowrap">{r.title}</span>
    },
    { 
      key: 'code', 
      label: 'Code',
      render: (r) => (
        <span className="font-mono font-bold text-xs bg-[#C9A45C]/15 text-[#5A1020] px-2.5 py-1 rounded-lg border border-[#C9A45C]/25 whitespace-nowrap">
          {r.code}
        </span>
      )
    },
    { 
      key: 'discount', 
      label: 'Benefit',
      render: (r) => <span className="font-bold text-emerald-700 whitespace-nowrap text-xs">{r.discount}</span>
    },
    { 
      key: 'expires', 
      label: 'Valid Until',
      render: (r) => <span className="text-xs text-[#211D1E]/60 whitespace-nowrap">{r.expires}</span>
    },
    {
      key: 'active', 
      label: 'Storefront Status', 
      render: (r) => (
        <button
          onClick={() => handleToggle(r.id)}
          className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-200 whitespace-nowrap touch-target ${
            r.active 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}
        >
          {r.active ? 'Active' : 'Inactive'}
        </button>
      ),
    },
  ]

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 select-none font-body">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A1020]">Festival & Seasonal Offers</h2>
          <p className="text-xs text-[#211D1E]/60 mt-1">Manage active boutique discount coupons, seasonal offers, and holiday specials.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#C9A45C]/40 bg-[#FFFDF8] hover:bg-[#5A1020] text-[#5A1020] hover:text-white text-xs font-bold uppercase tracking-wider transition-all shadow-2xs touch-target"
            title="Download Offers PDF"
          >
            <FileText size={13} className="text-[#C9A45C]" />
            <span>Export Offers (PDF)</span>
          </button>
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="btn-primary !py-2 sm:!py-2.5 !px-4 sm:!px-5 text-xs tracking-wider uppercase flex items-center gap-1.5 touch-target"
          >
            <Plus size={14} className="shrink-0" /> 
            <span>{showForm ? 'Close Form' : 'New Offer'}</span>
          </button>
        </div>
      </div>

      {showForm && (
        <motion.form 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate} 
          className="bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm max-w-2xl mb-8 space-y-4 font-body"
        >
          <h3 className="font-serif text-sm font-bold text-[#5A1020] tracking-wider uppercase border-b border-[#C9A45C]/15 pb-2">
            Create Promotional Offer
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Offer Title</label>
              <input required placeholder="e.g. Independence Day Special" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Coupon Code</label>
              <input required placeholder="e.g. AZADI15" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input-field uppercase font-mono font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Discount Value</label>
              <input required placeholder="e.g. 15% or ₹200 off" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="input-field" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Expiry Date</label>
              <input required type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" className="btn-primary w-full sm:w-auto text-xs font-bold tracking-widest touch-target">
              Create Offer
            </button>
          </div>
        </motion.form>
      )}

      {loading ? (
        <div className="py-20 text-center font-body text-xs text-[#211D1E]/50 animate-pulse">
          Loading festival offers...
        </div>
      ) : error ? (
        <div className="py-16 text-center font-body text-sm text-red-600 font-semibold border border-red-200/20 bg-red-50/10 rounded-3xl p-6">
          {error}
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          rows={offers} 
          title="Active Festival Offers"
          emptyMessage="No offers created yet." 
          exportFilename="agvia_festival_offers"
        />
      )}
    </AdminLayout>
  )
}
