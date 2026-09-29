import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Phone, MapPin, ShoppingBag, Heart, CreditCard,
  Bell, Shield, Award, Crown, Sparkles, Check, Copy,
  ExternalLink, Edit3, Trash2, Plus, CheckCircle2, AlertCircle,
  Clock, Lock, Smartphone, Laptop, LogOut, ChevronRight, X,
  Calendar, Ticket, RefreshCw, Eye, EyeOff, Camera
} from 'lucide-react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { authService } from '../../services/authService'
import { orderService } from '../../services/orderService'
import { subscriptionService } from '../../services/subscriptionService'
import { profileUpdated, loggedOut } from '../../store/authSlice'
import { removeFromWishlist } from '../../store/wishlistSlice'
import { useCart } from '../../hooks/useCart'
// emailJsService used for contact/order emails only — OTP emails handled by backend SMTP

export default function Profile() {
  const { user } = useSelector((state) => state.auth)
  const wishlistItems = useSelector((state) => state.wishlist?.items || [])
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  // Navigation tab
  const [activeTab, setActiveTab] = useState('personal')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  // ── 1. Personal Information State ────────────────────────────
  const [isEditingPersonal, setIsEditingPersonal] = useState(false)
  const [savingPersonal, setSavingPersonal] = useState(false)
  const [personalForm, setPersonalForm] = useState({
    firstName: user?.name ? user.name.split(' ')[0] : '',
    lastName: user?.name && user.name.split(' ').length > 1 ? user.name.split(' ').slice(1).join(' ') : '',
    displayName: user?.name || '',
    dob: '',
    gender: 'Prefer not to say',
    avatar: ''
  })
  const fileInputRef = useRef(null)

  // ── 2. Contact State (Email Verification & Phone OTP) ─────────
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState('idle') // idle | sending | otp_sent | verifying
  const [emailOtpValue, setEmailOtpValue] = useState(['', '', '', '', '', ''])
  const [emailOtpTimer, setEmailOtpTimer] = useState(60)

  const [phoneModalOpen, setPhoneModalOpen] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', ''])
  const [otpTimer, setOtpTimer] = useState(60)
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [phoneWhatsAppUrl, setPhoneWhatsAppUrl] = useState('')
  const [receivedOtpCode, setReceivedOtpCode] = useState('')

  // ── 3. Saved Addresses State (User-Isolated) ──────────────────
  const [addresses, setAddresses] = useState(() => {
    try {
      const key = user?.id ? `ps_user_addresses_${user.id}` : null
      if (key) {
        const saved = localStorage.getItem(key)
        if (saved) return JSON.parse(saved)
      }
      return []
    } catch {
      return []
    }
  })
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    line: '',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '',
    type: 'Home'
  })

  // ── 4. Orders State ──────────────────────────────────────────
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  // ── 5. Payment Preferences State ─────────────────────────────
  const [savedCards, setSavedCards] = useState([
    { id: 'card_1', bank: 'HDFC Bank', masked: '•••• 4242', brand: 'Visa', exp: '08/28', isDefault: true },
    { id: 'card_2', bank: 'ICICI Bank', masked: '•••• 8819', brand: 'Mastercard', exp: '11/27', isDefault: false }
  ])
  const [showCardModal, setShowCardModal] = useState(false)
  const [cardForm, setCardForm] = useState({ holder: '', number: '', exp: '', brand: 'Visa' })

  // ── 6. Notification Settings State ───────────────────────────
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    deliveryAlerts: true,
    promotionalEmails: false,
    smsNotifications: true,
    whatsappUpdates: true,
    festivalSpecials: true
  })
  const [savingNotif, setSavingNotif] = useState(false)

  // ── 7. Security (Password & Sessions) State ──────────────────
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [savingPass, setSavingPass] = useState(false)
  const [sessions, setSessions] = useState(() => [
    {
      id: 'sess_1',
      device: typeof navigator !== 'undefined' && /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile Device' : 'Desktop Browser',
      location: 'Current Authenticated Session',
      activeNow: true,
      lastActive: 'Active now',
      icon: typeof navigator !== 'undefined' && /Mobile|Android|iPhone/i.test(navigator.userAgent) ? Smartphone : Laptop
    }
  ])

  // ── 8. Subscription / AGVIA Atelier Circle State ──────────────────
  const [subscription, setSubscription] = useState(null)
  const [copiedCoupon, setCopiedCoupon] = useState(false)

  // Sync personal form when user object updates
  useEffect(() => {
    if (user) {
      const nameParts = (user.name || user.fullName || '').trim().split(' ')
      setPersonalForm((prev) => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : '',
        displayName: user.name || user.fullName || '',
        avatar: user.avatar || prev.avatar
      }))
    }
  }, [user])

  // Sync user-isolated addresses
  useEffect(() => {
    if (!user?.id) {
      setAddresses([])
      return
    }
    try {
      const key = `ps_user_addresses_${user.id}`
      const saved = localStorage.getItem(key)
      if (saved) {
        setAddresses(JSON.parse(saved))
      } else {
        setAddresses([])
      }
    } catch {
      setAddresses([])
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`ps_user_addresses_${user.id}`, JSON.stringify(addresses))
    }
  }, [addresses, user?.id])

  // Initial Data Loading: Authoritative /me profile + subscription + orders
  useEffect(() => {
    let isMounted = true
    async function initProfile() {
      try {
        const [meData, subData, userOrders] = await Promise.allSettled([
          authService.getCurrentUser(),
          subscriptionService.getMySubscription(),
          orderService.getMyOrders()
        ])
        if (isMounted) {
          if (meData.status === 'fulfilled' && meData.value) {
            const me = meData.value
            dispatch(profileUpdated({
              id: me.id,
              name: me.fullName || me.name,
              email: me.email,
              phone: me.phone,
              phoneVerified: me.phoneVerified,
              address: me.address,
              role: me.role === 'ROLE_ADMIN' ? 'ADMIN' : (me.role || 'CUSTOMER')
            }))
          }
          if (subData.status === 'fulfilled') setSubscription(subData.value)
          if (userOrders.status === 'fulfilled') setOrders(userOrders.value || [])
        }
      } catch (err) {
        console.error('Failed to init profile data:', err)
      } finally {
        if (isMounted) setPageLoading(false)
      }
    }
    initProfile()
    return () => { isMounted = false }
  }, [dispatch])

  // OTP Countdown timer
  useEffect(() => {
    let interval = null
    if (otpSent && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(t => t - 1), 1000)
    } else if (otpTimer === 0) {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [otpSent, otpTimer])

  // Email OTP Countdown timer
  useEffect(() => {
    let interval = null
    if (emailStatus === 'otp_sent' && emailOtpTimer > 0) {
      interval = setInterval(() => setEmailOtpTimer(t => t - 1), 1000)
    } else if (emailOtpTimer === 0) {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [emailStatus, emailOtpTimer])

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // ── Handler: Personal Information Save ───────────────────────
  const handlePersonalSave = async (e) => {
    e.preventDefault()
    setSavingPersonal(true)
    const combinedName = `${personalForm.firstName.trim()} ${personalForm.lastName.trim()}`.trim() || personalForm.displayName
    
    // Optimistic update
    dispatch(profileUpdated({ ...user, name: combinedName }))

    try {
      const updated = await authService.updateProfile({
        name: combinedName,
        phone: user?.phone || '',
        address: user?.address || ''
      })
      dispatch(profileUpdated(updated))
      setIsEditingPersonal(false)
      setHasUnsavedChanges(false)
      toast.success('Profile details saved successfully!', {
        icon: '✓',
        style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
      })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update profile on server.')
    } finally {
      setSavingPersonal(false)
    }
  }

  // ── Handler: Avatar Upload & Validation ──────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WEBP).')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be under 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPersonalForm(f => ({ ...f, avatar: reader.result }))
      toast.success('Photo updated successfully!')
    }
    reader.readAsDataURL(file)
  }

  // ── Handler: Email Verification Flow ─────────────────────────
  const handleSendEmailVerification = async (e) => {
    if (e) e.preventDefault()
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Please enter a valid email address.')
      return
    }
    setEmailStatus('sending')
    try {
      await authService.sendEmailOtp(newEmail)
      setEmailStatus('otp_sent')
      setEmailOtpTimer(60)
      setEmailOtpValue(['', '', '', '', '', ''])

      toast.success(`Verification code sent to ${newEmail}! Check your inbox.`, {
        icon: '✉️',
        style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
      })
    } catch (err) {
      setEmailStatus('idle')
      toast.error(err?.response?.data?.message || 'Could not send verification OTP. Please try again.')
    }
  }

  const handleVerifyEmailOtp = async () => {
    const enteredOtp = emailOtpValue.join('')
    if (enteredOtp.length !== 6) {
      toast.error('Please enter the complete 6-digit verification code.')
      return
    }
    setEmailStatus('verifying')
    try {
      const updatedUser = await authService.verifyEmailOtp(newEmail, enteredOtp)
      dispatch(profileUpdated({ ...user, ...updatedUser }))
      toast.success('Primary email address verified & updated!', {
        icon: '✓',
        style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
      })
      setEmailModalOpen(false)
      setEmailStatus('idle')
      setNewEmail('')
      setEmailOtpValue(['', '', '', '', '', ''])
    } catch (err) {
      setEmailStatus('otp_sent')
      toast.error(err?.response?.data?.message || 'Invalid or expired OTP code.')
    }
  }

  // ── Handler: Phone OTP Verification Flow ─────────────────────
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault()
    const cleanPhone = newPhone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit Indian mobile number.')
      return
    }
    setOtpSending(true)
    try {
      const res = await authService.sendPhoneOtp(newPhone)
      // Support both wrapped (res.data) and unwrapped response shapes
      const payload = res?.data || res
      const code = payload?.otpCode || payload?.data?.otpCode || ''
      setReceivedOtpCode(code)
      setPhoneWhatsAppUrl('')          // no longer opening WhatsApp
      setOtpSent(true)
      setOtpTimer(60)
      setOtpValue(['', '', '', '', '', ''])

      toast.success(`OTP generated for +91 ${cleanPhone.slice(-10)}. Check the code below.`, {
        icon: '🔐',
        duration: 4000,
        style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px', fontWeight: 600 }
      })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to generate phone OTP. Please check the number.')
    } finally {
      setOtpSending(false)
    }
  }

  const handleVerifyOtp = async () => {
    const enteredOtp = otpValue.join('')
    if (enteredOtp.length !== 6) {
      toast.error('Please enter the complete 6-digit verification code.')
      return
    }
    setOtpVerifying(true)
    try {
      const updatedUser = await authService.verifyPhoneOtp(newPhone, enteredOtp)
      dispatch(profileUpdated({ ...user, ...updatedUser }))
      toast.success('Mobile number verified & updated!', {
        icon: '✓',
        style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
      })
      setPhoneModalOpen(false)
      setOtpSent(false)
      setNewPhone('')
      setOtpValue(['', '', '', '', '', ''])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid or expired OTP code.')
    } finally {
      setOtpVerifying(false)
    }
  }

  // ── Handler: Address CRUD ────────────────────────────────────
  const handleSaveAddress = (e) => {
    e.preventDefault()
    const cleanPincode = addressForm.pincode.trim()
    if (!/^[1-9][0-9]{5}$/.test(cleanPincode)) {
      toast.error('Please enter a valid 6-digit Indian PIN code (e.g. 500033).')
      return
    }

    if (editingAddressId) {
      setAddresses(prev => prev.map(a => a.id === editingAddressId ? { ...a, ...addressForm } : a))
      toast.success('Address updated successfully!')
    } else {
      const newAddr = {
        id: Date.now(),
        ...addressForm,
        isDefault: addresses.length === 0
      }
      setAddresses(prev => [...prev, newAddr])
      toast.success('New address added!')
    }
    setShowAddressModal(false)
    setEditingAddressId(null)
    setAddressForm({ name: '', phone: '', line: '', city: 'Hyderabad', state: 'Telangana', pincode: '', type: 'Home' })
  }

  const handleSetDefaultAddress = (id) => {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })))
    toast.success('Default address updated!')
  }

  const handleDeleteAddress = (id) => {
    const target = addresses.find(a => a.id === id)
    if (target?.isDefault && addresses.length > 1) {
      toast.error('Please select another default address before deleting this one.')
      return
    }
    setAddresses(prev => prev.filter(a => a.id !== id))
    toast.success('Address deleted.')
  }

  // ── Handler: Notification Toggle ─────────────────────────────
  const handleToggleNotif = (key) => {
    setSavingNotif(true)
    setNotifications(prev => {
      const next = { ...prev, [key]: !prev[key] }
      setTimeout(() => {
        setSavingNotif(false)
        toast.success('Preference updated', { duration: 1500 })
      }, 300)
      return next
    })
  }

  // ── Handler: Password Change ─────────────────────────────────
  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (!passwordForm.current) {
      toast.error('Please enter your current password.')
      return
    }
    if (passwordForm.next.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error('New passwords do not match.')
      return
    }

    setSavingPass(true)
    setTimeout(() => {
      setSavingPass(false)
      setPasswordForm({ current: '', next: '', confirm: '' })
      toast.success('✓ Password updated successfully!', {
        style: { background: '#8B0000', color: '#FFFDF8', borderRadius: '12px' }
      })
    }, 1000)
  }

  // ── Handler: Sign out Device ─────────────────────────────────
  const handleSignOutDevice = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    toast.success('Device session terminated.')
  }

  const handleSignOutOtherDevices = () => {
    setSessions(prev => prev.filter(s => s.activeNow))
    toast.success('All other devices have been signed out.')
  }

  const handleCopyVipCoupon = () => {
    const code = subscription?.exclusiveCoupon || subscription?.couponCode || 'AGVIAVIP10'
    navigator.clipboard.writeText(code)
    setCopiedCoupon(true)
    toast.success(`VIP code ${code} copied!`, { icon: '✂️' })
    setTimeout(() => setCopiedCoupon(false), 2500)
  }

  const isVipActive = subscription?.status === 'ACTIVE'
  const accountId = user?.id ? `PS-CL-${String(user.id).padStart(4, '0')}` : 'PS-CL-MEMBER'

  // ── Navigation Tabs Configuration ────────────────────────────
  const NAV_TABS = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'contact', label: 'Contact & Verification', icon: Mail },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin, count: addresses.length },
    { id: 'orders', label: 'Orders & Purchases', icon: ShoppingBag, count: orders.length },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, count: wishlistItems.length },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard, count: savedCards.length },
    { id: 'notifications', label: 'Notification Settings', icon: Bell },
    { id: 'security', label: 'Security & Devices', icon: Shield },
    { id: 'vip', label: 'VIP & Rewards', icon: Crown, highlight: isVipActive }
  ]

  // Skeleton Loading Screen
  if (pageLoading) {
    return (
      <div className="min-h-full bg-[#FFFDF8] font-body text-[#3A2D23]">
        <Navbar />
        <div className="container-luxury py-10">
          <div className="h-8 w-60 bg-gray-200 rounded-xl animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 h-96 bg-gray-100 rounded-3xl animate-pulse" />
            <div className="lg:col-span-8 h-96 bg-gray-100 rounded-3xl animate-pulse" />
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#FFFDF8] font-body text-[#3A2D23] flex flex-col justify-between">
      <Navbar />

      <main className="container-luxury py-8 md:py-12 flex-1 w-full">
        {/* Profile Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#B8860B]/15 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] tracking-[0.3em] font-bold text-[#B8860B] uppercase">
                Customer Account Dashboard
              </span>
              <span className="text-[9px] bg-[#8B0000]/10 text-[#8B0000] font-bold px-2 py-0.5 rounded-full uppercase">
                {user?.role || 'CUSTOMER'}
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[#8B0000]">
              {personalForm.displayName || user?.name || 'Valued Customer'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-[#3A2D23]/50 block">ACCOUNT ID</span>
              <span className="font-mono text-xs font-bold text-[#3A2D23]">{accountId}</span>
            </div>
            {isVipActive ? (
              <Link
                to="/subscription"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#B8860B] to-[#E6C687] text-[#1A0A0A] font-bold text-xs rounded-full shadow hover:scale-105 transition-all"
              >
                <Crown size={14} /> VIP Member
              </Link>
            ) : (
              <Link
                to="/subscription"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#B8860B]/50 hover:bg-[#B8860B]/10 text-[#8B0000] font-bold text-xs rounded-full transition-all"
              >
                <Crown size={14} className="text-[#B8860B]" /> Upgrade to VIP
              </Link>
            )}
          </div>
        </div>

        {/* Unsaved Changes Banner */}
        {hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs font-medium shadow-sm"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-700 shrink-0" />
              <span>You have unsaved profile changes. Make sure to click <strong>Save Changes</strong> before navigating away.</span>
            </div>
            <button
              onClick={() => { setHasUnsavedChanges(false); setIsEditingPersonal(false) }}
              className="text-[10px] text-amber-800 underline uppercase tracking-wider font-bold"
            >
              Discard
            </button>
          </motion.div>
        )}

        {/* Mobile Horizontal Tabs Bar */}
        <div className="lg:hidden mb-6 w-full min-w-0 overflow-x-auto pb-2 scrollbar-none no-scrollbar flex gap-2">
          {NAV_TABS.map(tab => {
            const Icon = tab.icon
            const isCurrent = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isCurrent
                    ? 'bg-[#8B0000] text-white shadow'
                    : 'bg-white border border-[#B8860B]/15 text-[#3A2D23]/70 hover:text-[#8B0000]'
                }`}
              >
                <Icon size={13} className={isCurrent ? 'text-[#E6C687]' : 'text-[#B8860B]'} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isCurrent ? 'bg-white/20' : 'bg-gray-100'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* 2-Column Responsive Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-4 space-y-5 sticky top-24">
            {/* User Mini Card */}
            <div className="bg-white border border-[#B8860B]/15 rounded-3xl p-5 shadow-sm text-center relative overflow-hidden">
              <div className="relative w-20 h-20 mx-auto mb-3">
                {personalForm.avatar ? (
                  <img src={personalForm.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-[#B8860B]" />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#8B0000]/10 border-2 border-[#B8860B]/40 flex items-center justify-center text-[#8B0000] font-display text-2xl font-bold">
                    {user?.name ? user.name[0].toUpperCase() : 'P'}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Change photo"
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#8B0000] text-white flex items-center justify-center shadow hover:scale-110 transition-transform"
                >
                  <Camera size={12} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              <h3 className="font-display text-base font-bold text-[#8B0000]">
                {personalForm.displayName || user?.name}
              </h3>
              <p className="text-xs text-[#3A2D23]/60 font-body mb-3">{user?.email}</p>

              {isVipActive && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#B8860B] to-[#E6C687] text-[#1A0A0A] text-[10px] font-bold uppercase tracking-wider">
                  <Crown size={12} /> AGVIA Atelier Circle VIP
                </div>
              )}
            </div>

            {/* Nav Links */}
            <div className="bg-white border border-[#B8860B]/15 rounded-3xl p-3 shadow-sm space-y-1">
              {NAV_TABS.map(tab => {
                const Icon = tab.icon
                const isCurrent = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'bg-[#8B0000] text-white shadow-md'
                        : 'text-[#3A2D23]/75 hover:bg-[#F5E6C8]/25 hover:text-[#8B0000]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} className={isCurrent ? 'text-[#E6C687]' : 'text-[#B8860B]'} />
                      <span>{tab.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {tab.count !== undefined && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCurrent ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                      <ChevronRight size={13} className={isCurrent ? 'text-white/60' : 'text-gray-300'} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Column: Tab Panels */}
          <div className="lg:col-span-8 bg-white border border-[#B8860B]/15 rounded-3xl p-6 md:p-8 shadow-sm">
            
            {/* ── PANEL 1: PERSONAL INFORMATION ────────────────── */}
            {activeTab === 'personal' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#B8860B]/10">
                  <div>
                    <h2 className="font-display text-xl font-bold text-[#8B0000]">Personal Information</h2>
                    <p className="text-xs text-[#3A2D23]/60">Manage your official name, display handle, and demographic details.</p>
                  </div>
                  {!isEditingPersonal ? (
                    <button
                      onClick={() => setIsEditingPersonal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B0000]/10 hover:bg-[#8B0000] text-[#8B0000] hover:text-white font-bold text-xs transition-all"
                    >
                      <Edit3 size={13} /> Edit Profile
                    </button>
                  ) : (
                    <button
                      onClick={() => { setIsEditingPersonal(false); setHasUnsavedChanges(false) }}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={handlePersonalSave} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block">First Name</label>
                      <input
                        disabled={!isEditingPersonal}
                        value={personalForm.firstName}
                        onChange={(e) => { setPersonalForm({ ...personalForm, firstName: e.target.value }); setHasUnsavedChanges(true) }}
                        className="input-field disabled:bg-gray-50 disabled:text-gray-600"
                        placeholder="First Name"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block">Last Name</label>
                      <input
                        disabled={!isEditingPersonal}
                        value={personalForm.lastName}
                        onChange={(e) => { setPersonalForm({ ...personalForm, lastName: e.target.value }); setHasUnsavedChanges(true) }}
                        className="input-field disabled:bg-gray-50 disabled:text-gray-600"
                        placeholder="Last Name"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block">Display Name</label>
                    <input
                      disabled={!isEditingPersonal}
                      value={personalForm.displayName}
                      onChange={(e) => { setPersonalForm({ ...personalForm, displayName: e.target.value }); setHasUnsavedChanges(true) }}
                      className="input-field disabled:bg-gray-50 disabled:text-gray-600"
                      placeholder="Display Name"
                    />
                    <span className="text-[10px] text-gray-400">Shown in customer reviews and personalized order receipts.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block">Date of Birth</label>
                      <input
                        type="date"
                        disabled={!isEditingPersonal}
                        value={personalForm.dob}
                        onChange={(e) => { setPersonalForm({ ...personalForm, dob: e.target.value }); setHasUnsavedChanges(true) }}
                        className="input-field disabled:bg-gray-50 disabled:text-gray-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block">Gender</label>
                      <select
                        disabled={!isEditingPersonal}
                        value={personalForm.gender}
                        onChange={(e) => { setPersonalForm({ ...personalForm, gender: e.target.value }); setHasUnsavedChanges(true) }}
                        className="input-field disabled:bg-gray-50 disabled:text-gray-600 bg-white"
                      >
                        <option>Female</option>
                        <option>Male</option>
                        <option>Non-binary</option>
                        <option>Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  {isEditingPersonal && (
                    <div className="pt-4 flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={savingPersonal}
                        className="btn-primary"
                      >
                        {savingPersonal ? 'Saving changes...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsEditingPersonal(false); setHasUnsavedChanges(false) }}
                        className="px-6 py-3 rounded-full border border-gray-300 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </form>

                {/* Read-Only System Properties */}
                <div className="mt-8 pt-6 border-t border-gray-100 bg-[#FFFDF8] p-5 rounded-2xl border border-[#B8860B]/10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Account ID</span>
                    <span className="font-mono font-bold text-gray-800">{accountId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Account Role</span>
                    <span className="font-bold text-[#8B0000]">{user?.role || 'CUSTOMER'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Member Since</span>
                    <span className="font-medium text-gray-700">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Verified Member'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── PANEL 2: CONTACT & VERIFICATION ─────────────── */}
            {activeTab === 'contact' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="pb-4 border-b border-[#B8860B]/10">
                  <h2 className="font-display text-xl font-bold text-[#8B0000]">Contact & Verification</h2>
                  <p className="text-xs text-[#3A2D23]/60">Your verified contact channels used for billing, shipment alerts, and WhatsApp updates.</p>
                </div>

                <div className="space-y-4">
                  {/* Email Section */}
                  <div className="p-5 rounded-2xl border border-[#B8860B]/20 bg-[#FFFDF8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider">Primary Email</span>
                        <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={10} /> Verified
                        </span>
                      </div>
                      <p className="font-mono text-sm font-semibold text-gray-800">{user?.email}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Used for order receipts and login authentication.</p>
                    </div>
                    <button
                      onClick={() => { setEmailModalOpen(true); setEmailStatus('idle'); setNewEmail('') }}
                      className="px-4 py-2 border border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000] hover:text-white rounded-xl text-xs font-bold transition-all shrink-0"
                    >
                      Change Email
                    </button>
                  </div>

                  {/* Phone Section */}
                  <div className="p-5 rounded-2xl border border-[#B8860B]/20 bg-[#FFFDF8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider">Mobile Phone</span>
                        <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={10} /> SMS & WhatsApp Active
                        </span>
                      </div>
                      <p className="font-mono text-sm font-semibold text-gray-800">{user?.phone || '+91 90323 06961'}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Used for doorstep OTP delivery and WhatsApp receipts.</p>
                    </div>
                    <button
                      onClick={() => { setPhoneModalOpen(true); setOtpSent(false); setNewPhone('') }}
                      className="px-4 py-2 border border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000] hover:text-white rounded-xl text-xs font-bold transition-all shrink-0"
                    >
                      Update Number
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── PANEL 3: SAVED ADDRESSES ─────────────────────── */}
            {activeTab === 'addresses' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#B8860B]/10">
                  <div>
                    <h2 className="font-display text-xl font-bold text-[#8B0000]">Saved Addresses</h2>
                    <p className="text-xs text-[#3A2D23]/60">Manage your residential and work addresses for fast 1-click checkout.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingAddressId(null)
                      setAddressForm({ name: user?.name || '', phone: user?.phone || '', line: '', city: 'Hyderabad', state: 'Telangana', pincode: '', type: 'Home' })
                      setShowAddressModal(true)
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B0000] text-white font-bold text-xs hover:bg-[#700000] transition-all shadow"
                  >
                    <Plus size={14} /> Add Address
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        addr.isDefault
                          ? 'border-[#8B0000] bg-red-50/20 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-[#B8860B]/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-[#8B0000] uppercase tracking-wider flex items-center gap-1">
                            <MapPin size={12} className="text-[#B8860B]" /> {addr.type}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[9px] bg-[#8B0000] text-white font-bold px-2 py-0.5 rounded-full uppercase">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-gray-900">{addr.name}</p>
                        <p className="text-xs text-gray-600 leading-relaxed mt-1">{addr.line}</p>
                        <p className="text-xs text-gray-600">{addr.city}, {addr.state} - <strong className="font-mono">{addr.pincode}</strong></p>
                        <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1">
                          <Phone size={11} className="text-gray-400" /> {addr.phone}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                        {!addr.isDefault ? (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-[#8B0000] hover:underline font-bold text-[11px]"
                          >
                            Set as Default
                          </button>
                        ) : <span className="text-[11px] text-gray-400">Primary Delivery</span>}

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setEditingAddressId(addr.id)
                              setAddressForm({
                                name: addr.name,
                                phone: addr.phone,
                                line: addr.line,
                                city: addr.city,
                                state: addr.state,
                                pincode: addr.pincode,
                                type: addr.type
                              })
                              setShowAddressModal(true)
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── PANEL 4: ORDERS & PURCHASES ─────────────────── */}
            {activeTab === 'orders' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#B8860B]/10">
                  <div>
                    <h2 className="font-display text-xl font-bold text-[#8B0000]">Orders & Purchases</h2>
                    <p className="text-xs text-[#3A2D23]/60">Read-only live view of your placed confectionery orders.</p>
                  </div>
                  <Link to="/orders" className="text-xs font-bold text-[#8B0000] hover:underline flex items-center gap-1">
                    Full Order History <ExternalLink size={12} />
                  </Link>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl p-6">
                    <ShoppingBag size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-700">No recent orders found</p>
                    <p className="text-xs text-gray-500 mt-1 mb-4">Your handcrafted couture orders will appear here automatically.</p>
                    <Link to="/products" className="btn-primary">Browse Collection</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 4).map(order => (
                      <div key={order.id} className="p-5 rounded-2xl border border-gray-200 hover:border-[#B8860B]/30 transition-all bg-[#FFFDF8]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                          <div>
                            <span className="font-mono text-sm font-bold text-[#8B0000]">#{order.id}</span>
                            <span className="text-[11px] text-gray-500 ml-2">{order.date}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider self-start sm:self-auto ${
                            order.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'CONFIRMED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.status || 'CONFIRMED'}
                          </span>
                        </div>

                        <div className="py-3 flex justify-between items-center text-xs">
                          <div>
                            <p className="text-gray-600 font-medium">
                              {order.items?.length || 1} item(s) · {order.paymentMethod || 'COD'}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-xs">
                              {order.address?.line1 || 'Express Delivery Address'}
                            </p>
                          </div>
                          <span className="font-mono text-sm font-bold text-gray-900">₹{order.total || 540}</span>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3 text-xs">
                          <Link
                            to={`/track-order?id=${order.id}`}
                            className="text-[#8B0000] hover:underline font-bold"
                          >
                            Live Tracking
                          </Link>
                          <Link
                            to="/products"
                            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium"
                          >
                            Reorder
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── PANEL 5: WISHLIST ───────────────────────────── */}
            {activeTab === 'wishlist' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#B8860B]/10">
                  <div>
                    <h2 className="font-display text-xl font-bold text-[#8B0000]">My Wishlist</h2>
                    <p className="text-xs text-[#3A2D23]/60">Your saved delicacies for festival celebrations and gifting.</p>
                  </div>
                  <Link to="/wishlist" className="text-xs font-bold text-[#8B0000] hover:underline flex items-center gap-1">
                    Open Dedicated Wishlist <ExternalLink size={12} />
                  </Link>
                </div>

                {wishlistItems.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl p-6">
                    <Heart size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-700">Your wishlist is currently empty</p>
                    <p className="text-xs text-gray-500 mt-1 mb-4">Tap the heart icon on any silhouette to save it for later.</p>
                    <Link to="/products" className="btn-primary">Explore Collection</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlistItems.map(item => (
                      <div key={item.id} className="p-4 rounded-2xl border border-gray-200 flex items-center justify-between gap-3 bg-white">
                        <div className="flex items-center gap-3">
                          <img src={item.imageUrl || item.image || '/images/classic_silk_saree.jpg'} alt={item.name} className="w-14 h-14 rounded-xl object-cover border border-gray-100" />
                          <div>
                            <h4 className="font-display text-xs font-bold text-gray-900">{item.name}</h4>
                            <p className="font-mono text-xs font-bold text-[#8B0000] mt-0.5">₹{item.price}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { addToCart(item); toast.success(`${item.name} added to cart!`) }}
                            className="px-3 py-1.5 bg-[#8B0000] text-white rounded-xl text-xs font-bold hover:bg-[#700000]"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => dispatch(removeFromWishlist(item.id))}
                            className="p-1.5 text-gray-400 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── PANEL 6: PAYMENT PREFERENCES ────────────────── */}
            {activeTab === 'payments' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#B8860B]/10">
                  <div>
                    <h2 className="font-display text-xl font-bold text-[#8B0000]">Payment Preferences</h2>
                    <p className="text-xs text-[#3A2D23]/60">Safely saved payment tokens. We never store raw CVVs or sensitive credentials.</p>
                  </div>
                  <button
                    onClick={() => setShowCardModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B0000] text-white font-bold text-xs hover:bg-[#700000] shadow"
                  >
                    <Plus size={14} /> Add Card
                  </button>
                </div>

                <div className="space-y-3">
                  {savedCards.map(card => (
                    <div key={card.id} className="p-4 rounded-2xl border border-gray-200 flex items-center justify-between bg-[#FFFDF8]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-700">
                          {card.brand === 'Visa' ? 'VISA' : 'MC'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{card.bank} · <span className="font-mono">{card.masked}</span></p>
                          <p className="text-[11px] text-gray-500">Expires {card.exp}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {card.isDefault ? (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                            Default
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSavedCards(prev => prev.map(c => ({ ...c, isDefault: c.id === card.id })))
                              toast.success('Default payment method updated.')
                            }}
                            className="text-[11px] text-[#8B0000] hover:underline font-bold"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => setSavedCards(prev => prev.filter(c => c.id !== card.id))}
                          className="text-gray-400 hover:text-red-700 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2.5">
                  <Shield size={16} className="text-[#B8860B] shrink-0 mt-0.5" />
                  <p>
                    All payment transactions are encrypted and processed through RBI-compliant PCI-DSS Level 1 payment gateway (Razorpay).
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── PANEL 7: NOTIFICATION SETTINGS ──────────────── */}
            {activeTab === 'notifications' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#B8860B]/10">
                  <div>
                    <h2 className="font-display text-xl font-bold text-[#8B0000]">Notification Settings</h2>
                    <p className="text-xs text-[#3A2D23]/60">Customize how and when you receive order updates, receipts, and festival offers.</p>
                  </div>
                  {savingNotif && (
                    <span className="text-xs text-[#B8860B] font-bold flex items-center gap-1 animate-pulse">
                      <RefreshCw size={12} className="animate-spin" /> Saving...
                    </span>
                  )}
                </div>

                <div className="divide-y divide-gray-100">
                  {[
                    { key: 'orderUpdates', label: 'Order Confirmation & Receipts', desc: 'Real-time alerts whenever a new couture order is confirmed.' },
                    { key: 'deliveryAlerts', label: 'Doorstep Courier Tracking', desc: 'SMS and push updates when your parcel is out for delivery.' },
                    { key: 'whatsappUpdates', label: 'WhatsApp Concierge Receipts', desc: 'Formatted WhatsApp receipts and live dispatcher updates.' },
                    { key: 'smsNotifications', label: 'Critical SMS Alerts', desc: 'Essential OTPs and security alerts sent directly to your phone.' },
                    { key: 'festivalSpecials', label: 'Runway Drops & Bridal Previews', desc: 'Exclusive bridal trousseau and festive collection previews.' },
                    { key: 'promotionalEmails', label: 'The AGVIA Atelier Edit Newsletter', desc: 'Curated couture lookbooks and private salon invitations.' }
                  ].map(item => (
                    <div key={item.key} className="py-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-900">{item.label}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleNotif(item.key)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          notifications[item.key] ? 'bg-[#8B0000]' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            notifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── PANEL 8: SECURITY & SESSIONS ────────────────── */}
            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="pb-4 border-b border-[#B8860B]/10">
                  <h2 className="font-display text-xl font-bold text-[#8B0000]">Security & Active Sessions</h2>
                  <p className="text-xs text-[#3A2D23]/60">Manage your password and review active devices logged into your account.</p>
                </div>

                {/* Change Password Form */}
                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B0000]">Change Password</h3>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#B8860B] uppercase">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={passwordForm.current}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                        required
                        className="input-field pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#B8860B] uppercase">New Password</label>
                      <input
                        type="password"
                        value={passwordForm.next}
                        onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                        required
                        className="input-field"
                        placeholder="Min 6 characters"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#B8860B] uppercase">Confirm New</label>
                      <input
                        type="password"
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        required
                        className="input-field"
                        placeholder="Repeat new password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingPass}
                    className="btn-primary"
                  >
                    {savingPass ? 'Updating password...' : 'Update Password'}
                  </button>
                </form>

                {/* Active Sessions */}
                <div className="pt-6 border-t border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B0000]">Active Devices</h3>
                      <p className="text-[11px] text-gray-500">Authorized browsers and devices currently signed in.</p>
                    </div>
                    {sessions.length > 1 && (
                      <button
                        onClick={handleSignOutOtherDevices}
                        className="text-xs font-bold text-red-700 hover:underline"
                      >
                        Sign Out Other Devices
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {sessions.map(sess => {
                      const Icon = sess.icon
                      return (
                        <div key={sess.id} className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between text-xs bg-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                              <Icon size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{sess.device}</p>
                              <p className="text-[10px] text-gray-500">{sess.location} · {sess.lastActive}</p>
                            </div>
                          </div>

                          {sess.activeNow ? (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                              This Session
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSignOutDevice(sess.id)}
                              className="text-[11px] text-red-600 hover:underline font-bold"
                            >
                              Sign Out
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── PANEL 9: VIP & REWARDS ──────────────────────── */}
            {activeTab === 'vip' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="pb-4 border-b border-[#B8860B]/10">
                  <h2 className="font-display text-xl font-bold text-[#8B0000]">AGVIA Atelier Circle VIP & Loyalty</h2>
                  <p className="text-xs text-[#3A2D23]/60">Exclusive privileges, reward coins, and personalized festive benefits.</p>
                </div>

                {isVipActive ? (
                  <div className="bg-gradient-to-br from-[#1F1F1F] via-[#2A1810] to-[#8B0000] text-[#FFFDF8] rounded-3xl p-6 md:p-8 border-2 border-[#D4AF37]/50 shadow-xl relative overflow-hidden">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center">
                          <Crown size={24} className="text-[#D4AF37]" />
                        </div>
                        <div>
                          <span className="text-[9px] tracking-[0.25em] text-[#D4AF37] font-bold uppercase block">
                            AGVIA ATELIER CIRCLE
                          </span>
                          <h3 className="font-display text-lg font-bold text-white">VIP Royal Member</h3>
                        </div>
                      </div>
                      <span className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                        Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/10 text-xs mb-6">
                      <div>
                        <span className="text-white/50 text-[10px] uppercase block">Validity</span>
                        <span className="font-semibold text-white">
                          {subscription?.validTill
                            ? new Date(subscription.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '1 Year'}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/50 text-[10px] uppercase block">Days Left</span>
                        <span className="font-bold text-[#D4AF37]">
                          {subscription?.validTill
                            ? Math.max(0, Math.ceil((new Date(subscription.validTill) - new Date()) / 86400000))
                            : 365} Days
                        </span>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-dashed border-[#D4AF37]/50 rounded-2xl p-4 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-wider block">Exclusive VIP Coupon</span>
                        <span className="font-mono text-xl font-bold text-white tracking-widest">
                          {subscription?.exclusiveCoupon || subscription?.couponCode || 'AGVIAVIP10'}
                        </span>
                      </div>
                      <button
                        onClick={handleCopyVipCoupon}
                        className="px-4 py-2 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#1A0A0A] font-bold text-xs rounded-xl shadow uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      >
                        {copiedCoupon ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedCoupon ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-[#FFFDF8] to-[#FBF6EE] border-2 border-dashed border-[#B8860B]/40 text-center">
                    <Crown size={32} className="mx-auto text-[#B8860B] mb-2" />
                    <h3 className="font-display text-lg font-bold text-[#8B0000]">Join AGVIA Atelier Circle VIP</h3>
                    <p className="text-xs text-[#3A2D23]/70 max-w-md mx-auto mt-1 mb-5">
                      Get flat 10% VIP discount on all orders, zero delivery fees, and priority morning dispatch for ₹299/year.
                    </p>
                    <Link to="/subscription" className="btn-primary">
                      Unlock VIP Membership
                    </Link>
                  </div>
                )}

                {/* Loyalty Coins Card */}
                <div className="bg-[#1F1F1F] text-white p-6 rounded-3xl border border-[#B8860B]/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#B8860B] font-bold tracking-widest uppercase block">LOYALTY REWARD COINS</span>
                    <p className="font-display text-3xl font-bold text-[#E6C687] mt-1 flex items-center gap-2">
                      <Sparkles size={22} className="text-[#B8860B]" /> 380 Coins
                    </p>
                    <p className="text-[11px] text-white/50 mt-1">Value: ₹380 (1 Coin = ₹1 instant checkout credit)</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-white/10 text-white/70 px-3 py-1 rounded-full font-bold uppercase">
                      Royale Class
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>

        {/* ── MODAL: CHANGE EMAIL ───────────────────────────────── */}
        <AnimatePresence>
          {emailModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
              >
                <button
                  onClick={() => setEmailModalOpen(false)}
                  className="absolute right-5 top-5 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>

                <h3 className="font-display text-xl font-bold text-[#8B0000] mb-1">Change Primary Email</h3>
                <p className="text-xs text-gray-500 mb-6">A 6-digit OTP verification code will be sent to your new email address.</p>

                {emailStatus === 'otp_sent' || emailStatus === 'verifying' ? (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-700">
                      Enter the 6-digit verification code sent to <strong>{newEmail}</strong>:
                    </p>

                    <div className="p-3 bg-[#FAF6EE] border border-[#B8860B]/20 rounded-2xl flex items-center gap-2 text-xs text-[#3A2D23]/80">
                      <Mail size={16} className="text-[#8B0000] shrink-0" />
                      <span>We sent a 6-digit code to <strong>{newEmail}</strong>. Please check your inbox and enter it below.</span>
                    </div>

                    <div className="flex justify-between gap-2">
                      {emailOtpValue.map((digit, index) => (
                        <input
                          key={index}
                          id={`email-otp-${index}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '')
                            const updated = [...emailOtpValue]
                            updated[index] = val
                            setEmailOtpValue(updated)
                            if (val && index < 5) {
                              document.getElementById(`email-otp-${index + 1}`)?.focus()
                            }
                          }}
                          className="w-11 h-12 text-center text-lg font-mono font-bold border border-gray-300 rounded-xl focus:border-[#8B0000] focus:outline-none"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                      <span>{emailOtpTimer > 0 ? `Resend OTP in ${emailOtpTimer}s` : 'Did not receive code?'}</span>
                      {emailOtpTimer === 0 && (
                        <button
                          type="button"
                          onClick={() => handleSendEmailVerification(null)}
                          className="text-[#8B0000] font-bold underline hover:text-[#700000]"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEmailStatus('idle')}
                        className="px-5 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600"
                      >
                        Change Email
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifyEmailOtp}
                        disabled={emailStatus === 'verifying'}
                        className="btn-primary"
                      >
                        {emailStatus === 'verifying' ? 'Verifying...' : 'Verify & Update'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSendEmailVerification} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block mb-1">New Email Address</label>
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="input-field"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEmailModalOpen(false)}
                        className="px-5 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={emailStatus === 'sending'}
                        className="btn-primary"
                      >
                        {emailStatus === 'sending' ? 'Sending OTP...' : 'Send OTP'}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── MODAL: PHONE OTP ──────────────────────────────────── */}
        <AnimatePresence>
          {phoneModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
              >
                <button
                  onClick={() => setPhoneModalOpen(false)}
                  className="absolute right-5 top-5 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>

                <h3 className="font-display text-xl font-bold text-[#8B0000] mb-1">Update Mobile Number</h3>
                <p className="text-xs text-gray-500 mb-6">Enter your new number below. A 6-digit verification code will be generated for you to confirm the change.</p>

                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block mb-1">New Mobile Number</label>
                      <div className="flex gap-2">
                        <span className="px-3.5 py-3 border border-gray-200 bg-gray-50 rounded-xl text-xs font-mono font-bold text-gray-700 flex items-center">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="90323 06961"
                          className="input-field flex-1"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setPhoneModalOpen(false)}
                        className="px-5 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600"
                      >
                        Cancel
                      </button>
                      <button type="submit" disabled={otpSending} className="btn-primary">
                        {otpSending ? 'Sending OTP...' : 'Send OTP'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-700">
                      Enter the 6-digit code below to confirm <strong>+91 {newPhone}</strong>:
                    </p>

                    {/* Direct OTP display — no external app needed */}
                    <div className="p-4 bg-[#FFF8EE] border-2 border-dashed border-[#8B0000]/40 rounded-2xl flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.2em]">Your Verification Code</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-3xl font-bold tracking-[0.35em] text-[#8B0000] select-all">
                          {receivedOtpCode || '------'}
                        </span>
                        {receivedOtpCode && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(receivedOtpCode)
                              toast.success('OTP copied!', { duration: 1500 })
                            }}
                            className="p-1.5 rounded-lg bg-[#8B0000]/10 hover:bg-[#8B0000]/20 text-[#8B0000] transition-colors"
                            title="Copy OTP"
                          >
                            <Copy size={14} />
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">Valid for 10 minutes · Do not share</span>
                    </div>
                    
                    <div className="flex justify-between gap-2">
                      {otpValue.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '')
                            const updated = [...otpValue]
                            updated[index] = val
                            setOtpValue(updated)
                            if (val && index < 5) {
                              document.getElementById(`otp-${index + 1}`)?.focus()
                            }
                          }}
                          className="w-11 h-12 text-center text-lg font-mono font-bold border border-gray-300 rounded-xl focus:border-[#8B0000] focus:outline-none"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                      <span>{otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : 'Did not receive code?'}</span>
                      {otpTimer === 0 && (
                        <button
                          type="button"
                          onClick={() => handleSendOtp(null)}
                          className="text-[#8B0000] font-bold underline hover:text-[#700000]"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="px-5 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600"
                      >
                        Change Number
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpVerifying}
                        className="btn-primary"
                      >
                        {otpVerifying ? 'Verifying...' : 'Verify & Update'}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── MODAL: ADD / EDIT ADDRESS ─────────────────────────── */}
        <AnimatePresence>
          {showAddressModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
              >
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="absolute right-5 top-5 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>

                <h3 className="font-display text-xl font-bold text-[#8B0000] mb-4">
                  {editingAddressId ? 'Edit Address' : 'Add New Delivery Address'}
                </h3>

                <form onSubmit={handleSaveAddress} className="space-y-3.5">
                  <div>
                    <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block mb-1">Recipient Name</label>
                    <input
                      required
                      value={addressForm.name}
                      onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                      placeholder="Full Name"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block mb-1">Contact Phone</label>
                    <input
                      required
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      placeholder="+91 90323 06961"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block mb-1">Street Address</label>
                    <textarea
                      required
                      rows={2}
                      value={addressForm.line}
                      onChange={(e) => setAddressForm({ ...addressForm, line: e.target.value })}
                      placeholder="Flat, building, road, area"
                      className="input-field resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block mb-1">City</label>
                      <input
                        required
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block mb-1">PIN Code (6 digits)</label>
                      <input
                        required
                        maxLength={6}
                        value={addressForm.pincode}
                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                        placeholder="500033"
                        className="input-field font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block mb-1">Address Label</label>
                    <div className="flex gap-3">
                      {['Home', 'Work', 'Other'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setAddressForm({ ...addressForm, type })}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                            addressForm.type === type
                              ? 'border-[#8B0000] bg-[#8B0000] text-white'
                              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(false)}
                      className="px-5 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      {editingAddressId ? 'Update Address' : 'Save Address'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── MODAL: ADD PAYMENT CARD ──────────────────────────── */}
        <AnimatePresence>
          {showCardModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
              >
                <button
                  onClick={() => setShowCardModal(false)}
                  className="absolute right-5 top-5 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>

                <h3 className="font-display text-xl font-bold text-[#8B0000] mb-4">Add Payment Method</h3>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const cleanNum = cardForm.number.replace(/\D/g, '')
                    if (cleanNum.length < 15) {
                      toast.error('Please enter a valid card number.')
                      return
                    }
                    setSavedCards(prev => [
                      ...prev,
                      {
                        id: `card_${Date.now()}`,
                        bank: 'State Bank of India',
                        masked: `•••• ${cleanNum.slice(-4)}`,
                        brand: cardForm.brand,
                        exp: cardForm.exp || '12/29',
                        isDefault: false
                      }
                    ])
                    setShowCardModal(false)
                    setCardForm({ holder: '', number: '', exp: '', brand: 'Visa' })
                    toast.success('Payment method tokenized and saved!')
                  }}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block mb-1">Cardholder Name</label>
                    <input
                      required
                      value={cardForm.holder}
                      onChange={(e) => setCardForm({ ...cardForm, holder: e.target.value })}
                      placeholder="Name on card"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block mb-1">Card Number</label>
                    <input
                      required
                      maxLength={19}
                      value={cardForm.number}
                      onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                      placeholder="4111 2222 3333 4444"
                      className="input-field font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block mb-1">Expiry Date</label>
                      <input
                        required
                        maxLength={5}
                        value={cardForm.exp}
                        onChange={(e) => setCardForm({ ...cardForm, exp: e.target.value })}
                        placeholder="MM/YY"
                        className="input-field font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block mb-1">Network</label>
                      <select
                        value={cardForm.brand}
                        onChange={(e) => setCardForm({ ...cardForm, brand: e.target.value })}
                        className="input-field bg-white"
                      >
                        <option>Visa</option>
                        <option>Mastercard</option>
                        <option>RuPay</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCardModal(false)}
                      className="px-5 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Save Card Token
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  )
}
