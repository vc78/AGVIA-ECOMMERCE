import { MessageCircle } from 'lucide-react'
import { BUSINESS, buildWhatsAppUrl } from '../../constants/business'

export default function FloatingWhatsApp() {
  const url = buildWhatsAppUrl(
    'Namaste Lokesh Lingam Weaver, I would like to enquire about your Dharmavaram handloom sarees.'
  )

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Order or enquire on WhatsApp (${BUSINESS.contact.whatsapp})`}
      title={`WhatsApp ${BUSINESS.contact.whatsapp}`}
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 group flex items-center gap-2.5 rounded-full bg-[#651B2B] hover:bg-[#4A111D] text-[#FBF5EA] border border-[#B58A45] px-4 py-3 shadow-[0_10px_28px_rgba(56,39,31,0.28)] transition-all duration-300 hover:scale-105 active:scale-95 print:hidden"
    >
      <span className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
        <MessageCircle size={16} />
      </span>
      <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-[0.14em] pr-0.5">
        WhatsApp Us
      </span>
    </a>
  )
}
