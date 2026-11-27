import { useState, useRef, useEffect } from 'react'
import { FALLBACK_PRODUCT_IMAGE } from '../../utils/media'

export default function ReliableImage({
  src,
  alt = 'AGVIA Luxury Fashion',
  className = '',
  aspectRatio = '3/4',
  loading = 'lazy',
  priority = false,
  sizes,
  width,
  height,
  style = {},
  ...props
}) {
  const [loaded, setLoaded] = useState(false)
  const [errorCount, setErrorCount] = useState(0)
  const imgRef = useRef(null)

  // Primary source or fallback if error or empty
  const imageSource = (!src || errorCount > 0) ? FALLBACK_PRODUCT_IMAGE : src

  // Extract base path for local /images/ to construct responsive WebP variants
  let baseName = null
  let webpSrcSet = null
  let defaultSrc = imageSource

  if (typeof imageSource === 'string' && imageSource.startsWith('/images/')) {
    const match = imageSource.match(/^\/images\/(.*?)(?:-(?:400|600|900))?\.(jpg|jpeg|png|webp)$/i)
    if (match) {
      baseName = match[1]
      webpSrcSet = `/images/${baseName}-400.webp 400w, /images/${baseName}-600.webp 600w, /images/${baseName}-900.webp 900w`
      defaultSrc = `/images/${baseName}-600.webp`
    } else {
      defaultSrc = imageSource.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    }
  }

  const isEager = priority || loading === 'eager'

  // Default responsive sizes for fashion e-commerce cards:
  // Mobile (<640px): 2 columns (~45vw - 50vw)
  // Tablet (<1024px): 3 columns (~30vw - 33vw)
  // Desktop: max card width ~320px
  const effectiveSizes = sizes || '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px'

  // Instant display for already-cached images to avoid opacity flash
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true)
    }
  }, [defaultSrc])

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        aspectRatio: aspectRatio || undefined,
        ...style
      }}
    >
      {/* Shimmer placeholder while loading */}
      {!loaded && errorCount < 2 && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#F5E6C8]/40 via-[#FFFDF8]/70 to-[#F5E6C8]/40 animate-pulse pointer-events-none z-0"
        />
      )}

      <picture className="w-full h-full block">
        {webpSrcSet ? (
          <source
            type="image/webp"
            srcSet={webpSrcSet}
            sizes={effectiveSizes}
          />
        ) : typeof defaultSrc === 'string' && defaultSrc.endsWith('.webp') ? (
          <source
            type="image/webp"
            srcSet={defaultSrc}
          />
        ) : null}

        <img
          ref={imgRef}
          src={defaultSrc}
          srcSet={webpSrcSet || undefined}
          sizes={webpSrcSet ? effectiveSizes : undefined}
          alt={alt}
          width={width || 600}
          height={height || 800}
          loading={isEager ? 'eager' : 'lazy'}
          fetchpriority={priority ? 'high' : 'auto'}
          decoding={isEager ? 'sync' : 'async'}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (errorCount === 0) {
              setErrorCount(1)
            } else {
              setLoaded(true)
            }
          }}
          className={`w-full h-full object-cover transition-opacity duration-300 ease-out ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      </picture>
    </div>
  )
}

