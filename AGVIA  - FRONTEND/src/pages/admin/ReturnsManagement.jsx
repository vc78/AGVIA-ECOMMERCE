import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  Calendar,
  User,
  ArrowRight,
  Printer,
  Sparkles,
  Tag,
  AlertCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  X
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import returnService from '../../services/returnService'
import { exportReverseShippingSlipPDF } from '../../utils/pdfExportUtils'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { id: 'ALL', label: 'All Requests' },
  { id: 'REQUESTED', label: 'Pending Review' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled' },
  { id: 'RECEIVED', label: 'At Atelier' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'REJECTED', label: 'Declined' }
]

const getStatusBadge = (status = '') => {
  switch (status.toUpperCase()) {
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'RECEIVED':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case 'PICKUP_SCHEDULED':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'APPROVED':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200'
    case 'REQUESTED':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'REJECTED':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    default:
      return 'bg-stone-50 text-stone-700 border-stone-200'
  }
}

export default function ReturnsManagement() {
  const [returnsList, setReturnsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReturn, setSelectedReturn] = useState(null)
  const [updating, setUpdating] = useState(false)

  // Decision form inside modal
  const [decisionStatus, setDecisionStatus] = useState('APPROVED')
  const [adminNotes, setAdminNotes] = useState('')
  const [courierPartner, setCourierPartner] = useState('Blue Dart Express (Reverse Logistics)')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [issueStoreCredit, setIssueStoreCredit] = useState(true)

  const fetchReturns = useCallback(async () => {
    setLoading(true)
    try {
      const data = await returnService.adminGetAllReturns({
        status: activeTab === 'ALL' ? null : activeTab,
        size: 50
      })
      const list = Array.isArray(data) ? data : (data?.content || [])
      setReturnsList(list)
    } catch (err) {
      console.error('[ReturnsManagement] Failed to load return requests:', err)
      toast.error('Unable to load returns list. Please refresh.', {
        style: { background: '#1A0B10', color: '#FAF7F2' }
      })
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchReturns()
  }, [fetchReturns])

  const openDecisionModal = (ret) => {
    setSelectedReturn(ret)
    setDecisionStatus(ret.status === 'REQUESTED' ? 'APPROVED' : ret.status)
    setAdminNotes(ret.adminNotes || '')
    setCourierPartner(ret.reverseCourierPartner || 'Blue Dart Express (Reverse Logistics)')
    setTrackingNumber(ret.reverseTrackingNumber || '')
    setRefundAmount(ret.refundAmount ? String(ret.refundAmount) : '')
    setIssueStoreCredit(ret.resolution === 'STORE_CREDIT')
  }

  const handleUpdateDecision = async () => {
    if (!selectedReturn) return
    setUpdating(true)
    try {
      const payload = {
        status: decisionStatus,
        adminNotes,
        reverseCourierPartner: courierPartner,
        reverseTrackingNumber: trackingNumber,
        refundAmount: refundAmount ? parseFloat(refundAmount) : null,
        issueStoreCreditCoupon: issueStoreCredit
      }

      const updated = await returnService.adminUpdateDecision(selectedReturn.id, payload)
      toast.success(`Return #${updated.returnNumber} status updated to ${updated.status}.`, {
        icon: '✨',
        style: { background: '#1A0B10', color: '#FAF7F2' }
      })
      setSelectedReturn(null)
      fetchReturns()
    } catch (err) {
      console.error('[ReturnsManagement] Update failed:', err)
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update decision.', {
        style: { background: '#5A1020', color: '#FAF7F2' }
      })
    } finally {
      setUpdating(false)
    }
  }

  // Filter list by search query
  const filteredList = returnsList.filter(r => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (r.returnNumber && r.returnNumber.toLowerCase().includes(q)) ||
      (r.orderNumber && r.orderNumber.toLowerCase().includes(q)) ||
      (r.userName && r.userName.toLowerCase().includes(q)) ||
      (r.userEmail && r.userEmail.toLowerCase().includes(q)) ||
      (r.orderItemName && r.orderItemName.toLowerCase().includes(q))
    )
  })

  // Metric counts
  const totalCount = returnsList.length
  const requestedCount = returnsList.filter(r => r.status === 'REQUESTED').length
  const scheduledCount = returnsList.filter(r => r.status === 'PICKUP_SCHEDULED').length
  const completedCount = returnsList.filter(r => r.status === 'COMPLETED').length

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-body">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A45C]/20 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#5A1020] text-[#C9A45C] flex items-center justify-center border border-[#C9A45C]/30 shadow-sm">
              <RotateCcw size={24} />
            </div>
            <div>
              <span className="text-[9.5px] uppercase tracking-[0.25em] text-[#C9A45C] font-bold block">
                Atelier Client Service
              </span>
              <h1 className="font-serif text-2xl font-bold text-[#1A0B10] tracking-tight">
                Returns & Size Exchanges
              </h1>
            </div>
          </div>

          <button
            onClick={fetchReturns}
            className="self-start sm:self-auto py-2.5 px-4 bg-white hover:bg-stone-50 border border-stone-200 text-[#5A1020] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Portal</span>
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Inquiries</span>
            <span className="font-serif text-2xl font-bold text-[#1A0B10] mt-1 block">{totalCount}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs">
            <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Needs Review</span>
            <span className="font-serif text-2xl font-bold text-amber-700 mt-1 block">{requestedCount}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-2xs">
            <span className="text-[10px] text-blue-800 font-bold uppercase tracking-wider block">Pickup In Transit</span>
            <span className="font-serif text-2xl font-bold text-blue-700 mt-1 block">{scheduledCount}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs">
            <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Settled / Exchanged</span>
            <span className="font-serif text-2xl font-bold text-emerald-700 mt-1 block">{completedCount}</span>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Return #, Order #, Patron Name..."
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-[#FAF7F2]/60 border border-stone-200 rounded-xl focus:outline-none focus:border-[#5A1020]"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              {STATUS_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[#5A1020] text-[#FAF7F2] shadow-xs'
                      : 'bg-stone-50 text-gray-600 hover:bg-stone-100 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Return Requests Table */}
        <div className="bg-white border border-stone-200/80 rounded-2xl shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
              <RefreshCw size={24} className="animate-spin text-[#5A1020]" />
              <p className="text-xs font-semibold">Retrieving atelier return dossiers...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-2">
              <RotateCcw size={32} className="mx-auto text-gray-300" />
              <h4 className="font-serif text-sm font-bold text-gray-800">No Return or Exchange Inquiries Found</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                No orders match the selected filter. Return requests initiated by patrons will populate here in real-time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-stone-200 text-[#1A0B10] uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-4">Dossier / Ref</th>
                    <th className="py-3 px-4">Patron Details</th>
                    <th className="py-3 px-4">Garment Item</th>
                    <th className="py-3 px-4">Type & Choice</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Reverse Logistics</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredList.map(item => (
                    <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-[#5A1020] block">{item.returnNumber}</span>
                        <span className="text-[10px] text-gray-400">Order #{item.orderNumber || item.orderId}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block">{item.userName || 'Patron'}</span>
                        <span className="text-[10px] text-gray-500">{item.userEmail || '—'}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {item.orderItemImageUrl && (
                            <img src={item.orderItemImageUrl} alt={item.orderItemName} className="w-9 h-11 object-cover rounded border border-stone-200 shrink-0" />
                          )}
                          <div className="max-w-[160px] truncate">
                            <span className="font-medium text-gray-800 block truncate">{item.orderItemName || 'Couture Silhouette'}</span>
                            <span className="text-[10px] text-gray-400">{item.orderItemSku ? `SKU: ${item.orderItemSku}` : ''}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.type === 'EXCHANGE' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {item.type}
                        </span>
                        <p className="text-[11px] text-gray-600 mt-1">
                          {item.type === 'EXCHANGE' ? `Swap Size: ${item.targetSize || 'L'}` : item.resolution?.replace('_', ' ')}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(item.status)}`}>
                          {item.status?.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[11px]">
                        {item.reverseTrackingNumber ? (
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-gray-800 block">{item.reverseTrackingNumber}</span>
                            <span className="text-[10px] text-gray-500">{item.reverseCourierPartner || 'Courier'}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Not scheduled</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDecisionModal(item)}
                            className="py-1.5 px-3 bg-[#5A1020] hover:bg-[#72152b] text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
                          >
                            Manage
                          </button>

                          <button
                            type="button"
                            onClick={() => exportReverseShippingSlipPDF(item)}
                            className="p-1.5 bg-[#FAF7F2] hover:bg-stone-200 text-[#5A1020] rounded-lg border border-stone-200 transition-all"
                            title="Print Reverse Courier Label"
                          >
                            <Printer size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* DECISION & MANAGEMENT MODAL */}
        <AnimatePresence>
          {selectedReturn && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-2xl bg-white border border-[#C9A45C]/30 rounded-3xl shadow-2xl overflow-hidden my-auto"
              >
                {/* Header */}
                <div className="bg-[#1A0B10] text-[#FAF7F2] p-5 border-b border-[#C9A45C]/20 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.25em] text-[#C9A45C] font-semibold block">
                      Atelier Return Dossier
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#FAF7F2]">
                      Manage Return #{selectedReturn.returnNumber}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedReturn(null)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5 text-xs">
                  {/* Patron & Order Info */}
                  <div className="grid sm:grid-cols-2 gap-4 p-4 bg-[#FAF7F2] rounded-2xl border border-stone-200">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Patron</span>
                      <strong className="text-gray-900 block mt-0.5">{selectedReturn.userName || 'Patron'}</strong>
                      <span className="text-gray-500 text-[11px]">{selectedReturn.userEmail}</span>
                      <span className="text-gray-500 text-[11px] block mt-1">Pickup Address: {selectedReturn.pickupAddress}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Garment Item</span>
                      <strong className="text-gray-900 block mt-0.5">{selectedReturn.orderItemName || 'Couture Silhouette'}</strong>
                      <span className="text-gray-500 text-[11px] block">Order Ref: #{selectedReturn.orderNumber}</span>
                      <span className="text-gray-500 text-[11px] block">Service: <strong>{selectedReturn.type}</strong> ({selectedReturn.resolution?.replace('_', ' ')})</span>
                      {selectedReturn.targetSize && (
                        <span className="text-[#5A1020] font-bold text-[11px] block mt-1">Requested Size: {selectedReturn.targetSize}</span>
                      )}
                    </div>
                  </div>

                  {/* Customer Notes */}
                  {selectedReturn.customerNotes && (
                    <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl">
                      <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Patron's Fitting Remarks:</span>
                      <p className="text-gray-700 mt-1 italic">"{selectedReturn.customerNotes}"</p>
                    </div>
                  )}

                  {/* Status Progression Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                      Progress Return Status
                    </label>
                    <select
                      value={decisionStatus}
                      onChange={e => setDecisionStatus(e.target.value)}
                      className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-[#5A1020] font-semibold"
                    >
                      <option value="REQUESTED">REQUESTED (Pending Review)</option>
                      <option value="APPROVED">APPROVED (Authorized by Atelier)</option>
                      <option value="PICKUP_SCHEDULED">PICKUP_SCHEDULED (Reverse Courier Dispatched)</option>
                      <option value="PICKED_UP">PICKED_UP (In Transit to Atelier)</option>
                      <option value="RECEIVED">RECEIVED (Consignment at Atelier for Inspection)</option>
                      <option value="COMPLETED">COMPLETED (Settled: Replaced / Refunded / Credit Issued)</option>
                      <option value="REJECTED">REJECTED (Declined with Explanation)</option>
                    </select>
                  </div>

                  {/* Reverse Logistics Fields */}
                  <div className="grid sm:grid-cols-2 gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Reverse Courier Partner
                      </label>
                      <input
                        type="text"
                        value={courierPartner}
                        onChange={e => setCourierPartner(e.target.value)}
                        placeholder="e.g. Blue Dart Express"
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Reverse Tracking AWB #
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={e => setTrackingNumber(e.target.value)}
                        placeholder="Auto-generated if left blank"
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Store Credit / Refund Controls */}
                  {decisionStatus === 'COMPLETED' && (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <strong className="text-emerald-900 block text-xs">Settlement Options</strong>
                          <span className="text-[11px] text-emerald-700">Auto-generate AGVIA Store Privilege Coupon (+5% VIP Bonus)</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={issueStoreCredit}
                          onChange={e => setIssueStoreCredit(e.target.checked)}
                          className="w-4 h-4 accent-[#5A1020] rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                          Settlement / Refund Amount (₹)
                        </label>
                        <input
                          type="number"
                          value={refundAmount}
                          onChange={e => setRefundAmount(e.target.value)}
                          placeholder="Amount in Rupees"
                          className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      {selectedReturn.creditCouponCode && (
                        <div className="p-2.5 bg-white border border-emerald-300 rounded-lg flex items-center justify-between">
                          <span className="text-gray-600">Issued Privilege Code:</span>
                          <strong className="font-mono text-[#5A1020] text-sm">{selectedReturn.creditCouponCode}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin Notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-1">
                      Atelier Notes & Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={adminNotes}
                      onChange={e => setAdminNotes(e.target.value)}
                      placeholder="e.g. Courier instructed for protective box swap. Garment received in pristine condition."
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-[#FAF7F2] border-t border-stone-200 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => exportReverseShippingSlipPDF(selectedReturn)}
                    className="py-2.5 px-4 bg-white hover:bg-stone-100 text-[#5A1020] border border-[#5A1020]/30 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <Printer size={13} /> Print Shipping Slip
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedReturn(null)}
                      className="py-2.5 px-4 text-gray-600 hover:text-gray-900 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={updating}
                      onClick={handleUpdateDecision}
                      className="py-2.5 px-5 bg-[#5A1020] hover:bg-[#72152b] disabled:bg-gray-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      {updating ? 'Saving...' : 'Save Decision'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  )
}
