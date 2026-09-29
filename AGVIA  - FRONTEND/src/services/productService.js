import api from './api'
import { resolveImageUrl } from '../utils/media'

// ── 26 Official AGVIA Luxury Boutique Products ───────────────────────
export const BOUTIQUE_CATALOG_26 = [
  // ── Sarees (5) ──
  {
    id: 1,
    name: 'AGVIA Classic Silk Saree',
    description: 'Elegant mulberry silk saree with pure gold zari borders for auspicious occasions and traditional celebrations.',
    sku: 'AGV-SAR-001',
    price: 4999,
    stock: 25,
    unit: 'piece',
    image: '/images/classic_silk_saree.jpg',
    category: 'Sarees',
    rating: 4.9,
    bestseller: true,
  },
  {
    id: 2,
    name: 'AGVIA Floral Organza Saree',
    description: 'Lightweight sheer organza saree with delicate pastel floral motifs, ideal for day festivities and cocktail parties.',
    sku: 'AGV-SAR-002',
    price: 3999,
    stock: 20,
    unit: 'piece',
    image: '/images/floral_organza_saree.jpg',
    category: 'Sarees',
    rating: 4.8,
    bestseller: false,
  },
  {
    id: 3,
    name: 'AGVIA Kanjeevaram Temple Border Silk Saree',
    description: 'Heirloom heavy Kanjeevaram silk weave with traditional korvai temple borders and rich brocade pallu.',
    sku: 'AGV-SAR-003',
    price: 6499,
    stock: 15,
    unit: 'piece',
    image: '/images/classic_silk_saree.jpg',
    category: 'Sarees',
    rating: 5.0,
    bestseller: true,
  },
  {
    id: 4,
    name: 'AGVIA Pastel Banarasi Georgette Saree',
    description: 'Fluid drape handwoven Banarasi georgette featuring intricate silver cutwork buttas and scalloped zari trims.',
    sku: 'AGV-SAR-004',
    price: 4599,
    stock: 18,
    unit: 'piece',
    image: '/images/floral_organza_saree.jpg',
    category: 'Sarees',
    rating: 4.8,
    bestseller: false,
  },
  {
    id: 5,
    name: 'AGVIA Mulberry Tissue Silk Saree',
    description: 'Ultra-luminous gold tissue saree woven with fine metallic threads for a magnificent festive radiance.',
    sku: 'AGV-SAR-005',
    price: 5499,
    stock: 12,
    unit: 'piece',
    image: '/images/classic_silk_saree.jpg',
    category: 'Sarees',
    rating: 4.9,
    bestseller: false,
  },

  // ── Lehengas (5) ──
  {
    id: 6,
    name: 'AGVIA Royal Wedding Lehenga',
    description: 'Exquisite bridal couture lehenga handcrafted with intricate zardozi, semi-precious beadwork and double sheer dupattas.',
    sku: 'AGV-LEH-006',
    price: 8999,
    stock: 12,
    unit: 'set',
    image: '/images/wedding_lehenga.jpg',
    category: 'Lehengas',
    rating: 5.0,
    bestseller: true,
  },
  {
    id: 7,
    name: 'AGVIA Festive Silk Lehenga Set',
    description: 'Graceful raw silk flared lehenga with hand-embroidered gotta patti motifs and a lightweight net dupatta.',
    sku: 'AGV-LEH-007',
    price: 5999,
    stock: 15,
    unit: 'set',
    image: '/images/festive_lehenga_set.jpg',
    category: 'Lehengas',
    rating: 4.8,
    bestseller: true,
  },
  {
    id: 8,
    name: 'AGVIA Crimson Velvet Bridal Lehenga',
    description: 'Regal crimson velvet bridal ensemble adorned with traditional dabka, sequins, and heritage kalis.',
    sku: 'AGV-LEH-008',
    price: 9999,
    stock: 10,
    unit: 'set',
    image: '/images/wedding_lehenga.jpg',
    category: 'Lehengas',
    rating: 5.0,
    bestseller: true,
  },
  {
    id: 9,
    name: 'AGVIA Champagne Mirror-Work Lehenga',
    description: 'Dazzling champagne gold lehenga embellished with hand-cut mirrors and resham threadwork, perfect for Sangeet nights.',
    sku: 'AGV-LEH-009',
    price: 6999,
    stock: 14,
    unit: 'set',
    image: '/images/festive_lehenga_set.jpg',
    category: 'Lehengas',
    rating: 4.9,
    bestseller: false,
  },
  {
    id: 10,
    name: 'AGVIA Rose Gold Zardozi Lehenga',
    description: 'Romantic pastel lehenga featuring subtle rose gold metallic threadwork and a sweetheart neckline blouse.',
    sku: 'AGV-LEH-010',
    price: 7999,
    stock: 11,
    unit: 'set',
    image: '/images/wedding_lehenga.jpg',
    category: 'Lehengas',
    rating: 4.9,
    bestseller: false,
  },

  // ── Anarkalis & Kurtas (5) ──
  {
    id: 11,
    name: 'AGVIA Embroidered Anarkali Set',
    description: 'Floor-grazing silhouette with intricate hand-embroidered yoke, flared kalis and a sheer matching dupatta.',
    sku: 'AGV-ANK-011',
    price: 3499,
    stock: 30,
    unit: 'set',
    image: '/images/anarkali_set.jpg',
    category: 'Anarkalis & Kurtas',
    rating: 4.8,
    bestseller: true,
  },
  {
    id: 12,
    name: 'AGVIA Everyday Kurta Set',
    description: 'Breathable pure cotton-silk straight cut kurta with tailored trousers and lightweight kota doria dupatta.',
    sku: 'AGV-ANK-012',
    price: 1999,
    stock: 40,
    unit: 'set',
    image: '/images/everyday_kurta_set.jpg',
    category: 'Anarkalis & Kurtas',
    rating: 4.7,
    bestseller: false,
  },
  {
    id: 13,
    name: 'AGVIA Chikankari Angrakha Anarkali',
    description: 'Authentic handcrafted Lucknowi Chikankari angrakha with delicate tassel accents and flared ghera.',
    sku: 'AGV-ANK-013',
    price: 3899,
    stock: 22,
    unit: 'set',
    image: '/images/anarkali_set.jpg',
    category: 'Anarkalis & Kurtas',
    rating: 4.9,
    bestseller: false,
  },
  {
    id: 14,
    name: 'AGVIA Chanderi Silk Festive Kurta',
    description: 'Crisp Chanderi silk kurta with gold foil prints, intricate potli buttons, and cigarette pants.',
    sku: 'AGV-ANK-014',
    price: 2499,
    stock: 28,
    unit: 'set',
    image: '/images/everyday_kurta_set.jpg',
    category: 'Anarkalis & Kurtas',
    rating: 4.8,
    bestseller: false,
  },
  {
    id: 15,
    name: 'AGVIA Emerald Velvet Festive Anarkali',
    description: 'Opulent jewel-toned velvet suit set adorned with gold thread dori work and scalloped organza borders.',
    sku: 'AGV-ANK-015',
    price: 4499,
    stock: 18,
    unit: 'set',
    image: '/images/anarkali_set.jpg',
    category: 'Anarkalis & Kurtas',
    rating: 5.0,
    bestseller: true,
  },

  // ── Dresses & Gowns (4) ──
  {
    id: 16,
    name: 'AGVIA Evening Gown',
    description: 'Sophisticated cocktail gown designed with an asymmetric neckline, subtle shimmer, and draped silhouette.',
    sku: 'AGV-DRS-016',
    price: 3499,
    stock: 18,
    unit: 'piece',
    image: '/images/evening_gown.jpg',
    category: 'Dresses & Gowns',
    rating: 4.8,
    bestseller: false,
  },
  {
    id: 17,
    name: 'AGVIA Emerald Pleated Cocktail Gown',
    description: 'Floor-sweeping pleated metallic satin gown with a cinched waistline and graceful fluid movement.',
    sku: 'AGV-DRS-017',
    price: 4299,
    stock: 16,
    unit: 'piece',
    image: '/images/evening_gown.jpg',
    category: 'Dresses & Gowns',
    rating: 4.9,
    bestseller: true,
  },
  {
    id: 18,
    name: 'AGVIA Satin Wrap Resort Dress',
    description: 'Luxe heavyweight silk-satin wrap dress featuring a tie belt and elegant fluted sleeves.',
    sku: 'AGV-DRS-018',
    price: 2799,
    stock: 20,
    unit: 'piece',
    image: '/images/evening_gown.jpg',
    category: 'Dresses & Gowns',
    rating: 4.7,
    bestseller: false,
  },
  {
    id: 19,
    name: 'AGVIA One-Shoulder Fluted Gown',
    description: 'Dramatic single-shoulder gown tailored from stretch crepe with sculptural bodice pleats.',
    sku: 'AGV-DRS-019',
    price: 4799,
    stock: 14,
    unit: 'piece',
    image: '/images/evening_gown.jpg',
    category: 'Dresses & Gowns',
    rating: 4.9,
    bestseller: false,
  },

  // ── Western Wear (3) ──
  {
    id: 20,
    name: 'AGVIA Co-ord Set',
    description: 'Contemporary matching tunic and pleated trouser set tailored for smart-casual and travel occasions.',
    sku: 'AGV-WST-020',
    price: 1799,
    stock: 35,
    unit: 'set',
    image: '/images/coord_set.jpg',
    category: 'Western Wear',
    rating: 4.7,
    bestseller: false,
  },
  {
    id: 21,
    name: 'AGVIA Linen Blazer & Trousers Set',
    description: 'Double-breasted tailored linen blazer with wide-leg trousers in a warm sand tone.',
    sku: 'AGV-WST-021',
    price: 3199,
    stock: 24,
    unit: 'set',
    image: '/images/coord_set.jpg',
    category: 'Western Wear',
    rating: 4.8,
    bestseller: false,
  },
  {
    id: 22,
    name: 'AGVIA Crepe Cape & Pant Set',
    description: 'Flowing asymmetrical cape overlay paired with high-waisted cigarette pants for evening events.',
    sku: 'AGV-WST-022',
    price: 2899,
    stock: 22,
    unit: 'set',
    image: '/images/coord_set.jpg',
    category: 'Western Wear',
    rating: 4.8,
    bestseller: false,
  },

  // ── Kurtis (2) ──
  {
    id: 23,
    name: 'AGVIA Festive Kurti',
    description: 'Easy-to-wear A-line festive kurti featuring mirror-embroidered yoke and delicate contrast piping.',
    sku: 'AGV-KRT-023',
    price: 1499,
    stock: 45,
    unit: 'piece',
    image: '/images/festive_kurti.jpg',
    category: 'Kurtis',
    rating: 4.7,
    bestseller: false,
  },
  {
    id: 24,
    name: 'AGVIA Hand-Block Printed Silk Kurti',
    description: 'Pure Chanderi silk kurti adorned with artisanal hand-block floral motifs and subtle metallic accents.',
    sku: 'AGV-KRT-024',
    price: 1899,
    stock: 32,
    unit: 'piece',
    image: '/images/festive_kurti.jpg',
    category: 'Kurtis',
    rating: 4.8,
    bestseller: false,
  },

  // ── Dupattas (2) ──
  {
    id: 25,
    name: 'AGVIA Bridal Dupatta',
    description: 'Statement bridal veil drape crafted from fine net with heavy four-sided cutwork zardozi borders.',
    sku: 'AGV-DUP-025',
    price: 1299,
    stock: 30,
    unit: 'piece',
    image: '/images/bridal_dupatta.jpg',
    category: 'Dupattas',
    rating: 4.8,
    bestseller: false,
  },
  {
    id: 26,
    name: 'AGVIA Organza Zari Scalloped Dupatta',
    description: 'Crisp organza dupatta with hand-scalloped golden thread edging and delicate floral sprig buttas.',
    sku: 'AGV-DUP-026',
    price: 1699,
    stock: 35,
    unit: 'piece',
    image: '/images/bridal_dupatta.jpg',
    category: 'Dupattas',
    rating: 4.9,
    bestseller: false,
  },
]

