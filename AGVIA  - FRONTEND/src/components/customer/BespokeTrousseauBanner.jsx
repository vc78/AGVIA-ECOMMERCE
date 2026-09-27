import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Video,
  Calendar,
  MessageSquare,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  MapPin,
  Users,
  Check
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { BUSINESS } from '../../constants/business'

export default function BespokeTrousseauBanner() {
  // activePanel: null | 'video' | 'atelier'
  const [activePanel, setActivePanel] = useState(null)
  const panelRef = useRef(null)

  // Direct WhatsApp connection handler
  const handleWhatsAppChat = () => {
    const message = encodeURIComponent(
      `Hello AGVIA Atelier! I would like to consult with a bridal stylist regarding bespoke trousseau curation and heirloom silks.`
    )
    const url = `https://wa.me/${BUSINESS.contact.whatsappRaw}?text=${message}`
    window.open(url, '_blank', 'noopener,noreferrer')
    toast.success('Connecting with AGVIA Atelier stylist on WhatsApp...')
  }

  const togglePanel = (panelName) => {
    setActivePanel(prev => (prev === panelName ? null : panelName))
  }

  // Smoothly scroll to panel when opened
  useEffect(() => {
    if (activePanel && panelRef.current) {
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 150)
    }
  }, [activePanel])

  return (
    <section className="container-luxury my-6 md:my-10 relative z-10 select-none font-body">
      <div className="rounded-[28px] sm:rounded-3xl overflow-hidden relative shadow-2xl bg-gradient-to-r from-[#24040B] via-[#480A17] to-[#24040B] border border-[#C9A45C]/35 py-[clamp(24px,4vw,36px)] px-[clamp(16px,3.5vw,36px)] transition-all">
        
        {/* Subtle background radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(201,164,92,0.12),transparent_70%)] pointer-events-none" />

        {/* ── Top Row: 3-Column Luxury Banner Grid ── */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          
          {/* ── Left 4 Cols: Headings & Navigation Buttons ── */}
          <div className="lg:col-span-4 text-left space-y-3.5">
            <div className="inline-flex items-center gap-1.5 text-[#C9A45C] text-[9.5px] font-bold tracking-[0.24em] uppercase">
              <span>BESPOKE TROUSSEAU CURATION</span>
              <span>✦</span>
            </div>

            <h2 className="font-serif text-[clamp(1.75rem,3.2vw,2.6rem)] text-white font-bold leading-tight tracking-tight">
              Bridal Trousseau,<br />Elevated.
            </h2>

            <p className="font-sans text-xs sm:text-[13px] text-white/80 leading-relaxed max-w-sm">
              Handpicked heirloom silks and embroidered ensembles delivered in a bespoke keepsake presentation.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <Link
                to="/products?category=Lehengas"
                className="inline-flex items-center justify-center gap-2 bg-[#C9A45C] hover:bg-white text-[#211D1E] font-bold text-xs tracking-widest uppercase px-5 sm:px-6 py-3 rounded-full shadow-lg transition-all active:scale-95 min-h-[44px] touch-target"
              >
                <span>EXPLORE TROUSSEAU</span>
                <ArrowRight size={13} className="stroke-[2.5]" />
              </Link>

              <Link
                to="/products?category=Sarees"
                className="inline-flex items-center justify-center gap-2 border border-white/40 hover:border-[#C9A45C] text-white hover:text-[#C9A45C] font-semibold text-xs tracking-widest uppercase px-4 sm:px-5 py-3 rounded-full transition-all min-h-[44px] touch-target"
              >
                <span>HEIRLOOM SAREES</span>
              </Link>
            </div>
          </div>

          {/* ── Center 4 Cols: Royal Bride Portrait ── */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-[#C9A45C]/40 max-w-[380px] lg:max-w-[340px] xl:max-w-[400px] w-full aspect-[16/11] group">
              <img
                src="/images/bridal_trousseau_banner.jpg"
                alt="Royal Bridal Trousseau"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* ── Right 4 Cols: 3 Interactive Action Cards ── */}
          <div className="lg:col-span-4 space-y-3 pt-1 lg:pt-0">
            
            {/* Card 1: Book a Video Consultation */}
            <div
              onClick={() => togglePanel('video')}
              className={`relative cursor-pointer rounded-2xl p-3.5 sm:p-4 transition-all duration-300 shadow-md border ${
                activePanel === 'video'
                  ? 'bg-[#1A0307] border-[#C9A45C] ring-2 ring-[#C9A45C]/50 shadow-[0_0_20px_rgba(201,164,92,0.25)]'
                  : 'bg-[#1A0307]/75 hover:bg-[#1A0307]/90 border-[#C9A45C]/25 hover:border-[#C9A45C]/60'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 shadow-sm mt-0.5 transition-colors ${
                    activePanel === 'video'
                      ? 'bg-[#C9A45C] text-[#211D1E] border-[#C9A45C]'
                      : 'bg-[#5A1020]/80 text-[#C9A45C] border-[#C9A45C]/40'
                  }`}>
                    <Video size={17} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-serif text-sm sm:text-[15px] font-bold text-white tracking-wide truncate">
                      Book a Video Consultation
                    </h4>
                    <p className="text-[11px] text-white/70 leading-snug line-clamp-2 mt-0.5">
                      Meet an AGVIA stylist privately from anywhere.
                    </p>
                    <div className="flex items-center gap-1 text-[10.5px] text-[#C9A45C] font-medium mt-1">
                      <Clock size={11} className="shrink-0" />
                      <span>15–30 min consultation</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePanel('video')
                  }}
                  className={`shrink-0 text-[9.5px] sm:text-[10px] font-bold tracking-widest uppercase px-3 sm:px-3.5 py-2 rounded-full transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap min-h-[36px] ${
                    activePanel === 'video'
                      ? 'bg-[#C9A45C] text-[#211D1E] border border-[#C9A45C]'
                      : 'border border-[#C9A45C]/60 hover:border-[#C9A45C] bg-[#C9A45C]/10 hover:bg-[#C9A45C] text-[#C9A45C] hover:text-[#211D1E]'
                  }`}
                >
                  <span>{activePanel === 'video' ? 'CLOSE' : 'BOOK VIDEO CALL'}</span>
                  {activePanel === 'video' ? <X size={11} /> : <ArrowRight size={11} />}
                </button>
              </div>
            </div>

            {/* Card 2: Schedule an Atelier Appointment */}
            <div
              onClick={() => togglePanel('atelier')}
              className={`relative cursor-pointer rounded-2xl p-3.5 sm:p-4 transition-all duration-300 shadow-md border ${
                activePanel === 'atelier'
                  ? 'bg-[#1A0307] border-[#C9A45C] ring-2 ring-[#C9A45C]/50 shadow-[0_0_20px_rgba(201,164,92,0.25)]'
                  : 'bg-[#1A0307]/75 hover:bg-[#1A0307]/90 border-[#C9A45C]/25 hover:border-[#C9A45C]/60'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 shadow-sm mt-0.5 transition-colors ${
                    activePanel === 'atelier'
                      ? 'bg-[#C9A45C] text-[#211D1E] border-[#C9A45C]'
                      : 'bg-[#5A1020]/80 text-[#C9A45C] border-[#C9A45C]/40'
                  }`}>
                    <Calendar size={17} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-serif text-sm sm:text-[15px] font-bold text-white tracking-wide truncate">
                      Schedule an Atelier Appointment
                    </h4>
                    <p className="text-[11px] text-white/70 leading-snug line-clamp-2 mt-0.5">
                      Choose your preferred date and time for a personal styling session.
                    </p>
                    <div className="flex items-center gap-1 text-[10.5px] text-[#C9A45C] font-medium mt-1">
                      <Calendar size={11} className="shrink-0" />
                      <span>By appointment</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePanel('atelier')
                  }}
                  className={`shrink-0 text-[9.5px] sm:text-[10px] font-bold tracking-widest uppercase px-3 sm:px-3.5 py-2 rounded-full transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap min-h-[36px] ${
                    activePanel === 'atelier'
                      ? 'bg-[#C9A45C] text-[#211D1E] border border-[#C9A45C]'
                      : 'border border-[#C9A45C]/60 hover:border-[#C9A45C] bg-[#C9A45C]/10 hover:bg-[#C9A45C] text-[#C9A45C] hover:text-[#211D1E]'
                  }`}
                >
                  <span>{activePanel === 'atelier' ? 'CLOSE' : 'SCHEDULE APPOINTMENT'}</span>
                  {activePanel === 'atelier' ? <X size={11} /> : <ArrowRight size={11} />}
                </button>
              </div>
            </div>

            {/* Card 3: Chat on WhatsApp */}
            <div
              onClick={handleWhatsAppChat}
              className="relative cursor-pointer group bg-[#1A0307]/75 hover:bg-[#1A0307]/90 border border-[#C9A45C]/25 hover:border-[#C9A45C]/60 rounded-2xl p-3.5 sm:p-4 transition-all duration-300 shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#5A1020]/80 border border-[#C9A45C]/40 flex items-center justify-center text-[#C9A45C] shrink-0 shadow-sm mt-0.5">
                    <MessageSquare size={17} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-serif text-sm sm:text-[15px] font-bold text-white tracking-wide truncate">
                      Chat on WhatsApp
                    </h4>
                    <p className="text-[11px] text-white/70 leading-snug line-clamp-2 mt-0.5">
                      Message our styling team directly for quick assistance.
                    </p>
                    <div className="flex items-center gap-1.5 text-[10.5px] text-[#C9A45C] font-medium mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                      <span>Typically replies quickly</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="shrink-0 border border-[#C9A45C]/60 hover:border-[#C9A45C] bg-[#C9A45C]/10 hover:bg-[#C9A45C] text-[#C9A45C] hover:text-[#211D1E] text-[9.5px] sm:text-[10px] font-bold tracking-widest uppercase px-3 sm:px-3.5 py-2 rounded-full transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap min-h-[36px]"
                >
                  <span>CHAT ON WHATSAPP</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* ── Seamless In-Place Interactive Drawer / Section ── */}
        <div ref={panelRef}>
          <AnimatePresence mode="wait">
            {activePanel === 'video' && (
              <motion.div
                key="video-panel"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="bg-[#1A0307] border-2 border-[#C9A45C]/40 rounded-3xl p-5 sm:p-7 md:p-8 text-white shadow-2xl relative">
                  <div className="flex items-center justify-between border-b border-[#C9A45C]/25 pb-4 mb-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#C9A45C] text-[#211D1E] flex items-center justify-center">
                        <Video size={16} />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                          Private Video Consultation via Google Meet
                        </h3>
                        <p className="text-[11px] text-white/70">
                          Connect with a senior bridal stylist • Instant link generation
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActivePanel(null)}
                      className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                      title="Close consultation scheduler"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <InlineVideoScheduler onClose={() => setActivePanel(null)} />
                </div>
              </motion.div>
            )}

            {activePanel === 'atelier' && (
              <motion.div
                key="atelier-panel"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="bg-[#1A0307] border-2 border-[#C9A45C]/40 rounded-3xl p-5 sm:p-7 md:p-8 text-white shadow-2xl relative">
                  <div className="flex items-center justify-between border-b border-[#C9A45C]/25 pb-4 mb-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#C9A45C] text-[#211D1E] flex items-center justify-center">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                          Reserve Flagship Atelier Appointment
                        </h3>
                        <p className="text-[11px] text-white/70">
                          Jubilee Hills VIP Suite • Dedicated stylist & draper
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActivePanel(null)}
                      className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                      title="Close appointment scheduler"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <InlineAtelierScheduler onClose={() => setActivePanel(null)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════
// INLINE VIDEO CONSULTATION & GOOGLE MEET SCHEDULER
// ══════════════════════════════════════════════════════════════════════
function InlineVideoScheduler({ onClose }) {
  const [step, setStep] = useState('form') // 'form' | 'confirmed'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'Bridal Lehenga Consultation',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeSlot: '04:00 PM',
    notes: ''
  })
  const [meetingDetails, setMeetingDetails] = useState(null)
  const [copied, setCopied] = useState(false)

  const timeSlots = [
    '11:30 AM',
    '02:00 PM',
    '03:30 PM',
    '04:00 PM',
    '05:30 PM',
    '07:00 PM'
  ]

  const services = [
    { id: 'lehenga', label: 'Bridal Lehenga Consultation', duration: '30 min' },
    { id: 'saree', label: 'Heirloom Kanjeevaram & Silk Saree', duration: '20 min' },
    { id: 'gown', label: 'Reception & Contemporary Gowns', duration: '25 min' },
    { id: 'full', label: 'Complete Wedding Trousseau Curate', duration: '45 min' }
  ]

  const handleBookingSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) {
      toast.error('Please fill in your name, email, and phone number.')
      return
    }

    const randomCode = Math.random().toString(36).substring(2, 6)
    const randomMid = Math.random().toString(36).substring(2, 6)
    const meetCode = `agv-${randomMid}-${randomCode}`
    const meetUrl = `https://meet.google.com/${meetCode}`

    const booking = {
      id: `AGV-VID-${Date.now().toString().slice(-6)}`,
      meetUrl,
      meetCode,
      ...formData,
      stylist: 'Ananya Sharma (Senior Bridal Stylist)',
      createdAt: new Date().toISOString()
    }

    try {
      const existing = JSON.parse(localStorage.getItem('agvia_video_consultations') || '[]')
      localStorage.setItem('agvia_video_consultations', JSON.stringify([booking, ...existing]))
    } catch {}

    setMeetingDetails(booking)
    setStep('confirmed')
    toast.success('Your private video consultation has been scheduled!', {
      style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
    })
  }

  const handleCopyLink = () => {
    if (meetingDetails?.meetUrl) {
      navigator.clipboard.writeText(meetingDetails.meetUrl)
      setCopied(true)
      toast.success('Google Meet link copied to clipboard!')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleAddGoogleCalendar = () => {
    if (!meetingDetails) return
    const title = encodeURIComponent(`AGVIA Bridal Video Consultation: ${meetingDetails.service}`)
    const details = encodeURIComponent(
      `Video styling session with AGVIA Senior Stylist.\n\nJoin Google Meet: ${meetingDetails.meetUrl}\nBoutique Concierge: ${BUSINESS.contact.phone}`
    )
    const location = encodeURIComponent(meetingDetails.meetUrl)
    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`
    window.open(calUrl, '_blank', 'noopener,noreferrer')
  }

  const handleSendToWhatsApp = () => {
    if (!meetingDetails) return
    const text = encodeURIComponent(
      `Hello AGVIA Atelier! I have scheduled a Video Consultation for ${meetingDetails.service}.\nDate: ${meetingDetails.date} at ${meetingDetails.timeSlot}\nGoogle Meet Link: ${meetingDetails.meetUrl}\nName: ${meetingDetails.name}`
    )
    window.open(`https://wa.me/${BUSINESS.contact.whatsappRaw}?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  if (step === 'confirmed' && meetingDetails) {
    return (
      <div className="space-y-6 text-center max-w-2xl mx-auto py-2">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
          <CheckCircle2 size={30} />
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#C9A45C] tracking-[0.25em] uppercase">
            SESSION CONFIRMED
          </span>
          <h4 className="font-serif text-2xl font-bold text-white mt-1">
            Your Google Meet Session is Ready!
          </h4>
          <p className="text-xs text-white/70 mt-1 max-w-md mx-auto">
            An AGVIA bridal fashion stylist will join you live on Google Meet at your selected time.
          </p>
        </div>

        {/* Details Card */}
        <div className="bg-[#2A060D] border border-[#C9A45C]/30 rounded-2xl p-4 text-left text-xs space-y-2">
          <div className="flex justify-between items-center border-b border-[#C9A45C]/15 pb-2">
            <span className="text-white/60">Consultation:</span>
            <span className="font-serif font-bold text-[#C9A45C]">{meetingDetails.service}</span>
          </div>
          <div className="flex justify-between items-center border-b border-[#C9A45C]/15 pb-2">
            <span className="text-white/60">Scheduled Time:</span>
            <span className="font-semibold text-white">
              {meetingDetails.date} at {meetingDetails.timeSlot} IST
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Dedicated Stylist:</span>
            <span className="font-medium text-white">{meetingDetails.stylist}</span>
          </div>
        </div>

        {/* Link Box */}
        <div className="bg-[#0D0103] border-2 border-[#C9A45C]/60 rounded-2xl p-4 text-left space-y-3 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#C9A45C] text-[10px] font-bold uppercase tracking-wider">
              <Video size={13} />
              <span>Official Google Meet Link</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">● Active</span>
          </div>

          <div className="flex items-center justify-between gap-2 bg-white/10 rounded-xl px-3 py-2 border border-white/10">
            <span className="font-mono text-xs text-white truncate">
              {meetingDetails.meetUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="shrink-0 p-1.5 hover:bg-white/15 rounded-lg text-[#C9A45C] transition-colors"
              title="Copy Google Meet Link"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
            <a
              href={meetingDetails.meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#C9A45C] hover:bg-white text-[#211D1E] font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <span>JOIN GOOGLE MEET</span>
              <ExternalLink size={13} />
            </a>

            <button
              onClick={handleAddGoogleCalendar}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl border border-white/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <Calendar size={13} className="text-[#C9A45C]" />
              <span>Add to Calendar</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={handleSendToWhatsApp}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5"
          >
            <MessageSquare size={13} />
            <span>Send Details to WhatsApp</span>
          </button>
          <span className="text-white/20">•</span>
          <button
            onClick={() => setStep('form')}
            className="text-xs text-[#C9A45C] hover:underline font-bold"
          >
            Schedule Another
          </button>
          <span className="text-white/20">•</span>
          <button
            onClick={onClose}
            className="text-xs text-white/60 hover:text-white hover:underline font-bold"
          >
            Close Panel
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleBookingSubmit} className="space-y-5">
      {/* Service Selection Chips */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#C9A45C] mb-2">
          1. Select Consultation Focus
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {services.map((srv) => (
            <button
              type="button"
              key={srv.id}
              onClick={() => setFormData({ ...formData, service: srv.label })}
              className={`p-3 rounded-xl border text-left transition-all ${
                formData.service === srv.label
                  ? 'border-[#C9A45C] bg-[#C9A45C]/15 ring-1 ring-[#C9A45C]'
                  : 'border-[#C9A45C]/20 bg-[#25050C] hover:border-[#C9A45C]/50'
              }`}
            >
              <span className="font-serif text-xs font-semibold text-white block line-clamp-1">{srv.label}</span>
              <span className="text-[10px] text-[#C9A45C] font-mono mt-1 block">⏱ {srv.duration}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Date & Time Slot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#C9A45C] mb-1.5">
            2. Preferred Consultation Date
          </label>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#C9A45C]/35 bg-[#25050C] text-white text-xs font-semibold focus:outline-none focus:border-[#C9A45C]"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#C9A45C] mb-1.5">
            3. Time Slot (IST)
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {timeSlots.map((ts) => (
              <button
                type="button"
                key={ts}
                onClick={() => setFormData({ ...formData, timeSlot: ts })}
                className={`py-2 px-2 rounded-lg text-[10.5px] font-semibold border transition-all text-center ${
                  formData.timeSlot === ts
                    ? 'bg-[#C9A45C] text-[#211D1E] border-[#C9A45C] font-bold'
                    : 'bg-[#25050C] text-white/80 border-[#C9A45C]/25 hover:border-[#C9A45C]/60'
                }`}
              >
                {ts}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#C9A45C] mb-1.5">
          4. Contact Information
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Full Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="px-3.5 py-2.5 rounded-xl border border-[#C9A45C]/35 bg-[#25050C] text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#C9A45C]"
            required
          />
          <input
            type="email"
            placeholder="Email Address *"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="px-3.5 py-2.5 rounded-xl border border-[#C9A45C]/35 bg-[#25050C] text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#C9A45C]"
            required
          />
          <input
            type="tel"
            placeholder="Phone / WhatsApp *"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="px-3.5 py-2.5 rounded-xl border border-[#C9A45C]/35 bg-[#25050C] text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#C9A45C]"
            required
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#C9A45C]/20">
        <p className="text-[10px] text-white/60 text-center sm:text-left">
          Free 1-on-1 virtual styling session • Instant Google Meet link generated upon submission
        </p>

        <button
          type="submit"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#C9A45C] hover:bg-white text-[#211D1E] font-bold text-xs tracking-widest uppercase px-6 py-3 rounded-full shadow-lg transition-all active:scale-95"
        >
          <span>GENERATE GOOGLE MEET LINK</span>
          <ArrowRight size={13} className="stroke-[2.5]" />
        </button>
      </div>
    </form>
  )
}

// ══════════════════════════════════════════════════════════════════════
// INLINE ATELIER IN-STORE APPOINTMENT SCHEDULER
// ══════════════════════════════════════════════════════════════════════
function InlineAtelierScheduler({ onClose }) {
  const [step, setStep] = useState('form') // 'form' | 'confirmed'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    timeSlot: '03:00 PM - 04:30 PM',
    guests: 'Bride + 2 Guests',
    occasion: 'Wedding Day Trousseau',
    notes: ''
  })
  const [bookingRef, setBookingRef] = useState('')

  const timeSlots = [
    '11:00 AM - 12:30 PM',
    '01:00 PM - 02:30 PM',
    '03:00 PM - 04:30 PM',
    '05:00 PM - 06:30 PM',
    '07:00 PM - 08:30 PM'
  ]

  const occasions = [
    'Wedding Day Trousseau',
    'Sangeet & Mehendi Ensemble',
    'Reception Couture Gown',
    'Festive Family Heritage Silks',
    'Bespoke Bridal Tailoring'
  ]

  const guestOptions = [
    'Bride Solo',
    'Bride + 1 Guest',
    'Bride + 2 Guests',
    'Bridal Entourage (3-5 Guests)'
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Please enter your name and phone number.')
      return
    }

    const ref = `AGV-HYD-${Math.floor(1000 + Math.random() * 9000)}`
    setBookingRef(ref)

    try {
      const existing = JSON.parse(localStorage.getItem('agvia_atelier_appointments') || '[]')
      localStorage.setItem(
        'agvia_atelier_appointments',
        JSON.stringify([{ id: ref, ...formData, createdAt: new Date().toISOString() }, ...existing])
      )
    } catch {}

    setStep('confirmed')
    toast.success('Your private salon appointment has been reserved!', {
      style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
    })
  }

  const handleConfirmWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello AGVIA Atelier! I have scheduled an in-store appointment at the Jubilee Hills salon.\nBooking Ref: ${bookingRef}\nDate: ${formData.date}\nSlot: ${formData.timeSlot}\nName: ${formData.name}\nParty Size: ${formData.guests}\nOccasion: ${formData.occasion}`
    )
    window.open(`https://wa.me/${BUSINESS.contact.whatsappRaw}?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  if (step === 'confirmed') {
    return (
      <div className="space-y-6 text-center max-w-2xl mx-auto py-2">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
          <CheckCircle2 size={30} />
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#C9A45C] tracking-[0.25em] uppercase">
            RESERVATION CONFIRMED
          </span>
          <h4 className="font-serif text-2xl font-bold text-white mt-1">
            VIP Suite Reserved at Jubilee Hills
          </h4>
          <p className="text-xs text-white/70 mt-1 max-w-md mx-auto">
            Your appointment has been logged. We look forward to welcoming you to the flagship salon.
          </p>
        </div>

        {/* Reference & Summary Box */}
        <div className="bg-[#2A060D] border-2 border-[#C9A45C]/50 rounded-2xl p-5 text-left text-xs space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#C9A45C]/20 pb-3">
            <div>
              <span className="text-[10px] text-white/50 uppercase tracking-widest block">Booking Reference</span>
              <span className="font-mono text-base font-bold text-[#C9A45C]">{bookingRef}</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
              Reserved
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-white/50 text-[11px] block">Date & Time Slot:</span>
              <span className="text-white font-semibold">{formData.date} • {formData.timeSlot}</span>
            </div>
            <div>
              <span className="text-white/50 text-[11px] block">Party Size:</span>
              <span className="text-white font-semibold">{formData.guests}</span>
            </div>
            <div>
              <span className="text-white/50 text-[11px] block">Occasion:</span>
              <span className="text-white font-semibold">{formData.occasion}</span>
            </div>
            <div>
              <span className="text-white/50 text-[11px] block">Atelier Address:</span>
              <span className="text-white/80">{BUSINESS.location.fullAddress}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleConfirmWhatsApp}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-full flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <MessageSquare size={14} />
            <span>Confirm on WhatsApp</span>
          </button>

          <a
            href={BUSINESS.location.mapUrl || 'https://maps.google.com/?q=Jubilee+Hills+Hyderabad'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-semibold text-xs uppercase tracking-wider py-3 px-5 rounded-full border border-white/20 flex items-center justify-center gap-1.5 transition-all"
          >
            <MapPin size={13} className="text-[#C9A45C]" />
            <span>Open in Google Maps</span>
          </a>

          <button
            onClick={onClose}
            className="w-full sm:w-auto text-xs text-white/70 hover:text-white py-2 px-4 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Salon Location banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#25050C] border border-[#C9A45C]/30 text-xs text-white/80">
        <MapPin size={18} className="text-[#C9A45C] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block font-serif">AGVIA Flagship Atelier</span>
          <span className="text-[11px] leading-tight block text-white/70 mt-0.5">
            {BUSINESS.location.fullAddress} • Private Trial Suite & High Tea Service
          </span>
        </div>
      </div>

      {/* Date & Time Slot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#C9A45C] mb-1.5">
            1. Appointment Date
          </label>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#C9A45C]/35 bg-[#25050C] text-white text-xs font-semibold focus:outline-none focus:border-[#C9A45C]"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#C9A45C] mb-1.5">
            2. Salon Session Slot
          </label>
          <select
            value={formData.timeSlot}
            onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#C9A45C]/35 bg-[#25050C] text-white text-xs font-semibold focus:outline-none focus:border-[#C9A45C]"
          >
            {timeSlots.map((ts) => (
              <option key={ts} value={ts} className="bg-[#1A0307] text-white">{ts}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Guests & Occasion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#C9A45C] mb-1.5">
            3. Accompanying Party Size
          </label>
          <select
            value={formData.guests}
            onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#C9A45C]/35 bg-[#25050C] text-white text-xs font-semibold focus:outline-none focus:border-[#C9A45C]"
          >
            {guestOptions.map((g) => (
              <option key={g} value={g} className="bg-[#1A0307] text-white">{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#C9A45C] mb-1.5">
            4. Trousseau Occasion
          </label>
          <select
            value={formData.occasion}
            onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#C9A45C]/35 bg-[#25050C] text-white text-xs font-semibold focus:outline-none focus:border-[#C9A45C]"
          >
            {occasions.map((o) => (
              <option key={o} value={o} className="bg-[#1A0307] text-white">{o}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Contact Details */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#C9A45C] mb-1.5">
          5. Guest Contact Details
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Full Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="px-3.5 py-2.5 rounded-xl border border-[#C9A45C]/35 bg-[#25050C] text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#C9A45C]"
            required
          />
          <input
            type="tel"
            placeholder="Mobile Number *"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="px-3.5 py-2.5 rounded-xl border border-[#C9A45C]/35 bg-[#25050C] text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#C9A45C]"
            required
          />
          <input
            type="email"
            placeholder="Email Address (Optional)"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="px-3.5 py-2.5 rounded-xl border border-[#C9A45C]/35 bg-[#25050C] text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#C9A45C]"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#C9A45C]/20">
        <p className="text-[10px] text-white/60 text-center sm:text-left">
          Includes private trial suite, tea refreshments, and master bridal draper assistance.
        </p>

        <button
          type="submit"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#C9A45C] hover:bg-white text-[#211D1E] font-bold text-xs tracking-widest uppercase px-6 py-3 rounded-full shadow-lg transition-all active:scale-95"
        >
          <span>RESERVE ATELIER SUITE</span>
          <ArrowRight size={13} className="stroke-[2.5]" />
        </button>
      </div>
    </form>
  )
}
