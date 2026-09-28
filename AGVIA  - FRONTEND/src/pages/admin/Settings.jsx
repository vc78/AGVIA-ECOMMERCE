import { useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'
import { BUSINESS } from '../../constants/business'

export default function Settings() {
  const [form, setForm] = useState({
    boutiqueName: BUSINESS.name,
    supportPhone: BUSINESS.contact.phone,
    supportEmail: BUSINESS.contact.email,
    minimumOrderValue: '200',
    freeDeliveryThreshold: '999',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    toast.success("Boutique preferences saved successfully!", {
      style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
    })
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  return (
    <AdminLayout>
      <div className="mb-6 select-none font-body">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A1020]">System Settings</h2>
        <p className="text-xs text-[#211D1E]/60 mt-1">Configure global boutique defaults, shipping tariffs, and contacts.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-2xl space-y-6 font-body shadow-sm">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Boutique Name</label>
          <input name="boutiqueName" required value={form.boutiqueName} onChange={handleChange} className="input-field" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Support Contact Number</label>
            <input name="supportPhone" required value={form.supportPhone} onChange={handleChange} className="input-field" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Support Email</label>
            <input name="supportEmail" type="email" required value={form.supportEmail} onChange={handleChange} className="input-field" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Minimum Checkout Value (₹)</label>
            <input name="minimumOrderValue" type="number" required value={form.minimumOrderValue} onChange={handleChange} className="input-field" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Free Delivery Target (₹)</label>
            <input name="freeDeliveryThreshold" type="number" required value={form.freeDeliveryThreshold} onChange={handleChange} className="input-field" />
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" className="btn-primary w-full sm:w-auto text-xs font-bold tracking-widest uppercase touch-target">
            Save Preferences
          </button>
        </div>
      </form>
    </AdminLayout>
  )
}
