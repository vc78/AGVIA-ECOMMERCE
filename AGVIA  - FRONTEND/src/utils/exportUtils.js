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
