/**
 * AGVIA Atelier - Data Export Utilities
 * Handles CSV, JSON and Bulk downloads for admin datasets (Orders, Patrons, Products, Inventory, Analytics).
 */

// Helper to escape and quote CSV field values
function formatCSVCell(val) {
  if (val === null || val === undefined) return '""'
  if (typeof val === 'object') {
    if (val instanceof Date) return `"${val.toISOString().split('T')[0]}"`
    // If it's an array or object, convert to string
    val = JSON.stringify(val).replace(/"/g, '""')
    return `"${val}"`
  }
  const str = String(val)
  // Escape double quotes by doubling them
  return `"${str.replace(/"/g, '""')}"`
}

/**
 * Generic CSV Exporter
 * @param {Array<Object>} rows - Array of row objects
 * @param {Array<{ key: string, label: string }>} columns - Column definitions
 * @param {string} filename - Target file name without extension
 */
export function exportToCSV(rows = [], columns = [], filename = 'agvia_export') {
  if (!rows || rows.length === 0) {
    throw new Error('No data available to export.')
  }

  // Determine columns if not explicitly provided
  const cols = columns.length > 0 
    ? columns 
    : Object.keys(rows[0]).map(key => ({ key, label: key.toUpperCase() }))

  const headers = cols.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',')
  
  const csvRows = rows.map(row => {
    return cols.map(c => {
      let val = row[c.key]
      if (c.getter && typeof c.getter === 'function') {
        val = c.getter(row)
      }
      return formatCSVCell(val)
    }).join(',')
  })

  const csvContent = '\uFEFF' + [headers, ...csvRows].join('\r\n') // include BOM for Excel UTF-8 support
  downloadBlob(csvContent, `${filename}_${getTimestamp()}.csv`, 'text/csv;charset=utf-8;')
}

/**
 * Generic JSON Exporter
 */
export function exportToJSON(data, filename = 'agvia_data') {
  const jsonContent = JSON.stringify(data, null, 2)
  downloadBlob(jsonContent, `${filename}_${getTimestamp()}.json`, 'application/json;charset=utf-8;')
}

/**
 * Trigger browser file download
 */
function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function getTimestamp() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `${yyyy}${mm}${dd}_${hh}${min}`
}

/* ─────────────────────────────────────────────────────────────
   SPECIALIZED DOMAIN EXPORTERS
   ───────────────────────────────────────────────────────────── */

/** Export Orders */
export function exportOrders(orders = []) {
  const columns = [
    { key: 'orderNumber', label: 'Order ID' },
    { key: 'customer', label: 'Patron Name' },
    { key: 'date', label: 'Order Date' },
    { key: 'total', label: 'Amount (INR)', getter: (r) => r.total || 0 },
    { key: 'status', label: 'Dispatch Status' },
    { key: 'payment', label: 'Payment Method & Status' },
    { key: 'items', label: 'Items Count', getter: (r) => r.items || (r.orderItems?.length ?? 1) },
    { key: 'couponCode', label: 'Coupon Applied', getter: (r) => r.couponCode || 'None' },
    { key: 'discountAmount', label: 'Discount (INR)', getter: (r) => r.discountAmount || 0 },
    { key: 'notificationStatus', label: 'Patron Notification' }
  ]
  exportToCSV(orders, columns, 'agvia_atelier_orders')
}

