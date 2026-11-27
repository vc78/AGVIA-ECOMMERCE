import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts'
import {
  IndianRupee, ShoppingBag, TrendingUp, Package,
  RefreshCw, Radio, AlertTriangle, CalendarDays,
  Star, Award, Download, FileText, Calendar, Filter, ChevronRight, CheckCircle2,
  Users, Eye, Share2, ShoppingCart, Smartphone, Monitor, Tablet, Globe, ArrowRight,
  Info, ShieldCheck, Activity, Layers, ExternalLink, HelpCircle, ChevronDown
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../services/api'
import { exportAnalyticsPDF, exportMasterAdminPDF } from '../../utils/pdfExportUtils'
import { exportMasterAdminCSV, exportAnalyticsCSV, exportToJSON } from '../../utils/exportUtils'
import { adminService } from '../../services/adminService'
import toast from 'react-hot-toast'

const BRAND_COLORS = {
  primary: '#5A1020',
  secondary: '#C9A45C',
  dark: '#211D1E',
  bg: '#FAF7F2',
  blue: '#2A4365',
  green: '#166534',
  amber: '#D97706',
  purple: '#7C3AED'
}

const PIE_COLORS = ['#5A1020', '#C9A45C', '#2A4365', '#166534', '#9333EA', '#E11D48']

function formatDateISO(d) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)
  if (seconds < 60) return `${Math.max(1, seconds)}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ── Metric Card ───────────────────────────────────────────────
function MetricCard({ title, value, sub, icon: Icon, accent = BRAND_COLORS.primary, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white border border-[#C9A45C]/20 rounded-2xl p-4 shadow-xs animate-pulse">
        <div className="flex justify-between items-center mb-3">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="h-7 bg-gray-200 rounded w-16 mb-2"></div>
        <div className="h-2.5 bg-gray-100 rounded w-28"></div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#C9A45C]/20 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-[#C9A45C]/40 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-sans text-[10px] text-[#211D1E]/60 tracking-wider uppercase font-bold truncate">
          {title}
        </span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${accent}14` }}
        >
          <Icon size={16} style={{ color: accent }} />
        </div>
      </div>
      <div>
        <p className="font-serif text-xl sm:text-2xl font-bold truncate leading-tight" style={{ color: accent }}>
          {value ?? 0}
        </p>
        {sub && (
          <p className="font-sans text-[10px] text-[#211D1E]/50 tracking-wide mt-1 truncate">
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Tooltip ───────────────────────────────────────────────────
function CustomChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#FFFDF8] border border-[#C9A45C]/40 rounded-xl px-3.5 py-2.5 shadow-xl text-xs select-none">
      <p className="font-serif font-bold text-[#5A1020] text-xs mb-1.5 border-b border-[#C9A45C]/20 pb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5 font-sans text-[11px]">
          <span className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }}></span>
            {p.name}:
          </span>
          <span className="font-bold text-[#211D1E]">
            {p.name.toLowerCase().includes('revenue')
              ? `₹${Number(p.value).toLocaleString('en-IN')}`
              : Number(p.value).toLocaleString('en-IN')}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('website') // 'website' | 'sales'
  const [activePreset, setActivePreset] = useState('today')
  const [liveSync, setLiveSync] = useState(true)
  const [lastSync, setLastSync] = useState(new Date())
  const [showDefinitions, setShowDefinitions] = useState(false)

  // Date range state
  const [startDate, setStartDate] = useState(() => formatDateISO(new Date()))
  const [endDate, setEndDate] = useState(() => formatDateISO(new Date()))
  const [customStart, setCustomStart] = useState(() => formatDateISO(new Date()))
  const [customEnd, setCustomEnd] = useState(() => formatDateISO(new Date()))

  // Loading & error states
  const [loading, setLoading] = useState(true)
  const [sectionErrors, setSectionErrors] = useState({})

  // Website Analytics Data
  const [overview, setOverview] = useState({
    visitors: 0,
    sessions: 0,
    pageViews: 0,
    productViews: 0,
    addToCart: 0,
    shares: 0,
    checkouts: 0,
    orders: 0,
    revenue: 0
  })
  const [trends, setTrends] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [topPages, setTopPages] = useState([])
  const [devices, setDevices] = useState([])
  const [sources, setSources] = useState([])
  const [funnel, setFunnel] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])

  // Legacy Sales Report Data
  const [salesReportData, setSalesReportData] = useState(null)
  const [allOrders, setAllOrders] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [allProducts, setAllProducts] = useState([])

  // Download entire admin panel lists state
  const [downloading, setDownloading] = useState(false)
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false)
  const downloadDropdownRef = useRef(null)

  const pollRef = useRef(null)

  // Close download dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target)) {
        setDownloadDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Apply Preset ──────────────────────────────────────────
  const applyPreset = (preset) => {
    setActivePreset(preset)
    const now = new Date()
    let s = new Date()
    let e = new Date()

    if (preset === 'today') {
      // s and e are today
    } else if (preset === '7days') {
      s.setDate(s.getDate() - 6)
    } else if (preset === '30days') {
      s.setDate(s.getDate() - 29)
    } else if (preset === '90days') {
      s.setDate(s.getDate() - 89)
    }

    const isoS = formatDateISO(s)
    const isoE = formatDateISO(e)
    setStartDate(isoS)
    setEndDate(isoE)
    setCustomStart(isoS)
    setCustomEnd(isoE)
  }

  const handleCustomSubmit = (e) => {
    e?.preventDefault()
    if (!customStart || !customEnd) {
      toast.error('Please enter both start and end dates.')
      return
    }
    if (new Date(customStart) > new Date(customEnd)) {
      toast.error('Start date cannot be after end date.')
      return
    }
    setActivePreset('custom')
    setStartDate(customStart)
    setEndDate(customEnd)
    toast.success(`Date filter applied: ${customStart} to ${customEnd}`)
  }

  // ── Fetch Website Analytics ───────────────────────────────
  const fetchWebsiteAnalytics = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const query = `startDate=${startDate}&endDate=${endDate}`

    try {
      const [
        overviewRes,
        trendsRes,
        productsRes,
        pagesRes,
        devicesRes,
        sourcesRes,
        funnelRes,
        recentRes
      ] = await Promise.allSettled([
        api.get(`/admin/analytics/overview?${query}`),
        api.get(`/admin/analytics/trends?${query}`),
        api.get(`/admin/analytics/products?${query}&limit=10`),
        api.get(`/admin/analytics/pages?${query}&limit=10`),
        api.get(`/admin/analytics/devices?${query}`),
        api.get(`/admin/analytics/sources?${query}`),
        api.get(`/admin/analytics/funnel?${query}`),
        api.get('/admin/analytics/recent?limit=25')
      ])

      const newErrors = {}

      if (overviewRes.status === 'fulfilled') {
        setOverview(overviewRes.value.data?.data || {})
      } else {
        newErrors.overview = true
      }

      if (trendsRes.status === 'fulfilled') {
        setTrends(trendsRes.value.data?.data || [])
      } else {
        newErrors.trends = true
      }

      if (productsRes.status === 'fulfilled') {
        setTopProducts(productsRes.value.data?.data || [])
      } else {
        newErrors.products = true
      }

      if (pagesRes.status === 'fulfilled') {
        setTopPages(pagesRes.value.data?.data || [])
      } else {
        newErrors.pages = true
      }

      if (devicesRes.status === 'fulfilled') {
        setDevices(devicesRes.value.data?.data || [])
      } else {
        newErrors.devices = true
      }

      if (sourcesRes.status === 'fulfilled') {
        setSources(sourcesRes.value.data?.data || [])
      } else {
        newErrors.sources = true
      }

      if (funnelRes.status === 'fulfilled') {
        setFunnel(funnelRes.value.data?.data || null)
      } else {
        newErrors.funnel = true
      }

      if (recentRes.status === 'fulfilled') {
        setRecentActivity(recentRes.value.data?.data || [])
      } else {
        newErrors.recent = true
      }

      setSectionErrors(newErrors)
      setLastSync(new Date())
    } catch (err) {
      console.error('Failed to load website analytics:', err)
      if (!silent) toast.error('Could not load website analytics')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [startDate, endDate])

  // ── Fetch Legacy Sales Report ─────────────────────────────
  const fetchSalesReport = useCallback(async () => {
    try {
      const [srRes, ordsRes, prodsRes, catsRes] = await Promise.allSettled([
        api.get(`/admin/analytics/sales-report?startDate=${startDate}&endDate=${endDate}`),
        api.get('/admin/orders'),
        api.get('/admin/products'),
        api.get('/admin/categories')
      ])

      if (srRes.status === 'fulfilled') setSalesReportData(srRes.value.data?.data || null)
      if (ordsRes.status === 'fulfilled') setAllOrders(ordsRes.value.data?.data?.content || ordsRes.value.data?.data || [])
      if (prodsRes.status === 'fulfilled') setAllProducts(prodsRes.value.data?.data?.content || prodsRes.value.data?.data || [])
      if (catsRes.status === 'fulfilled') setAllCategories(catsRes.value.data?.data || [])
    } catch (err) {
      console.error('Error fetching sales report data:', err)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchWebsiteAnalytics(false)
    if (activeTab === 'sales') {
      fetchSalesReport()
    }
  }, [fetchWebsiteAnalytics, fetchSalesReport, activeTab])

  // Polling when liveSync enabled (refreshes in background every 15s)
  useEffect(() => {
    if (liveSync) {
      pollRef.current = setInterval(() => {
        fetchWebsiteAnalytics(true)
      }, 15000)
    } else {
      clearInterval(pollRef.current)
    }
    return () => clearInterval(pollRef.current)
  }, [liveSync, fetchWebsiteAnalytics])

  // Trend Chart display series toggles
  const [visibleSeries, setVisibleSeries] = useState({
    visitors: true,
    pageViews: true,
    productViews: true,
    orders: false
  })

  const toggleSeries = (key) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // ── Download Entire Admin Panel Lists & Telemetry Handler ──
  const handleDownloadAll = async (format = 'pdf') => {
    setDownloading(true)
    setDownloadDropdownOpen(false)
    const toastId = toast.loading('Compiling entire admin panel records & web analytics...', { id: 'master-dl' })
    try {
      // Fetch all admin lists in parallel with full capacity
      const [
        ordersRes,
        customersRes,
        productsRes,
        inventoryRes,
        categoriesRes,
        couponsRes,
        subsRes,
        reviewsRes
      ] = await Promise.allSettled([
        adminService.getOrders({ size: 1000 }),
        adminService.getCustomers({ size: 1000 }),
        adminService.getProducts({ size: 1000 }),
        adminService.getInventory(),
        adminService.getCategories(),
        adminService.getCoupons(),
        adminService.getSubscriptions({ size: 1000 }),
        adminService.getReviews({ size: 1000 })
      ])

      const ordersData = ordersRes.status === 'fulfilled' ? (ordersRes.value || []) : (allOrders || [])
      const customersData = customersRes.status === 'fulfilled' ? (customersRes.value || []) : []
      const productsData = productsRes.status === 'fulfilled' ? (productsRes.value || []) : (allProducts || [])
      const inventoryData = inventoryRes.status === 'fulfilled' ? (inventoryRes.value || []) : []
      const categoriesData = categoriesRes.status === 'fulfilled' ? (categoriesRes.value || []) : (allCategories || [])
      const couponsData = couponsRes.status === 'fulfilled' ? (couponsRes.value || []) : []
      const subsData = subsRes.status === 'fulfilled' ? (subsRes.value?.content || (Array.isArray(subsRes.value) ? subsRes.value : [])) : []
      const reviewsData = reviewsRes.status === 'fulfilled' ? (reviewsRes.value || []) : []

      const totalCount = ordersData.length + customersData.length + productsData.length + inventoryData.length + couponsData.length + subsData.length

      if (format === 'pdf') {
        toast.loading('Generating luxury Master Atelier PDF dossier with web analytics...', { id: toastId })
        await exportMasterAdminPDF({
          startDate,
          endDate,
          overview,
          trends,
          funnel,
          topProducts,
          topPages,
          devices,
          sources,
          recentActivity,
          orders: ordersData,
          customers: customersData,
          products: productsData,
          inventory: inventoryData,
          categories: categoriesData,
          coupons: couponsData,
          subscriptions: subsData,
          reviews: reviewsData
        })
        toast.success(`Generated official Master PDF (${totalCount} records + full web analytics)!`, { id: toastId })
      } else if (format === 'csv') {
        toast.loading('Compiling Master CSV archive with full web telemetry...', { id: toastId })
        exportMasterAdminCSV({
          overview,
          trends,
          funnel,
          devices,
          sources,
          topPages,
          topProducts,
          recentActivity,
          orders: ordersData,
          customers: customersData,
          products: productsData,
          inventory: inventoryData,
          categories: categoriesData,
          coupons: couponsData,
          subscriptions: subsData,
          reviews: reviewsData,
          startDate,
          endDate
        })
        toast.success(`Exported complete Master CSV (${totalCount} records + web analytics)!`, { id: toastId })
      } else if (format === 'analytics_csv') {
        toast.loading('Exporting Web Analytics telemetry spreadsheet...', { id: toastId })
        exportAnalyticsCSV({
          overview,
          trends,
          funnel,
          devices,
          sources,
          topPages,
          topProducts,
          recentActivity,
          orders: ordersData,
          startDate,
          endDate
        })
        toast.success('Web Analytics CSV exported successfully!', { id: toastId })
      } else if (format === 'json') {
        const fullArchive = {
          exportDate: new Date().toISOString(),
          system: 'AGVIA Haute Couture Atelier ERP & Analytics Master Backup',
          status: 'Authoritative Verified Data',
          dateRange: { startDate, endDate },
          analytics: { overview, trends, funnel, topProducts, topPages, devices, sources, recentActivity },
          orders: ordersData,
          customers: customersData,
          products: productsData,
          inventory: inventoryData,
          categories: categoriesData,
          coupons: couponsData,
          subscriptions: subsData,
          reviews: reviewsData
        }
        exportToJSON(fullArchive, 'agvia_master_atelier_complete_archive')
        toast.success('Complete atelier raw JSON archive & analytics downloaded!', { id: toastId })
      } else if (format === 'analytics_only' || format === 'analytics_pdf') {
        toast.loading('Generating comprehensive Web Analytics PDF dossier...', { id: toastId })
        await exportAnalyticsPDF({
          startDate,
          endDate,
          overview,
          summary: {
            totalRevenue: overview.revenue || salesReportData?.totalRevenue || 0,
            totalOrders: overview.orders || salesReportData?.totalOrders || ordersData.length,
            aov: (overview.orders > 0) ? Math.round(overview.revenue / overview.orders) : 0,
            deliveredOrders: ordersData.filter(o => String(o.status || '').toUpperCase().includes('DELIVERED')).length,
          },
          trends,
          dailyTrend: trends,
          funnel,
          devices,
          sources,
          topPages,
          topProducts,
          recentActivity,
          orders: ordersData
        })
        toast.success('Comprehensive Website Analytics PDF exported successfully!', { id: toastId })
      }
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Failed to compile master records: ' + (err.message || 'Unknown error'), { id: toastId })
    } finally {
      setDownloading(false)
    }
  }

  // Device Pie Data formatted
  const devicePieData = useMemo(() => {
    if (!devices || devices.length === 0) return []
    return devices.map((d) => ({
      name: d.deviceType || 'Unknown',
      value: d.count || 0,
      percentage: d.percentage || 0
    }))
  }, [devices])

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 pb-12">
        {/* Top Header & Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#C9A45C]/20 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#C9A45C] font-bold">
                Atelier Intelligence
              </span>
              <span className="inline-block w-1 h-1 rounded-full bg-[#C9A45C]"></span>
              <span className="text-[10px] text-[#211D1E]/40 font-mono">Real-time telemetry</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A1020]">
              Website Analytics
            </h1>
            <p className="font-sans text-xs text-[#211D1E]/60 mt-0.5">
              Authoritative visitor sessions, catalog engagement, and checkout conversion tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tab Switcher */}
            <div className="bg-[#F2ECE4] p-1 rounded-xl flex items-center border border-[#C9A45C]/30">
              <button
                type="button"
                onClick={() => setActiveTab('website')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'website'
                    ? 'bg-[#5A1020] text-white shadow-xs'
                    : 'text-[#211D1E]/70 hover:text-[#5A1020]'
                }`}
              >
                Website Analytics
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('sales')
                  fetchSalesReport()
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'sales'
                    ? 'bg-[#5A1020] text-white shadow-xs'
                    : 'text-[#211D1E]/70 hover:text-[#5A1020]'
                }`}
              >
                Sales & Orders Report
              </button>
            </div>

            {/* Live Sync Toggle */}
            <button
              type="button"
              onClick={() => setLiveSync((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                liveSync
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-[#C9A45C]/30 text-[#211D1E]/70 hover:border-[#C9A45C]'
              }`}
              title="Toggle automatic 20-second live polling"
            >
              <Radio size={12} className={liveSync ? 'animate-pulse text-emerald-600' : 'text-[#211D1E]/40'} />
              <span>{liveSync ? 'Live Sync On' : 'Live Sync'}</span>
            </button>

            {/* Manual Refresh */}
            <button
              type="button"
              onClick={() => fetchWebsiteAnalytics(false)}
              disabled={loading}
              className="p-2 rounded-xl bg-white border border-[#C9A45C]/30 text-[#5A1020] hover:bg-[#FAF7F2] transition-colors disabled:opacity-50"
              title="Refresh Analytics"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Master Atelier Download Dropdown */}
            <div className="relative" ref={downloadDropdownRef}>
              <div className="flex items-center rounded-xl bg-[#5A1020] text-white shadow-xs overflow-hidden border border-[#5A1020]">
                <button
                  type="button"
                  onClick={() => handleDownloadAll('pdf')}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold hover:bg-[#721529] transition-colors disabled:opacity-60"
                  title="Download complete master dossier containing entire admin panel lists & web analytics"
                >
                  <Download size={13} className={downloading ? 'animate-bounce' : ''} />
                  <span className="hidden sm:inline">{downloading ? 'Compiling Dossier...' : 'Download Everything (PDF)'}</span>
                  <span className="sm:hidden">{downloading ? 'Exporting...' : 'Download All'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDownloadDropdownOpen(prev => !prev)}
                  disabled={downloading}
                  className="px-2 py-1.5 border-l border-white/20 hover:bg-[#721529] transition-colors"
                  title="Choose download format"
                >
                  <ChevronDown size={12} className={`transition-transform duration-200 ${downloadDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {downloadDropdownOpen && (
                <div className="absolute right-0 mt-2 w-[min(300px,calc(100vw-32px))] bg-white rounded-2xl shadow-2xl border border-[#C9A45C]/35 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2 border-b border-[#C9A45C]/15">
                    <p className="font-serif text-xs font-bold text-[#5A1020] uppercase tracking-wider">Download Entire Admin Data</p>
                    <p className="text-[9.5px] text-[#211D1E]/60">Compiles all 9 admin registries + live telemetry</p>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadAll('pdf')}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#FAF7F2] flex items-center gap-2.5 transition-colors group"
                    >
                      <FileText size={15} className="text-[#5A1020] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#5A1020] truncate">Master Atelier Dossier (PDF)</p>
                        <p className="text-[9.5px] text-[#211D1E]/55 truncate">All lists + Analytics, Orders, Patrons, Stock</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadAll('analytics_pdf')}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#FAF7F2] flex items-center gap-2.5 transition-colors group"
                    >
                      <Activity size={15} className="text-[#C9A45C] group-hover:text-[#5A1020] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#5A1020] truncate">Web Analytics Dossier (PDF)</p>
                        <p className="text-[9.5px] text-[#211D1E]/55 truncate">Visitor telemetry, conversion funnel, devices</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadAll('csv')}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#FAF7F2] flex items-center gap-2.5 transition-colors group"
                    >
                      <Layers size={15} className="text-[#C9A45C] group-hover:text-[#5A1020] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#211D1E] group-hover:text-[#5A1020] truncate">Consolidated Master CSV</p>
                        <p className="text-[9.5px] text-[#211D1E]/55 truncate">Multi-section spreadsheet for Excel/Sheets</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadAll('analytics_csv')}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#FAF7F2] flex items-center gap-2.5 transition-colors group"
                    >
                      <ExternalLink size={15} className="text-[#2A4365] group-hover:text-[#5A1020] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#211D1E] group-hover:text-[#5A1020] truncate">Web Analytics Only (CSV)</p>
                        <p className="text-[9.5px] text-[#211D1E]/55 truncate">Spreadsheet of traffic, devices & funnel</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadAll('json')}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#FAF7F2] flex items-center gap-2.5 transition-colors group"
                    >
                      <Layers size={15} className="text-[#2A4365] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#211D1E] truncate">Full Database Archive (JSON)</p>
                        <p className="text-[9.5px] text-[#211D1E]/55 truncate">Raw database backup of all registries</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="bg-white border border-[#C9A45C]/20 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'today', label: 'Today' },
              { id: '7days', label: '7 Days' },
              { id: '30days', label: '30 Days' },
              { id: '90days', label: '90 Days' },
              { id: 'custom', label: 'Custom' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => (p.id === 'custom' ? setActivePreset('custom') : applyPreset(p.id))}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  activePreset === p.id
                    ? 'bg-[#5A1020] text-[#FAF7F2] shadow-xs'
                    : 'bg-[#FAF7F2] text-[#211D1E]/75 hover:bg-[#F2ECE4] border border-[#C9A45C]/20'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Form / Current Range Badge */}
          {activePreset === 'custom' ? (
            <form onSubmit={handleCustomSubmit} className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-[#C9A45C]/40 text-xs text-[#211D1E] bg-[#FAF7F2] focus:outline-none focus:border-[#5A1020]"
              />
              <span className="text-xs text-[#211D1E]/40 font-bold">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-[#C9A45C]/40 text-xs text-[#211D1E] bg-[#FAF7F2] focus:outline-none focus:border-[#5A1020]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-[#C9A45C] text-[#211D1E] font-bold text-xs hover:bg-[#5A1020] hover:text-white transition-colors"
              >
                Apply
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#211D1E]/60 font-sans">
              <Calendar size={13} className="text-[#C9A45C]" />
              <span>
                Reporting window: <strong className="text-[#5A1020] font-mono">{startDate}</strong> to{' '}
                <strong className="text-[#5A1020] font-mono">{endDate}</strong>
              </span>
            </div>
          )}

          {/* Definitions Toggle */}
          <button
            type="button"
            onClick={() => setShowDefinitions((v) => !v)}
            className="flex items-center gap-1 text-xs text-[#5A1020] font-semibold hover:text-[#C9A45C] transition-colors self-start lg:self-auto"
          >
            <HelpCircle size={14} />
            <span>{showDefinitions ? 'Hide Data Definitions' : 'Data Definitions'}</span>
          </button>
        </div>

        {/* Data Definitions Banner */}
        {showDefinitions && (
          <div className="bg-[#FAF7F2] border border-[#C9A45C]/40 rounded-2xl p-4 sm:p-5 text-xs text-[#211D1E]/80 space-y-2">
            <div className="flex items-center gap-2 font-serif font-bold text-[#5A1020] text-sm mb-1">
              <ShieldCheck size={16} className="text-[#C9A45C]" />
              <span>Privacy-Conscious Metrics Definitions</span>
            </div>
            <p>
              <strong>Unique Visitor:</strong> Count of unique anonymous browser identifiers (random UUID) observed
              during the selected period. <em>Note: This is an anonymous client-device identity, not a guaranteed count
              of unique biological human beings.</em>
            </p>
            <p>
              <strong>Session:</strong> Active visit session generated on first visit and expired after 30 minutes of
              inactivity.
            </p>
            <p>
              <strong>Page View & Product View:</strong> Public route views and couture catalog views. Protected against
              duplicate re-render triggers.
            </p>
            <p>
              <strong>Orders & Revenue:</strong> Directly sourced from authoritative completed database orders. Never
              estimated from cart actions or button clicks.
            </p>
          </div>
        )}

        {/* ── TAB 1: WEBSITE ANALYTICS ────────────────────────── */}
        {activeTab === 'website' && (
          <div className="space-y-6">
            {/* Master Download Action Banner */}
            <div className="bg-white border border-[#C9A45C]/30 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#5A1020]/10 border border-[#5A1020]/15 flex items-center justify-center shrink-0 text-[#5A1020]">
                  <Download size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-sm sm:text-base font-bold text-[#5A1020]">
                      Atelier Enterprise Master Intelligence Export
                    </h3>
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#5A1020]/10 text-[#5A1020]">
                      All 9 Registries + Telemetry
                    </span>
                  </div>
                  <p className="font-sans text-xs text-[#211D1E]/65 mt-0.5">
                    Click to download <strong>everything across the entire admin panel & web analytics</strong> (Orders, Patrons, Silhouettes, Fabric Stock, Categories, Coupons, VIP Memberships, Reviews & Live Telemetry).
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadAll('pdf')}
                  disabled={downloading}
                  className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#5A1020] text-white font-bold text-xs hover:bg-[#721529] transition-all shadow-xs disabled:opacity-60"
                  title="Download complete Master Dossier in luxury PDF format (All lists + Analytics)"
                >
                  <Download size={14} className={downloading ? 'animate-bounce' : ''} />
                  <span>{downloading ? 'Compiling Dossier...' : 'Download Everything (PDF)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadAll('analytics_pdf')}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#C9A45C]/50 text-[#5A1020] font-bold text-xs hover:bg-[#F2ECE4] transition-all disabled:opacity-60"
                  title="Download comprehensive Web Analytics & Telemetry report in luxury PDF format"
                >
                  <FileText size={13} className="text-[#C9A45C]" />
                  <span>Web Analytics (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadAll('csv')}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#C9A45C]/40 bg-white text-[#211D1E] font-bold text-xs hover:bg-[#FAF7F2] transition-all disabled:opacity-60"
                  title="Download Master CSV spreadsheet with all lists and analytics"
                >
                  <Layers size={13} className="text-[#C9A45C]" />
                  <span>Master CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadAll('json')}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#C9A45C]/40 bg-white text-[#211D1E]/80 font-bold text-xs hover:bg-[#FAF7F2] transition-all disabled:opacity-60"
                  title="Download complete database & telemetry raw JSON backup"
                >
                  <Activity size={13} className="text-[#2A4365]" />
                  <span>Raw JSON</span>
                </button>
              </div>
            </div>

            {/* ROW 1: PRIMARY METRIC CARDS */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#5A1020]">
                  Traffic & Engagement Overview
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <MetricCard
                  title="Unique Visitors"
                  value={overview.visitors?.toLocaleString('en-IN')}
                  sub="Unique anonymous visitors"
                  icon={Users}
                  accent={BRAND_COLORS.primary}
                  loading={loading}
                />
                <MetricCard
                  title="Total Sessions"
                  value={overview.sessions?.toLocaleString('en-IN')}
                  sub="30-min active sessions"
                  icon={Layers}
                  accent={BRAND_COLORS.blue}
                  loading={loading}
                />
                <MetricCard
                  title="Page Views"
                  value={overview.pageViews?.toLocaleString('en-IN')}
                  sub="Public pages visited"
                  icon={Eye}
                  accent={BRAND_COLORS.purple}
                  loading={loading}
                />
                <MetricCard
                  title="Product Views"
                  value={overview.productViews?.toLocaleString('en-IN')}
                  sub="Couture detail views"
                  icon={Package}
                  accent={BRAND_COLORS.amber}
                  loading={loading}
                />
              </div>
            </div>

            {/* ROW 2: COMMERCE & CONVERSION CARDS */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#5A1020]">
                  Commerce & Purchase Intent
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <MetricCard
                  title="Add to Cart"
                  value={overview.addToCart?.toLocaleString('en-IN')}
                  sub="Successful cart adds"
                  icon={ShoppingCart}
                  accent="#B45309"
                  loading={loading}
                />
                <MetricCard
                  title="Product Shares"
                  value={overview.shares?.toLocaleString('en-IN')}
                  sub="WhatsApp, Link, Web"
                  icon={Share2}
                  accent="#0D9488"
                  loading={loading}
                />
                <MetricCard
                  title="Checkouts Started"
                  value={overview.checkouts?.toLocaleString('en-IN')}
                  sub="Initiated checkout"
                  icon={TrendingUp}
                  accent="#4338CA"
                  loading={loading}
                />
                <MetricCard
                  title="Authoritative Orders"
                  value={overview.orders?.toLocaleString('en-IN')}
                  sub="Confirmed purchases"
                  icon={ShoppingBag}
                  accent={BRAND_COLORS.green}
                  loading={loading}
                />
                <MetricCard
                  title="Total Revenue"
                  value={`₹${Number(overview.revenue || 0).toLocaleString('en-IN')}`}
                  sub="From completed orders"
                  icon={IndianRupee}
                  accent={BRAND_COLORS.primary}
                  loading={loading}
                />
              </div>
            </div>

            {/* ROW 3: TRAFFIC & ENGAGEMENT TRENDS CHART */}
            <div className="bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-[#5A1020]">
                    Traffic & Engagement Trends
                  </h2>
                  <p className="font-sans text-xs text-[#211D1E]/60 mt-0.5">
                    Daily trend of visitors, page views, product views, and orders.
                  </p>
                </div>

                {/* Series Toggles */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => toggleSeries('visitors')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                      visibleSeries.visitors
                        ? 'bg-[#5A1020]/10 border-[#5A1020] text-[#5A1020] font-bold'
                        : 'border-gray-200 text-gray-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#5A1020]"></span>
                    Visitors
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSeries('pageViews')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                      visibleSeries.pageViews
                        ? 'bg-[#2A4365]/10 border-[#2A4365] text-[#2A4365] font-bold'
                        : 'border-gray-200 text-gray-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#2A4365]"></span>
                    Page Views
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSeries('productViews')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                      visibleSeries.productViews
                        ? 'bg-[#C9A45C]/15 border-[#C9A45C] text-[#C9A45C] font-bold'
                        : 'border-gray-200 text-gray-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#C9A45C]"></span>
                    Product Views
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSeries('orders')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                      visibleSeries.orders
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-700 font-bold'
                        : 'border-gray-200 text-gray-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Orders
                  </button>
                </div>
              </div>

              {trends.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#211D1E]/50 font-sans">
                  No traffic recorded yet for this period. Public page visits will appear here in real time.
                </div>
              ) : (
                <div className="h-64 sm:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5A1020" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#5A1020" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2A4365" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2A4365" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorProducts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C9A45C" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#C9A45C" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F2ECE4" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#211D1E"
                        strokeOpacity={0.4}
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#211D1E"
                        strokeOpacity={0.4}
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      {visibleSeries.pageViews && (
                        <Area
                          type="monotone"
                          dataKey="pageViews"
                          name="Page Views"
                          stroke="#2A4365"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorViews)"
                        />
                      )}
                      {visibleSeries.productViews && (
                        <Area
                          type="monotone"
                          dataKey="productViews"
                          name="Product Views"
                          stroke="#C9A45C"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorProducts)"
                        />
                      )}
                      {visibleSeries.visitors && (
                        <Area
                          type="monotone"
                          dataKey="visitors"
                          name="Visitors"
                          stroke="#5A1020"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorVisitors)"
                        />
                      )}
                      {visibleSeries.orders && (
                        <Area
                          type="monotone"
                          dataKey="orders"
                          name="Orders"
                          stroke="#166534"
                          strokeWidth={2}
                          fill="#166534"
                          fillOpacity={0.15}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* ROW 4: TOP PERFORMING PRODUCTS */}
            <div className="bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-[#5A1020]">
                    Top-Performing Products
                  </h2>
                  <p className="font-sans text-xs text-[#211D1E]/60 mt-0.5">
                    Products ranked by genuine catalog views, add-to-cart actions, shares, and purchases.
                  </p>
                </div>
                <span className="text-[11px] text-[#211D1E]/50 font-sans">
                  Showing top {topProducts.length} silhouettes
                </span>
              </div>

              {topProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#211D1E]/50 font-sans">
                  No product views or engagement recorded yet for this period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-[#C9A45C]/20 text-[#211D1E]/60 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3">Product</th>
                        <th className="py-3 px-3 text-right">Views</th>
                        <th className="py-3 px-3 text-right">Add to Cart</th>
                        <th className="py-3 px-3 text-right">Shares</th>
                        <th className="py-3 px-3 text-right">Orders</th>
                        <th className="py-3 px-3 text-right">Cart Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#C9A45C]/10">
                      {topProducts.map((p, idx) => {
                        const cartCount = p.addToCart ?? p.carts ?? 0
                        const cartRate = p.views > 0 ? Math.round((cartCount / p.views) * 100) : 0
                        return (
                          <tr key={p.productId || idx} className="hover:bg-[#FAF7F2]/60 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-serif font-bold text-[#5A1020] text-sm">
                                {p.productName || `Product #${p.productId}`}
                              </div>
                              <div className="text-[10px] text-[#211D1E]/40 font-mono">
                                ID: {p.productId}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-[#211D1E]">
                              {p.views?.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-[#B45309]">
                              {cartCount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-[#0D9488]">
                              {p.shares?.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-[#166534]">
                              {p.orders?.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  cartRate > 15
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : cartRate > 5
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {cartRate}%
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ROW 5: TOP PAGES + DEVICE BREAKDOWN + TRAFFIC SOURCES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* TOP PAGES (1.5 col equivalent) */}
              <div className="bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-[#5A1020]">
                      Most Visited Pages
                    </h2>
                    <p className="font-sans text-xs text-[#211D1E]/60 mt-0.5">
                      Top public navigation routes across the boutique.
                    </p>
                  </div>
                  <Globe size={16} className="text-[#C9A45C]" />
                </div>

                {topPages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#211D1E]/50 font-sans">
                    No page views recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-[#C9A45C]/20 text-[#211D1E]/60 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">Page Path</th>
                          <th className="py-2.5 px-3 text-right">Views</th>
                          <th className="py-2.5 px-3 text-right">Share of Traffic</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#C9A45C]/10">
                        {topPages.map((pg, idx) => (
                          <tr key={pg.pagePath || idx} className="hover:bg-[#FAF7F2]/60 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-[#5A1020] text-xs">
                              {pg.pagePath}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-[#211D1E]">
                              {pg.views?.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#5A1020] rounded-full"
                                    style={{ width: `${Math.min(100, pg.percentage || 0)}%` }}
                                  ></div>
                                </div>
                                <span className="text-[10px] text-[#211D1E]/60 font-semibold w-8">
                                  {pg.percentage}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* DEVICE BREAKDOWN + SOURCES */}
              <div className="bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-serif text-lg font-bold text-[#5A1020]">
                      Device Traffic
                    </h2>
                    <div className="flex items-center gap-2 text-[#211D1E]/60">
                      <Smartphone size={15} />
                      <Monitor size={15} />
                    </div>
                  </div>

                  {devicePieData.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#211D1E]/50 font-sans">
                      No device telemetry available.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={devicePieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={68}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {devicePieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomChartTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-[#C9A45C]/15">
                        {devices.map((d, i) => (
                          <div key={d.deviceType || i} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 text-[#211D1E]/70 font-sans">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                              ></span>
                              {d.deviceType}
                            </span>
                            <span className="font-bold text-[#5A1020]">
                              {d.percentage}% <span className="text-[10px] text-gray-400 font-normal">({d.count})</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Traffic Sources Breakdown */}
                <div className="mt-5 pt-4 border-t border-[#C9A45C]/15">
                  <h3 className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#5A1020] mb-2">
                    Traffic Sources
                  </h3>
                  {sources.length === 0 ? (
                    <p className="text-xs text-[#211D1E]/40 font-sans">Direct & referrer data will display here.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {sources.map((s, i) => (
                        <div key={s.source || i} className="flex items-center justify-between text-xs">
                          <span className="text-[#211D1E]/75 font-sans truncate">{s.source}</span>
                          <span className="font-bold text-[#211D1E] font-mono text-[11px]">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 6: CONVERSION FUNNEL */}
            <div className="bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-[#5A1020]">
                    E-Commerce Conversion Funnel
                  </h2>
                  <p className="font-sans text-xs text-[#211D1E]/60 mt-0.5">
                    Multi-stage progression from initial discovery to completed order.
                  </p>
                </div>
                {funnel && (funnel.overallConversionRate > 0 || funnel.overallConversionPct > 0) && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-1 text-xs text-emerald-800 font-bold self-start">
                    Overall Conversion: {funnel.overallConversionRate ?? funnel.overallConversionPct ?? 0}%
                  </div>
                )}
              </div>

              {!funnel || funnel.visitors === 0 ? (
                <div className="py-12 text-center text-xs text-[#211D1E]/50 font-sans">
                  No conversion funnel activity recorded for this period yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'Visitors', count: funnel.visitors, rate: '100%', sub: 'Discovery' },
                    { label: 'Product Views', count: funnel.productViews, rate: `${funnel.productViewRate ?? funnel.visitorsToViewsPct ?? 0}%`, sub: 'Catalog Interest' },
                    { label: 'Add to Cart', count: (funnel.addToCart ?? 0), rate: `${funnel.cartRate ?? funnel.viewsToCartPct ?? 0}%`, sub: 'Purchase Intent' },
                    { label: 'Checkout Started', count: (funnel.checkoutStarted ?? funnel.checkouts ?? 0), rate: `${funnel.checkoutRate ?? funnel.cartToCheckoutsPct ?? 0}%`, sub: 'Order Initiation' },
                    { label: 'Purchased', count: (funnel.purchases ?? 0), rate: `${funnel.purchaseRate ?? funnel.checkoutsToPurchasesPct ?? 0}%`, sub: 'Completed Orders' }
                  ].map((stage, idx) => (
                    <div
                      key={stage.label}
                      className="bg-[#FAF7F2] border border-[#C9A45C]/30 rounded-2xl p-4 flex flex-col justify-between relative"
                    >
                      {idx > 0 && (
                        <div className="hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-white border border-[#C9A45C]/40 rounded-full p-0.5 shadow-2xs">
                          <ArrowRight size={12} className="text-[#C9A45C]" />
                        </div>
                      )}
                      <div>
                        <span className="font-sans text-[10px] uppercase tracking-wider text-[#211D1E]/60 font-bold">
                          {stage.label}
                        </span>
                        <p className="font-serif text-2xl font-bold text-[#5A1020] mt-1">
                          {stage.count?.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-[#211D1E]/50 font-sans mt-0.5">
                          {stage.sub}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#C9A45C]/20 flex items-center justify-between text-[11px]">
                        <span className="text-[#211D1E]/50">Stage conversion:</span>
                        <span className="font-bold text-[#5A1020]">{stage.rate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ROW 7: REAL-TIME RECENT ACTIVITY */}
            <div className="bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-[#5A1020]" />
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-[#5A1020]">
                    Recent Activity Stream
                  </h2>
                </div>
                <span className="font-sans text-[11px] text-[#211D1E]/50">
                  Privacy-conscious anonymous event telemetry
                </span>
              </div>

              {recentActivity.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#211D1E]/50 font-sans">
                  No live activities recorded yet. Public route navigation or customer actions will appear here.
                </div>
              ) : (
                <div className="divide-y divide-[#C9A45C]/10 max-h-96 overflow-y-auto pr-1">
                  {recentActivity.map((act) => {
                    let badgeBg = 'bg-gray-100 text-gray-700'
                    if (act.eventType === 'PURCHASE') badgeBg = 'bg-green-100 text-green-800 font-bold'
                    else if (act.eventType === 'CHECKOUT_STARTED') badgeBg = 'bg-indigo-100 text-indigo-800'
                    else if (act.eventType === 'ADD_TO_CART') badgeBg = 'bg-amber-100 text-amber-800'
                    else if (act.eventType === 'PRODUCT_SHARE') badgeBg = 'bg-teal-100 text-teal-800'
                    else if (act.eventType === 'PRODUCT_VIEW') badgeBg = 'bg-purple-100 text-purple-800'

                    return (
                      <div key={act.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-semibold shrink-0 ${badgeBg}`}>
                            {act.eventType}
                          </span>
                          <span className="font-sans text-[#211D1E]/80 truncate">
                            {act.description || act.eventLabel || act.eventType}
                          </span>
                          {act.pagePath && (
                            <span className="hidden md:inline font-mono text-[10px] text-[#211D1E]/40 truncate">
                              ({act.pagePath})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-[10px] text-[#211D1E]/50 font-sans">
                          {act.deviceType && (
                            <span className="hidden sm:inline bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#C9A45C]/20">
                              {act.deviceType}
                            </span>
                          )}
                          <span>{timeAgo(act.createdAt || act.timestamp)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: SALES & ORDER REPORTS (PRESERVES EXISTING FUNCTIONALITY) ── */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#C9A45C]/20 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#5A1020]">
                  Authoritative Sales & Financial Report
                </h2>
                <p className="font-sans text-xs text-[#211D1E]/60 mt-0.5">
                  Financial figures and order totals derived strictly from completed store transactions.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadAll('pdf')}
                  disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5A1020] text-[#FAF7F2] font-semibold text-xs hover:bg-[#8B0000] transition-colors shadow-xs disabled:opacity-60"
                  title="Download complete Master Dossier containing all admin panel lists & web analytics"
                >
                  <Download size={14} className={downloading ? 'animate-bounce' : ''} />
                  <span>{downloading ? 'Compiling All Lists...' : 'Download Everything (Master PDF)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadAll('analytics_pdf')}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#C9A45C]/50 text-[#5A1020] font-bold text-xs hover:bg-[#F2ECE4] transition-all disabled:opacity-60"
                  title="Download Web Analytics PDF report"
                >
                  <FileText size={13} className="text-[#C9A45C]" />
                  <span>Web Analytics (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadAll('csv')}
                  disabled={downloading}
                  className="px-3.5 py-2 rounded-xl border border-[#C9A45C]/40 bg-[#FAF7F2] text-[#5A1020] font-bold text-xs hover:bg-[#F2ECE4] transition-all"
                  title="Download all admin lists in spreadsheet CSV"
                >
                  Master CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                title="Authoritative Revenue"
                value={`₹${Number(overview.revenue || salesReportData?.totalRevenue || 0).toLocaleString('en-IN')}`}
                sub="Completed transactions"
                icon={IndianRupee}
                accent={BRAND_COLORS.primary}
              />
              <MetricCard
                title="Total Orders"
                value={overview.orders || salesReportData?.totalOrders || allOrders.length}
                sub="Verified orders in database"
                icon={ShoppingBag}
                accent={BRAND_COLORS.green}
              />
              <MetricCard
                title="Average Order Value"
                value={`₹${(overview.orders > 0 ? Math.round(overview.revenue / overview.orders) : 0).toLocaleString('en-IN')}`}
                sub="AOV for period"
                icon={TrendingUp}
                accent={BRAND_COLORS.blue}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
