import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard, Package, PlusSquare, ClipboardList, Users, Boxes, Tag, Star, BarChart3, Crown, Layers, Settings as SettingsIcon, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Couture Edits', icon: Package },
  { to: '/admin/products/add', label: 'Add Silhouette', icon: PlusSquare },
  { to: '/admin/categories', label: 'Categories', icon: Layers },
  { to: '/admin/orders', label: 'Atelier Orders', icon: ClipboardList },
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
    <div className="flex flex-col h-full bg-[#1A0B10] text-[#FAF7F2]">
      {/* Brand Header */}
      <div className="h-14 sm:h-16 flex items-center justify-between px-4 border-b border-[#C9A45C]/20 bg-[#1A0B10]/95 select-none">
        <Link to="/" className="flex items-center gap-2.5" onClick={onClose}>
          <img src="/images/agvia-logo.webp" alt="AGVIA" width={36} height={28} decoding="async" className="h-7 w-auto object-contain brightness-110" />
          <div className="flex flex-col">
            <span className="font-serif text-base tracking-[0.18em] font-bold uppercase text-[#FAF7F2] leading-none">
              AGVIA
            </span>
            <span className="font-sans text-[7.5px] tracking-[0.28em] uppercase text-[#C9A45C] font-semibold mt-0.5">
              ATELIER ADMIN
            </span>
          </div>
        </Link>
        <button className="lg:hidden text-white/60 hover:text-white touch-target w-10 h-10 flex items-center justify-center rounded-lg" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <span className="block font-sans text-[8.5px] font-bold text-[#C9A45C] tracking-[0.22em] uppercase px-2 mb-2 select-none">
          Atelier Management
        </span>
        
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-sans tracking-wide uppercase transition-all duration-200 min-h-[44px] touch-target ${
                isActive 
                  ? 'bg-[#5A1020] text-[#FAF7F2] border-r-3 border-[#C9A45C] shadow-xs font-semibold' 
                  : 'hover:bg-white/5 text-white/70 hover:text-white'
              }`
            }
          >
            <Icon size={16} className="text-[#C9A45C] shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-white/10 text-center select-none bg-[#14060B]">
        <span className="font-sans text-[8px] tracking-widest text-white/40 uppercase block">
          AGVIA ATELIER ERP v2.0
        </span>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar (Permanent on lg screens) */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-60 shrink-0 border-r border-[#C9A45C]/20 sticky top-0 h-screen overflow-hidden">
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
