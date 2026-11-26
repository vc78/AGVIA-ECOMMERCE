import api from './api'
import { resolveImageUrl } from '../utils/media'
import { BUSINESS } from '../constants/business'

// No fabricated products, prices, or stock are hardcoded.
// Live products come exclusively from the backend catalogue API and admin product management.
export const BOUTIQUE_CATALOG_26 = []

export function normalizeProduct(p) {
  if (!p) return null
  const rawStock = p.stock ?? p.stockQuantity ?? null
  const stock = rawStock !== null && rawStock !== undefined ? Number(rawStock) : null
  const lowStockThreshold = p.lowStockThreshold != null ? Number(p.lowStockThreshold) : 5
  const rawPaymentOption =
    p.paymentPolicy?.mode ||
    p.paymentPolicy?.paymentMode ||
    p.paymentOption ||
    p.payment_option ||
    'COD_AND_ONLINE'
  const paymentOption = String(rawPaymentOption).trim().toUpperCase()
  const isStrictCod = paymentOption === 'COD_ONLY'
  const isStrictOnline = paymentOption === 'ONLINE_ONLY'
  const codAllowed = isStrictOnline ? false : isStrictCod ? true : p.codAllowed ?? true
  const onlineAllowed = isStrictCod ? false : isStrictOnline ? true : p.onlineAllowed ?? true

  let stockStatus = p.stockStatus
  if (!stockStatus && stock !== null) {
    if (stock <= 0) stockStatus = 'OUT_OF_STOCK'
    else if (stock <= lowStockThreshold) stockStatus = 'LOW_STOCK'
    else stockStatus = 'IN_STOCK'
  }

  const rawVariants = Array.isArray(p.variants) ? p.variants : []
  const variants = rawVariants.map((v) => {
    const rawVariantOpt =
      v.paymentPolicy?.mode || v.paymentPolicy?.paymentMode || v.paymentOption || v.payment_option
    const vOpt = isStrictCod
      ? 'COD_ONLY'
      : isStrictOnline
      ? 'ONLINE_ONLY'
      : rawVariantOpt
      ? String(rawVariantOpt).trim().toUpperCase()
      : paymentOption
    return {
      ...v,
      paymentOption: vOpt,
      codAllowed: vOpt !== 'ONLINE_ONLY',
      onlineAllowed: vOpt !== 'COD_ONLY',
      primaryImageUrl: resolveImageUrl(v.primaryImageUrl || v.imageUrl),
      images: Array.isArray(v.images)
        ? v.images.map((img) => ({
            ...img,
            imageUrl: resolveImageUrl(img.imageUrl),
          }))
        : [],
    }
  })

  return {
    ...p,
    image: resolveImageUrl(p.image || p.imageUrl),
    stock,
    lowStockThreshold,
    stockStatus: stockStatus || 'IN_STOCK',
    paymentOption,
    codAllowed,
    onlineAllowed,
    hasVariants: Boolean(p.hasVariants || variants.length > 0),
    variants,
    numReviews: Number(p.numReviews ?? 0),
    rating: p.rating ?? p.avgRating ?? p.averageRating ?? null,
    bestseller: p.bestseller ?? p.isBestseller ?? false,
    category: p.category?.name || p.category || p.categoryName || '',
  }
}

