import { useState } from 'react'
import { FALLBACK_PRODUCT_IMAGE } from '../../utils/media'

export default function ReliableImage({
  src,
  alt = 'AGVIA Luxury Fashion',
  className = '',
  aspectRatio = '3/4',
  loading = 'lazy',
  priority = false,
  width,
  height,
  style = {},
  ...props
}) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  // Primary source or fallback if error or empty
  const imageSource = (!src || error) ? FALLBACK_PRODUCT_IMAGE : src
  
  // Calculate WebP path if image is in /images/
  const webpSource = (!error && typeof imageSource === 'string' && imageSource.startsWith('/images/') && (imageSource.endsWith('.jpg') || imageSource.endsWith('.jpeg') || imageSource.endsWith('.png')))
    ? imageSource.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    : null

  const isEager = priority || loading === 'eager'

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        aspectRatio: aspectRatio || undefined,
        ...style
      }}
    >
      {/* Shimmer placeholder while loading */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#F5E6C8]/40 via-[#FFFDF8]/70 to-[#F5E6C8]/40 animate-pulse pointer-events-none z-0" />
      )}

      <picture className="w-full h-full block">
        {webpSource && <source srcSet={webpSource} type="image/webp" />}
        <img
          src={imageSource}
          alt={alt}
          width={width}
          height={height}
          loading={isEager ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={isEager ? 'sync' : 'async'}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (!error) {
              setError(true)
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
