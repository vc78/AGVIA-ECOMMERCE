import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { X, Printer, Download, QrCode, ShieldCheck, Truck, AlertTriangle, CheckCircle2, Scissors } from 'lucide-react'
import { BUSINESS } from '../../constants/business'
import { exportOrderParcelReceiptPDF } from '../../utils/pdfExportUtils'
import { adminService } from '../../services/adminService'
import toast from 'react-hot-toast'

export default function ParcelReceiptModal({ order, isOpen, onClose }) {
  const [fullOrder, setFullOrder] = useState(order)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (!isOpen || !order) return

    setFullOrder(order)

    // Generate unique QR Code for this order
    const siteUrl = typeof window !== 'undefined' && window.location?.origin 
      ? window.location.origin 
      : 'https://agvia-ecommerce.vercel.app'
    const trackingRef = order.orderNumber || `#${order.id}`
    const trackingUrl = `${siteUrl}/track-order?order=${encodeURIComponent(trackingRef)}`

    QRCode.toDataURL(trackingUrl, {
      width: 256,
      margin: 1,
      color: {
        dark: '#211D1E',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR code generation error:', err))

    // If order is missing itemized list or shipping address, fetch full order
    if ((!order.itemsList || order.itemsList.length === 0 || !order.shippingAddress) && order.id) {
      setLoadingDetails(true)
      adminService.getOrderById(order.id)
        .then(res => {
          if (res) setFullOrder(res)
        })
        .catch(err => console.warn('Could not fetch full order details:', err))
        .finally(() => setLoadingDetails(false))
    }
  }, [isOpen, order])

  if (!isOpen || !order) return null

  const isCOD = String(fullOrder.paymentMethod || fullOrder.payment || '').toUpperCase().includes('COD')
  const trackingRef = fullOrder.orderNumber || `#${fullOrder.id}`
  const subtotal = Number(fullOrder.subtotal || fullOrder.total || 0)
  const discount = Number(fullOrder.discountAmount || 0)
  const grandTotal = Number(fullOrder.total || 0)
  const gstEstimated = Math.round(grandTotal * 0.05 / 1.05)

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true)
      toast.loading(`Compiling parcel slip for #${trackingRef}...`, { id: 'modal-pdf' })
      await exportOrderParcelReceiptPDF(fullOrder)
      toast.success(`Downloaded parcel receipt with unique QR!`, {
        id: 'modal-pdf',
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to export PDF receipt.', { id: 'modal-pdf' })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#C9A45C]/30 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Control Bar (Hidden during Print) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#5A1020] text-[#FAF7F2] border-b border-[#C9A45C]/30 print:hidden select-none">
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-[#C9A45C]" />
            <h3 className="font-serif font-bold text-sm sm:text-base tracking-wide">
              Official Parcel Dispatch Slip & Receipt
            </h3>
            <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-[#C9A45C]/20 text-[#FAF7F2] border border-[#C9A45C]/30">
              {trackingRef}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-[#FAF7F2] transition-all touch-target"
              title="Print directly to sticker/thermal printer"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print Slip</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C9A45C] hover:bg-[#A67D28] text-xs font-bold text-[#5A1020] transition-all touch-target shadow-xs"
              title="Download high-resolution PDF"
            >
              <Download size={14} className={isDownloading ? 'animate-bounce' : ''} />
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all touch-target ml-1"
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Parcel Slip Canvas */}
        <div className="overflow-y-auto p-5 sm:p-8 space-y-5 font-body print:p-0 print:overflow-visible">
          <div className="border border-[#C9A45C]/40 rounded-2xl p-5 sm:p-6 bg-[#FFFDF8] relative overflow-hidden print:border print:rounded-none">
            
            {/* Top Luxury Banner */}
            <div className="bg-[#5A1020] -m-5 sm:-m-6 mb-4 p-3.5 px-5 flex items-center justify-between text-[#FAF7F2] border-b-2 border-[#C9A45C]">
              <div>
                <span className="font-serif font-bold text-sm tracking-wider uppercase text-[#C9A45C]">AGVIA</span>
                <span className="text-[10px] text-white/70 ml-2 hidden sm:inline">• HAUTE COUTURE ATELIER DISPATCH</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#FAF7F2]/90">
                  OFFICIAL PARCEL PACKING SLIP & TAX INVOICE
                </span>
              </div>
            </div>

            {/* Header: Brand & QR Code */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#C9A45C]/20">
              <div>
                <h1 className="font-serif text-2xl font-bold text-[#5A1020] tracking-wide">AGVIA</h1>
                <p className="text-[11px] text-[#211D1E]/70 font-medium">Boutique Luxury Women's Wear & Atelier Dispatches</p>
                <p className="text-[10px] text-[#211D1E]/50 mt-1 font-mono">
                  GSTIN: 36AAHCA1234F1Z5 | CIN: U18101TG2026PTC099882
                </p>
              </div>

              {/* Unique Scannable QR Code */}
              <div className="flex flex-col items-center sm:items-end">
                <div className="p-1.5 bg-white border border-[#C9A45C]/40 rounded-xl shadow-xs">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="Order Tracking QR" 
                      className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                      Generating QR...
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-bold text-[#5A1020] tracking-wider uppercase mt-1 flex items-center gap-1">
                  <QrCode size={10} className="text-[#C9A45C]" /> Scan to Track / Verify
                </span>
              </div>
            </div>

            {/* Order Metadata Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF7F2] p-3 rounded-xl border border-[#C9A45C]/20 my-4 text-xs">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-[#211D1E]/60 font-semibold block">Order Reference</span>
                <span className="font-mono font-bold text-[#5A1020] text-sm">{trackingRef}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-[#211D1E]/60 font-semibold block">Placement Date</span>
                <span className="font-semibold text-[#211D1E]">{fullOrder.date || '—'}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-[#211D1E]/60 font-semibold block">Fulfillment</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px] inline-block mt-0.5">
                  {String(fullOrder.status || 'READY').toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-[#211D1E]/60 font-semibold block">Logistics Carrier</span>
                <span className="font-semibold text-[#211D1E] flex items-center gap-1">
                  <Truck size={12} className="text-[#C9A45C]" /> Express Partner
                </span>
              </div>
            </div>

            {/* Address Columns: SHIP TO vs SHIP FROM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
              {/* Ship To */}
              <div className="border border-[#5A1020]/30 rounded-xl p-3.5 bg-white relative">
                <span className="text-[9px] font-bold uppercase tracking-wider bg-[#5A1020] text-[#FAF7F2] px-2 py-0.5 rounded-full absolute -top-2.5 left-3">
                  Ship To (Consignee)
                </span>
                <h4 className="font-bold text-sm text-[#5A1020] mt-1">{fullOrder.customer || 'Valued Patron'}</h4>
                <p className="text-xs text-[#211D1E]/80 mt-1 whitespace-pre-wrap leading-relaxed">
                  {fullOrder.shippingAddress || 'Customer Delivery Address on Record'}
                </p>
                <div className="mt-2.5 pt-2 border-t border-gray-100 text-[11px] text-[#211D1E]/70 space-y-0.5 font-medium">
                  <p><span className="text-gray-400">Phone:</span> {fullOrder.contactPhone || 'Contact verified on account'}</p>
                  {fullOrder.userEmail && <p><span className="text-gray-400">Email:</span> {fullOrder.userEmail}</p>}
                </div>
              </div>

              {/* Ship From */}
              <div className="border border-[#C9A45C]/30 rounded-xl p-3.5 bg-white relative">
                <span className="text-[9px] font-bold uppercase tracking-wider bg-[#C9A45C] text-[#5A1020] px-2 py-0.5 rounded-full absolute -top-2.5 left-3">
                  Return & Dispatch (Consignor)
                </span>
                <h4 className="font-bold text-sm text-[#5A1020] mt-1">AGVIA ATELIER DISPATCH CENTER</h4>
                <p className="text-xs text-[#211D1E]/80 mt-1 leading-relaxed">
                  {BUSINESS.location.street}, {BUSINESS.location.city}, {BUSINESS.location.state} - {BUSINESS.location.pincode}
                </p>
                <div className="mt-2.5 pt-2 border-t border-gray-100 text-[11px] text-[#211D1E]/70 space-y-0.5 font-medium">
                  <p><span className="text-gray-400">Concierge Helpline:</span> {BUSINESS.contact.phone}</p>
                  <p><span className="text-gray-400">Official Support:</span> {BUSINESS.contact.email}</p>
                </div>
              </div>
            </div>

            {/* Payment Callout Banner (Critical for Delivery Agent) */}
            <div className={`p-3 rounded-xl border flex items-center justify-between my-4 ${
              isCOD 
                ? 'bg-amber-50/80 border-amber-300 text-amber-900' 
                : 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
            }`}>
              <div className="flex items-center gap-2">
                {isCOD ? (
                  <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider block">
                    {isCOD ? 'CASH ON DELIVERY (COD) SHIPMENT' : 'PREPAID CONSIGNMENT'}
                  </span>
                  <span className="text-[10px] text-[#211D1E]/60">
                    {isCOD ? 'Collect the exact gross cash amount upon delivery hand-off.' : 'DO NOT collect any payment from the customer.'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Amount to Collect</span>
                <span className={`font-mono font-bold text-base sm:text-lg ${isCOD ? 'text-amber-800' : 'text-emerald-700'}`}>
                  {isCOD ? `₹${grandTotal.toLocaleString('en-IN')}` : '₹0.00 (PAID)'}
                </span>
              </div>
            </div>

            {/* Itemized Manifest Table */}
            <div className="my-4 border border-[#C9A45C]/20 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#5A1020] text-[#FAF7F2] text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">#</th>
                    <th className="py-2.5 px-3">Description of Apparel</th>
                    <th className="py-2.5 px-3 text-center w-16">Qty</th>
                    <th className="py-2.5 px-3 text-right w-28">Rate (INR)</th>
                    <th className="py-2.5 px-3 text-right w-28">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A45C]/15 bg-white">
                  {Array.isArray(fullOrder.itemsList) && fullOrder.itemsList.length > 0 ? (
                    fullOrder.itemsList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F2]/50">
                        <td className="py-2 px-3 text-center text-[#211D1E]/50 font-mono text-[10px]">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-[#211D1E]">
                          {item.productName || item.title || `Luxury Atelier Piece #${item.productId || idx + 1}`}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold">{item.quantity || 1}</td>
                        <td className="py-2 px-3 text-right font-mono text-[#211D1E]/70">
                          ₹{Number(item.price || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-[#5A1020]">
                          ₹{Number(item.subtotal || (item.price * (item.quantity || 1)) || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2.5 px-3 text-center font-mono text-[10px]">1</td>
                      <td className="py-2.5 px-3 font-semibold text-[#211D1E]">
                        AGVIA Curated Luxury Women's Wear Ensemble ({fullOrder.items || 1} Piece/Set)
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">{fullOrder.items || 1}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#211D1E]/70">₹{subtotal.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#5A1020]">₹{subtotal.toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Totals (Right Aligned) */}
            <div className="flex justify-end my-4">
              <div className="w-full sm:w-72 bg-white border border-[#C9A45C]/30 rounded-xl p-3 text-xs space-y-1.5 shadow-2xs">
                <div className="flex justify-between text-[#211D1E]/70">
                  <span>Merchandise Subtotal:</span>
                  <span className="font-mono font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount ({fullOrder.couponCode || 'PROMO'}):</span>
                    <span className="font-mono">-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#211D1E]/70">
                  <span>Express Courier & Insurance:</span>
                  <span className="font-semibold text-emerald-700">FREE</span>
                </div>
                <div className="flex justify-between text-[#211D1E]/50 text-[10px]">
                  <span>GST Included (5% IGST/CGST):</span>
                  <span className="font-mono">₹{gstEstimated.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-[#C9A45C]/30 flex justify-between text-sm font-bold text-[#5A1020]">
                  <span>Total Invoice Amount:</span>
                  <span className="font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Cut / Fold Indicator Line (Explicit for Pasting on Parcel Box) */}
            <div className="relative my-6 text-center">
              <div className="border-t-2 border-dashed border-[#C9A45C]/60 w-full" />
              <span className="bg-[#FFFDF8] px-3 py-1 text-[9px] font-bold text-[#A67D28] tracking-widest uppercase inline-flex items-center gap-1.5 absolute -top-3 left-1/2 -translate-x-1/2 border border-[#C9A45C]/30 rounded-full">
                <Scissors size={11} /> CUT OR FOLD HERE TO ATTACH SECURELY ON CUSTOMER PARCEL <Scissors size={11} />
              </span>
            </div>

            {/* Security & Verification Stamp */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-[10px] text-[#211D1E]/60">
              <div className="space-y-0.5">
                <p className="font-bold text-[#5A1020] uppercase flex items-center gap-1">
                  <ShieldCheck size={12} className="text-[#C9A45C]" /> Tamper-Evident Luxury Seal
                </p>
                <p>Do not accept shipment if outer security ribbon is breached.</p>
                <p>For return assistance or styling inquiries: concierge@agvia.com | +91 90323 06961</p>
              </div>

              <div className="border border-[#C9A45C]/40 rounded-xl p-2.5 bg-white text-center sm:text-right shrink-0">
                <span className="text-[9px] uppercase tracking-wider text-[#A67D28] font-bold block">
                  AGVIA Quality Checked & Sealed
                </span>
                <span className="font-mono text-[9px] text-[#5A1020] font-bold">
                  SEAL: AGV-{String(fullOrder.id).padStart(4, '0')}-{fullOrder.date ? String(fullOrder.date).replace(/-/g, '') : '2026'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-5 py-3.5 bg-[#FAF7F2] border-t border-[#C9A45C]/20 flex items-center justify-between print:hidden">
          <span className="text-xs text-[#211D1E]/60 flex items-center gap-1">
            <QrCode size={13} className="text-[#C9A45C]" /> Unique QR links directly to patron order tracking.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-outline !py-2 !px-3.5 text-xs font-bold tracking-wider flex items-center gap-1.5 touch-target"
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="btn-primary !py-2 !px-4 text-xs font-bold tracking-wider flex items-center gap-1.5 touch-target"
            >
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
