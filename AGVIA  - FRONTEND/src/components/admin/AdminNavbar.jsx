import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { LogOut, Bell, Menu } from 'lucide-react'
import { loggedOut } from '../../store/authSlice'

export default function AdminNavbar({ onMenuToggle }) {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(loggedOut())
    navigate('/admin/login')
  }

  return (
    <header className="h-20 bg-white/95 backdrop-blur-md border-b border-[#C9A45C]/20 flex items-center justify-between px-4 sm:px-6 md:px-10 sticky top-0 z-30 select-none">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuToggle}
          className="lg:hidden touch-target min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#211D1E]/80 hover:text-[#5A1020] hover:bg-[#5A1020]/5 transition-colors"
          aria-label="Open Sidebar"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1 className="font-serif text-base sm:text-xl md:text-2xl text-[#5A1020] font-bold leading-tight">
            Welcome, <span className="text-[#C9A45C]">{user?.name || 'Atelier Director'}</span>
          </h1>
          <p className="text-[9px] text-[#211D1E]/50 tracking-wider uppercase font-bold mt-0.5 hidden sm:block">
            AGVIA Boutique Workspace Active
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-5">
        <button className="touch-target w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[#5A1020]/5 text-[#5A1020] hover:text-[#C9A45C] transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#C9A45C] rounded-full" />
        </button>
        <button 
          onClick={handleLogout} 
          className="btn-outline min-h-[44px] !py-2 !px-4 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 !border-[#5A1020]/30 hover:!bg-[#5A1020] hover:!text-white touch-target"
        >
          <LogOut size={13} /> <span>Logout</span>
        </button>
      </div>
    </header>
  )
}