// Normalize a product object from backend/fallback so that all UI components
// can use consistent field names (image, stock, rating, bestseller, category).
export function normalizeProduct(p) {
  return {
    ...p,
    image: resolveImageUrl(p.image || p.imageUrl),
    stock: p.stock ?? p.stockQuantity ?? 20,
    rating: p.rating ?? p.avgRating ?? p.averageRating ?? 4.8,
    bestseller: p.bestseller ?? p.isBestseller ?? false,
    category: p.category || p.categoryName || '',
  }
}

export const productService = {
  async getAll(params = {}) {
    let items = []
    try {
      // 1. Try to fetch from backend API
      if (params.category && params.category !== 'All') {
        const { data: catData } = await api.get('/categories')
        const catList = catData.data || []
        const found = catList.find(
          (c) => c.name.toLowerCase() === params.category.toLowerCase()
        )
        if (found) {
          const { data } = await api.get(`/products/category/${found.id}`, { params: { size: 200, page: 0 } })
          items = Array.isArray(data?.data?.content) ? data.data.content : (Array.isArray(data?.data) ? data.data : [])
        }
      } else if (params.search) {
        const { data } = await api.get('/products/search', { params: { keyword: params.search, size: 200, page: 0 } })
        items = Array.isArray(data?.data?.content) ? data.data.content : (Array.isArray(data?.data) ? data.data : [])
      } else {
        const { data } = await api.get('/products', { params: { size: 200, page: 0, sortBy: 'id', direction: 'desc' } })
        items = Array.isArray(data?.data?.content) ? data.data.content : (Array.isArray(data?.data) ? data.data : [])
      }
    } catch {
      // API call failed, will fallback to curated catalog
    }

    let combined = []
    if (Array.isArray(items) && items.length > 0) {
      combined = items.map(normalizeProduct)
    } else {
      combined = BOUTIQUE_CATALOG_26.map(normalizeProduct)
    }

    // Merge locally cached products (created by admin) so they are 100% visible immediately
    try {
      const localCustom = JSON.parse(localStorage.getItem('agvia_custom_products') || '[]')
      if (Array.isArray(localCustom) && localCustom.length > 0) {
        const existingIds = new Set(combined.map(p => String(p.id)))
        const missing = localCustom.filter(p => !existingIds.has(String(p.id))).map(normalizeProduct)
        combined = [...missing, ...combined]
      }
    } catch (e) {}

    // Apply filtering
    if (params.category && params.category !== 'All') {
      combined = combined.filter((p) => (p.category || '').toLowerCase() === params.category.toLowerCase())
    }

    if (params.search) {
      const q = params.search.toLowerCase()
      combined = combined.filter((p) =>
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
      // fallback
    }

    // Check local storage custom products
    try {
      const localCustom = JSON.parse(localStorage.getItem('agvia_custom_products') || '[]')
      const localFound = localCustom.find(p => String(p.id) === String(id))
      if (localFound) return normalizeProduct(localFound)
    } catch (e) {}

    const found = BOUTIQUE_CATALOG_26.find((p) => String(p.id) === String(id))
    if (found) return normalizeProduct(found)
    return normalizeProduct(BOUTIQUE_CATALOG_26[0])
  },

  async getCategories() {
    try {
      const { data } = await api.get('/categories')
      const catList = (data.data || []).map((c) => c.name)
      if (catList.length > 0) return catList
    } catch {
      // fallback
    }
    return [
      'Sarees',
      'Lehengas',
      'Anarkalis & Kurtas',
      'Dresses & Gowns',
      'Western Wear',
      'Kurtis',
      'Dupattas'
    ]
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
        customer: r.customerName || r.userName || 'Valued Patron',
        rating: Number(r.rating || 5),
        comment: r.comment,
        verified: r.verifiedPurchase ?? true,
        date: r.createdAt ? r.createdAt.split('T')[0] : 'N/A',
      }))
    } catch (err) {
      console.warn('Could not fetch reviews from backend for product:', productId, err)
    }

    // Load local storage cached reviews for this product
    let localReviews = []
    try {
      const storageKey = `agvia_reviews_${productId}`
      localReviews = JSON.parse(localStorage.getItem(storageKey) || '[]')
    } catch (e) {}

    // Merge: local first, then server reviews (avoiding duplicate IDs or identical comment/customer)
    const combined = [...localReviews]
    for (const sr of serverReviews) {
      if (!combined.some((c) => c.id === sr.id || (c.comment === sr.comment && c.customer === sr.customer))) {
        combined.push(sr)
      }
    }

    if (combined.length > 0) {
      return combined
    }

    // Default luxury boutique reviews if product is completely brand new
    return [
      { id: 101, customer: 'Ananya Sharma', rating: 5, comment: 'The handloom weave quality and zari borders exceeded all my expectations! Wore it to a wedding reception and received endless compliments.', verified: true, date: '2026-09-12' },
      { id: 102, customer: 'Pooja Reddy', rating: 5, comment: 'Stunning craftsmanship and pure luxury. The drape is effortless and the packaging felt like an authentic atelier experience.', verified: true, date: '2026-09-08' },
      { id: 103, customer: 'Divya Iyer', rating: 5, comment: 'Flawless tailoring and true-to-picture colors. Will definitely be ordering our bespoke bridal trousseau from AGVIA.', verified: true, date: '2026-08-28' },
    ]
  },

  async getRelated(id, limit = 4) {
    try {
      // 1. Load the target product to get its category
      const target = await this.getById(id)
      if (!target) return []

      const category = target.category || target.categoryName || ''

      // 2. Try backend: fetch by category
      if (category) {
        try {
          const { data: catData } = await api.get('/categories')
          const catList = catData.data || []
          const found = catList.find(
            (c) => c.name.toLowerCase() === category.toLowerCase()
          )
          if (found) {
            const { data } = await api.get(`/products/category/${found.id}`, {
              params: { size: 20, page: 0 }
            })
            const items = Array.isArray(data?.data?.content)
              ? data.data.content
              : Array.isArray(data?.data) ? data.data : []
            const filtered = items
              .map(normalizeProduct)
              .filter((p) => String(p.id) !== String(id))
              .slice(0, limit)
            if (filtered.length > 0) return filtered
          }
        } catch {
          // fall through to catalog fallback
        }
      }

      // 3. Fallback: local catalog, same category
      const related = BOUTIQUE_CATALOG_26
        .map(normalizeProduct)
        .filter((p) => String(p.id) !== String(id) && p.category === category)
        .slice(0, limit)

      // 4. If still empty, return any other products
      if (related.length === 0) {
        return BOUTIQUE_CATALOG_26
          .map(normalizeProduct)
          .filter((p) => String(p.id) !== String(id))
          .slice(0, limit)
      }

      return related
    } catch {
      return BOUTIQUE_CATALOG_26
        .map(normalizeProduct)
        .filter((p) => String(p.id) !== String(id))
        .slice(0, limit)
    }
  },

  async submitReview(productId, payload) {
    let savedReview = null
    const customerName = payload.customer || payload.customerName || 'Valued Patron'

    try {
      const { data } = await api.post('/reviews', {
        productId: Number(productId),
        rating: Number(payload.rating),
        comment: payload.comment,
        customerName: customerName,
      })
      const r = data.data || {}
      savedReview = {
        id: r.id || Date.now(),
        customer: r.customerName || r.userName || customerName,
        rating: Number(r.rating || payload.rating),
        comment: r.comment || payload.comment,
        verified: r.verifiedPurchase ?? true,
        date: r.createdAt ? r.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
      }
    } catch (err) {
      console.warn('Backend review submission returned error, persisting to local storage:', err)
      savedReview = {
        id: Date.now(),
        customer: customerName,
        rating: Number(payload.rating),
        comment: payload.comment,
        verified: true,
        date: new Date().toISOString().split('T')[0],
      }
    }

    // Always store to local storage cache for this specific product
    try {
      const storageKey = `agvia_reviews_${productId}`
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const updated = [savedReview, ...existing.filter((item) => item.id !== savedReview.id)]
      localStorage.setItem(storageKey, JSON.stringify(updated))
    } catch (e) {
      console.warn('Could not cache review in localStorage:', e)
    }

    return savedReview
  },

  async deleteReview(reviewId, productId) {
    try {
      const { data } = await api.delete(`/reviews/${reviewId}`)
      if (productId) {
        try {
          const storageKey = `agvia_reviews_${productId}`
          const existing = JSON.parse(localStorage.getItem(storageKey) || '[]')
          const updated = existing.filter((item) => item.id !== reviewId)
          localStorage.setItem(storageKey, JSON.stringify(updated))
        } catch (e) {}
      }
      return data
    } catch (err) {
      console.error('Failed to delete review:', err)
      throw err
    }
  }
}
