import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { adminService } from '../../services/adminService'
import toast from 'react-hot-toast'
import {
  Crown,
  Sparkles,
  Users,
  CreditCard,
  Clock,
  Search,
  Filter,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  CalendarPlus,
  RefreshCw,
  X,
  FileText
} from 'lucide-react'
import { exportSubscriptionsPDF } from '../../utils/pdfExportUtils'


export default function SubscriptionsManagement() {
  const [subscriptions, setSubscriptions] = useState([])
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    pendingSubscribers: 0,
    expiringThisMonth: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [granting, setGranting] = useState(false)

  const [grantForm, setGrantForm] = useState({
    email: '',
    customerName: '',
    customerPhone: '',
    planName: 'AGVIA_ATELIER_VIP',
    planTier: 'VIP',
    amount: '299',
    durationDays: 365,
    notes: 'Complimentary VIP Circle membership'
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [subsData, statsData] = await Promise.all([
        adminService.getSubscriptions({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          query: searchQuery.trim() || undefined,
          size: 50
        }),
        adminService.getSubscriptionStats()
      ])
      setSubscriptions(subsData?.content || [])
      setStats(statsData || {})
    } catch (err) {
      console.error(err)
      toast.error('Failed to load subscriptions from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const handleSearch = (e) => {
    e.preventDefault()
    loadData()
  }

  const handleStatusToggle = async (sub) => {
    const newStatus = sub.status === 'ACTIVE' ? 'CANCELLED' : 'ACTIVE'
    try {
      await adminService.updateSubscriptionStatus(sub.id, newStatus)
      toast.success(`Subscription marked as ${newStatus}!`, {
        style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
      })
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update subscription status.')
    }
  }

  const handleExtend = async (id, days) => {
    try {
      await adminService.extendSubscription(id, days)
      toast.success(`Extended membership by ${days} days!`, {
        icon: '📅',
        style: { background: '#075E54', color: '#FFFDF8', borderRadius: '12px' }
      })
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Failed to extend subscription.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription record?')) return
    try {
      await adminService.deleteSubscription(id)
      toast.success('Subscription record removed.')
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Could not delete subscription.')
    }
  }

  const handleGrantSubmit = async (e) => {
    e.preventDefault()
    if (!grantForm.email.trim()) {
      toast.error('Email is required')
      return
    }
    setGranting(true)
    try {
      await adminService.grantSubscription(grantForm)
      toast.success(`VIP membership granted to ${grantForm.email}!`, {
        icon: '👑',
        style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
      })
      setShowGrantModal(false)
      setGrantForm({
        email: '',
        customerName: '',
        customerPhone: '',
        planName: 'AGVIA_ATELIER_VIP',
        planTier: 'VIP',
        amount: '299',
        durationDays: 365,
        notes: 'Complimentary VIP Circle membership'
      })
      loadData()
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Failed to grant subscription.')
    } finally {
      setGranting(false)
    }
  }

  const handleExport = async () => {
    if (subscriptions.length === 0) {
      toast.error('No subscriptions available to export.')
      return
    }
    toast.loading('Generating VIP Circle PDF...', { id: 'vip-pdf' })
    try {
      await exportSubscriptionsPDF(subscriptions)
      toast.success(`Exported ${subscriptions.length} VIP subscriptions to branded PDF!`, {
        id: 'vip-pdf',
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF document.', { id: 'vip-pdf' })
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 font-body">
        
        {/* Page Title & Top Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-[0.25em] font-bold text-[#B8860B] uppercase">Memberships</span>
              <span className="text-xs bg-[#B8860B]/15 text-[#8B0000] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Crown size={11} /> AGVIA Atelier Circle
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#5A1020] font-bold mt-1">
              VIP Subscriptions
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#C9A45C]/40 bg-[#FFFDF8] hover:bg-[#5A1020] text-[#5A1020] hover:text-white text-xs font-bold uppercase tracking-wider transition-all shadow-2xs touch-target"
              title="Download VIP Circle PDF"
            >
              <FileText size={13} className="text-[#C9A45C]" />
              <span>Export VIP (PDF)</span>
            </button>
            <button
              onClick={loadData}
              className="p-2 sm:p-2.5 rounded-xl border border-[#B8860B]/20 text-[#8B0000] hover:bg-[#F5E6C8]/20 transition-colors touch-target"
              title="Refresh Data"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowGrantModal(true)}
              className="btn-primary !py-2 sm:!py-2.5 !px-4 sm:!px-5 text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg font-bold touch-target"
            >
              <Plus size={15} />
              <span>Grant VIP</span>
            </button>
          </div>
        </div>


        {/* Analytics & KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Active Members */}
          <div className="bg-white p-5 rounded-2xl border border-[#B8860B]/15 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#3A2D23]/60 uppercase tracking-widest font-semibold">Active Members</p>
              <h3 className="font-display text-2xl font-bold text-[#075E54] mt-1">{stats.activeSubscribers}</h3>
              <p className="text-[10px] text-green-700 mt-0.5">● VIP Circle Benefits Enabled</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 text-[#075E54] flex items-center justify-center border border-green-200/60 shadow-inner">
              <Crown size={22} />
            </div>
          </div>

          {/* Total Subscriptions */}
          <div className="bg-white p-5 rounded-2xl border border-[#B8860B]/15 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#3A2D23]/60 uppercase tracking-widest font-semibold">Total Enrolled</p>
              <h3 className="font-display text-2xl font-bold text-[#8B0000] mt-1">{stats.totalSubscribers}</h3>
              <p className="text-[10px] text-[#3A2D23]/50 mt-0.5">Lifetime signups</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#8B0000]/10 text-[#8B0000] flex items-center justify-center border border-[#8B0000]/20 shadow-inner">
              <Users size={22} />
            </div>
          </div>

          {/* Subscription Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-[#B8860B]/15 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#3A2D23]/60 uppercase tracking-widest font-semibold">Membership Revenue</p>
              <h3 className="font-display text-2xl font-bold text-[#B8860B] mt-1">₹{Number(stats.totalRevenue || 0).toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-[#B8860B] mt-0.5">Paid subscriptions</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#B8860B]/10 text-[#B8860B] flex items-center justify-center border border-[#B8860B]/20 shadow-inner">
              <CreditCard size={22} />
            </div>
          </div>

          {/* Expiring this Month */}
          <div className="bg-white p-5 rounded-2xl border border-[#B8860B]/15 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#3A2D23]/60 uppercase tracking-widest font-semibold">Expiring in 30 Days</p>
              <h3 className="font-display text-2xl font-bold text-amber-700 mt-1">{stats.expiringThisMonth}</h3>
              <p className="text-[10px] text-amber-600 mt-0.5">Eligible for renewal</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shadow-inner">
              <Clock size={22} />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#B8860B]/15 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {['ALL', 'ACTIVE', 'PENDING_PAYMENT', 'EXPIRED', 'CANCELLED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wider transition-all ${
                  statusFilter === tab
                    ? 'bg-[#8B0000] text-white shadow'
                    : 'bg-[#F5E6C8]/20 text-[#3A2D23]/70 hover:bg-[#F5E6C8]/40'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3A2D23]/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search email, name..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#B8860B]/25 focus:outline-none focus:border-[#8B0000]"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-[#8B0000] text-white text-xs font-semibold rounded-xl hover:bg-[#660000] transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white rounded-2xl border border-[#B8860B]/15 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#3A2D23]/60 uppercase tracking-wider text-[10px] border-b border-[#B8860B]/10">
                <tr>
                  <th className="py-3.5 px-5">Subscriber</th>
                  <th className="py-3.5 px-4">Membership Plan</th>
                  <th className="py-3.5 px-4">Amount & Payment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B8860B]/10 text-[#3A2D23]">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-[#3A2D23]/50">
                      <div className="inline-block w-6 h-6 border-2 border-[#8B0000] border-t-transparent rounded-full animate-spin mb-2" />
                      <p>Loading subscribers...</p>
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-[#3A2D23]/50">
                      <Crown size={32} className="mx-auto text-[#B8860B]/30 mb-2" />
                      <p className="font-semibold text-sm text-[#8B0000]">No subscriptions found</p>
                      <p className="text-xs mt-0.5">Click "Grant VIP Membership" to add subscribers manually.</p>
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => {
                    const isActive = sub.status === 'ACTIVE'
                    return (
                      <tr key={sub.id} className="hover:bg-[#FFFDF8] transition-colors">
                        {/* Customer */}
                        <td className="py-4 px-5">
                          <div>
                            <span className="font-bold text-[#8B0000] text-sm block">
                              {sub.customerName || 'VIP Member'}
                            </span>
                            <span className="text-[#3A2D23]/70 font-mono text-[11px] block">{sub.email}</span>
                            {sub.customerPhone && (
                              <span className="text-[10px] text-[#B8860B] block mt-0.5">📞 {sub.customerPhone}</span>
                            )}
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-xs bg-[#B8860B]/15 text-[#8B0000] px-2.5 py-0.5 rounded-full">
                            <Sparkles size={11} className="text-[#B8860B]" />
                            {sub.planTier} Circle
                          </span>
                          <p className="text-[10px] text-[#3A2D23]/60 mt-1">
                            Voucher: <span className="font-mono font-bold text-[#8B0000]">{sub.exclusiveCoupon}</span> ({sub.discountPercent}% Off)
                          </p>
                        </td>

                        {/* Amount & Payment */}
                        <td className="py-4 px-4">
                          <span className="font-bold text-sm text-[#3A2D23] block">₹{sub.amount}</span>
                          <span className="text-[10px] text-[#3A2D23]/60 block font-mono">
                            {sub.paymentMethod} • {sub.paymentStatus || 'COMPLETED'}
                          </span>
                          {sub.paymentId && (
                            <span className="text-[9px] text-gray-400 block font-mono truncate max-w-[140px]" title={sub.paymentId}>
                              {sub.paymentId}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              sub.status === 'ACTIVE'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : sub.status === 'PENDING_PAYMENT'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : sub.status === 'CANCELLED'
                                ? 'bg-gray-50 text-gray-600 border-gray-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>

                        {/* Validity */}
                        <td className="py-4 px-4">
                          <div className="text-xs">
                            <span className="font-semibold block">
                              {sub.validTill ? new Date(sub.validTill).toLocaleDateString('en-IN') : 'N/A'}
                            </span>
                            <span
                              className={`text-[10px] font-medium ${
                                sub.daysRemaining > 30 ? 'text-green-700' : 'text-amber-700'
                              }`}
                            >
                              {sub.daysRemaining > 0 ? `${sub.daysRemaining} days remaining` : 'Expired'}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Status toggle */}
                            <button
                              onClick={() => handleStatusToggle(sub)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isActive
                                  ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                  : 'border-green-200 text-green-700 hover:bg-green-50'
                              }`}
                              title={isActive ? 'Deactivate Membership' : 'Activate Membership'}
                            >
                              {isActive ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                            </button>

                            {/* Extend +30 Days */}
                            <button
                              onClick={() => handleExtend(sub.id, 30)}
                              className="p-1.5 rounded-lg border border-[#B8860B]/30 text-[#8B0000] hover:bg-[#F5E6C8]/20 transition-colors text-[10px] font-bold"
                              title="Extend by +30 Days"
                            >
                              +30d
                            </button>

                            {/* Extend +1 Year */}
                            <button
                              onClick={() => handleExtend(sub.id, 365)}
                              className="p-1.5 rounded-lg border border-[#B8860B]/30 text-[#8B0000] hover:bg-[#F5E6C8]/20 transition-colors text-[10px] font-bold"
                              title="Extend by +1 Year"
                            >
                              +1yr
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(sub.id)}
                              className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grant VIP Membership Modal */}
        {showGrantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 md:p-8 border border-[#B8860B]/20 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#B8860B]/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#8B0000]/10 text-[#8B0000] flex items-center justify-center">
                    <Crown size={16} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#8B0000]">Grant VIP Membership</h3>
                </div>
                <button
                  onClick={() => setShowGrantModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleGrantSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#3A2D23]/80 uppercase text-[10px] tracking-wider block">
                    Customer Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={grantForm.email}
                    onChange={(e) => setGrantForm({ ...grantForm, email: e.target.value })}
                    placeholder="client@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 focus:outline-none focus:border-[#8B0000]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#3A2D23]/80 uppercase text-[10px] tracking-wider block">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={grantForm.customerName}
                      onChange={(e) => setGrantForm({ ...grantForm, customerName: e.target.value })}
                      placeholder="e.g. Venkat"
                      className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 focus:outline-none focus:border-[#8B0000]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#3A2D23]/80 uppercase text-[10px] tracking-wider block">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={grantForm.customerPhone}
                      onChange={(e) => setGrantForm({ ...grantForm, customerPhone: e.target.value })}
                      placeholder="+91 9032306961"
                      className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 focus:outline-none focus:border-[#8B0000]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#3A2D23]/80 uppercase text-[10px] tracking-wider block">
                      Plan Tier
                    </label>
                    <select
                      value={grantForm.planTier}
                      onChange={(e) => setGrantForm({ ...grantForm, planTier: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 focus:outline-none focus:border-[#8B0000] bg-white"
                    >
                      <option value="VIP">VIP Circle (15% Off)</option>
                      <option value="GOLD">Gold Royale (20% Off)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#3A2D23]/80 uppercase text-[10px] tracking-wider block">
                      Duration (Days)
                    </label>
                    <input
                      type="number"
                      value={grantForm.durationDays}
                      onChange={(e) => setGrantForm({ ...grantForm, durationDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 focus:outline-none focus:border-[#8B0000]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#3A2D23]/80 uppercase text-[10px] tracking-wider block">
                    Notes / Reference
                  </label>
                  <textarea
                    rows={2}
                    value={grantForm.notes}
                    onChange={(e) => setGrantForm({ ...grantForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 focus:outline-none focus:border-[#8B0000]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowGrantModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={granting}
                    className="flex-1 py-2.5 rounded-xl bg-[#8B0000] hover:bg-[#660000] text-white font-bold disabled:opacity-50"
                  >
                    {granting ? 'Granting...' : 'Confirm Grant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}