/** Export Patrons / Customers */
export function exportCustomers(customers = []) {
  const columns = [
    { key: 'id', label: 'Patron ID' },
    { key: 'name', label: 'Full Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'phone', label: 'Contact Phone', getter: (r) => r.phone || 'N/A' },
    { key: 'orders', label: 'Lifetime Orders' },
    { key: 'spent', label: 'Total Wardrobe Spend (INR)', getter: (r) => r.spent || 0 },
    { key: 'joined', label: 'Member Since' },
    { key: 'status', label: 'Client Tier', getter: (r) => r.orders > 0 ? 'Active Patron' : 'New Client' }
  ]
  exportToCSV(customers, columns, 'agvia_patrons_directory')
}

/** Export Silhouettes / Products */
export function exportProducts(products = []) {
  const columns = [
    { key: 'id', label: 'Silhouette ID' },
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Couture Name' },
    { key: 'category', label: 'Collection / Category' },
    { key: 'price', label: 'Original Price (INR)' },
    { key: 'discountPrice', label: 'Offer Price (INR)', getter: (r) => r.discountPrice || 'N/A' },
    { key: 'stock', label: 'Available Stock' },
    { key: 'unit', label: 'Unit Type', getter: (r) => r.unit || 'piece' },
    { key: 'rating', label: 'Average Rating', getter: (r) => r.rating || r.avgRating || '5.0' },
    { key: 'active', label: 'Catalog Status', getter: (r) => r.active !== false ? 'Active' : 'Inactive' }
  ]
  exportToCSV(products, columns, 'agvia_couture_collection')
}

/** Export Stock & Inventory */
export function exportInventory(inventory = []) {
  const columns = [
    { key: 'id', label: 'Item ID' },
    { key: 'sku', label: 'SKU Identifier' },
    { key: 'name', label: 'Couture Silhouette' },
    { key: 'category', label: 'Line / Category' },
    { key: 'stock', label: 'Current Inventory' },
    { key: 'unit', label: 'Unit' },
    { key: 'health', label: 'Stock Health', getter: (r) => (Number(r.stock) <= 10 ? 'LOW STOCK ALERT' : 'OPTIMAL') }
  ]
  exportToCSV(inventory, columns, 'agvia_fabric_inventory')
}

/** Export Privilege Codes / Coupons */
export function exportCoupons(coupons = []) {
  const columns = [
    { key: 'id', label: 'Coupon ID' },
    { key: 'code', label: 'Privilege Code' },
    { key: 'title', label: 'Campaign Title' },
    { key: 'discountType', label: 'Type' },
    { key: 'discountValue', label: 'Discount Value' },
    { key: 'minOrderAmount', label: 'Min Spend (INR)' },
    { key: 'expires', label: 'Expiry Date' },
    { key: 'active', label: 'Status', getter: (r) => r.active ? 'ACTIVE' : 'PAUSED' }
  ]
  exportToCSV(coupons, columns, 'agvia_privilege_codes')
}

/** Export Atelier Subscriptions */
export function exportSubscriptions(subscriptions = []) {
  const columns = [
    { key: 'id', label: 'Membership ID' },
    { key: 'customerName', label: 'Patron Name' },
    { key: 'customerEmail', label: 'Email' },
    { key: 'customerPhone', label: 'Phone' },
    { key: 'planName', label: 'Circle Plan' },
    { key: 'planTier', label: 'Tier' },
    { key: 'status', label: 'Membership Status' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'Expiry Date' },
    { key: 'amount', label: 'Annual Fee (INR)' }
  ]
  exportToCSV(subscriptions, columns, 'agvia_atelier_circle_subscribers')
}

/** Export Categories */
export function exportCategories(categories = []) {
  const columns = [
    { key: 'id', label: 'Category ID' },
    { key: 'name', label: 'Category Name' },
    { key: 'description', label: 'Description' },
    { key: 'count', label: 'Total Silhouettes' },
    { key: 'active', label: 'Status' }
  ]
  exportToCSV(categories, columns, 'agvia_categories')
}

/** Export Reviews */
export function exportReviews(reviews = []) {
  const columns = [
    { key: 'id', label: 'Review ID' },
    { key: 'product', label: 'Product / Silhouette' },
    { key: 'customer', label: 'Patron' },
    { key: 'rating', label: 'Rating (out of 5)' },
    { key: 'comment', label: 'Review Details' },
    { key: 'status', label: 'Moderation Status', getter: (r) => r.approved ? 'Approved' : 'Pending' }
  ]
  exportToCSV(reviews, columns, 'agvia_patron_reviews')
}

/** Export Date-Range Analytics Summary */
export function exportAnalyticsReport({ startDate, endDate, summary = {}, dailyTrend = [], orders = [] }) {
  const metaRows = [
    { Metric: 'Report Type', Value: 'AGVIA Atelier Analytics Date-Wise Summary' },
    { Metric: 'Filter Start Date', Value: startDate },
    { Metric: 'Filter End Date', Value: endDate },
    { Metric: 'Generated At', Value: new Date().toLocaleString('en-IN') },
    { Metric: 'Total Period Revenue (INR)', Value: summary.totalRevenue || 0 },
    { Metric: 'Total Period Orders', Value: summary.totalOrders || 0 },
    { Metric: 'Average Order Value (INR)', Value: summary.aov || 0 },
    { Metric: 'Delivered Orders', Value: summary.deliveredOrders || 0 },
    { Metric: 'Pending Orders', Value: summary.pendingOrders || 0 }
  ]
  
  // Format summary header section
  const summaryCSV = [
    '"METRIC","VALUE"',
    ...metaRows.map(r => `"${r.Metric}","${String(r.Value).replace(/"/g, '""')}"`)
  ].join('\r\n')

  // Format daily trend section
  const dailyHeader = '\r\n\r\n"DATE / PERIOD","REVENUE (INR)","ORDERS COUNT"\r\n'
  const dailyRows = (dailyTrend || []).map(d => 
    `"${d.date || d.month}","${d.sales || d.revenue || 0}","${d.orders || 0}"`
  ).join('\r\n')

  const fullContent = '\uFEFF' + summaryCSV + dailyHeader + dailyRows
  downloadBlob(fullContent, `agvia_analytics_${startDate}_to_${endDate}.csv`, 'text/csv;charset=utf-8;')
}

/**
 * Export Master Atelier Enterprise CSV Archive
 * Compiles all 9 admin panel datasets into a unified spreadsheet:
 * Executive KPI summary, Orders, Patrons, Products, Inventory, Categories, Coupons, Subscriptions, Reviews
 */
export function exportMasterAdminCSV({
  overview = {},
  trends = [],
  funnel = null,
  devices = [],
  sources = [],
  topPages = [],
  topProducts = [],
  recentActivity = [],
  orders = [],
  customers = [],
  products = [],
  inventory = [],
  categories = [],
  coupons = [],
  subscriptions = [],
  reviews = [],
  startDate,
  endDate
}) {
  const totalRevenue = overview.revenue || orders.reduce((sum, o) => sum + Number(o.total || o.finalAmount || 0), 0)
  const metaRows = [
    ['REPORT', 'AGVIA Master Atelier Enterprise Dossier (Web Analytics & All Admin Registries)'],
    ['GENERATED AT', new Date().toLocaleString('en-IN')],
    ['WINDOW', (startDate && endDate) ? `${startDate} to ${endDate}` : 'Complete Atelier Lifetime Records'],
    ['TOTAL REVENUE (INR)', totalRevenue],
    ['TOTAL ORDERS', orders.length || overview.orders || 0],
    ['UNIQUE VISITORS', overview.visitors || 0],
    ['CONVERSION RATE', `${funnel?.overallConversionRate ?? funnel?.overallConversionPct ?? 0}%`],
    ['REGISTERED PATRONS', customers.length],
    ['COUTURE SILHOUETTES', products.length],
    ['FABRIC INVENTORY ITEMS', inventory.length],
    ['ACTIVE CATEGORIES', categories.length],
    ['PRIVILEGE CODES', coupons.length],
    ['VIP PATRONS', subscriptions.length],
    ['CUSTOMER REVIEWS', reviews.length],
  ]

  let sections = []

  // Meta Section
  sections.push(['=== EXECUTIVE OVERVIEW & ATELIER KPIs ==='])
  metaRows.forEach(([k, v]) => sections.push([k, v]))
  sections.push([])

  // Section: Web Analytics Traffic & Engagement Overview
  sections.push(['=== I. REAL-TIME WEBSITE TRAFFIC & COMMERCE TELEMETRY ==='])
  sections.push(['Metric Description', 'Recorded Value'])
  sections.push(['Unique Anonymous Visitors', overview.visitors || 0])
  sections.push(['Total Active Sessions (30-min)', overview.sessions || 0])
  sections.push(['Total Public Page Views', overview.pageViews || 0])
  sections.push(['Couture Product Views', overview.productViews || 0])
  sections.push(['Add to Cart Actions', overview.addToCart || 0])
  sections.push(['Product Social & Link Shares', overview.shares || 0])
  sections.push(['Verified Store Orders', orders.length || overview.orders || 0])
  sections.push(['Authoritative Revenue (INR)', totalRevenue])
  sections.push([])

  // Section: E-Commerce Conversion Funnel
  sections.push(['=== II. E-COMMERCE CONVERSION FUNNEL ==='])
  sections.push(['Funnel Stage', 'Activity Tracked', 'Volume Recorded', 'Stage Conversion Rate'])
  sections.push(['Stage 1: Discovery', 'Unique Anonymous Visitors', overview.visitors || 0, '100% Top of Funnel'])
  sections.push(['Stage 2: Catalog Interest', 'Couture Detail Views', overview.productViews || 0, `${funnel?.productViewRate ?? funnel?.visitorsToViewsPct ?? 0}%`])
  sections.push(['Stage 3: Purchase Intent', 'Silhouettes Added to Cart', overview.addToCart || 0, `${funnel?.cartRate ?? funnel?.viewsToCartPct ?? 0}%`])
  sections.push(['Stage 4: Order Initiation', 'Checkout Started Workflows', overview.checkouts || funnel?.checkoutStarted || 0, `${funnel?.checkoutRate ?? funnel?.cartToCheckoutsPct ?? 0}%`])
  sections.push(['Stage 5: Completed Purchases', 'Verified Database Orders', orders.length || overview.orders || 0, `${funnel?.purchaseRate ?? funnel?.checkoutsToPurchasesPct ?? 0}% (Overall: ${funnel?.overallConversionRate ?? funnel?.overallConversionPct ?? 0}%)`])
  sections.push([])

  // Section: Daily Telemetry & Engagement Trends
  if (trends && trends.length > 0) {
    sections.push(['=== III. CALENDAR WINDOW DAILY TRAFFIC & PERFORMANCE TRENDS ==='])
    sections.push(['Date / Month', 'Unique Visitors', 'Page Views', 'Product Views', 'Cart Adds', 'Orders Count', 'Sales Revenue (INR)'])
    trends.forEach(t => {
      sections.push([
        t.date || t.month || 'Day',
        t.visitors || 0,
        t.pageViews || 0,
        t.productViews || 0,
        t.addToCart || 0,
        t.orders || 0,
        t.revenue || t.sales || 0
      ])
    })
    sections.push([])
  }

  // Section: Device Distribution
  if (devices && devices.length > 0) {
    sections.push(['=== IV. CLIENT DEVICE TELEMETRY DISTRIBUTION ==='])
    sections.push(['Device Category', 'Recorded Sessions', 'Percentage Share'])
    devices.forEach(d => {
      sections.push([
        d.deviceType || 'Unknown',
        d.count || 0,
        `${d.percentage || 0}%`
      ])
    })
    sections.push([])
  }

  // Section: Traffic Acquisition Sources
  if (sources && sources.length > 0) {
    sections.push(['=== V. TRAFFIC ACQUISITION CHANNELS & SOURCES ==='])
    sections.push(['Traffic Source / Referrer', 'Visit Volume'])
    sources.forEach(s => {
      sections.push([
        s.source || 'Direct',
        s.count || 0
      ])
    })
    sections.push([])
  }

  // Section: Top Visited Silhouettes
  if (topProducts && topProducts.length > 0) {
    sections.push(['=== VI. TOP VISITED HAUTE COUTURE SILHOUETTES ==='])
    sections.push(['Silhouette Name', 'SKU', 'Views Count', 'Catalog Share'])
    topProducts.forEach(p => {
      sections.push([
        p.productName || p.name || 'Silhouette',
        p.sku || `AGV-${p.productId || p.id || '—'}`,
        p.views || 0,
        `${p.percentage || 0}%`
      ])
    })
    sections.push([])
  }

  // Section: Top Visited Pages
  if (topPages && topPages.length > 0) {
    sections.push(['=== VII. TOP VISITED PUBLIC STORE ROUTES ==='])
    sections.push(['Page Route / URL', 'Total Page Views', 'Traffic Share'])
    topPages.forEach(pg => {
      sections.push([
        pg.pagePath || '/',
        pg.views || 0,
        `${pg.percentage || 0}%`
      ])
    })
    sections.push([])
  }

  // Section: Recent Activity Stream
  if (recentActivity && recentActivity.length > 0) {
    sections.push(['=== VIII. REAL-TIME AUDIT ACTIVITY & TELEMETRY STREAM ==='])
    sections.push(['Timestamp', 'Event Type', 'Event Description', 'Page Path', 'Device'])
    recentActivity.forEach(act => {
      sections.push([
        act.createdAt || act.timestamp || 'Just now',
        act.eventType || 'VISIT',
        act.description || act.eventLabel || 'User Interaction',
        act.pagePath || '—',
        act.deviceType || '—'
      ])
    })
    sections.push([])
  }

  // Section: Orders
  sections.push(['=== IX. ATELIER ORDERS & DISPATCH REGISTER ==='])
  sections.push(['Order ID', 'Patron Name', 'Order Date', 'Items Count', 'Total Amount (INR)', 'Payment Method', 'Dispatch Status', 'Coupon Code'])
  orders.forEach(o => {
    sections.push([
      o.orderNumber || `#${o.id}`,
      o.customer || 'Guest',
      o.date || o.createdAt?.split('T')[0] || '—',
      o.items || (Array.isArray(o.orderItems) ? o.orderItems.length : 1),
      o.total || o.finalAmount || 0,
      o.payment || o.paymentMethod || 'PAID',
      o.status || 'PENDING',
      o.couponCode || 'None'
    ])
  })
  sections.push([])

  // Section: Patrons
  sections.push(['=== X. PATRONS & CLIENTELE DIRECTORY ==='])
  sections.push(['Patron ID', 'Full Name', 'Email Address', 'Phone', 'Lifetime Orders', 'Total Wardrobe Spend (INR)', 'Client Tier'])
  customers.forEach(c => {
    sections.push([
      `#${c.id}`,
      c.name || 'Patron',
      c.email || '—',
      c.phone || '—',
      c.orders || 0,
      c.spent || 0,
      c.orders > 0 ? 'Active Patron' : 'New Client'
    ])
  })
  sections.push([])

  // Section: Products
  sections.push(['=== XI. HAUTE COUTURE SILHOUETTES & CATALOG ==='])
  sections.push(['SKU', 'Silhouette Name', 'Category / Line', 'Original Price (INR)', 'Offer Price (INR)', 'Stock Quantity', 'Status'])
  products.forEach(p => {
    sections.push([
      p.sku || `AGV-${p.id}`,
      p.name || 'Silhouette',
      p.category || p.categoryName || 'Couture',
      p.price || 0,
      p.discountPrice || 'N/A',
      p.stock ?? p.stockQuantity ?? 0,
      p.active !== false ? 'Active' : 'Inactive'
    ])
  })
  sections.push([])

  // Section: Inventory
  sections.push(['=== XII. FABRIC & STOCK INVENTORY AUDIT ==='])
  sections.push(['SKU', 'Item Name', 'Line', 'Stock Quantity', 'Unit', 'Health Status'])
  inventory.forEach(i => {
    sections.push([
      i.sku || `AGV-${i.id}`,
      i.name || 'Garment Piece',
      i.category || 'Atelier',
      i.stock ?? 0,
      i.unit || 'piece',
      Number(i.stock ?? 0) <= 10 ? 'LOW STOCK ALERT' : 'OPTIMAL'
    ])
  })
  sections.push([])

  // Section: Categories
  sections.push(['=== XIII. COLLECTIONS & CATEGORIES ARCHITECTURE ==='])
  sections.push(['Category ID', 'Collection Name', 'Description', 'Status'])
  categories.forEach(c => {
    sections.push([
      `#${c.id}`,
      c.name || 'Collection',
      c.description || 'Exclusive handcrafted collection',
      c.active !== false ? 'Active' : 'Inactive'
    ])
  })
  sections.push([])

  // Section: Coupons
  sections.push(['=== XIV. PRIVILEGE CODES & DISCOUNT CAMPAIGNS ==='])
  sections.push(['Code', 'Campaign Title', 'Discount Benefit', 'Min Spend (INR)', 'Expiry Date', 'Status'])
  coupons.forEach(c => {
    sections.push([
      c.code,
      c.title || c.code,
      c.discount || `${c.discountValue}%`,
      c.minOrderAmount || 0,
      c.expires || 'No Expiry',
      c.active ? 'ACTIVE' : 'PAUSED'
    ])
  })
  sections.push([])

  // Section: VIP Subscriptions
  sections.push(['=== XV. ATELIER CIRCLE VIP MEMBERSHIPS ==='])
  sections.push(['Membership ID', 'Patron Name', 'Email', 'Phone', 'Circle Plan', 'Tier', 'Annual Fee (INR)', 'Status', 'Expiry Date'])
  subscriptions.forEach(s => {
    sections.push([
      `#${s.id}`,
      s.customerName || 'VIP Member',
      s.email || '—',
      s.customerPhone || '—',
      s.planName || 'AGVIA VIP',
      s.planTier || 'VIP',
      s.amount || 299,
      s.status || 'ACTIVE',
      s.endDate ? new Date(s.endDate).toLocaleDateString('en-IN') : 'Annual'
    ])
  })
  sections.push([])

  // Section: Reviews
  sections.push(['=== XVI. PATRON REVIEWS & TESTIMONIALS ==='])
  sections.push(['Review ID', 'Product', 'Patron Name', 'Rating (out of 5)', 'Comment / Feedback', 'Review Date'])
  reviews.forEach(r => {
    sections.push([
      `#${r.id}`,
      r.product || r.productName || 'Couture Garment',
      r.customer || r.customerName || 'Patron',
      r.rating || 5,
      r.comment || '',
      r.date || r.createdAt?.split('T')[0] || '—'
    ])
  })

  const csvRows = sections.map(row => row.map(formatCSVCell).join(','))
  const fullContent = '\uFEFF' + csvRows.join('\r\n')
  downloadBlob(fullContent, `agvia_master_atelier_lists_${getTimestamp()}.csv`, 'text/csv;charset=utf-8;')
}

/**
 * Dedicated Web Analytics CSV Exporter
 */
export function exportAnalyticsCSV({
  overview = {},
  trends = [],
  funnel = null,
  devices = [],
  sources = [],
  topPages = [],
  topProducts = [],
  recentActivity = [],
  orders = [],
  startDate,
  endDate
}) {
  const sections = []

  // Metadata
  sections.push(['=== AGVIA ATELIER - WEBSITE ANALYTICS & TELEMETRY REPORT ==='])
  sections.push(['GENERATED AT', new Date().toLocaleString('en-IN')])
  sections.push(['REPORTING WINDOW', (startDate && endDate) ? `${startDate} to ${endDate}` : 'All Time'])
  sections.push(['UNIQUE VISITORS', overview.visitors || 0])
  sections.push(['TOTAL SESSIONS', overview.sessions || 0])
  sections.push(['TOTAL PAGE VIEWS', overview.pageViews || 0])
  sections.push(['PRODUCT VIEWS', overview.productViews || 0])
  sections.push(['ADD TO CART', overview.addToCart || 0])
  sections.push(['PRODUCT SHARES', overview.shares || 0])
  sections.push(['COMPLETED ORDERS', orders.length || overview.orders || 0])
  sections.push(['AUTHORITATIVE REVENUE (INR)', overview.revenue || 0])
  sections.push(['OVERALL CONVERSION RATE', `${funnel?.overallConversionRate ?? funnel?.overallConversionPct ?? 0}%`])
  sections.push([])

  // Funnel
  sections.push(['=== CONVERSION FUNNEL METRICS ==='])
  sections.push(['Stage', 'Activity', 'Count', 'Conversion Rate'])
  sections.push(['Discovery', 'Unique Visitors', overview.visitors || 0, '100%'])
  sections.push(['Catalog Interest', 'Product Views', overview.productViews || 0, `${funnel?.productViewRate ?? funnel?.visitorsToViewsPct ?? 0}%`])
  sections.push(['Purchase Intent', 'Add to Cart', overview.addToCart || 0, `${funnel?.cartRate ?? funnel?.viewsToCartPct ?? 0}%`])
  sections.push(['Order Initiation', 'Checkout Started', overview.checkouts || funnel?.checkoutStarted || 0, `${funnel?.checkoutRate ?? funnel?.cartToCheckoutsPct ?? 0}%`])
  sections.push(['Purchased', 'Completed Orders', orders.length || overview.orders || 0, `${funnel?.purchaseRate ?? funnel?.checkoutsToPurchasesPct ?? 0}%`])
  sections.push([])

  // Daily Trends
  if (trends && trends.length > 0) {
    sections.push(['=== DAILY TRAFFIC & TELEMETRY TRENDS ==='])
    sections.push(['Date', 'Visitors', 'Page Views', 'Product Views', 'Cart Adds', 'Orders', 'Revenue (INR)'])
    trends.forEach(t => {
      sections.push([
        t.date || t.month || 'Day',
        t.visitors || 0,
        t.pageViews || 0,
        t.productViews || 0,
        t.addToCart || 0,
        t.orders || 0,
        t.revenue || t.sales || 0
      ])
    })
    sections.push([])
  }

  // Devices
  if (devices && devices.length > 0) {
    sections.push(['=== DEVICE BREAKDOWN ==='])
    sections.push(['Device Category', 'Visitors / Sessions', 'Percentage'])
    devices.forEach(d => {
      sections.push([d.deviceType || 'Unknown', d.count || 0, `${d.percentage || 0}%`])
    })
    sections.push([])
  }

  // Sources
  if (sources && sources.length > 0) {
    sections.push(['=== TRAFFIC SOURCES ==='])
    sections.push(['Channel Source', 'Visits Count'])
    sources.forEach(s => {
      sections.push([s.source || 'Direct', s.count || 0])
    })
    sections.push([])
  }

  // Top Pages
  if (topPages && topPages.length > 0) {
    sections.push(['=== TOP VISITED PAGES & ROUTES ==='])
    sections.push(['Page Route', 'Views Count', 'Share Percentage'])
    topPages.forEach(p => {
      sections.push([p.pagePath || '/', p.views || 0, `${p.percentage || 0}%`])
    })
    sections.push([])
  }

  // Top Products
  if (topProducts && topProducts.length > 0) {
    sections.push(['=== TOP VISITED PRODUCTS & SILHOUETTES ==='])
    sections.push(['Silhouette Name', 'SKU', 'Views Count', 'Share Percentage'])
    topProducts.forEach(p => {
      sections.push([p.productName || p.name || 'Silhouette', p.sku || '—', p.views || 0, `${p.percentage || 0}%`])
    })
    sections.push([])
  }

  // Recent Activity
  if (recentActivity && recentActivity.length > 0) {
    sections.push(['=== RECENT TELEMETRY ACTIVITY STREAM ==='])
    sections.push(['Timestamp', 'Event Type', 'Description / Label', 'Page Path', 'Device'])
    recentActivity.forEach(act => {
      sections.push([
        act.createdAt || act.timestamp || 'Recent',
        act.eventType || 'EVENT',
        act.description || act.eventLabel || 'Action',
        act.pagePath || '—',
        act.deviceType || '—'
      ])
    })
  }

  const csvRows = sections.map(row => row.map(formatCSVCell).join(','))
  const fullContent = '\uFEFF' + csvRows.join('\r\n')
  downloadBlob(fullContent, `agvia_website_analytics_${getTimestamp()}.csv`, 'text/csv;charset=utf-8;')
}

