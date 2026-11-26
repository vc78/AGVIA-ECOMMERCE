import { Instagram, Star, Sparkles, PackageCheck, Truck, MessageCircle, ExternalLink } from 'lucide-react'
import { BUSINESS, buildWhatsAppUrl } from '../../constants/business'

const HIGHLIGHT_THEMES = [
  {
    title: 'Reviews',
    desc: 'Shared feedback & saree draping stories from customers.',
    icon: Star,
  },
  {
    title: 'Best Selling',
    desc: 'Popular Dharmavaram & Kanchi-style silk handloom weaves.',
    icon: Sparkles,
  },
  {
    title: 'Dispatch',
    desc: 'Careful folding and dispatch preparation updates.',
    icon: PackageCheck,
  },
  {
    title: 'Delivery',
    desc: 'Customer parcel arrival and delivery moments.',
    icon: Truck,
  },
]

export default function TestimonialsCarousel({ verifiedReviews = [] }) {
  const whatsappUrl = buildWhatsAppUrl(
    'Namaste Lokesh Lingam Weaver, I saw your Instagram highlights and would like to enquire about available sarees.'
  )

  return (
    <section className="relative py-14 sm:py-18 bg-[#FBF5EA] border-t border-[#E7D4B9]">
      <div className="container-luxury">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 text-[#B58A45] text-[10px] font-bold tracking-[0.3em] uppercase mb-2">
            ✦ Customer Proof &amp; Instagram Highlights ✦
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#651B2B] font-bold leading-tight">
            From Our Looms to Customers
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#38271F]/75 mt-3 leading-relaxed">
            Follow our active Instagram profile{' '}
            <a
              href={BUSINESS.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#651B2B] underline decoration-[#B58A45]"
            >
              {BUSINESS.social.instagramHandle}
            </a>{' '}
            for verified customer stories, dispatch updates, and current loom highlights.
          </p>
        </div>

        {/* Instagram Story Highlight Themes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
          {HIGHLIGHT_THEMES.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.title}
                href={BUSINESS.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white border border-[#E7D4B9] hover:border-[#B58A45] rounded-2xl p-5 sm:p-6 text-center shadow-sm hover:shadow-card transition-all flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-[#651B2B] via-[#B58A45] to-[#E7D4B9] mb-4 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full bg-[#FBF5EA] flex items-center justify-center text-[#651B2B]">
                    <Icon size={24} />
                  </div>
                </div>
                <h3 className="font-serif text-lg font-bold text-[#651B2B] group-hover:text-[#B58A45] transition-colors">
                  {item.title}
                </h3>
                <p className="font-sans text-xs text-[#38271F]/70 mt-1.5 leading-relaxed">
                  {item.desc}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#B58A45]">
                  View on Instagram <ExternalLink size={11} />
                </span>
              </a>
            )
          })}
        </div>

        {/* Verified Database Reviews (Rendered ONLY when genuine verified reviews exist) */}
        {Array.isArray(verifiedReviews) && verifiedReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {verifiedReviews.slice(0, 6).map((rev, idx) => (
              <div
                key={rev.id || idx}
                className="bg-white border border-[#E7D4B9] rounded-2xl p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(Math.max(1, Math.min(5, Number(rev.rating || 5))))].map((_, s) => (
                      <Star key={s} size={13} className="text-[#B58A45] fill-[#B58A45]" />
                    ))}
                  </div>
                  <p className="font-sans text-xs text-[#38271F]/85 leading-relaxed italic">
                    “{rev.comment}”
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E7D4B9]/60 flex items-center justify-between text-[11px]">
                  <span className="font-serif font-bold text-[#651B2B]">
                    {rev.customer || rev.userName || 'Verified Customer'}
                  </span>
                  {rev.verified && (
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#65704B]">
                      Verified Order
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#E7D4B9] rounded-2xl p-6 sm:p-8 text-center max-w-2xl mx-auto mb-8 shadow-sm">
            <p className="font-serif text-lg sm:text-xl font-bold text-[#651B2B]">
              Verified Customer Reviews on Instagram
            </p>
            <p className="font-sans text-xs sm:text-sm text-[#38271F]/75 mt-2 leading-relaxed">
              We publish only genuine customer feedback. Verified product reviews submitted by customers appear directly on each saree page, and our customer review stories, dispatch reels, and delivery updates are showcased on{' '}
              <span className="font-semibold text-[#651B2B]">{BUSINESS.social.instagramHandle}</span>.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={BUSINESS.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            <Instagram size={15} />
            <span>Visit {BUSINESS.social.instagramHandle}</span>
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            <MessageCircle size={15} />
            <span>Enquire on WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  )
}
