import { BUSINESS } from '../../constants/business'

/**
 * Official Lokesh Lingam Weaver Logo component.
 * Uses the exact client-supplied logo asset without recreating it in text or distorting its 3:2 proportions.
 */
export default function BrandLogo({
  variant = 'light', // 'light' | 'dark'
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className = '',
  priority = false,
}) {
  const sizeMap = {
    xs: 'h-9',
    sm: 'h-11 sm:h-12',
    md: 'h-12 sm:h-14',
    lg: 'h-16 sm:h-20',
    xl: 'h-28 sm:h-36',
  }

  const heightCls = sizeMap[size] || sizeMap.md

  const imgEl = (
    <picture className="inline-flex items-center justify-center shrink-0">
      <source
        type="image/webp"
        srcSet="/images/lokesh-lingam-logo-400.webp 400w, /images/lokesh-lingam-logo-600.webp 600w, /images/lokesh-lingam-logo.webp 1024w"
        sizes="(max-width: 640px) 160px, 240px"
      />
      <img
        src={BUSINESS.logo.png}
        alt={BUSINESS.logo.alt}
        width={1024}
        height={682}
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={`${heightCls} w-auto object-contain select-none ${className}`}
      />
    </picture>
  )

  if (variant === 'dark') {
    return (
      <div className="inline-flex items-center justify-center rounded-2xl bg-[#FBF5EA] px-3 py-1.5 border border-[#B58A45]/60 shadow-[0_6px_22px_rgba(0,0,0,0.22)]">
        {imgEl}
      </div>
    )
  }

  return imgEl
}
