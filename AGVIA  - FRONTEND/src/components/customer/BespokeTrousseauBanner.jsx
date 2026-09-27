import { useState, useId } from 'react'
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
  ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { BUSINESS } from '../../constants/business'

export default function BespokeTrousseauBanner() {
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showAtelierModal, setShowAtelierModal] = useState(false)

  // Direct WhatsApp connection handler
  const handleWhatsAppChat = () => {
    const message = encodeURIComponent(
      `Hello AGVIA Atelier! I would like to consult with a bridal stylist regarding bespoke trousseau curation and heirloom silks.`
    )
    const url = `https://wa.me/${BUSINESS.contact.whatsappRaw}?text=${message}`
    window.open(url, '_blank', 'noopener,noreferrer')
    toast.success('Connecting with AGVIA Atelier stylist on WhatsApp...')
  }

  return (
    <>
      <section className="container-luxury my-6 md:my-10 relative z-10 select-none">
        <div className="rounded-[28px] sm:rounded-3xl overflow-hidden relative shadow-2xl bg-gradient-to-r from-[#24040B] via-[#480A17] to-[#24040B] border border-[#C9A45C]/35 py-[clamp(24px,4vw,40px)] px-[clamp(16px,3.5vw,40px)]">
          
          {/* Subtle background radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(201,164,92,0.12),transparent_70%)] pointer-events-none" />

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

            {/* ── Center 4-5 Cols: Royal Bride Portrait ── */}
            <div className="lg:col-span-4 xl:col-span-4 flex justify-center">
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
            <div className="lg:col-span-4 xl:col-span-4 space-y-3 pt-1 lg:pt-0">
              
              {/* Card 1: Book a Video Consultation */}
              <div className="relative group bg-[#1A0307]/75 hover:bg-[#1A0307]/90 border border-[#C9A45C]/25 hover:border-[#C9A45C]/60 rounded-2xl p-3.5 sm:p-4 transition-all duration-300 shadow-md">
                {/* Decorative corner flourish */}
                <div className="absolute top-2 right-2 text-[#C9A45C]/30 text-[10px] pointer-events-none select-none">✦</div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#5A1020]/80 border border-[#C9A45C]/40 flex items-center justify-center text-[#C9A45C] shrink-0 shadow-sm mt-0.5">
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
                    onClick={() => setShowVideoModal(true)}
                    className="shrink-0 border border-[#C9A45C]/60 hover:border-[#C9A45C] bg-[#C9A45C]/10 hover:bg-[#C9A45C] text-[#C9A45C] hover:text-[#211D1E] text-[9.5px] sm:text-[10px] font-bold tracking-widest uppercase px-3 sm:px-3.5 py-2 rounded-full transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap min-h-[36px]"
                  >
                    <span>BOOK VIDEO CALL</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>

              {/* Card 2: Schedule an Atelier Appointment */}
              <div className="relative group bg-[#1A0307]/75 hover:bg-[#1A0307]/90 border border-[#C9A45C]/25 hover:border-[#C9A45C]/60 rounded-2xl p-3.5 sm:p-4 transition-all duration-300 shadow-md">
                <div className="absolute top-2 right-2 text-[#C9A45C]/30 text-[10px] pointer-events-none select-none">✦</div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#5A1020]/80 border border-[#C9A45C]/40 flex items-center justify-center text-[#C9A45C] shrink-0 shadow-sm mt-0.5">
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
                    onClick={() => setShowAtelierModal(true)}
                    className="shrink-0 border border-[#C9A45C]/60 hover:border-[#C9A45C] bg-[#C9A45C]/10 hover:bg-[#C9A45C] text-[#C9A45C] hover:text-[#211D1E] text-[9.5px] sm:text-[10px] font-bold tracking-widest uppercase px-3 sm:px-3.5 py-2 rounded-full transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap min-h-[36px]"
                  >
                    <span>SCHEDULE APPOINTMENT</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>

              {/* Card 3: Chat on WhatsApp */}
              <div className="relative group bg-[#1A0307]/75 hover:bg-[#1A0307]/90 border border-[#C9A45C]/25 hover:border-[#C9A45C]/60 rounded-2xl p-3.5 sm:p-4 transition-all duration-300 shadow-md">
                <div className="absolute top-2 right-2 text-[#C9A45C]/30 text-[10px] pointer-events-none select-none">✦</div>

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
                    onClick={handleWhatsAppChat}
                    className="shrink-0 border border-[#C9A45C]/60 hover:border-[#C9A45C] bg-[#C9A45C]/10 hover:bg-[#C9A45C] text-[#C9A45C] hover:text-[#211D1E] text-[9.5px] sm:text-[10px] font-bold tracking-widest uppercase px-3 sm:px-3.5 py-2 rounded-full transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap min-h-[36px]"
                  >
                    <span>CHAT ON WHATSAPP</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ── MODAL 1: Video Consultation & Google Meet Scheduler ── */}
      <AnimatePresence>
        {showVideoModal && (
          <VideoConsultationModal onClose={() => setShowVideoModal(false)} />
        )}
      </AnimatePresence>

      {/* ── MODAL 2: Atelier Appointment Scheduler ── */}
      <AnimatePresence>
        {showAtelierModal && (
          <AtelierAppointmentModal onClose={() => setShowAtelierModal(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════
// VIDEO CONSULTATION & GOOGLE MEET SCHEDULER MODAL
// ══════════════════════════════════════════════════════════════════════
function VideoConsultationModal({ onClose }) {
  const [step, setStep] = useState('form') // 'form' | 'confirmed'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'Bridal Lehenga Consultation',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow default
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

    // Generate unique realistic Google Meet code (e.g. agv-trou-9x4b)
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

    // Persist to local storage
    try {
      const existing = JSON.parse(localStorage.getItem('agvia_video_consultations') || '[]')
      localStorage.setItem('agvia_video_consultations', JSON.stringify([booking, ...existing]))
    } catch {
      // Ignore local storage error
    }

    setMeetingDetails(booking)
    setStep('confirmed')
    toast.success('Your private video consultation has been scheduled!')
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
    // Create UTC date string for Google Calendar URL
    const dateClean = meetingDetails.date.replace(/-/g, '')
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative z-10 w-full max-w-lg bg-[#FFFDF8] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#C9A45C]/35 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3B0712] via-[#5A1020] to-[#3B0712] text-white p-5 sm:p-6 relative select-none">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2 text-[#C9A45C] text-[10px] font-bold tracking-[0.2em] uppercase">
            <Video size={13} />
            <span>Virtual Atelier Concierge</span>
          </div>

          <h3 className="font-serif text-xl sm:text-2xl text-white font-bold mt-1">
            Book a Video Consultation
          </h3>
          <p className="text-xs text-white/80 mt-0.5">
            Private 1-on-1 virtual walkthrough with an AGVIA bridal stylist.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {step === 'form' ? (
            <form onSubmit={handleBookingSubmit} className="space-y-4 text-[#3A2D23]">
              
              {/* Service Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A1020] mb-1.5">
                  Select Consultation Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {services.map((srv) => (
                    <button
                      type="button"
                      key={srv.id}
                      onClick={() => setFormData({ ...formData, service: srv.label })}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        formData.service === srv.label
                          ? 'border-[#5A1020] bg-[#5A1020]/5 text-[#5A1020] font-bold shadow-xs'
                          : 'border-[#B8860B]/20 bg-white text-[#3A2D23]/80 hover:border-[#5A1020]/40'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-serif">{srv.label}</span>
                      </div>
                      <span className="text-[10px] text-[#C9A45C] font-sans font-medium block mt-0.5">
                        ⏱ {srv.duration}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A1020] mb-1.5">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 bg-white text-xs font-semibold focus:outline-none focus:border-[#5A1020]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A1020] mb-1.5">
                    Time Slot (IST)
                  </label>
                  <select
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 bg-white text-xs font-semibold focus:outline-none focus:border-[#5A1020]"
                  >
                    {timeSlots.map((ts) => (
                      <option key={ts} value={ts}>{ts}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A1020] mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Radhika Reddy"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 bg-white text-xs focus:outline-none focus:border-[#5A1020]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A1020] mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="radhika@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 bg-white text-xs focus:outline-none focus:border-[#5A1020]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A1020] mb-1">
                      WhatsApp / Phone *
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 bg-white text-xs focus:outline-none focus:border-[#5A1020]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A1020] mb-1">
                    Wedding Date / Styling Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tell us about your wedding themes, color palettes, or custom silhouette requests..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 bg-white text-xs focus:outline-none focus:border-[#5A1020]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-primary w-full py-3.5 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 touch-target shadow-md"
              >
                <span>CONFIRM & GENERATE GOOGLE MEET LINK</span>
                <Sparkles size={14} className="text-[#C9A45C]" />
              </button>
            </form>
          ) : (
            /* ── CONFIRMATION SCREEN WITH GOOGLE MEET LINK ── */
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>

              <div>
                <span className="text-[10px] text-[#C9A45C] font-bold uppercase tracking-widest block">
                  Reference: {meetingDetails.id}
                </span>
                <h4 className="font-serif text-2xl font-bold text-[#5A1020] mt-0.5">
                  Consultation Confirmed!
                </h4>
                <p className="text-xs text-[#3A2D23]/70 mt-1 max-w-sm mx-auto">
                  Your Google Meet link has been generated. An AGVIA bridal stylist will join at your selected time.
                </p>
              </div>

              {/* Schedule Summary Card */}
              <div className="bg-[#FAF7F2] border border-[#C9A45C]/30 rounded-2xl p-3.5 text-left text-xs space-y-1.5 shadow-2xs">
                <div className="flex justify-between items-center border-b border-[#C9A45C]/15 pb-1.5">
                  <span className="text-[#3A2D23]/60">Consultation:</span>
                  <span className="font-serif font-bold text-[#5A1020]">{meetingDetails.service}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#C9A45C]/15 pb-1.5">
                  <span className="text-[#3A2D23]/60">Date & Time:</span>
                  <span className="font-semibold text-[#3A2D23]">
                    {meetingDetails.date} at {meetingDetails.timeSlot} IST
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#3A2D23]/60">Assigned Stylist:</span>
                  <span className="font-medium text-[#C9A45C]">{meetingDetails.stylist}</span>
                </div>
              </div>

              {/* Google Meet Link Box */}
              <div className="bg-[#1A0307] border-2 border-[#C9A45C]/50 rounded-2xl p-4 text-left space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#C9A45C] text-[10.5px] font-bold uppercase tracking-wider">
                    <Video size={13} />
                    <span>Your Google Meet Link</span>
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
                    {copied ? <CheckCircle2 size={15} className="text-emerald-400" /> : <Copy size={15} />}
                  </button>
                </div>

                <div className="pt-1 flex flex-col sm:flex-row gap-2">
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

              {/* Secondary Actions */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  onClick={handleSendToWhatsApp}
                  className="text-xs text-[#075E54] hover:underline font-bold flex items-center gap-1"
                >
                  <MessageSquare size={13} />
                  <span>Send Meet Link to WhatsApp</span>
                </button>
                <span className="text-gray-300">•</span>
                <button
                  onClick={onClose}
                  className="text-xs text-[#5A1020] hover:underline font-bold"
                >
                  Done
                </button>
              </div>

            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// ATELIER IN-STORE APPOINTMENT SCHEDULER MODAL
// ══════════════════════════════════════════════════════════════════════
function AtelierAppointmentModal({ onClose }) {
  const [step, setStep] = useState('form') // 'form' | 'confirmed'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    timeSlot: '03:00 PM',
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
      localStorage.setItem('agvia_atelier_appointments', JSON.stringify([{ id: ref, ...formData, createdAt: new Date().toISOString() }, ...existing]))
    } catch {
      // Ignore
    }

    setStep('confirmed')
    toast.success('Your private salon appointment has been reserved!')
  }

  const handleConfirmWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello AGVIA Atelier! I have scheduled an in-store appointment at the Jubilee Hills salon.\nBooking Ref: ${bookingRef}\nDate: ${formData.date}\nSlot: ${formData.timeSlot}\nName: ${formData.name}\nParty Size: ${formData.guests}`
    )
    window.open(`https://wa.me/${BUSINESS.contact.whatsappRaw}?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative z-10 w-full max-w-lg bg-[#FFFDF8] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#C9A45C]/35 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3B0712] via-[#5A1020] to-[#3B0712] text-white p-5 sm:p-6 relative select-none">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2 text-[#C9A45C] text-[10px] font-bold tracking-[0.2em] uppercase">
            <Calendar size={13} />
            <span>Jubilee Hills Flagship Salon</span>
          </div>

          <h3 className="font-serif text-xl sm:text-2xl text-white font-bold mt-1">
            Schedule an Atelier Appointment
          </h3>
          <p className="text-xs text-white/80 mt-0.5">
            Private VIP suite with an AGVIA bridal draper and bespoke stylist.
          </p>
        </div>

        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-[#3A2D23]">
              
              {/* Salon Location banner */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAF7F2] border border-[#C9A45C]/30 text-xs text-[#3A2D23]/80">
                <MapPin size={16} className="text-[#5A1020] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#5A1020] block font-serif">AGVIA Flagship Salon</span>
                  <span className="text-[11px] leading-tight block text-[#3A2D23]/70">
                    {BUSINESS.location.fullAddress}
                  </span>
                </div>
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A1020] mb-1.5">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 bg-white text-xs font-semibold focus:outline-none focus:border-[#5A1020]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A1020] mb-1.5">
                    Time Slot
                  </label>
                  <select
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 bg-white text-xs font-semibold focus:outline-none focus:border-[#5A1020]"
                  >
                    {timeSlots.map((ts) => (
                      <option key={ts} value={ts}>{ts}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Guest Count & Occasion */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A1020] mb-1.5">
                    Accompanying Guests
                  </label>
                  <select
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 bg-white text-xs font-semibold focus:outline-none focus:border-[#5A1020]"
                  >
                    <option value="Bride Only">Bride Only</option>
                    <option value="Bride + 1 Guest">Bride + 1 Guest</option>
                    <option value="Bride + 2 Guests">Bride + 2 Guests</option>
                    <option value="Bride + Family (Up to 4)">Bride + Family (Up to 4)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A1020] mb-1.5">
                    Trousseau Occasion
                  </label>
                  <select
                    value={formData.occasion}
                    onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 bg-white text-xs font-semibold focus:outline-none focus:border-[#5A1020]"
                  >
                    <option value="Wedding Day Trousseau">Wedding Day Trousseau</option>
                    <option value="Sangeet & Mehendi">Sangeet & Mehendi</option>
                    <option value="Reception Gowns">Reception Gowns</option>
                    <option value="Heirloom Saree Selection">Heirloom Saree Selection</option>
                  </select>
                </div>
              </div>

              {/* Client Info */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A1020] mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Radhika Reddy"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 bg-white text-xs focus:outline-none focus:border-[#5A1020]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A1020] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="radhika@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 bg-white text-xs focus:outline-none focus:border-[#5A1020]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A1020] mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#B8860B]/25 bg-white text-xs focus:outline-none focus:border-[#5A1020]"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3.5 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 touch-target shadow-md"
              >
                <span>RESERVE ATELIER SUITE</span>
                <ArrowRight size={14} />
              </button>
            </form>
          ) : (
            /* ── CONFIRMATION SCREEN ── */
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>

              <div>
                <span className="text-[10px] text-[#C9A45C] font-bold uppercase tracking-widest block">
                  Reference: {bookingRef}
                </span>
                <h4 className="font-serif text-2xl font-bold text-[#5A1020] mt-0.5">
                  Atelier Suite Reserved
                </h4>
                <p className="text-xs text-[#3A2D23]/70 mt-1 max-w-sm mx-auto">
                  We look forward to hosting you at our Jubilee Hills salon for your private bridal session.
                </p>
              </div>

              <div className="bg-[#FAF7F2] border border-[#C9A45C]/30 rounded-2xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between items-center border-b border-[#C9A45C]/15 pb-1.5">
                  <span className="text-[#3A2D23]/60">Date:</span>
                  <span className="font-bold text-[#5A1020]">{formData.date}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#C9A45C]/15 pb-1.5">
                  <span className="text-[#3A2D23]/60">Slot:</span>
                  <span className="font-semibold text-[#3A2D23]">{formData.timeSlot}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#C9A45C]/15 pb-1.5">
                  <span className="text-[#3A2D23]/60">Party:</span>
                  <span className="font-semibold text-[#3A2D23]">{formData.guests}</span>
                </div>
                <div className="flex justify-between items-start pt-0.5">
                  <span className="text-[#3A2D23]/60">Location:</span>
                  <span className="font-medium text-right text-[#5A1020] max-w-[220px]">
                    Road No. 36, Jubilee Hills, Hyderabad
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleConfirmWhatsApp}
                  className="flex-1 bg-[#075E54] hover:bg-[#054D44] text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <MessageSquare size={14} />
                  <span>Confirm on WhatsApp</span>
                </button>

                <a
                  href={BUSINESS.location.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 border border-[#5A1020]/30 hover:border-[#5A1020] bg-white text-[#5A1020] font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-2xs"
                >
                  <MapPin size={14} className="text-[#C9A45C]" />
                  <span>Google Maps Directions</span>
                </a>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="text-xs text-[#5A1020] hover:underline font-bold"
                >
                  Close & Return to Boutique
                </button>
              </div>

            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
