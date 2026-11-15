import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard, Package, PlusSquare, ClipboardList, Users, Boxes, Tag, Star, BarChart3, Crown, Layers, Settings as SettingsIcon, X, Receipt, RotateCcw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/pos', label: 'Store Billing (POS)', icon: Receipt },
  { to: '/admin/products', label: 'Couture Edits', icon: Package },
  { to: '/admin/products/add', label: 'Add Silhouette', icon: PlusSquare },
  { to: '/admin/categories', label: 'Categories', icon: Layers },
  { to: '/admin/orders', label: 'Atelier Orders', icon: ClipboardList },
  { to: '/admin/returns', label: 'Returns & Exchanges', icon: RotateCcw },
  { to: '/admin/customers', label: 'Patrons', icon: Users },
  { to: '/admin/subscriptions', label: 'Atelier Circle', icon: Crown },
  { to: '/admin/inventory', label: 'Fabric & Stock', icon: Boxes },
  { to: '/admin/offers', label: 'Curations & Offers', icon: Tag },
  { to: '/admin/coupons', label: 'Privilege Codes', icon: Tag },
  { to: '/admin/reviews', label: 'Patron Reviews', icon: Star },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
]

export default function AdminSidebar({ isOpen, onClose }) {
  const content = (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#140409] via-[#1B060E] to-[#120308] text-[#FFF8EB]">
      {/* Brand Header */}
      <div className="h-14 sm:h-16 flex items-center justify-between px-4 border-b border-[#F5B900]/25 bg-[#140409]/95 backdrop-blur-md select-none">
        <Link to="/" className="flex items-center gap-2.5 group" onClick={onClose}>
          <img src="/images/agvia-logo.webp" alt="NOOLU" width={56} height={28} decoding="async" className="h-7 w-auto object-contain brightness-110 drop-shadow-sm group-hover:scale-105 transition-transform" />
          <div className="flex flex-col">
            <span className="font-serif text-base tracking-[0.2em] font-bold uppercase text-[#FFF8EB] leading-none">
              NOOLU
            </span>
            <span className="font-sans text-[7.5px] tracking-[0.28em] uppercase text-[#F5B900] font-semibold mt-0.5">
              ATELIER ADMIN • నూలు
            </span>
          </div>
        </Link>
        <button className="lg:hidden text-white/60 hover:text-white touch-target w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <span className="block font-sans text-[8.5px] font-bold text-[#F5B900] tracking-[0.24em] uppercase px-2 mb-2 select-none">
          Atelier Management
        </span>
        
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-sans tracking-wide uppercase transition-all duration-200 min-h-[44px] touch-target group ${
                isActive 
                  ? 'bg-gradient-to-r from-[#800020] to-[#9E0028] text-white font-semibold shadow-[0_4px_16px_rgba(128,0,32,0.4)] border border-[#F5B900]/30' 
                  : 'hover:bg-white/8 text-white/75 hover:text-white hover:translate-x-0.5'
              }`
            }
          >
            <Icon size={16} className="text-[#F5B900] shrink-0 group-hover:scale-110 transition-transform" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-white/10 text-center select-none bg-[#0E0206]">
        <span className="font-sans text-[8px] tracking-[0.25em] text-[#F5B900]/80 uppercase block font-semibold">
          NOOLU ATELIER ERP • A RHYTHM OF LOOM
        </span>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar (Permanent on lg screens) */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-60 shrink-0 border-r border-[#F5B900]/20 sticky top-0 h-screen overflow-hidden shadow-xl">
        {content}
      </aside>

      {/* Mobile Drawer (Only visible on mobile/tablet when open) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-black lg:hidden"
            />
            {/* Sidebar Slide-in */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 w-full max-w-[min(280px,calc(100vw-32px))] lg:hidden shadow-2xl"
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
