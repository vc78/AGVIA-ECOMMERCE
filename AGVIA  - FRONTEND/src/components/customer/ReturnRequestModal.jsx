import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Tag,
  HelpCircle,
  ChevronRight
} from 'lucide-react'
import returnService from '../../services/returnService'

const REASONS = [
  { id: 'SIZE_FIT', label: 'Size or Fit Issue', desc: 'Garment is too tight, loose, or length differs from expectations.' },
  { id: 'DEFECTIVE', label: 'Fabric / Craftsmanship Concern', desc: 'Identified a defect, loose embroidery, or seam imperfection.' },
  { id: 'COLOR_MISMATCH', label: 'Color or Shade Variation', desc: 'The garment shade slightly differs from device photography.' },
  { id: 'INCORRECT_ITEM', label: 'Incorrect Silhouette Delivered', desc: 'Received a different style or item from what was ordered.' },
  { id: 'NOT_AS_EXPECTED', label: 'General Style Reconsideration', desc: 'Style or drape did not meet your personal aesthetic expectations.' },
  { id: 'OTHER', label: 'Other Atelier Request', desc: 'Special request or bespoke concierge requirement.' }
]

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size', 'Custom Tailored']

export default function ReturnRequestModal({ isOpen, onClose, order, onSuccess }) {
  const [step, setStep] = useState(1)
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [type, setType] = useState('EXCHANGE') // EXCHANGE or RETURN
  const [reason, setReason] = useState('SIZE_FIT')
  const [resolution, setResolution] = useState('SIZE_EXCHANGE') // SIZE_EXCHANGE, STORE_CREDIT, ORIGINAL_PAYMENT
  const [targetSize, setTargetSize] = useState('L')
  const [targetColor, setTargetColor] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [pickupAddress, setPickupAddress] = useState(order?.address?.line1 || order?.shippingAddress || '')
  const [bankDetails, setBankDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [successResult, setSuccessResult] = useState(null)

  if (!isOpen || !order) return null

  const items = Array.isArray(order.items) ? order.items : []
  const activeItem = items.find(i => (i.id === selectedItemId || i.productId === selectedItemId)) || items[0]

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const orderDbId = order.backendId || (typeof order.id === 'number' ? order.id : null)
      if (!orderDbId) {
        throw new Error('Unable to identify order ID. Please refresh your orders.')
      }

      const payload = {
        orderId: orderDbId,
        orderItemId: activeItem?.id || null,
        type,
        reason,
        resolution: type === 'EXCHANGE' ? 'SIZE_EXCHANGE' : resolution,
        targetSize: type === 'EXCHANGE' ? targetSize : null,
        targetColor: type === 'EXCHANGE' ? (targetColor || null) : null,
        customerNotes,
        pickupAddress,
        bankDetails: (resolution === 'ORIGINAL_PAYMENT' && order.paymentMethod === 'COD') ? bankDetails : null
      }

      const res = await returnService.createReturn(payload)
      setSuccessResult(res)
      if (onSuccess) onSuccess(res)
    } catch (err) {
      console.error('[ReturnRequestModal] Submission failed:', err)
      setError(err?.response?.data?.message || err?.message || 'Unable to submit your return request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl bg-white border border-[#C9A45C]/30 rounded-3xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="bg-[#1A0B10] text-[#FAF7F2] p-5 sm:p-6 border-b border-[#C9A45C]/20 flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5A1020] text-[#C9A45C] flex items-center justify-center border border-[#C9A45C]/30 shadow-xs">
                <RotateCcw size={20} />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-[0.25em] text-[#C9A45C] font-semibold block">
                  Self-Service Atelier Care
                </span>
                <h3 className="font-serif text-lg font-bold text-[#FAF7F2]">
                  Return & Size Exchange
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper Bar (if not completed) */}
          {!successResult && (
            <div className="bg-[#FAF7F2] px-6 py-2.5 border-b border-[#C9A45C]/15 flex items-center justify-between text-xs font-semibold">
              <span className={`flex items-center gap-1.5 ${step >= 1 ? 'text-[#5A1020]' : 'text-gray-400'}`}>
                <span className="w-5 h-5 rounded-full text-[11px] flex items-center justify-center border border-current font-mono">1</span>
                <span>Type</span>
              </span>
              <ChevronRight size={14} className="text-[#C9A45C]/40" />
              <span className={`flex items-center gap-1.5 ${step >= 2 ? 'text-[#5A1020]' : 'text-gray-400'}`}>
                <span className="w-5 h-5 rounded-full text-[11px] flex items-center justify-center border border-current font-mono">2</span>
                <span>Reason</span>
              </span>
              <ChevronRight size={14} className="text-[#C9A45C]/40" />
              <span className={`flex items-center gap-1.5 ${step >= 3 ? 'text-[#5A1020]' : 'text-gray-400'}`}>
                <span className="w-5 h-5 rounded-full text-[11px] flex items-center justify-center border border-current font-mono">3</span>
                <span>Resolution</span>
              </span>
              <ChevronRight size={14} className="text-[#C9A45C]/40" />
              <span className={`flex items-center gap-1.5 ${step >= 4 ? 'text-[#5A1020]' : 'text-gray-400'}`}>
                <span className="w-5 h-5 rounded-full text-[11px] flex items-center justify-center border border-current font-mono">4</span>
                <span>Review</span>
              </span>
            </div>
          )}

          {/* Body */}
          <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto space-y-5">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-rose-600 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* SUCCESS SCREEN */}
            {successResult ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] tracking-widest uppercase font-bold text-[#C9A45C]">Request Registered</span>
                  <h4 className="font-serif text-xl font-bold text-[#1A0B10]">
                    Your Request Has Been Confirmed
                  </h4>
                  <p className="text-xs text-gray-600 max-w-sm mx-auto">
                    Reference Number: <strong className="font-mono text-[#5A1020]">{successResult.returnNumber}</strong>
                  </p>
                </div>

                <div className="p-4 bg-[#FAF7F2] border border-[#C9A45C]/20 rounded-2xl text-left space-y-2 text-xs">
                  <div className="flex justify-between border-b border-stone-200/60 pb-2">
                    <span className="text-gray-500">Service Type:</span>
                    <span className="font-bold text-[#5A1020] uppercase">{successResult.type}</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-200/60 pb-2">
                    <span className="text-gray-500">Chosen Resolution:</span>
                    <span className="font-bold">{successResult.resolution?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-200/60 pb-2">
                    <span className="text-gray-500">Scheduled Pickup:</span>
                    <span className="font-medium text-gray-800">{successResult.pickupAddress || 'Order delivery address'}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-gray-500">Status:</span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[11px] border border-amber-200">
                      Under Atelier Review
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500">
                  Our logistics partner will reach out within 24–48 hours for complimentary doorstep pickup. Please keep all original tags intact.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3 bg-[#5A1020] hover:bg-[#72152b] text-[#FAF7F2] rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-md"
                  >
                    Done & Return to Orders
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* STEP 1: Select Type & Item */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1A0B10] uppercase tracking-wider mb-2">
                        1. Select Silhouette
                      </label>
                      <div className="space-y-2">
                        {items.map((i, idx) => {
                          const isSelected = (!selectedItemId && idx === 0) || selectedItemId === i.id || selectedItemId === i.productId
                          return (
                            <div
                              key={i.id || idx}
                              onClick={() => setSelectedItemId(i.id || i.productId)}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-[#5A1020]/5 border-[#5A1020] ring-1 ring-[#5A1020]'
                                  : 'bg-[#FAF7F2]/40 border-stone-200 hover:border-[#C9A45C]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {i.image && (
                                  <img src={i.image} alt={i.name} className="w-12 h-14 object-cover rounded-lg border border-stone-200" />
                                )}
                                <div>
                                  <p className="font-serif text-xs font-bold text-[#1A0B10]">{i.name}</p>
                                  <p className="text-[11px] text-gray-500">Qty: {i.qty || 1} • ₹{i.price}</p>
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#5A1020] bg-[#5A1020] text-white' : 'border-gray-300'}`}>
                                {isSelected && <CheckCircle2 size={12} />}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1A0B10] uppercase tracking-wider mb-2">
                        2. How Would You Like to Proceed?
                      </label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div
                          onClick={() => { setType('EXCHANGE'); setResolution('SIZE_EXCHANGE') }}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            type === 'EXCHANGE'
                              ? 'bg-[#5A1020]/5 border-[#5A1020] ring-1 ring-[#5A1020]'
                              : 'bg-white border-stone-200 hover:border-[#C9A45C]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-serif font-bold text-sm text-[#5A1020]">Size / Color Exchange</span>
                            <Sparkles size={16} className="text-[#C9A45C]" />
                          </div>
                          <p className="text-[11px] text-gray-600 leading-relaxed">
                            Doorstep replacement for a different size or shade with complimentary white-glove logistics.
                          </p>
                        </div>

                        <div
                          onClick={() => { setType('RETURN'); setResolution('STORE_CREDIT') }}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            type === 'RETURN'
                              ? 'bg-[#5A1020]/5 border-[#5A1020] ring-1 ring-[#5A1020]'
                              : 'bg-white border-stone-200 hover:border-[#C9A45C]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-serif font-bold text-sm text-[#1A0B10]">Return & Refund</span>
                            <RotateCcw size={16} className="text-gray-400" />
                          </div>
                          <p className="text-[11px] text-gray-600 leading-relaxed">
                            Return the ensemble for instant AGVIA Store Privilege Credit or refund to original payment.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Select Reason & Feedback */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1A0B10] uppercase tracking-wider mb-2">
                        Select Primary Reason
                      </label>
                      <div className="space-y-2">
                        {REASONS.map(r => (
                          <div
                            key={r.id}
                            onClick={() => setReason(r.id)}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                              reason === r.id
                                ? 'bg-[#5A1020]/5 border-[#5A1020] ring-1 ring-[#5A1020]'
                                : 'bg-white border-stone-200 hover:border-[#C9A45C]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-serif text-xs font-bold text-[#1A0B10]">{r.label}</span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${reason === r.id ? 'border-[#5A1020] bg-[#5A1020] text-white' : 'border-gray-300'}`}>
                                {reason === r.id && <CheckCircle2 size={10} />}
                              </div>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">{r.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1A0B10] uppercase tracking-wider mb-1">
                        Fitting & Notes for Master Tailor (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={customerNotes}
                        onChange={e => setCustomerNotes(e.target.value)}
                        placeholder="e.g. Sleeves are 1 inch longer than preferred; need standard size L fit."
                        className="w-full p-3 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-[#5A1020]"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: Resolution Choice */}
                {step === 3 && (
                  <div className="space-y-4">
                    {type === 'EXCHANGE' ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-[#1A0B10] uppercase tracking-wider mb-2">
                            Select Replacement Size
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {SIZES.map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setTargetSize(s)}
                                className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                                  targetSize === s
                                    ? 'bg-[#5A1020] text-white border-[#5A1020] shadow-xs'
                                    : 'bg-white text-gray-700 border-stone-200 hover:border-[#C9A45C]'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#1A0B10] uppercase tracking-wider mb-1">
                            Preferred Color / Variant (Optional)
                          </label>
                          <input
                            type="text"
                            value={targetColor}
                            onChange={e => setTargetColor(e.target.value)}
                            placeholder="e.g., Royal Navy Blue, Crimson Maroon"
                            className="w-full p-3 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-[#5A1020]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-[#1A0B10] uppercase tracking-wider">
                          Choose Refund Resolution
                        </label>

                        {/* Store Privilege Credit (+5% VIP Bonus) */}
                        <div
                          onClick={() => setResolution('STORE_CREDIT')}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden ${
                            resolution === 'STORE_CREDIT'
                              ? 'bg-amber-50/50 border-[#C9A45C] ring-1 ring-[#C9A45C]'
                              : 'bg-white border-stone-200 hover:border-[#C9A45C]'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-serif font-bold text-sm text-[#5A1020]">
                                  AGVIA Store Privilege Credit
                                </span>
                                <span className="bg-[#5A1020] text-[#C9A45C] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  +5% Bonus
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-600 mt-1">
                                Instant privilege voucher code credited upon pickup inspection with <strong>+5% extra shopping bonus</strong>. No expiry for 12 months.
                              </p>
                            </div>
                            <Tag size={18} className="text-[#C9A45C] shrink-0" />
                          </div>
                        </div>

                        {/* Original Payment */}
                        <div
                          onClick={() => setResolution('ORIGINAL_PAYMENT')}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            resolution === 'ORIGINAL_PAYMENT'
                              ? 'bg-[#5A1020]/5 border-[#5A1020] ring-1 ring-[#5A1020]'
                              : 'bg-white border-stone-200 hover:border-[#C9A45C]'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-serif font-bold text-sm text-[#1A0B10]">
                                Original Payment Mode
                              </span>
                              <p className="text-[11px] text-gray-600 mt-1">
                                {order.paymentMethod === 'COD'
                                  ? 'Refund transferred to your verified Bank Account / UPI ID within 3–5 working days.'
                                  : 'Refund processed directly back to your source card / UPI via Razorpay.'}
                              </p>
                            </div>
                            <CreditCard size={18} className="text-gray-400 shrink-0" />
                          </div>
                        </div>

                        {resolution === 'ORIGINAL_PAYMENT' && order.paymentMethod === 'COD' && (
                          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                            <label className="block text-[11px] font-bold text-gray-700">
                              UPI ID or Bank Details for Transfer
                            </label>
                            <input
                              type="text"
                              value={bankDetails}
                              onChange={e => setBankDetails(e.target.value)}
                              placeholder="e.g. UPI ID (patron@okhdfcbank) or IFSC & Account Number"
                              className="w-full p-2.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#5A1020]"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4: Pickup Address & Review */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1A0B10] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Truck size={14} className="text-[#5A1020]" /> Confirm Doorstep Pickup Address
                      </label>
                      <textarea
                        rows={2}
                        value={pickupAddress}
                        onChange={e => setPickupAddress(e.target.value)}
                        placeholder="Complete postal address for courier pickup"
                        className="w-full p-3 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-[#5A1020]"
                      />
                    </div>

                    <div className="p-4 bg-[#FAF7F2] border border-[#C9A45C]/20 rounded-2xl space-y-2 text-xs">
                      <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
                        <span className="text-gray-500">Order Reference:</span>
                        <span className="font-mono font-bold text-[#5A1020]">{order.orderNumber || order.id}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
                        <span className="text-gray-500">Item Selected:</span>
                        <span className="font-semibold text-gray-800">{activeItem?.name || 'Garment Silhouette'}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
                        <span className="text-gray-500">Request Type:</span>
                        <span className="font-bold uppercase text-[#5A1020]">{type}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
                        <span className="text-gray-500">Selected Resolution:</span>
                        <span className="font-semibold text-gray-800">
                          {type === 'EXCHANGE' ? `Size Exchange to ${targetSize}` : (resolution === 'STORE_CREDIT' ? 'Store Privilege Credit (+5% bonus)' : 'Original Mode Refund')}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-gray-500">Estimated Pickup:</span>
                        <span className="font-medium text-emerald-700">Within 24–48 Business Hours</span>
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center gap-2.5 text-[11px] text-gray-600">
                      <ShieldCheck size={18} className="text-[#C9A45C] shrink-0" />
                      <span>Complimentary reverse shipping. Please keep price tags attached and garment folded in original muslin packaging.</span>
                    </div>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="py-2.5 px-4 bg-[#FAF7F2] text-gray-700 hover:bg-stone-200 rounded-xl text-xs font-bold transition-all"
                    >
                      Back
                    </button>
                  ) : <div />}

                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step + 1)}
                      className="py-2.5 px-5 bg-[#5A1020] hover:bg-[#72152b] text-[#FAF7F2] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <span>Continue</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmit}
                      className="py-2.5 px-6 bg-[#5A1020] hover:bg-[#72152b] disabled:bg-gray-400 text-[#FAF7F2] rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Registering Request...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Submit Request</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
