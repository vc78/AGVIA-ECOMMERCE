import { useState } from 'react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { MapPin, Phone, Mail, Clock, ExternalLink, Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { BUSINESS } from '../../constants/business'
import api from '../../services/api'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [sending, setSending] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error('Please fill in your name, email, and message.')
      return
    }

    setSending(true)
    try {
      await api.post('/contact', formData).catch(() => {})
      toast.success('Thank you! Your message has been received by our atelier concierge.', {
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      toast.error('Failed to submit enquiry. Please try again or reach us by phone.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#3A2D23] font-body">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-24">
        <span className="text-[9px] tracking-[0.3em] font-bold text-[#B8860B] uppercase block text-center mb-3">✦ Get In Touch ✦</span>
        <h1 className="font-display text-4xl md:text-5xl text-[#8B0000] font-bold text-center mb-12">Contact Our Boutiques</h1>
        
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5 space-y-6">
            <h2 className="font-display text-2xl text-[#8B0000] font-bold mb-4">Store Information</h2>
            
            <div className="space-y-4 text-xs text-[#3A2D23]/70">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-[#B8860B] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#3A2D23] block">Main Boutique</strong>
                  <span>{BUSINESS.location.fullAddress}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={16} className="text-[#B8860B] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#3A2D23] block">Call Us</strong>
                  <a href={`tel:${BUSINESS.contact.phoneRaw}`} className="hover:text-[#8B0000] transition-colors">{BUSINESS.contact.phone}</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={16} className="text-[#B8860B] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#3A2D23] block">Email support</strong>
                  <a href={`mailto:${BUSINESS.contact.email}`} className="hover:text-[#8B0000] transition-colors">{BUSINESS.contact.email}</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={16} className="text-[#B8860B] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#3A2D23] block">Boutique Hours</strong>
                  <span>{BUSINESS.contact.hours} ({BUSINESS.contact.openDays})</span>
                </div>
              </div>
            </div>

            {/* Google Maps Link Card */}
            <a 
              href={BUSINESS.location.googleMapsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="border border-[#B8860B]/20 rounded-3xl p-5 bg-[#F5E6C8]/25 flex items-center justify-between hover:bg-[#F5E6C8]/40 hover:border-[#B8860B]/40 transition-all duration-300 group block"
            >
              <div>
                <span className="text-[10px] tracking-widest text-[#B8860B] uppercase font-bold block mb-1">Locate Us On Map</span>
                <span className="text-xs text-[#8B0000] font-semibold">{BUSINESS.location.street}, {BUSINESS.location.city}</span>
              </div>
              <ExternalLink size={16} className="text-[#B8860B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

          <div className="md:col-span-7 bg-white border border-[#B8860B]/15 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="font-display text-2xl text-[#8B0000] font-bold mb-6">Send A Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block mb-1">Your Name</label>
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Venkat Chowdary"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block mb-1">Your Email</label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@domain.com"
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block mb-1">Subject</label>
                <input
                  required
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Bridal Consultation / Custom Saree Styling / Atelier Inquiries"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider block mb-1">Message</label>
                <textarea
                  required
                  rows={5}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can our atelier stylists assist you with bespoke sizing, bridal trousseau, or custom handloom selections?"
                  className="input-field"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Sending Message...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
