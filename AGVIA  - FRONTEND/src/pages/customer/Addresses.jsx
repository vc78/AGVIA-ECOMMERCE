import Navbar from '../../components/customer/Navbar'
import Footer from '../../components/customer/Footer'
import { MapPin, Plus, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'

export default function Addresses() {
  const { user } = useSelector((state) => state.auth)
  const storageKey = user?.id ? `ps_user_addresses_${user.id}` : 'ps_user_addresses_guest'

  const [addrList, setAddrList] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (user?.id) {
      try {
        const saved = localStorage.getItem(`ps_user_addresses_${user.id}`)
        setAddrList(saved ? JSON.parse(saved) : [])
      } catch {
        setAddrList([])
      }
    }
  }, [user?.id])

  const handleDelete = (id) => {
    const updated = addrList.filter((a) => a.id !== id)
    setAddrList(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    toast.success("Address removed successfully!")
  }

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#3A2D23] font-body flex flex-col justify-between">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-24 w-full">
        <h1 className="font-display text-3xl md:text-5xl text-[#8B0000] font-bold mb-10 select-none">
          Saved Addresses
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          {addrList.map((addr) => (
            <div key={addr.id} className="bg-white border border-[#B8860B]/15 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#8B0000] uppercase mb-3">
                  <MapPin size={14} className="text-[#B8860B]" /> {addr.label}
                </span>
                <p className="text-xs text-[#3A2D23]/60 leading-relaxed">{addr.details}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#B8860B]/10 flex justify-end">
                <button onClick={() => handleDelete(addr.id)} className="text-red-700 hover:text-red-900 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          ))}

          <div className="border-2 border-dashed border-[#B8860B]/25 hover:border-[#8B0000] rounded-3xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer text-[#B8860B] hover:text-[#8B0000] transition-colors min-h-[160px]">
            <Plus size={24} />
            <span className="text-xs font-bold uppercase tracking-widest">Add New Address</span>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
