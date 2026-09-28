import { useState, useMemo } from 'react'
import { FileText, Search } from 'lucide-react'
import { exportTableToPDF } from '../../utils/pdfExportUtils'
import toast from 'react-hot-toast'

export default function DataTable({ 
  columns, 
  rows = [], 
  emptyMessage = 'No records found.',
  title = null,
  enableExport = true,
  exportFilename = 'agvia_table_export',
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchKeys = null
}) {
  const [search, setSearch] = useState('')
  const [downloading, setDownloading] = useState(false)

  // Filter rows based on search query if enabled
  const filteredRows = useMemo(() => {
    if (!searchable || !search.trim()) return rows
    const q = search.toLowerCase().trim()
    return rows.filter((row) => {
      if (searchKeys && Array.isArray(searchKeys)) {
        return searchKeys.some(k => String(row[k] || '').toLowerCase().includes(q))
      }
      return Object.values(row).some(val => {
        if (val === null || val === undefined) return false
        if (typeof val === 'object') return false
        return String(val).toLowerCase().includes(q)
      })
    })
  }, [rows, search, searchable, searchKeys])

  const handleExportPDF = async () => {
    try {
      if (filteredRows.length === 0) {
        toast.error('No rows available to generate PDF.')
        return
      }
      setDownloading(true)
      toast.loading('Compiling luxury branded PDF...', { id: 'pdf-gen' })
      
      // Filter out non-renderable raw actions or images for table export
      const pdfCols = columns.filter(c => c.key !== 'actions' && c.key !== 'image')
      await exportTableToPDF(pdfCols, filteredRows, title || 'Atelier Report', exportFilename)
      
      toast.success(`Generated luxury PDF with ${filteredRows.length} records!`, {
        id: 'pdf-gen',
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF document.', { id: 'pdf-gen' })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden select-none">
      {/* Table Header Action Bar */}
      {(title || enableExport || searchable) && (
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 bg-[#FAF7F2]/60 border-b border-[#C9A45C]/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            {title && (
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#5A1020] uppercase tracking-wider">
                {title}
              </h3>
            )}
            <span className="text-[10px] font-sans font-semibold px-2.5 py-0.5 rounded-full bg-[#5A1020]/10 text-[#5A1020] border border-[#5A1020]/15">
              {filteredRows.length} {filteredRows.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Input */}
            {searchable && (
              <div className="relative flex-1 sm:w-56 md:w-64">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#211D1E]/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#C9A45C]/30 bg-white text-xs text-[#211D1E] placeholder:text-[#211D1E]/40 focus:outline-none focus:border-[#5A1020] focus:ring-1 focus:ring-[#5A1020] transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#211D1E]/40 hover:text-[#5A1020]"
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            {/* Branded PDF Download Button */}
            {enableExport && (
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={downloading || filteredRows.length === 0}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#C9A45C]/40 bg-white hover:bg-[#5A1020] text-[#5A1020] hover:text-white text-[11px] font-bold uppercase tracking-wider transition-all duration-200 shadow-2xs disabled:opacity-40 disabled:pointer-events-none touch-target"
                title="Download Branded PDF Document"
              >
                <FileText size={13} />
                <span><span className="hidden xs:inline">Download</span> PDF</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Responsive Horizontal Scroll Container */}
      <div className="overflow-x-auto w-full scrollbar-thin">
        <table className="w-full text-left border-collapse min-w-[640px] sm:min-w-[720px]">
          <thead>
            <tr className="bg-[#FAF7F2]/80 border-b border-[#C9A45C]/15">
              {columns.map((col) => (
                <th 
                  key={col.key} 
                  className="px-3.5 sm:px-6 py-3 sm:py-3.5 font-sans text-[10px] sm:text-[11px] tracking-widest font-bold text-[#5A1020] uppercase whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#C9A45C]/10 bg-white">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 sm:px-6 py-12 text-center font-sans text-xs text-[#211D1E]/45 italic">
                  {search ? 'No matching records found for this query.' : emptyMessage}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, i) => (
                <tr 
                  key={row.id ?? i} 
                  className="hover:bg-[#FAF7F2]/50 transition-colors duration-150"
                >
                  {columns.map((col) => (
                    <td 
                      key={col.key} 
                      className="px-3.5 sm:px-6 py-3 sm:py-4 whitespace-nowrap font-sans text-xs text-[#211D1E]/85 align-middle"
                    >
                      {col.render ? col.render(row) : (
                        col.key === 'status' ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                            String(row[col.key]).toUpperCase().includes('DELIVERED') || String(row[col.key]).toUpperCase().includes('PAID') || String(row[col.key]).toUpperCase().includes('ACTIVE') || String(row[col.key]).toUpperCase().includes('CONFIRMED')
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : String(row[col.key]).toUpperCase().includes('PROCESSING') || String(row[col.key]).toUpperCase().includes('SHIPPED')
                                ? 'bg-[#C9A45C]/10 text-[#A67D28] border-[#C9A45C]/30'
                                : String(row[col.key]).toUpperCase().includes('CANCELLED') || String(row[col.key]).toUpperCase().includes('REFUNDED') || String(row[col.key]).toUpperCase().includes('FAILED')
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {row[col.key]}
                          </span>
                        ) : row[col.key]
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Scroll Hint */}
      <div className="sm:hidden px-3.5 py-2 bg-[#FAF7F2]/40 border-t border-[#C9A45C]/10 flex items-center justify-between text-[10px] text-[#211D1E]/40 font-sans">
        <span>Showing {filteredRows.length} items</span>
        <span className="italic">Swipe sideways to view full details →</span>
      </div>
    </div>
  )
}
