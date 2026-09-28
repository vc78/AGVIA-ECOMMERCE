import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminNavbar from './AdminNavbar'

export default function AdminLayout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#FFFDF8] font-body text-[#211D1E] antialiased">
      {/* Sidebar (Desktop sticky + Mobile slide-out drawer) */}
      <AdminSidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      
      {/* Main Content Area */}
      <div className="flex-1 min-w-0 w-full max-w-full flex flex-col overflow-x-hidden">
        <AdminNavbar onMenuToggle={() => setMobileSidebarOpen(true)} />
        
        <main className="flex-1 w-full max-w-full px-3.5 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8">
          {children}
        </main>
      </div>
    </div>
  )
}
