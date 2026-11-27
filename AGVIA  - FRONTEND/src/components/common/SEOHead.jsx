import { useEffect } from 'react'
import { BUSINESS } from '../../constants/business'

const BASE_URL = 'https://agviaboutique.com'
const DEFAULT_IMAGE = `${BASE_URL}/images/agvia-logo.png`

/**
 * Updates or creates a meta tag in document.head
 */
function setMetaTag(selector, attribute, value) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    if (selector.startsWith('meta[name=')) {
      const name = selector.replace("meta[name='", '').replace("']", '')
      element.setAttribute('name', name)
    } else if (selector.startsWith('meta[property=')) {
      const property = selector.replace("meta[property='", '').replace("']", '')
      element.setAttribute('property', property)
    }
    document.head.appendChild(element)
  }
  element.setAttribute(attribute, value)
}

/**
 * Updates or creates the canonical link tag in document.head
 */
function setCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

/**
 * Injects or updates Schema.org JSON-LD scripts in document.head
 */
function setJsonLdSchema(schemaId, schemaData) {
  const existing = document.getElementById(schemaId)
  if (existing) {
    existing.remove()
  }

  if (schemaData) {
    const script = document.createElement('script')
    script.id = schemaId
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(schemaData)
    document.head.appendChild(script)
  }
}

/**
 * High-Performance SEO Component for AGVIA
 * Dynamically synchronizes title, meta descriptions, canonical URLs,
 * OpenGraph, Twitter Cards, robots directives, and Schema.org JSON-LD structured data.
 */
export default function SEOHead({
  title,
  description,
  canonicalUrl,
  image,
  type = 'website',
  noindex = false,
  structuredData = null,
  breadcrumbs = null
}) {
  const fullTitle = title
    ? `${title} | AGVIA Women's Wear Boutique`
    : "AGVIA | Women's Wear Boutique — Luxury Handcrafted Fashion"

  const metaDesc = description || BUSINESS.seo.defaultDescription
  const shareImage = image ? (image.startsWith('http') ? image : `${BASE_URL}${image}`) : DEFAULT_IMAGE
  const activeUrl = canonicalUrl ? (canonicalUrl.startsWith('http') ? canonicalUrl : `${BASE_URL}${canonicalUrl}`) : BASE_URL

  useEffect(() => {
    // 1. Document Title
    document.title = fullTitle

    // 2. Meta Description
    setMetaTag("meta[name='description']", 'content', metaDesc)

    // 3. Robots directive
    const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    setMetaTag("meta[name='robots']", 'content', robotsContent)

    // 4. Canonical URL
    setCanonical(activeUrl)

    // 5. Open Graph tags
    setMetaTag("meta[property='og:title']", 'content', fullTitle)
    setMetaTag("meta[property='og:description']", 'content', metaDesc)
    setMetaTag("meta[property='og:url']", 'content', activeUrl)
    setMetaTag("meta[property='og:type']", 'content', type)
    setMetaTag("meta[property='og:image']", 'content', shareImage)
    setMetaTag("meta[property='og:site_name']", 'content', "AGVIA Women's Wear Boutique")

    // 6. Twitter Card tags
    setMetaTag("meta[name='twitter:card']", 'content', 'summary_large_image')
    setMetaTag("meta[name='twitter:title']", 'content', fullTitle)
    setMetaTag("meta[name='twitter:description']", 'content', metaDesc)
    setMetaTag("meta[name='twitter:image']", 'content', shareImage)
    setMetaTag("meta[name='twitter:url']", 'content', activeUrl)

    // 7. Schema.org JSON-LD
    const schemas = []

    // BreadcrumbList schema
    if (breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': breadcrumbs.map((crumb, idx) => ({
          '@type': 'ListItem',
          'position': idx + 1,
          'name': crumb.name,
          'item': crumb.url.startsWith('http') ? crumb.url : `${BASE_URL}${crumb.url}`
        }))
      })
    }

    // Additional structured data (Product, ItemList, Organization, etc.)
    if (structuredData) {
      if (Array.isArray(structuredData)) {
        schemas.push(...structuredData)
      } else {
        schemas.push(structuredData)
      }
    }

    if (schemas.length > 0) {
      setJsonLdSchema('agvia-primary-schema', schemas.length === 1 ? schemas[0] : schemas)
    } else {
      setJsonLdSchema('agvia-primary-schema', null)
    }

    return () => {
      // Clean up primary schema when unmounting to prevent schema leakage on dynamic route changes
      setJsonLdSchema('agvia-primary-schema', null)
    }
  }, [fullTitle, metaDesc, activeUrl, type, shareImage, noindex, structuredData, breadcrumbs])

  return null
}
