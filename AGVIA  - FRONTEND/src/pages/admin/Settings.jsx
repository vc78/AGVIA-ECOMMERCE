import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'
import { 
  Store, 
  Truck, 
  Bell, 
  Percent, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Save, 
  Radio, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare, 
  Send,
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { adminService } from '../../services/adminService'
import { adminWebSocket, playLuxuryChime } from '../../services/adminWebSocket'
import { BUSINESS } from '../../constants/business'

const TABS = [
  { id: 'general', label: 'Atelier & Brand', icon: Store },
  { id: 'tariffs', label: 'Tariffs & Shipping', icon: Truck },
  { id: 'operations', label: 'Live Operations & Banners', icon: Radio },
  { id: 'tax', label: 'Tax & Currency', icon: Percent },
  { id: 'alerts', label: 'Real-Time Alerts & Stock', icon: Bell }
]

export default function Settings() {
  const { connectionStatus, soundEnabled } = useSelector((state) => state.notifications)
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

  // Real-Time Test Alert State
  const [testType, setTestType] = useState('NEW_ORDER')
  const [testTitle, setTestTitle] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [sendingTest, setSendingTest] = useState(false)

  const [form, setForm] = useState({
    // Store Identity & Concierge
    storeName: BUSINESS.name,
    storeTagline: BUSINESS.tagline,
    supportEmail: BUSINESS.contact.supportEmail || 'care@agvia.in',
    supportPhone: BUSINESS.contact.phone,
    whatsappNumber: BUSINESS.contact.whatsapp,
    storeAddress: BUSINESS.location.fullAddress,
    businessHours: BUSINESS.contact.hours,

    // Tariffs & Checkout Rules
    minimumOrderValue: 200,
    freeDeliveryThreshold: 999,
    standardDeliveryFee: 50,
    expressDeliveryFee: 150,
    enableCod: true,
    codMaxLimit: 25000,
    enableGuestCheckout: true,

    // Live Operations & Store Banners
    maintenanceMode: false,
    maintenanceMessage: 'Our boutique atelier is undergoing scheduled curation. We will resume taking orders shortly.',
    announcementBarEnabled: true,
    announcementText: '✨ Festive Curation: Complimentary Handloom Potli with orders above ₹3,000 | Free Shipping across India on orders above ₹999',
    announcementLink: '/shop',
    holidayMode: false,
    holidayNotice: 'Orders placed now will be handcrafted and dispatched starting next week.',

    // Tax & Currencies
    currencySymbol: '₹',
    currencyCode: 'INR',
    gstPercentage: 5.0,
    pricesIncludeTax: true,

    // Real-Time Alerts & Stock
    lowStockThreshold: 5,
    enableLowStockAlerts: true,
    notifyAdminOnNewOrder: true,
    notifyCustomerOnDispatch: true,
    adminAlertEmail: 'orders@pragathisweets.com',
    soundAlertsEnabled: true
  })

  // Load existing settings from backend on mount
  useEffect(() => {
    let isMounted = true

    async function fetchSettings() {
      try {
        setLoading(true)
        const data = await adminService.getSettings()
        if (data && isMounted) {
          setForm((prev) => ({
            ...prev,
            ...data
          }))
          if (data.updatedAt) {
            setLastSaved(new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
          }
        }
      } catch (err) {
        console.warn('Could not load server settings, using boutique defaults:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchSettings()

    // Subscribe to live WebSocket settings updates from other administrators
    const unsubscribe = adminWebSocket.subscribeSettings((incoming) => {
      if (incoming && isMounted) {
        setForm((prev) => ({ ...prev, ...incoming }))
        setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        toast('Store settings updated remotely via WebSocket', {
          icon: '🔄',
          style: { background: '#1A0B10', color: '#FBF3E7', borderRadius: '12px' }
        })
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        minimumOrderValue: Number(form.minimumOrderValue),
        freeDeliveryThreshold: Number(form.freeDeliveryThreshold),
        standardDeliveryFee: Number(form.standardDeliveryFee),
        expressDeliveryFee: Number(form.expressDeliveryFee),
        codMaxLimit: Number(form.codMaxLimit),
        gstPercentage: Number(form.gstPercentage),
        lowStockThreshold: Number(form.lowStockThreshold)
      }

      const res = await adminService.updateSettings(payload)
      if (res) {
        setForm((prev) => ({ ...prev, ...res }))
      }
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      toast.success('Boutique settings saved & broadcasted in real time!', {
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      toast.error('Failed to persist settings. Please check connection.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all e-commerce settings to default factory values?')) return
    setResetting(true)
    try {
      const res = await adminService.resetSettings()
      if (res) {
        setForm((prev) => ({ ...prev, ...res }))
      }
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      toast.success('Settings restored to luxury factory defaults', {
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      toast.error('Failed to reset settings.')
    } finally {
      setResetting(false)
    }
  }

  const handleSendTestAlert = async () => {
    setSendingTest(true)
    try {
      await adminService.sendTestNotification(
        testType,
        testTitle || undefined,
        testMessage || undefined
      )
      toast.success(`Dispatched real-time test alert: ${testType}`)
      // Play luxury feedback chime
      playLuxuryChime()
    } catch (err) {
      toast.error('Failed to send test notification.')
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <AdminLayout>
      <div className="font-body space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#C9A45C]/20 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A1020]">
                E-Commerce Live Settings
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Real-Time Sync
              </span>
            </div>
            <p className="text-xs text-[#211D1E]/70 mt-1">
              Configure store tariffs, checkout parameters, live banners, and instant WebSocket alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Live Socket Status Beacon */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#C9A45C]/25 shadow-xs text-xs font-medium">
              <Radio size={14} className={connectionStatus === 'CONNECTED' ? 'text-emerald-600 animate-pulse' : 'text-amber-500'} />
              <span className="text-[11px] text-[#211D1E]/80">
                Socket: <strong className="text-[#5A1020]">{connectionStatus}</strong>
              </span>
            </div>

            {lastSaved && (
              <span className="text-[11px] text-[#211D1E]/50 hidden md:inline">
                Synced: {lastSaved}
              </span>
            )}

            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={resetting || saving}
              className="px-3 py-2 border border-[#C9A45C]/40 text-[#5A1020] hover:bg-[#FAF7F2] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-50"
              title="Reset to original defaults"
            >
              <RotateCcw size={13} className={resetting ? 'animate-spin' : ''} />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 bg-[#5A1020] hover:bg-[#430B17] text-[#FAF7F2] rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save size={13} className={saving ? 'animate-spin' : ''} />
              <span>{saving ? 'Synchronizing...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 border-b border-[#C9A45C]/15 pb-2">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#5A1020] text-[#FAF7F2] shadow-sm'
                    : 'text-[#211D1E]/70 hover:text-[#5A1020] hover:bg-[#FAF7F2]'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#C9A45C]' : ''} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="bg-white border border-[#C9A45C]/20 rounded-2xl p-12 text-center space-y-3">
            <RefreshCw size={24} className="animate-spin text-[#C9A45C] mx-auto" />
            <p className="text-xs text-[#211D1E]/60 uppercase tracking-widest font-bold">
              Fetching Authoritative Boutique Settings...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── TAB 1: ATELIER & BRAND CONCIERGE ────────────────────── */}
            {activeTab === 'general' && (
              <div className="bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#C9A45C]/15">
                  <Store size={18} className="text-[#C9A45C]" />
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#5A1020]">Boutique Identity & Flagship Concierge</h3>
                    <p className="text-xs text-[#211D1E]/60">Public store branding, customer support touchpoints, and atelier addresses.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block">
                      Boutique Store Name
                    </label>
                    <input
                      name="storeName"
                      required
                      value={form.storeName || ''}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="e.g. AGVIA Women's Wear Boutique"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block">
                      Brand Tagline & Essence
                    </label>
                    <input
                      name="storeTagline"
                      value={form.storeTagline || ''}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="e.g. Haute Couture & Heritage Silks"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block flex items-center gap-1">
                      <Mail size={11} /> Concierge Support Email
                    </label>
                    <input
                      name="supportEmail"
                      type="email"
                      required
                      value={form.supportEmail || ''}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="care@agvia.in"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block flex items-center gap-1">
                      <Phone size={11} /> Concierge Telephone
                    </label>
                    <input
                      name="supportPhone"
                      required
                      value={form.supportPhone || ''}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="+91 90323 06961"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block flex items-center gap-1">
                      <MessageSquare size={11} /> WhatsApp Business Hotline
                    </label>
                    <input
                      name="whatsappNumber"
                      value={form.whatsappNumber || ''}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="+91 90323 06961"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block flex items-center gap-1">
                      <Clock size={11} /> Operating & Styling Hours
                    </label>
                    <input
                      name="businessHours"
                      value={form.businessHours || ''}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="10:30 AM - 8:30 PM IST (Mon - Sun)"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block flex items-center gap-1">
                      <MapPin size={11} /> Flagship Atelier Physical Address
                    </label>
                    <input
                      name="storeAddress"
                      value={form.storeAddress || ''}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: TARIFFS & SHIPPING RULES ─────────────────────── */}
            {activeTab === 'tariffs' && (
              <div className="bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#C9A45C]/15">
                  <Truck size={18} className="text-[#C9A45C]" />
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#5A1020]">Shipping Tariffs & Checkout Rules</h3>
                    <p className="text-xs text-[#211D1E]/60">Define free delivery eligibility, courier rates, and payment method caps.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block">
                      Free Delivery Target Threshold (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#211D1E]/40 font-bold">₹</span>
                      <input
                        name="freeDeliveryThreshold"
                        type="number"
                        min="0"
                        step="10"
                        required
                        value={form.freeDeliveryThreshold}
                        onChange={handleChange}
                        className="input-field pl-8"
                      />
                    </div>
                    <span className="text-[10px] text-[#211D1E]/50">
                      Orders reaching this subtotal receive complimentary luxury shipping.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block">
                      Standard Courier Tariff (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#211D1E]/40 font-bold">₹</span>
                      <input
                        name="standardDeliveryFee"
                        type="number"
                        min="0"
                        step="5"
                        required
                        value={form.standardDeliveryFee}
                        onChange={handleChange}
                        className="input-field pl-8"
                      />
                    </div>
                    <span className="text-[10px] text-[#211D1E]/50">
                      Applied when order is below the free delivery target.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block">
                      Express Priority Courier Tariff (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#211D1E]/40 font-bold">₹</span>
                      <input
                        name="expressDeliveryFee"
                        type="number"
                        min="0"
                        step="10"
                        value={form.expressDeliveryFee}
                        onChange={handleChange}
                        className="input-field pl-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block">
                      Minimum Checkout Order Value (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#211D1E]/40 font-bold">₹</span>
                      <input
                        name="minimumOrderValue"
                        type="number"
                        min="0"
                        step="50"
                        required
                        value={form.minimumOrderValue}
                        onChange={handleChange}
                        className="input-field pl-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block">
                      Maximum Allowed COD Value (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#211D1E]/40 font-bold">₹</span>
                      <input
                        name="codMaxLimit"
                        type="number"
                        min="0"
                        step="500"
                        value={form.codMaxLimit}
                        onChange={handleChange}
                        className="input-field pl-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-4 border-t border-[#C9A45C]/15 space-y-4">
                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#C9A45C]/20 bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] cursor-pointer transition-all">
                    <div>
                      <div className="text-xs font-bold text-[#5A1020]">Cash On Delivery (COD) Active</div>
                      <div className="text-[11px] text-[#211D1E]/60">Allow patrons to pay upon arrival for eligible domestic pin codes.</div>
                    </div>
                    <input
                      name="enableCod"
                      type="checkbox"
                      checked={form.enableCod}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#5A1020] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#C9A45C]/20 bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] cursor-pointer transition-all">
                    <div>
                      <div className="text-xs font-bold text-[#5A1020]">Guest Checkout Permitted</div>
                      <div className="text-[11px] text-[#211D1E]/60">Permit patrons to purchase without prior account registration.</div>
                    </div>
                    <input
                      name="enableGuestCheckout"
                      type="checkbox"
                      checked={form.enableGuestCheckout}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#5A1020] rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* ── TAB 3: LIVE OPERATIONS & ANNOUNCEMENT BANNERS ────────── */}
            {activeTab === 'operations' && (
              <div className="bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#C9A45C]/15">
                  <Radio size={18} className="text-[#C9A45C]" />
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#5A1020]">Real-Time Storefront Banners & Emergency Controls</h3>
                    <p className="text-xs text-[#211D1E]/60">Manage store operating status, top ticker announcements, and holiday notices live.</p>
                  </div>
                </div>

                {/* Announcement Bar Section */}
                <div className="p-4 sm:p-5 rounded-2xl border border-[#C9A45C]/25 bg-[#FAF7F2]/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#5A1020]">Storefront Top Announcement Ticker</h4>
                      <p className="text-[11px] text-[#211D1E]/60">Broadcasts promotional slogans or alerts across the top header of every page.</p>
                    </div>
                    <input
                      name="announcementBarEnabled"
                      type="checkbox"
                      checked={form.announcementBarEnabled}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#5A1020] rounded"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block">
                      Announcement Ticker Text
                    </label>
                    <textarea
                      name="announcementText"
                      rows={2}
                      value={form.announcementText || ''}
                      onChange={handleChange}
                      className="input-field leading-relaxed"
                      placeholder="✨ Festive Curation: Complimentary Handloom Potli with orders above ₹3,000"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block">
                      Call-to-Action Link
                    </label>
                    <input
                      name="announcementLink"
                      value={form.announcementLink || ''}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="/shop or /offers"
                    />
                  </div>

                  {/* Live Announcement Preview */}
                  {form.announcementBarEnabled && (
                    <div className="pt-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#C9A45C] block mb-1">
                        Live Preview (Customers will see):
                      </span>
                      <div className="bg-[#5A1020] text-[#FBF3E7] px-4 py-2 rounded-lg text-xs font-serif text-center flex items-center justify-center gap-2 shadow-xs">
                        <Sparkles size={12} className="text-[#C9A45C]" />
                        <span>{form.announcementText || 'Store announcement'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Maintenance Mode Section */}
                <div className="p-4 sm:p-5 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-rose-600" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">Boutique Maintenance Mode</h4>
                        <p className="text-[11px] text-rose-700/80">Temporarily pause customer checkout while curating inventory or upgrades.</p>
                      </div>
                    </div>
                    <input
                      name="maintenanceMode"
                      type="checkbox"
                      checked={form.maintenanceMode}
                      onChange={handleChange}
                      className="w-5 h-5 accent-rose-600 rounded"
                    />
                  </div>

                  {form.maintenanceMode && (
                    <div className="space-y-2 pt-2 animate-enter">
                      <label className="text-[10px] font-bold text-rose-700 tracking-widest uppercase block">
                        Maintenance Message Displayed to Visitors
                      </label>
                      <textarea
                        name="maintenanceMessage"
                        rows={2}
                        value={form.maintenanceMessage || ''}
                        onChange={handleChange}
                        className="input-field border-rose-300 focus:border-rose-500 bg-white"
                      />
                    </div>
                  )}
                </div>

                {/* Holiday Mode Section */}
                <div className="p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">Festive Atelier Dispatch Notice</h4>
                      <p className="text-[11px] text-amber-800/80">Notify patrons of potential dispatch delays during national or festival celebrations.</p>
                    </div>
                    <input
                      name="holidayMode"
                      type="checkbox"
                      checked={form.holidayMode}
                      onChange={handleChange}
                      className="w-4 h-4 accent-amber-600 rounded"
                    />
                  </div>

                  {form.holidayMode && (
                    <div className="space-y-2 pt-2 animate-enter">
                      <label className="text-[10px] font-bold text-amber-800 tracking-widest uppercase block">
                        Festive Notice Text
                      </label>
                      <input
                        name="holidayNotice"
                        value={form.holidayNotice || ''}
                        onChange={handleChange}
                        className="input-field border-amber-300 bg-white"
                        placeholder="Orders placed now will be dispatched starting next week."
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 4: TAX & CURRENCY ───────────────────────────────── */}
            {activeTab === 'tax' && (
              <div className="bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#C9A45C]/15">
                  <Percent size={18} className="text-[#C9A45C]" />
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#5A1020]">Tax & Currency Defaults</h3>
                    <p className="text-xs text-[#211D1E]/60">GST parameters, invoicing tax rates, and boutique currency specifications.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block">
                      Currency Symbol
                    </label>
                    <input
                      name="currencySymbol"
                      required
                      value={form.currencySymbol || '₹'}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block">
                      Currency Code (ISO)
                    </label>
                    <input
                      name="currencyCode"
                      required
                      value={form.currencyCode || 'INR'}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block">
                      GST / Tax Percentage (%)
                    </label>
                    <input
                      name="gstPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.25"
                      required
                      value={form.gstPercentage}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#C9A45C]/15">
                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#C9A45C]/20 bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] cursor-pointer transition-all">
                    <div>
                      <div className="text-xs font-bold text-[#5A1020]">Storefront Prices Include GST</div>
                      <div className="text-[11px] text-[#211D1E]/60">Listed prices already incorporate sales tax / GST.</div>
                    </div>
                    <input
                      name="pricesIncludeTax"
                      type="checkbox"
                      checked={form.pricesIncludeTax}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#5A1020] rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* ── TAB 5: REAL-TIME ALERTS & STOCK ────────────────────── */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <div className="bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-[#C9A45C]/15">
                    <Bell size={18} className="text-[#C9A45C]" />
                    <div>
                      <h3 className="font-serif text-lg font-bold text-[#5A1020]">Inventory Thresholds & Alert Dispatch</h3>
                      <p className="text-xs text-[#211D1E]/60">Set automatic triggers for low stock warnings and administrator alerts.</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block">
                        Low Stock Alert Threshold (Units)
                      </label>
                      <input
                        name="lowStockThreshold"
                        type="number"
                        min="1"
                        required
                        value={form.lowStockThreshold}
                        onChange={handleChange}
                        className="input-field"
                      />
                      <span className="text-[10px] text-[#211D1E]/50">
                        When available quantity falls at or below this value, an instant alert is triggered.
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block">
                        Administrator Order Alert Email
                      </label>
                      <input
                        name="adminAlertEmail"
                        type="email"
                        value={form.adminAlertEmail || ''}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="orders@pragathisweets.com"
                      />
                    </div>
                  </div>

                  {/* Switches */}
                  <div className="pt-2 space-y-3">
                    <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#C9A45C]/20 bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] cursor-pointer transition-all">
                      <div>
                        <div className="text-xs font-bold text-[#5A1020]">Low Stock Real-Time Warnings</div>
                        <div className="text-[11px] text-[#211D1E]/60">Send real-time alerts when attire inventories need kitchen/craft replenishment.</div>
                      </div>
                      <input
                        name="enableLowStockAlerts"
                        type="checkbox"
                        checked={form.enableLowStockAlerts}
                        onChange={handleChange}
                        className="w-4 h-4 accent-[#5A1020] rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#C9A45C]/20 bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] cursor-pointer transition-all">
                      <div>
                        <div className="text-xs font-bold text-[#5A1020]">Notify Admin on Every New Order</div>
                        <div className="text-[11px] text-[#211D1E]/60">Broadcast instant WebSocket popups & email when a patron checks out.</div>
                      </div>
                      <input
                        name="notifyAdminOnNewOrder"
                        type="checkbox"
                        checked={form.notifyAdminOnNewOrder}
                        onChange={handleChange}
                        className="w-4 h-4 accent-[#5A1020] rounded"
                      />
                    </label>
                  </div>
                </div>

                {/* ── INTERACTIVE REAL-TIME NOTIFICATION TEST BENCH ────────── */}
                <div className="bg-[#1A0B10] text-[#FBF3E7] border border-[#C9A45C]/30 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#C9A45C]/20">
                    <div className="flex items-center gap-2.5">
                      <Sparkles size={18} className="text-[#C9A45C]" />
                      <div>
                        <h4 className="font-serif text-base font-bold text-[#FBF3E7]">Live WebSocket Test Bench</h4>
                        <p className="text-[11px] text-[#FBF3E7]/60">
                          Verify real-time notification toasts, luxury audio chimes, and bell badges right now.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => playLuxuryChime()}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[#C9A45C] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      title="Test Audio Chime"
                    >
                      <Volume2 size={13} />
                      <span>Test Chime</span>
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block mb-1">
                        Notification Type
                      </label>
                      <select
                        value={testType}
                        onChange={(e) => setTestType(e.target.value)}
                        className="w-full bg-white/10 border border-[#C9A45C]/30 rounded-xl px-3 py-2 text-xs text-[#FBF3E7] focus:outline-hidden focus:ring-1 focus:ring-[#C9A45C]"
                      >
                        <option value="NEW_ORDER" className="bg-[#1A0B10]">🛍️ New Order</option>
                        <option value="PAYMENT_RECEIVED" className="bg-[#1A0B10]">💳 Payment Received</option>
                        <option value="LOW_STOCK" className="bg-[#1A0B10]">📦 Low Stock Alert</option>
                        <option value="OUT_OF_STOCK" className="bg-[#1A0B10]">⚠️ Out of Stock Alert</option>
                        <option value="ORDER_STATUS_CHANGED" className="bg-[#1A0B10]">🔄 Order Status Update</option>
                        <option value="SETTINGS_UPDATED" className="bg-[#1A0B10]">⚙️ Settings Synchronized</option>
                        <option value="SYSTEM_ALERT" className="bg-[#1A0B10]">📢 Broadcast Announcement</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block mb-1">
                        Custom Title (Optional)
                      </label>
                      <input
                        value={testTitle}
                        onChange={(e) => setTestTitle(e.target.value)}
                        placeholder="e.g. VIP Atelier Order #9812"
                        className="w-full bg-white/10 border border-[#C9A45C]/30 rounded-xl px-3 py-2 text-xs text-[#FBF3E7] placeholder:text-[#FBF3E7]/40 focus:outline-hidden focus:ring-1 focus:ring-[#C9A45C]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block mb-1">
                        Custom Message (Optional)
                      </label>
                      <input
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        placeholder="e.g. Bridal Lehenga order received (₹45,000)"
                        className="w-full bg-white/10 border border-[#C9A45C]/30 rounded-xl px-3 py-2 text-xs text-[#FBF3E7] placeholder:text-[#FBF3E7]/40 focus:outline-hidden focus:ring-1 focus:ring-[#C9A45C]"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSendTestAlert}
                      disabled={sendingTest}
                      className="px-5 py-2.5 bg-[#C9A45C] hover:bg-[#B38F46] text-[#1A0B10] rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send size={13} className={sendingTest ? 'animate-spin' : ''} />
                      <span>{sendingTest ? 'Broadcasting...' : 'Broadcast Live Test Alert'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Save Bar */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#C9A45C]/20">
              <div className="text-[11px] text-[#211D1E]/60">
                Changes will immediately broadcast to all active administrator terminals and patron storefront sessions.
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#5A1020] hover:bg-[#430B17] text-[#FAF7F2] rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={14} className={saving ? 'animate-spin' : ''} />
                  <span>{saving ? 'Synchronizing...' : 'Save Settings'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  )
}
