import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Star, Check, X, RefreshCw, FileText } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import DataTable from '../../components/admin/DataTable'
import { adminService } from '../../services/adminService'
import { exportTableToPDF } from '../../utils/pdfExportUtils'

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const loadReviews = async () => {
    setLoading(true)
    try {
      const data = await adminService.getReviews()
      setReviews(data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load reviews.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadReviews() }, [])

  const handleModerate = async (id, approved) => {
    try {
      await adminService.moderateReview(id, approved)
      if (!approved) {
        setReviews((list) => list.filter((r) => r.id !== id))
        toast.success('Review removed successfully')
      } else {
        setReviews((list) => list.map((r) => (r.id === id ? { ...r, approved: true } : r)))
        toast.success('Review approved for display')
      }
    } catch (err) {
      toast.error('Action failed')
    }
  }

  const handleExport = async () => {
    if (reviews.length === 0) {
      toast.error('No reviews available to export.')
      return
    }
    toast.loading('Generating reviews PDF...', { id: 'rev-pdf' })
    try {
      const exportCols = [
        { key: 'product', label: 'Silhouette' },
        { key: 'customer', label: 'Patron' },
        { key: 'rating', label: 'Score' },
        { key: 'comment', label: 'Review Statement' },
        { key: 'statusText', label: 'Moderation Status' }
      ]
      const sanitizedReviews = reviews.map(r => ({
        ...r,
        rating: `${Number(r.rating || 5).toFixed(1)} / 5.0`,
        statusText: r.approved ? 'Approved' : 'Pending Moderation'
      }))
      await exportTableToPDF('AGVIA Patron Feedback & Reviews', exportCols, sanitizedReviews, 'agvia_patron_reviews')
      toast.success(`Exported ${reviews.length} reviews to branded PDF!`, {
        id: 'rev-pdf',
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF document.', { id: 'rev-pdf' })
    }
  }

  const columns = [
    { 
      key: 'product', 
      label: 'Silhouette',
      render: (r) => <span className="font-serif font-bold text-[#5A1020] text-xs sm:text-sm whitespace-nowrap">{r.product}</span>
    },
    { 
      key: 'customer', 
      label: 'Patron',
      render: (r) => <span className="font-bold text-xs text-[#211D1E] whitespace-nowrap">{r.customer}</span>
    },
    { 
      key: 'rating', 
      label: 'Score', 
      render: (r) => (
        <span className="flex items-center gap-1 text-[#C9A45C] font-semibold text-xs whitespace-nowrap">
          <Star size={13} fill="currentColor" /> {Number(r.rating || 5).toFixed(1)}
        </span>
      ) 
    },
    { 
      key: 'comment', 
      label: 'Review Statement',
      render: (r) => <span className="text-xs text-[#211D1E]/75 max-w-[220px] truncate block">{r.comment || '—'}</span>
    },
    {
      key: 'status', 
      label: 'Moderation', 
      render: (r) => (
        r.approved
          ? <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 whitespace-nowrap">Approved</span>
          : (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <button 
                onClick={() => handleModerate(r.id, true)} 
                className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition-all flex items-center justify-center touch-target"
                title="Approve Review"
              >
                <Check size={13} />
              </button>
              <button 
                onClick={() => handleModerate(r.id, false)} 
                className="w-7 h-7 rounded-lg bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-100 transition-all flex items-center justify-center touch-target"
                title="Reject Review"
              >
                <X size={13} />
              </button>
            </div>
          )
      ),
    },
  ]

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 select-none font-body">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A1020]">Patron Reviews</h2>
          <p className="text-xs text-[#211D1E]/60 mt-1">Moderate client reviews, comments, and rating scores submitted to the storefront.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Export Reviews Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#C9A45C]/40 bg-[#FFFDF8] hover:bg-[#5A1020] text-[#5A1020] hover:text-white text-xs font-bold uppercase tracking-wider transition-all shadow-2xs touch-target"
            title="Download Reviews PDF"
          >
            <FileText size={13} className="text-[#C9A45C]" />
            <span>Export Reviews (PDF)</span>
          </button>

          <button
            onClick={loadReviews}
            disabled={loading}
            className="btn-outline !py-2 !px-3 sm:!px-4 text-xs font-bold tracking-widest flex items-center gap-1.5 touch-target"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> 
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#211D1E]/50 animate-pulse font-body">
          Retrieving patron feedback...
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          rows={reviews} 
          title="Storefront Reviews"
          emptyMessage="No reviews submitted yet." 
          exportFilename="agvia_patron_reviews"
        />
      )}
    </AdminLayout>
  )
}
