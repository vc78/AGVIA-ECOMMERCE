import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import DataTable from '../../components/admin/DataTable'
import { adminService } from '../../services/adminService'
import { exportCouponsPDF } from '../../utils/pdfExportUtils'
import toast from 'react-hot-toast'
import { Trash2, RefreshCw, Tag, FileText } from 'lucide-react'

export default function CouponsManagement() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderAmount: '',
    expires: ''
  })

  const loadCoupons = async () => {
    setLoading(true)
    try {
      const data = await adminService.getCoupons()
      setCoupons(data)
    } catch (err) {
      console.error(err)
      toast.error('Could not load promo coupons from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.code.trim() || !form.discountValue) return
    setSaving(true)
    try {
      await adminService.createCoupon(form)
      toast.success('Coupon code activated successfully!', {
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
      setForm({
        title: '',
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minOrderAmount: '',
        expires: ''
      })
      loadCoupons()
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Failed to create coupon.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (id, code, currentActive) => {
    try {
      const res = await adminService.toggleCouponStatus(id)
      const nowActive = res.active ?? !currentActive
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: nowActive } : c))
      if (nowActive) {
        toast.success(`Coupon "${code}" implemented & activated for patrons!`, {
          style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
        })
      } else {
        toast.success(`Coupon "${code}" stopped and paused from checkout.`, {
          style: { background: '#211D1E', color: '#FAF7F2', borderRadius: '12px' }
        })
      }
    } catch (err) {
      console.error(err)
      toast.error('Could not update offer status.')
    }
  }

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Permanently remove promo coupon "${code}"?`)) return
    try {
      await adminService.deleteCoupon(id)
      toast.success(`Coupon ${code} removed.`)
      setCoupons(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error(err)
      toast.error('Could not remove coupon.')
    }
  }

  const handleExport = async () => {
    if (coupons.length === 0) {
      toast.error('No coupons available to export.')
      return
    }
    toast.loading('Generating privilege codes PDF...', { id: 'coupons-pdf' })
    try {
      await exportCouponsPDF(coupons)
      toast.success(`Exported ${coupons.length} privilege codes to branded PDF!`, {
        id: 'coupons-pdf',
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF document.', { id: 'coupons-pdf' })
    }
  }

  const columns = [
    {
      key: 'code',
      label: 'Privilege Code',
      render: (r) => (
        <div className="whitespace-nowrap">
          <span className="font-mono font-bold text-xs bg-[#C9A45C]/15 text-[#5A1020] px-2.5 py-1 rounded-lg border border-[#C9A45C]/25 block w-fit">
            {r.code}
          </span>
          <span className="text-[10px] text-[#211D1E]/50 block mt-1">Min: ₹{r.minOrderAmount || 0}</span>
        </div>
      )
    },
    { 
      key: 'title', 
      label: 'Campaign Title',
      render: (r) => (
        <div className="min-w-[130px]">
          <span className="font-bold text-xs text-[#211D1E] block truncate">{r.title}</span>
          <span className="text-[10px] text-[#211D1E]/50 block">Redeemed: {r.usedCount || 0} times</span>
        </div>
      )
    },
    {
      key: 'discount',
      label: 'Benefit',
      render: (r) => <span className="font-bold text-emerald-700 whitespace-nowrap text-xs">{r.discount} OFF</span>
    },
    { 
      key: 'expires', 
      label: 'Valid Until',
      render: (r) => <span className="text-xs text-[#211D1E]/60 whitespace-nowrap">{r.expires || 'No Expiry'}</span>
    },
    {
      key: 'active',
      label: 'Storefront Status',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${row.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          {row.active ? 'Active' : 'Paused'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Controls',
      render: (r) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          {r.active ? (
            <button
              onClick={() => handleToggleStatus(r.id, r.code, r.active)}
              className="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 text-[10px] font-bold transition-all touch-target"
              title="Pause this coupon"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={() => handleToggleStatus(r.id, r.code, r.active)}
              className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[10px] font-bold transition-all touch-target"
              title="Activate this coupon"
            >
              Activate
            </button>
          )}

          <button
            onClick={() => handleDelete(r.id, r.code)}
            className="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center touch-target"
            title="Delete Coupon"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ]

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 select-none font-body">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A1020]">Privilege Codes & Campaigns</h2>
          <p className="text-xs text-[#211D1E]/60 mt-1">Manage discounts, checkout promo codes, and atelier privilege campaigns.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#C9A45C]/40 bg-[#FFFDF8] hover:bg-[#5A1020] text-[#5A1020] hover:text-white text-xs font-bold uppercase tracking-wider transition-all shadow-2xs touch-target"
            title="Download Privilege Codes PDF"
          >
            <FileText size={13} className="text-[#C9A45C]" />
            <span>Export Codes (PDF)</span>
          </button>

          <button
            onClick={loadCoupons}
            disabled={loading}
            className="btn-outline !py-2 !px-3 sm:!px-4 text-xs font-bold tracking-widest flex items-center gap-1.5 touch-target"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> 
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 font-body">
        {/* Table Column */}
        <div className="lg:col-span-8 bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 shadow-sm">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#211D1E]/50 animate-pulse font-body">
              Syncing privilege codes from database...
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              rows={coupons} 
              title="Active Privilege Codes"
              emptyMessage="No coupons registered yet." 
              exportFilename="agvia_privilege_codes"
            />
          )}
        </div>

        {/* Create Form Column */}
        <div className="lg:col-span-4 bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm h-fit select-none">
          <h3 className="font-serif text-base font-bold text-[#5A1020] mb-4 flex items-center gap-2">
            <Tag size={16} className="text-[#C9A45C]" /> Create Privilege Code
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider block">Campaign Title</label>
              <input
                required
                placeholder="Diwali Festive Privilege"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider block">Promo Code</label>
              <input
                required
                placeholder="FESTIVE25"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="input-field uppercase font-mono font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider block">Type</label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                  className="input-field bg-white cursor-pointer"
                >
                  <option value="PERCENTAGE">Percent (%)</option>
                  <option value="FLAT">Flat (₹)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider block">Value</label>
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="20"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider block">Min Order Amount (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="2500 (optional)"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider block">Expiration Date</label>
              <input
                required
                type="date"
                value={form.expires}
                onChange={(e) => setForm({ ...form, expires: e.target.value })}
                className="input-field"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full disabled:opacity-60 text-xs font-bold tracking-widest touch-target"
            >
              {saving ? 'Creating Privilege Code...' : 'Save & Publish Code'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}
