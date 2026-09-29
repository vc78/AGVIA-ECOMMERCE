import { useState, useRef, useEffect } from 'react'
import { Share2, Copy, Check, MessageCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { shareProduct, copyProductLink, getProductWhatsAppShareUrl, getProductShareUrl } from '../../utils/shareUtils'

export default function ProductShareButton({ product, variant = 'icon', className = '' }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const popoverRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  if (!product?.id) return null

  const handleShareClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    const result = await shareProduct(product)
    if (result.method === 'native' || result.aborted) {
      return
    }
    // Fallback: open small luxury share popover
    setOpen((prev) => !prev)
  }

  const handleCopy = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const success = await copyProductLink(product)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }

  const handleWhatsApp = (e) => {
    e.stopPropagation()
    const waUrl = getProductWhatsAppShareUrl(product)
    window.open(waUrl, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  const shareUrl = getProductShareUrl(product.id)

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={handleShareClick}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-sm text-[#5A1020] hover:bg-[#5A1020] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm active:scale-90 touch-target ${className}`}
          title="Share Silhouette"
          aria-label="Share Silhouette"
        >
          <Share2 size={15} />
        </button>
      ) : variant === 'button' ? (
        <button
          type="button"
          onClick={handleShareClick}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#C9A45C]/40 bg-white/80 hover:bg-[#5A1020] hover:text-white text-[#5A1020] font-sans text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-2xs touch-target ${className}`}
          title="Share Silhouette"
        >
          <Share2 size={13} className="text-[#C9A45C]" />
          <span>Share</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleShareClick}
          className={`flex items-center gap-2 py-3 px-5 rounded-full border border-[#C9A45C]/50 bg-white hover:bg-[#5A1020] hover:text-white text-[#5A1020] font-sans text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm min-h-[44px] ${className}`}
          title="Share Piece"
        >
          <Share2 size={16} />
          <span>Share Silhouette</span>
        </button>
      )}

      {/* Luxury Compact Share Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-full mt-2 z-50 w-64 bg-white/98 backdrop-blur-md rounded-2xl shadow-[0_12px_40px_rgba(90,16,32,0.18)] border border-[#C9A45C]/30 p-3 select-none text-[#211D1E]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#C9A45C]/15 mb-2.5">
              <span className="font-serif text-xs font-bold text-[#5A1020] uppercase tracking-wider">
                Share Piece
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-0.5 rounded-lg"
              >
                <X size={13} />
              </button>
            </div>

            {/* URL Display */}
            <div className="bg-[#FAF7F2] rounded-xl p-2 mb-2.5 border border-[#C9A45C]/20 flex items-center justify-between gap-1 text-[11px]">
              <span className="truncate text-[#5A1020] font-mono text-[10px]">
                {shareUrl}
              </span>
            </div>

            {/* Actions */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-[#FAF7F2] hover:bg-[#5A1020] hover:text-white text-[#211D1E] transition-all group"
              >
                <span className="flex items-center gap-2">
                  {copied ? <Check size={14} className="text-emerald-600 group-hover:text-emerald-300" /> : <Copy size={14} className="text-[#C9A45C]" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
                </span>
                {copied && <span className="text-[10px] text-emerald-600 group-hover:text-emerald-300 font-bold">✓ Copied</span>}
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-[#25D366]/10 hover:bg-[#25D366] hover:text-white text-[#128C7E] transition-all"
              >
                <MessageCircle size={14} className="text-[#25D366] group-hover:text-white" />
                <span>Share via WhatsApp</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