export const productService = {
  async getAll(params = {}) {
    let items = []
    try {
      if (params.category && params.category !== 'All') {
        const { data: catData } = await api.get('/categories')
        const catList = catData.data || []
        const found = catList.find(
          (c) => c.name.toLowerCase() === params.category.toLowerCase()
        )
        if (found) {
          const { data } = await api.get(`/products/category/${found.id}`, {
            params: { size: 200, page: 0 },
          })
          items = Array.isArray(data?.data?.content)
            ? data.data.content
            : Array.isArray(data?.data)
            ? data.data
            : []
        } else {
          const { data } = await api.get('/products', {
            params: { size: 200, page: 0, sortBy: 'id', direction: 'desc' },
          })
          items = Array.isArray(data?.data?.content)
            ? data.data.content
            : Array.isArray(data?.data)
            ? data.data
            : []
        }
      } else if (params.search) {
        const { data } = await api.get('/products/search', {
          params: { keyword: params.search, size: 200, page: 0 },
        })
        items = Array.isArray(data?.data?.content)
          ? data.data.content
          : Array.isArray(data?.data)
          ? data.data
          : []
      } else {
        const { data } = await api.get('/products', {
          params: { size: 200, page: 0, sortBy: 'id', direction: 'desc' },
        })
        items = Array.isArray(data?.data?.content)
          ? data.data.content
          : Array.isArray(data?.data)
          ? data.data
          : []
      }
    } catch {
      // API unavailable; return only admin-persisted local items if present, never mock data
    }

    let combined = Array.isArray(items) ? items.map(normalizeProduct).filter(Boolean) : []

    try {
      const localCustom = JSON.parse(localStorage.getItem('agvia_custom_products') || '[]')
      if (Array.isArray(localCustom) && localCustom.length > 0) {
        const existingIds = new Set(combined.map((p) => String(p.id)))
        const missing = localCustom
          .filter((p) => !existingIds.has(String(p.id)))
          .map(normalizeProduct)
          .filter(Boolean)
        combined = [...missing, ...combined]
      }
    } catch {}

    if (params.category && params.category !== 'All') {
      const targetCat = params.category.toLowerCase()
      combined = combined.filter(
        (p) => (p.category || '').toLowerCase() === targetCat || (p.category || '').toLowerCase().includes(targetCat)
      )
    }

    if (params.search) {
      const q = params.search.toLowerCase()
      combined = combined.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q)
      )
    }

    return combined
  },

  async getById(id) {
    try {
      const { data } = await api.get(`/products/${id}`)
      if (data?.data) return normalizeProduct(data.data)
    } catch {
      // Check admin-created local fallback if any
    }

    try {
      const localCustom = JSON.parse(localStorage.getItem('agvia_custom_products') || '[]')
      const localFound = localCustom.find((p) => String(p.id) === String(id))
      if (localFound) return normalizeProduct(localFound)
    } catch {}

    return null
  },

  async getCategories() {
    try {
      const { data } = await api.get('/categories')
      const catList = (data.data || []).map((c) => c.name).filter(Boolean)
      if (catList.length > 0) return catList
    } catch {
      // Fallback to verified business categories
    }
    return [...BUSINESS.productCategories]
  },

  async getReviews(productId) {
    let serverReviews = []
    try {
      const { data } = await api.get(`/reviews/product/${productId}`)
      const items = Array.isArray(data.data?.content)
        ? data.data.content
        : Array.isArray(data.data)
        ? data.data
        : []
      serverReviews = items.map((r) => ({
        id: r.id,
        userId: r.userId ?? null,
        userName: r.userName,
        customerName: r.customerName,
        customer: r.customerName || r.userName || 'Verified Customer',
        rating: Number(r.rating || 5),
        comment: r.comment,
        verified: r.verifiedPurchase ?? true,
        date: r.createdAt ? r.createdAt.split('T')[0] : '',
      }))
    } catch {
      // Return only genuine reviews if present
    }

    let localReviews = []
    try {
      const storageKey = `llw_reviews_${productId}`
      localReviews = JSON.parse(localStorage.getItem(storageKey) || '[]')
    } catch {}

    const combined = [...localReviews]
    for (const sr of serverReviews) {
      if (
        !combined.some(
          (c) => c.id === sr.id || (c.comment === sr.comment && c.customer === sr.customer)
        )
      ) {
        combined.push(sr)
      }
    }
    return combined
  },

  async getRelated(id, limit = 4) {
    try {
      const target = await this.getById(id)
      if (!target) return []
      const all = await this.getAll()
      const category = (target.category || '').toLowerCase()
      const sameCat = all.filter(
        (p) => String(p.id) !== String(id) && (p.category || '').toLowerCase() === category
      )
      if (sameCat.length > 0) return sameCat.slice(0, limit)
      return all.filter((p) => String(p.id) !== String(id)).slice(0, limit)
    } catch {
      return []
    }
  },

  async submitReview(productId, payload) {
    const customerName = payload.customer || payload.customerName || 'Customer'
    const { data } = await api.post('/reviews', {
      productId: Number(productId),
      rating: Number(payload.rating),
      comment: payload.comment,
      customerName,
    })
    const r = data.data || {}
    return {
      id: r.id || Date.now(),
      customer: r.customerName || r.userName || customerName,
      rating: Number(r.rating || payload.rating),
      comment: r.comment || payload.comment,
      verified: r.verifiedPurchase ?? true,
      date: r.createdAt ? r.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
    }
  },

  async deleteReview(reviewId, productId) {
    const { data } = await api.delete(`/reviews/${reviewId}`)
    if (productId) {
      try {
        const storageKey = `llw_reviews_${productId}`
        const existing = JSON.parse(localStorage.getItem(storageKey) || '[]')
        const updated = existing.filter((item) => item.id !== reviewId)
        localStorage.setItem(storageKey, JSON.stringify(updated))
      } catch {}
    }
    return data
  },

  async getHomepageData() {
    try {
      const { data } = await api.get('/homepage')
      const payload = data?.data || {}
      return {
        sections: payload.sections || [],
        bestSellers: (payload.bestSellers || []).map(normalizeProduct).filter(Boolean),
        trending: (payload.trending || []).map(normalizeProduct).filter(Boolean),
        newArrivals: (payload.newArrivals || []).map(normalizeProduct).filter(Boolean),
        limitedStock: (payload.limitedStock || []).map(normalizeProduct).filter(Boolean),
        featured: (payload.featured || []).map(normalizeProduct).filter(Boolean),
        collections: payload.collections || [],
        colors: payload.colors || [],
      }
    } catch {
      return {
        sections: [],
        bestSellers: [],
        trending: [],
        newArrivals: [],
        limitedStock: [],
        featured: [],
        collections: [],
        colors: [],
      }
    }
  },

  async getCollections() {
    try {
      const { data } = await api.get('/collections')
      return data?.data || []
    } catch {
      return []
    }
  },

  async getCollectionBySlug(slug) {
    try {
      const { data } = await api.get(`/collections/${slug}`)
      const coll = data?.data
      if (coll && coll.products) {
        coll.products = coll.products.map(normalizeProduct).filter(Boolean)
      }
      return coll
    } catch {
      return null
    }
  },
}
