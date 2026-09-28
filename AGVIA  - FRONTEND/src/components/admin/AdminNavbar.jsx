import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { LogOut, Bell, Menu, Download, Database, FileText, ChevronDown, CheckCircle2, X } from 'lucide-react'
import { loggedOut } from '../../store/authSlice'
import { adminService } from '../../services/adminService'
import { 
  exportOrdersPDF, 
  exportCustomersPDF, 
  exportProductsPDF, 
  exportInventoryPDF, 
  exportCouponsPDF, 
  exportSubscriptionsPDF 
} from '../../utils/pdfExportUtils'
import { exportToJSON } from '../../utils/exportUtils'
import toast from 'react-hot-toast'

export default function AdminNavbar({ onMenuToggle }) {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    dispatch(loggedOut())
    navigate('/admin/login')
  }

  const handleDownloadDataset = async (type) => {
    setExporting(true)
    toast.loading('Compiling luxury branded PDF report...', { id: 'pdf-dl' })
    try {
      if (type === 'orders') {
        const data = await adminService.getOrders()
        if (!data || data.length === 0) throw new Error('No orders found to download.')
        await exportOrdersPDF(data)
        toast.success(`Generated official PDF for ${data.length} orders!`, { id: 'pdf-dl' })
      } else if (type === 'customers') {
        const data = await adminService.getCustomers()
        if (!data || data.length === 0) throw new Error('No patrons found to download.')
        await exportCustomersPDF(data)
        toast.success(`Generated official PDF for ${data.length} patrons!`, { id: 'pdf-dl' })
      } else if (type === 'products') {
        const data = await adminService.getProducts()
        if (!data || data.length === 0) throw new Error('No products found to download.')
        await exportProductsPDF(data)
        toast.success(`Generated official PDF for ${data.length} silhouettes!`, { id: 'pdf-dl' })
      } else if (type === 'inventory') {
        const data = await adminService.getInventory()
        if (!data || data.length === 0) throw new Error('No inventory records found.')
        await exportInventoryPDF(data)
        toast.success(`Generated official PDF for ${data.length} inventory items!`, { id: 'pdf-dl' })
      } else if (type === 'coupons') {
        const data = await adminService.getCoupons()
        if (!data || data.length === 0) throw new Error('No coupons found.')
        await exportCouponsPDF(data)
        toast.success(`Generated official PDF for ${data.length} privilege codes!`, { id: 'pdf-dl' })
      } else if (type === 'subscriptions') {
        const res = await adminService.getSubscriptions({ size: 100 })
        const list = res?.content || []
        if (list.length === 0) throw new Error('No subscriptions found.')
        await exportSubscriptionsPDF(list)
        toast.success(`Generated official PDF for ${list.length} subscribers!`, { id: 'pdf-dl' })
      } else if (type === 'all_json') {
        toast.loading('Packaging full atelier system archive...', { id: 'pdf-dl' })
        const [orders, customers, products, inventory, coupons, categories] = await Promise.allSettled([
          adminService.getOrders(),
          adminService.getCustomers(),
          adminService.getProducts(),
          adminService.getInventory(),
          adminService.getCoupons(),
          adminService.getCategories(),
        ])
        const backupData = {
          exportDate: new Date().toISOString(),
          system: 'AGVIA Haute Couture Atelier ERP',
          orders: orders.status === 'fulfilled' ? orders.value : [],
          customers: customers.status === 'fulfilled' ? customers.value : [],
          products: products.status === 'fulfilled' ? products.value : [],
          inventory: inventory.status === 'fulfilled' ? inventory.value : [],
          coupons: coupons.status === 'fulfilled' ? coupons.value : [],
          categories: categories.status === 'fulfilled' ? categories.value : [],
        }
        exportToJSON(backupData, 'agvia_complete_atelier_backup')
        toast.success('Complete atelier JSON archive downloaded!', { id: 'pdf-dl' })
      }
      setExportOpen(false)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Export failed.', { id: 'pdf-dl' })
    } finally {
      setExporting(false)
    }
  }

  return (
    <header className="h-16 sm:h-20 bg-white/95 backdrop-blur-md border-b border-[#C9A45C]/20 flex items-center justify-between px-3 sm:px-6 md:px-8 sticky top-0 z-30 select-none">
      {/* Left: Mobile Toggle & Brand / Welcome */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        <button 
          onClick={onMenuToggle}
          className="lg:hidden touch-target min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center rounded-xl text-[#211D1E]/80 hover:text-[#5A1020] hover:bg-[#5A1020]/10 transition-colors"
          aria-label="Open Sidebar"
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0">
          <h1 className="font-serif text-sm sm:text-lg md:text-xl text-[#5A1020] font-bold leading-tight truncate">
            Welcome, <span className="text-[#C9A45C]">{user?.name || 'Atelier Director'}</span>
          </h1>
          <p className="text-[8.5px] sm:text-[9.5px] text-[#211D1E]/50 tracking-wider uppercase font-bold mt-0.5 truncate hidden xs:block">
            AGVIA Boutique Workspace Active
          </p>
        </div>
      </div>
      
      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Global Download / Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportOpen(prev => !prev)}
            disabled={exporting}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-[#C9A45C]/35 bg-[#FFFDF8] hover:bg-[#5A1020] text-[#5A1020] hover:text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all shadow-2xs touch-target"
            title="Download Atelier Documents in PDF"
          >
            <Download size={13} className={exporting ? 'animate-bounce' : ''} />
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
            <ChevronDown size={11} className={`transition-transform duration-200 ${exportOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Export Dropdown Menu */}
          {exportOpen && (
            <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-xl border border-[#C9A45C]/30 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2 border-b border-[#C9A45C]/15 flex items-center justify-between">
                <div>
                  <p className="font-serif text-xs font-bold text-[#5A1020] uppercase tracking-wider">Download Luxury PDF</p>
                  <p className="text-[9.5px] text-[#211D1E]/50">Company-themed certified documents</p>
                </div>
                <button onClick={() => setExportOpen(false)} className="text-[#211D1E]/40 hover:text-[#5A1020] p-1">
                  <X size={14} />
                </button>
              </div>

              <div className="py-1">
                {[
                  { id: 'orders', label: 'Atelier Orders (PDF)', desc: 'Official order dispatch log & bills' },
                  { id: 'customers', label: 'Patrons & Clients (PDF)', desc: 'Client directory & lifetime spend' },
                  { id: 'products', label: 'Couture Silhouettes (PDF)', desc: 'Haute couture catalog & prices' },
                  { id: 'inventory', label: 'Fabric & Stock Audit (PDF)', desc: 'Inventory counts & low stock alerts' },
                  { id: 'coupons', label: 'Privilege Codes (PDF)', desc: 'Promo codes, discounts, validity' },
                  { id: 'subscriptions', label: 'VIP Circle Register (PDF)', desc: 'VIP memberships & validity' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleDownloadDataset(item.id)}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#FAF7F2] flex items-center gap-2.5 transition-colors group"
                  >
                    <FileText size={15} className="text-[#C9A45C] group-hover:text-[#5A1020] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#211D1E] group-hover:text-[#5A1020] truncate">{item.label}</p>
                      <p className="text-[9px] text-[#211D1E]/45 truncate">{item.desc}</p>
                    </div>
                  </button>
                ))}

                <div className="my-1 border-t border-[#C9A45C]/15" />

                <button
                  onClick={() => handleDownloadDataset('all_json')}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#5A1020]/10 flex items-center gap-2.5 transition-colors group"
                >
                  <Database size={15} className="text-[#5A1020] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#5A1020] truncate">Full Database Archive (.JSON)</p>
                    <p className="text-[9px] text-[#211D1E]/45 truncate">Unified raw JSON backup</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button 
          className="touch-target w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-[#5A1020]/10 text-[#5A1020] hover:text-[#C9A45C] transition-colors relative"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#C9A45C] rounded-full" />
        </button>

        {/* Logout */}
        <button 
          onClick={handleLogout} 
          className="touch-target px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-[#5A1020]/30 hover:bg-[#5A1020] text-[#5A1020] hover:text-white transition-all shadow-2xs"
          title="Sign out of atelier admin"
        >
          <LogOut size={13} /> 
          <span className="hidden xs:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
