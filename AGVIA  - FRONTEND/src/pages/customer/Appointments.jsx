import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, MapPin, Clock, Phone, Mail, Award, CheckCircle2, Calendar, Video, MessageSquare } from 'lucide-react'
import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import BespokeTrousseauBanner from '../../components/customer/BespokeTrousseauBanner'
import RangoliDivider from '../../components/customer/RangoliDivider'
import { BUSINESS } from '../../constants/business'

export default function Appointments() {
  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#3A2D23] font-body selection:bg-[#C9A45C]/30 selection:text-[#5A1020]">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-r from-[#5A1020] via-[#7A1F32] to-[#4A0D1A] text-white pt-8 pb-10 sm:py-12 px-[clamp(16px,3vw,40px)] relative overflow-hidden select-none border-b border-[#C9A45C]/30 shadow-sm">
        <div className="max-w-[1320px] mx-auto relative z-10 text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-[#C9A45C] text-[10px] font-bold tracking-[0.3em] uppercase bg-white/10 px-4 py-1.5 rounded-full border border-[#C9A45C]/30">
            <Sparkles size={12} />
            <span>VIP BESPOKE STYLING</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white font-bold leading-tight">
            Atelier Appointments & <span className="italic font-normal text-[#C9A45C]">Video Consultations</span>
          </h1>

          <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
            Experience our personal bridal concierge services. Schedule an intimate styling session at our Jubilee Hills salon or connect virtually from anywhere in the world.
          </p>
        </div>
      </section>

      {/* Main Interactive Banner (Exact Reference Design) */}
      <div className="pt-4 sm:pt-6">
        <BespokeTrousseauBanner />
      </div>

      <RangoliDivider />

      {/* Salon Amenities & Experience Section */}
      <section className="container-luxury py-10 sm:py-14">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[10px] text-[#C9A45C] font-bold tracking-[0.25em] uppercase block mb-1">
            THE PRIVATE SUITE EXPERIENCE
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A1020]">
            What to Expect During Your Session
          </h2>
          <p className="text-xs text-[#211D1E]/70 mt-1 leading-relaxed">
            Every bride and connoisseur is welcomed with personalized hospitality, private trial salons, and master drapers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#C9A45C]/25 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#5A1020]/10 border border-[#5A1020]/20 flex items-center justify-center text-[#5A1020]">
              <Award size={22} className="text-[#C9A45C]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#5A1020]">Certified Handloom Silks</h3>
            <p className="text-xs text-[#211D1E]/70 leading-relaxed">
              Touch and drape authentic Kanjeevaram, Banarasi, and Paithani weaves verified by our silk mark certifications.
            </p>
          </div>

          <div className="bg-white border border-[#C9A45C]/25 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#5A1020]/10 border border-[#5A1020]/20 flex items-center justify-center text-[#5A1020]">
              <Sparkles size={22} className="text-[#C9A45C]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#5A1020]">Custom Bridal Embroidery</h3>
            <p className="text-xs text-[#211D1E]/70 leading-relaxed">
              Collaborate directly with our master zardozi craftsmen for custom bridal lehenga motifs, initials, and bespoke necklines.
            </p>
          </div>

          <div className="bg-white border border-[#C9A45C]/25 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#5A1020]/10 border border-[#5A1020]/20 flex items-center justify-center text-[#5A1020]">
              <Clock size={22} className="text-[#C9A45C]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#5A1020]">Dedicated 90-Min VIP Salon</h3>
            <p className="text-xs text-[#211D1E]/70 leading-relaxed">
              Uninterrupted attention in a private VIP styling suite with tea, refreshments, and tailored trial fittings for your entourage.
            </p>
          </div>
        </div>

        {/* Location & Contact Bar */}
        <div className="mt-10 bg-[#FAF7F2] border border-[#C9A45C]/35 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-serif text-xl font-bold text-[#5A1020]">
              AGVIA Flagship Atelier
            </h4>
            <p className="text-xs text-[#3A2D23]/80 flex items-center justify-center md:justify-start gap-1.5">
              <MapPin size={13} className="text-[#C9A45C] shrink-0" />
              <span>{BUSINESS.location.fullAddress}</span>
            </p>
            <p className="text-[11px] text-[#3A2D23]/60 pt-0.5">
              Hours: {BUSINESS.contact.hours} • Open 7 Days
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={BUSINESS.location.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline text-xs !py-2.5 !px-4"
            >
              Get Directions
            </a>

            <a
              href={`tel:${BUSINESS.contact.phoneRaw}`}
              className="btn-primary text-xs !py-2.5 !px-4"
            >
              Call Concierge
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
