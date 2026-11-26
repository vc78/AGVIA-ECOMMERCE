import { Link } from 'react-router-dom'
import { Instagram, Phone, MapPin, MessageCircle, ArrowUp } from 'lucide-react'
import BrandLogo from '../common/BrandLogo'
import { BUSINESS, buildWhatsAppUrl } from '../../constants/business'

export default function Footer() {
  const whatsappUrl = buildWhatsAppUrl(
    'Namaste Lokesh Lingam Weaver, I would like to enquire about your handloom saree collections.'
  )

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Collections', to: '/products' },
    { label: 'About Us', to: '/about' },
    { label: 'Contact Us', to: '/contact' },
    { label: 'Track Order', to: '/track-order' },
    { label: 'Admin Console', to: '/admin/login' },
  ]

  const collectionLinks = [
    { label: 'Dharmavaram Silk Sarees', to: '/products?category=Dharmavaram+Silk+Sarees' },
    { label: 'Kanchi-Style Silk Sarees', to: '/products?category=Kanchi-Style+Silk+Sarees' },
    { label: 'Traditional Handloom Weaves', to: '/products?category=Traditional+Handloom+Weaves' },
    { label: 'All Handloom Collections', to: '/products' },
  ]

  return (
    <footer className="relative select-none bg-[#38271F] text-[#FBF5EA] border-t-2 border-[#B58A45]/60 font-body">
      {/* Subtle Heritage Top Border */}
      <div className="bg-[#651B2B] py-3 border-b border-[#B58A45]/30">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-center gap-3 text-center">
          <span className="text-[#B58A45] text-xs">✦</span>
          <p className="font-serif text-sm sm:text-base tracking-[0.2em] uppercase text-[#FBF5EA] font-semibold">
            LOKESH LINGAM WEAVER
          </p>
          <span className="text-[#B58A45] hidden sm:inline">•</span>
          <p className="font-sans text-[10px] sm:text-[11px] tracking-[0.24em] uppercase text-[#E7D4B9] font-medium">
            HANDLOOM SAREES &amp; TRADITIONAL WEAVES
          </p>
          <span className="text-[#B58A45] text-xs">✦</span>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-8 border-b border-[#B58A45]/20">
          {/* Column 1: Official Logo & Business Description */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-block">
              <BrandLogo variant="dark" size="lg" />
            </Link>
            <p className="text-xs text-[#E7D4B9]/90 leading-relaxed max-w-sm">
              {BUSINESS.description}
            </p>
            <div className="flex flex-wrap gap-2 text-[10.5px] font-semibold uppercase tracking-wider text-[#E7D4B9]">
              <span className="px-3 py-1 rounded-full bg-[#651B2B]/70 border border-[#B58A45]/40">
                Direct Handloom Weaver
              </span>
              <span className="px-3 py-1 rounded-full bg-[#651B2B]/70 border border-[#B58A45]/40">
                Since {BUSINESS.establishedYear}
              </span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-serif text-base font-bold text-[#E7D4B9] tracking-wide">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              {navLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-[#FBF5EA]/80 hover:text-[#B58A45] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Product Collections */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-serif text-base font-bold text-[#E7D4B9] tracking-wide">
              Product Collections
            </h4>
            <ul className="space-y-2 text-xs">
              {collectionLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-[#FBF5EA]/80 hover:text-[#B58A45] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact, WhatsApp, Instagram & Location */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-serif text-base font-bold text-[#E7D4B9] tracking-wide">
              Connect With Us
            </h4>
            <div className="space-y-2.5 text-xs text-[#FBF5EA]/85">
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="text-[#B58A45] shrink-0 mt-0.5" />
                <span>{BUSINESS.location.fullAddress}</span>
              </div>
              <a
                href={`tel:${BUSINESS.contact.phoneRaw}`}
                className="flex items-center gap-2.5 hover:text-[#B58A45] transition-colors"
              >
                <Phone size={15} className="text-[#B58A45] shrink-0" />
                <span>{BUSINESS.contact.phone}</span>
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 hover:text-[#B58A45] transition-colors"
              >
                <MessageCircle size={15} className="text-[#B58A45] shrink-0" />
                <span>WhatsApp: {BUSINESS.contact.whatsapp}</span>
              </a>
              <a
                href={BUSINESS.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 hover:text-[#B58A45] transition-colors"
              >
                <Instagram size={15} className="text-[#B58A45] shrink-0" />
                <span>{BUSINESS.social.instagramHandle}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Signature Bar */}
        <div className="pt-6 pb-16 sm:pb-0 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="font-serif text-xs sm:text-sm font-bold tracking-[0.18em] uppercase text-[#E7D4B9]">
              LOKESH LINGAM WEAVER
            </p>
            <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-[#B58A45]">
              HANDLOOM SAREES &amp; TRADITIONAL WEAVES
            </p>
          </div>

          <p className="font-sans text-[11px] text-[#E7D4B9]/70">
            © {new Date().getFullYear()} Lokesh Lingam Weaver • Dharmavaram, Andhra Pradesh.
          </p>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-[#E7D4B9] hover:text-white border border-[#B58A45]/45 hover:border-[#B58A45] rounded-full px-4 py-1.5 transition-all"
          >
            <span>Back to Top</span>
            <ArrowUp size={12} />
          </button>
        </div>
      </div>
    </footer>
  )
}
