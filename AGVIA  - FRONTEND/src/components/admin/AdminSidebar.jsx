import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard, Package, PlusSquare, ClipboardList, Users, Boxes, Tag, Star, BarChart3, Crown, Layers, Settings as SettingsIcon, X, Receipt, RotateCcw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import BrandLogo from '../common/BrandLogo'
import { BUSINESS } from '../../constants/business'

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/pos', label: 'Store Billing (POS)', icon: Receipt },
  { to: '/admin/products', label: 'Saree Catalogue', icon: Package },
  { to: '/admin/products/add', label: 'Add Saree', icon: PlusSquare },
  { to: '/admin/categories', label: 'Categories', icon: Layers },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/returns', label: 'Returns & Exchanges', icon: RotateCcw },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/subscriptions', label: 'Memberships', icon: Crown },
  { to: '/admin/inventory', label: 'Stock & Inventory', icon: Boxes },
  { to: '/admin/offers', label: 'Offers', icon: Tag },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
]

export default function AdminSidebar({ isOpen, onClose }) {
  const content = (
    <div className="flex flex-col h-full bg-[#38271F] text-[#FBF5EA]">
      {/* Brand Header */}
      <div className="h-14 sm:h-16 flex items-center justify-between px-4 border-b border-[#B58A45]/25 bg-[#38271F]/95 select-none">
        <Link to="/" className="flex items-center gap-2.5 min-w-0" onClick={onClose}>
          <BrandLogo variant="dark" size="xs" />
        </Link>
        <button className="lg:hidden text-white/60 hover:text-white touch-target w-10 h-10 flex items-center justify-center rounded-lg" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <span className="block font-sans text-[8.5px] font-bold text-[#B58A45] tracking-[0.22em] uppercase px-2 mb-2 select-none">
          {BUSINESS.name} Admin
        </span>
        
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-sans tracking-wide uppercase transition-all duration-200 min-h-[44px] touch-target ${
                isActive 
                  ? 'bg-[#651B2B] text-[#FBF5EA] border-r-3 border-[#B58A45] shadow-xs font-semibold' 
                  : 'hover:bg-white/5 text-white/75 hover:text-white'
              }`
            }
          >
            <Icon size={16} className="text-[#B58A45] shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-white/10 text-center select-none bg-[#2A1D17]">
        <span className="font-sans text-[8px] tracking-widest text-white/55 uppercase block">
          {BUSINESS.name} · Admin Portal
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
