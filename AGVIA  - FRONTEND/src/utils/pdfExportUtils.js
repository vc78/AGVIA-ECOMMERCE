/**
 * AGVIA Haute Couture - Interactive Company-Oriented Luxury PDF Generator
 * Generates branded, high-fidelity PDF documents with company logo, gold crest accents,
 * KPI summary tiles, structured data tables, and official verification seals.
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BUSINESS } from '../constants/business'

// Brand Color Palette in RGB
const THEME = {
  maroon: [90, 16, 32],        // #5A1020
  maroonDark: [60, 10, 20],    // #3C0A14
  gold: [201, 164, 92],         // #C9A45C
  goldDark: [166, 125, 40],     // #A67D28
  goldLight: [245, 230, 200],   // #F5E6C8
  ivory: [255, 253, 248],       // #FFFDF8
  charcoal: [33, 29, 30],       // #211D1E
  charcoalMuted: [90, 85, 87],  // #5A5557
  borderGold: [225, 200, 150],  // subtle gold border
  green: [46, 125, 50],
  red: [198, 40, 40],
  amber: [180, 100, 10]
}

/**
 * Fetch and convert logo to base64 for embedding in PDF
 */
async function loadLogoBase64() {
  try {
    const res = await fetch('/images/agvia-logo.png')
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.warn('Logo could not be loaded into PDF, using vector crest fallback.', err)
    return null
  }
}

/**
 * Creates and formats the official AGVIA luxury branded document header
 */
function drawDocumentHeader(doc, logoData, { title, subtitle, documentId, dateRange }) {
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Top Luxury Burgundy & Gold Accent Strip
  doc.setFillColor(...THEME.maroon)
  doc.rect(0, 0, pageWidth, 12, 'F')
  
  doc.setFillColor(...THEME.gold)
  doc.rect(0, 12, pageWidth, 1.2, 'F')

  // Confidential tag in top bar
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...THEME.goldLight)
  doc.text('AGVIA ATELIER ENTERPRISE SYSTEM • OFFICIAL CONFIDENTIAL REPORT', 14, 8)
  
  const nowStr = new Date().toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  })
  doc.text(`GENERATED: ${nowStr.toUpperCase()}`, pageWidth - 14, 8, { align: 'right' })

  // Logo & Company Information Section
  let y = 20

  if (logoData) {
    try {
      // Draw logo (width 32, height 12)
      doc.addImage(logoData, 'PNG', 14, y, 32, 12)
    } catch (_) {
      drawTextCrest(doc, 14, y)
    }
  } else {
    drawTextCrest(doc, 14, y)
  }

  // Company details on the right
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...THEME.maroon)
  doc.text(BUSINESS.name.toUpperCase(), pageWidth - 14, y + 4, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...THEME.charcoalMuted)
  doc.text(`${BUSINESS.location.street}, ${BUSINESS.location.city}`, pageWidth - 14, y + 8.5, { align: 'right' })
  doc.text(`Concierge: ${BUSINESS.contact.phone} | ${BUSINESS.contact.email}`, pageWidth - 14, y + 12.5, { align: 'right' })

  y += 18

  // Gold Separator Line
  doc.setDrawColor(...THEME.gold)
  doc.setLineWidth(0.5)
  doc.line(14, y, pageWidth - 14, y)

  y += 6

  // Document Title Banner
  doc.setFont('times', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...THEME.maroon)
  doc.text(title.toUpperCase(), 14, y)

  // Document ID Badge on right
  const docRef = documentId || `AGV-${Math.floor(100000 + Math.random() * 900000)}`
  doc.setFillColor(...THEME.goldLight)
  doc.setDrawColor(...THEME.gold)
  doc.roundedRect(pageWidth - 62, y - 5, 48, 6.5, 1.5, 1.5, 'FD')
  doc.setFont('courier', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...THEME.maroon)
  doc.text(`REF: ${docRef}`, pageWidth - 38, y - 0.5, { align: 'center' })

  y += 5
  if (subtitle || dateRange) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...THEME.charcoalMuted)
    const sub = dateRange ? `${subtitle ? `${subtitle} • ` : ''}Calendar Window: ${dateRange}` : subtitle
    doc.text(sub, 14, y)
    y += 5
  }

  return y
}

function drawTextCrest(doc, x, y) {
  doc.setFont('times', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...THEME.maroon)
  doc.text('AGVIA', x, y + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...THEME.goldDark)
  doc.text('HAUTE COUTURE ATELIER', x, y + 10)
}

/**
 * Draws luxury KPI summary cards in the PDF
 */
function drawKpiBoxes(doc, startY, kpis = []) {
  if (!kpis || kpis.length === 0) return startY

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const availableWidth = pageWidth - (margin * 2)
  const count = kpis.length
  const gap = 3.5
  const boxWidth = (availableWidth - (gap * (count - 1))) / count
  const boxHeight = 15

  kpis.forEach((kpi, i) => {
    const x = margin + i * (boxWidth + gap)
    
    // Box background
    doc.setFillColor(254, 252, 247)
    doc.setDrawColor(...THEME.borderGold)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, startY, boxWidth, boxHeight, 2, 2, 'FD')

    // Top gold indicator
    doc.setFillColor(...THEME.gold)
    doc.roundedRect(x + 2, startY + 2, 8, 1, 0.5, 0.5, 'F')

    // Label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...THEME.charcoalMuted)
    doc.text(String(kpi.label).toUpperCase(), x + 4, startY + 6.5)

    // Value
    doc.setFont('times', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(...THEME.maroon)
    doc.text(String(kpi.value), x + 4, startY + 12)
  })

  return startY + boxHeight + 6
}

/**
 * Adds branded header and footer to every autoTable page
 */
function setupPageDecorations(doc, logoData, headerConfig) {
  const pageCount = doc.internal.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Footer
    const footerY = pageHeight - 9
    doc.setDrawColor(...THEME.gold)
    doc.setLineWidth(0.4)
    doc.line(14, footerY - 3, pageWidth - 14, footerY - 3)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...THEME.charcoalMuted)
    doc.text('AGVIA WOMEN\'S WEAR BOUTIQUE • CERTIFIED ATELIER AUDIT DOCUMENT', 14, footerY + 1)
    doc.text(`PAGE ${i} OF ${pageCount}`, pageWidth - 14, footerY + 1, { align: 'right' })
  }
}

/* ─────────────────────────────────────────────────────────────
   SPECIALIZED LUXURY PDF EXPORTS
   ───────────────────────────────────────────────────────────── */

/**
 * Export Atelier Orders PDF
 */
export async function exportOrdersPDF(orders = [], filterName = 'All Orders') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const logoData = await loadLogoBase64()

  const startY = drawDocumentHeader(doc, logoData, {
    title: 'Atelier Orders & Dispatch Register',
    subtitle: `Active Storefront Orders • Filter: ${filterName}`,
    documentId: `ORD-${Date.now().toString().slice(-6)}`
  })

  // Compute quick summary
  const totalAmount = orders.reduce((sum, o) => sum + Number(o.total || 0), 0)
  const deliveredCount = orders.filter(o => String(o.status || '').toUpperCase().includes('DELIVERED')).length
  const pendingCount = orders.filter(o => String(o.status || '').toUpperCase().includes('PENDING')).length

  const afterKpiY = drawKpiBoxes(doc, startY, [
    { label: 'Total Orders', value: orders.length },
    { label: 'Cumulative Revenue', value: `₹${totalAmount.toLocaleString('en-IN')}` },
    { label: 'Delivered', value: deliveredCount },
    { label: 'Pending / In Progress', value: pendingCount }
  ])

  const headers = [['ORDER ID', 'PATRON NAME', 'DATE', 'ITEMS', 'TOTAL (INR)', 'PAYMENT', 'DISPATCH STATUS', 'EMAIL NOTICE']]
  
  const body = orders.map(o => [
    o.orderNumber || `#${o.id}`,
    o.customer || 'Patron',
    o.date || '—',
    `${o.items || 1} piece(s)`,
    `₹${Number(o.total || 0).toLocaleString('en-IN')}`,
    String(o.payment || 'PAID').toUpperCase(),
    String(o.status || 'PENDING').toUpperCase(),
    String(o.notificationStatus || 'SENT').toUpperCase()
  ])

  autoTable(doc, {
    startY: afterKpiY,
    head: headers,
    body: body,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.8,
      lineColor: THEME.borderGold,
      lineWidth: 0.2,
      textColor: THEME.charcoal
    },
    headStyles: {
      fillColor: THEME.maroon,
      textColor: THEME.goldLight,
      fontStyle: 'bold',
      fontSize: 8.5
    },
    alternateRowStyles: {
      fillColor: THEME.ivory
    },
    didParseCell: (data) => {
      // Highlight Status column
      if (data.section === 'body' && data.column.index === 6) {
        const text = String(data.cell.raw).toUpperCase()
        if (text.includes('DELIVERED') || text.includes('CONFIRMED')) {
          data.cell.styles.textColor = THEME.green
          data.cell.styles.fontStyle = 'bold'
        } else if (text.includes('CANCELLED')) {
          data.cell.styles.textColor = THEME.red
        } else {
          data.cell.styles.textColor = THEME.amber
        }
      }
    }
  })

  setupPageDecorations(doc, logoData, {})
  doc.save(`agvia_orders_dispatch_${formatDateStamp()}.pdf`)
}

/**
 * Export Patrons / Clients PDF
 */
export async function exportCustomersPDF(customers = []) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const logoData = await loadLogoBase64()

  const startY = drawDocumentHeader(doc, logoData, {
    title: 'Patron & Loyal Client Registry',
    subtitle: 'Confidential Registry of Registered AGVIA Clientele',
    documentId: `PAT-${Date.now().toString().slice(-6)}`
  })

  const totalSpent = customers.reduce((sum, c) => sum + (c.spent || 0), 0)
  const activeBuyers = customers.filter(c => (c.orders || 0) > 0).length

  const afterKpiY = drawKpiBoxes(doc, startY, [
    { label: 'Registered Patrons', value: customers.length },
    { label: 'Active Buyers', value: activeBuyers },
    { label: 'Lifetime Wardrobe Spend', value: `₹${totalSpent.toLocaleString('en-IN')}` }
  ])

  const headers = [['PATRON NAME', 'EMAIL ADDRESS', 'PHONE', 'ORDERS', 'TOTAL SPEND (INR)', 'TIER']]
  const body = customers.map(c => [
    c.name || 'Patron',
    c.email || '—',
    c.phone || '—',
    c.orders || 0,
    `₹${Number(c.spent || 0).toLocaleString('en-IN')}`,
    (c.orders > 0 ? 'Active Patron' : 'New Client')
  ])

  autoTable(doc, {
    startY: afterKpiY,
    head: headers,
    body: body,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.8,
      lineColor: THEME.borderGold,
      lineWidth: 0.2,
      textColor: THEME.charcoal
    },
    headStyles: {
      fillColor: THEME.maroon,
      textColor: THEME.goldLight,
      fontStyle: 'bold',
      fontSize: 8.5
    },
    alternateRowStyles: {
      fillColor: THEME.ivory
    }
  })

  setupPageDecorations(doc, logoData, {})
  doc.save(`agvia_patrons_directory_${formatDateStamp()}.pdf`)
}

/**
 * Export Couture Silhouettes / Products PDF
 */
export async function exportProductsPDF(products = []) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const logoData = await loadLogoBase64()

  const startY = drawDocumentHeader(doc, logoData, {
    title: 'Haute Couture Silhouette Catalog',
    subtitle: 'Active Luxury Garment Silhouettes, Pricing, and Stock Status',
    documentId: `CAT-${Date.now().toString().slice(-6)}`
  })

  const totalStock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0)
  const lowStock = products.filter(p => Number(p.stock || 0) <= 10).length

  const afterKpiY = drawKpiBoxes(doc, startY, [
    { label: 'Total Silhouettes', value: products.length },
    { label: 'Inventory in Stock', value: `${totalStock} units` },
    { label: 'Low Stock Alerts', value: lowStock }
  ])

  const headers = [['SKU', 'SILHOUETTE NAME', 'LINE / CATEGORY', 'PRICE (INR)', 'OFFER', 'STOCK']]
  const body = products.map(p => [
    p.sku || `AGV-${p.id}`,
    p.name || 'Silhouette',
    p.category || 'Couture',
    `₹${Number(p.price || 0).toLocaleString('en-IN')}`,
    p.discountPrice ? `₹${Number(p.discountPrice).toLocaleString('en-IN')}` : '—',
    `${p.stock || 0} in stock`
  ])

  autoTable(doc, {
    startY: afterKpiY,
    head: headers,
    body: body,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.8,
      lineColor: THEME.borderGold,
      lineWidth: 0.2,
      textColor: THEME.charcoal
    },
    headStyles: {
      fillColor: THEME.maroon,
      textColor: THEME.goldLight,
      fontStyle: 'bold',
      fontSize: 8.5
    },
    alternateRowStyles: {
      fillColor: THEME.ivory
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = parseInt(data.cell.raw, 10)
        if (val <= 10) {
          data.cell.styles.textColor = THEME.red
          data.cell.styles.fontStyle = 'bold'
        }
      }
    }
  })

  setupPageDecorations(doc, logoData, {})
  doc.save(`agvia_couture_collection_${formatDateStamp()}.pdf`)
}

/**
 * Export Inventory PDF
 */
export async function exportInventoryPDF(inventory = []) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const logoData = await loadLogoBase64()

  const startY = drawDocumentHeader(doc, logoData, {
    title: 'Fabric & Atelier Stock Audit',
    subtitle: 'Inventory Level Tracking and Re-order Health Status',
    documentId: `INV-${Date.now().toString().slice(-6)}`
  })

  const lowStockCount = inventory.filter(i => Number(i.stock || 0) <= 10).length

  const afterKpiY = drawKpiBoxes(doc, startY, [
    { label: 'Audited Items', value: inventory.length },
    { label: 'Low Stock Flagged', value: lowStockCount },
    { label: 'Audit Status', value: lowStockCount === 0 ? 'Optimal' : 'Attention Required' }
  ])

  const headers = [['SKU IDENTIFIER', 'SILHOUETTE NAME', 'COUTURE LINE', 'QUANTITY', 'HEALTH STATUS']]
  const body = inventory.map(i => [
    i.sku || `AGV-${i.id}`,
    i.name || 'Garment Piece',
    i.category || 'Atelier',
    `${i.stock} ${i.unit || 'piece'}`,
    Number(i.stock) <= 10 ? 'LOW STOCK ALERT' : 'OPTIMAL INVENTORY'
  ])

  autoTable(doc, {
    startY: afterKpiY,
    head: headers,
    body: body,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      lineColor: THEME.borderGold,
      lineWidth: 0.2,
      textColor: THEME.charcoal
    },
    headStyles: {
      fillColor: THEME.maroon,
      textColor: THEME.goldLight,
      fontStyle: 'bold',
      fontSize: 8.5
    },
    alternateRowStyles: {
      fillColor: THEME.ivory
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        if (data.cell.raw.includes('ALERT')) {
          data.cell.styles.textColor = THEME.red
          data.cell.styles.fontStyle = 'bold'
        } else {
          data.cell.styles.textColor = THEME.green
        }
      }
    }
  })

  setupPageDecorations(doc, logoData, {})
  doc.save(`agvia_fabric_inventory_${formatDateStamp()}.pdf`)
}

/**
 * Export Privilege Codes / Coupons PDF
 */
export async function exportCouponsPDF(coupons = []) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const logoData = await loadLogoBase64()

  const startY = drawDocumentHeader(doc, logoData, {
    title: 'Atelier Privilege Codes & Campaigns',
    subtitle: 'Active Promotional Codes, Discount Tariffs, and Expiry Dates',
    documentId: `CPN-${Date.now().toString().slice(-6)}`
  })

  const headers = [['CODE', 'CAMPAIGN TITLE', 'BENEFIT', 'MIN SPEND', 'VALID UNTIL', 'STATUS']]
  const body = coupons.map(c => [
    c.code,
    c.title,
    c.discount || `${c.discountValue}% OFF`,
    c.minOrderAmount ? `₹${c.minOrderAmount}` : 'None',
    c.expires || 'No Expiry',
    c.active ? 'ACTIVE' : 'PAUSED'
  ])

  autoTable(doc, {
    startY: startY + 4,
    head: headers,
    body: body,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.8,
      lineColor: THEME.borderGold,
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: THEME.maroon,
      textColor: THEME.goldLight,
      fontStyle: 'bold',
      fontSize: 8.5
    },
    alternateRowStyles: {
      fillColor: THEME.ivory
    }
  })

  setupPageDecorations(doc, logoData, {})
  doc.save(`agvia_privilege_codes_${formatDateStamp()}.pdf`)
}

/**
 * Export Subscriptions PDF
 */
export async function exportSubscriptionsPDF(subscriptions = []) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const logoData = await loadLogoBase64()

  const startY = drawDocumentHeader(doc, logoData, {
    title: 'Atelier Circle VIP Memberships Register',
    subtitle: 'VIP Patrons, Membership Tiers, Validity, and Benefit Tariffs',
    documentId: `VIP-${Date.now().toString().slice(-6)}`
  })

  const headers = [['ID', 'PATRON NAME', 'EMAIL', 'PHONE', 'CIRCLE PLAN', 'TIER', 'FEE (INR)', 'STATUS', 'VALIDITY']]
  const body = subscriptions.map(s => [
    s.id,
    s.customerName || 'VIP Member',
    s.email,
    s.customerPhone || '—',
    s.planName || 'AGVIA VIP',
    s.planTier || 'VIP',
    `₹${s.amount || 299}`,
    s.status || 'ACTIVE',
    s.endDate ? new Date(s.endDate).toLocaleDateString('en-IN') : '1 Year'
  ])

  autoTable(doc, {
    startY: startY + 4,
    head: headers,
    body: body,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.5,
      lineColor: THEME.borderGold,
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: THEME.maroon,
      textColor: THEME.goldLight,
      fontStyle: 'bold',
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: THEME.ivory
    }
  })

  setupPageDecorations(doc, logoData, {})
  doc.save(`agvia_vip_subscriptions_${formatDateStamp()}.pdf`)
}

/**
 * Export Calendar Date-Wise Analytics PDF Report
 */
export async function exportAnalyticsPDF({ startDate, endDate, summary = {}, dailyTrend = [], orders = [] }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const logoData = await loadLogoBase64()

  const dateRangeStr = `${new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} to ${new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`

  const startY = drawDocumentHeader(doc, logoData, {
    title: 'Calendar Analytics & Revenue Intelligence',
    subtitle: 'Haute Couture Sales Trajectory, Order Velocity, and Atelier Performance',
    dateRange: dateRangeStr,
    documentId: `ANL-${Date.now().toString().slice(-6)}`
  })

  // Executive KPI tiles
  const afterKpiY = drawKpiBoxes(doc, startY, [
    { label: 'Window Revenue', value: `₹${Number(summary.totalRevenue || 0).toLocaleString('en-IN')}` },
    { label: 'Window Orders', value: summary.totalOrders || 0 },
    { label: 'Avg Order Value', value: `₹${Number(summary.aov || 0).toLocaleString('en-IN')}` },
    { label: 'Delivered', value: summary.deliveredOrders || 0 }
  ])

  // Daily Trend Table Section
  doc.setFont('times', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...THEME.maroon)
  doc.text('I. CALENDAR WINDOW DAILY PERFORMANCE', 14, afterKpiY + 4)

  const trendHeaders = [['TIMEFRAME', 'SALES REVENUE (INR)', 'ORDERS RECORDED', 'AVERAGE TICKET (INR)']]
  const trendBody = (dailyTrend || []).map(t => {
    const rev = Number(t.sales || t.revenue || 0)
    const cnt = Number(t.orders || 1)
    const avg = Math.round(rev / (cnt || 1))
    return [
      t.month || t.date || 'Day',
      `₹${rev.toLocaleString('en-IN')}`,
      cnt,
      `₹${avg.toLocaleString('en-IN')}`
    ]
  })

  autoTable(doc, {
    startY: afterKpiY + 7,
    head: trendHeaders,
    body: trendBody.slice(0, 31), // Up to 31 rows on first table
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: THEME.borderGold,
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: THEME.maroon,
      textColor: THEME.goldLight,
      fontStyle: 'bold',
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: THEME.ivory
    }
  })

  // If there are detailed orders in the window, add them as section II
  if (orders && orders.length > 0) {
    const nextY = doc.lastAutoTable.finalY + 8
    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...THEME.maroon)
    doc.text('II. ATELIER BOOKINGS LOGGED IN THIS CALENDAR WINDOW', 14, nextY)

    const orderHeaders = [['ORDER ID', 'PATRON', 'DATE', 'BILLING TOTAL (INR)', 'STATUS', 'PAYMENT']]
    const orderBody = orders.slice(0, 50).map(o => [
      o.orderNumber || `#${o.id}`,
      o.customer || 'Patron',
      o.date || o.createdAt?.split('T')[0] || '—',
      `₹${Number(o.total || o.finalAmount || 0).toLocaleString('en-IN')}`,
      String(o.status || 'CONFIRMED').toUpperCase(),
      String(o.payment || 'PAID').toUpperCase()
    ])

    autoTable(doc, {
      startY: nextY + 3,
      head: orderHeaders,
      body: orderBody,
      margin: { left: 14, right: 14, bottom: 16 },
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 2.2,
        lineColor: THEME.borderGold,
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: THEME.maroonDark,
        textColor: THEME.goldLight,
        fontStyle: 'bold',
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: THEME.ivory
      }
    })
  }

  setupPageDecorations(doc, logoData, {})
  doc.save(`agvia_analytics_report_${startDate}_to_${endDate}.pdf`)
}

/**
 * Generic Table to Luxury PDF Exporter
 */
export async function exportTableToPDF(columns = [], rows = [], title = 'Atelier Report', filename = 'agvia_report') {
  const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })
  const logoData = await loadLogoBase64()

  const startY = drawDocumentHeader(doc, logoData, {
    title: title,
    subtitle: `Total Records Logged: ${rows.length}`,
    documentId: `DOC-${Date.now().toString().slice(-6)}`
  })

  const headers = [columns.map(c => c.label.toUpperCase())]
  const body = rows.map(r => {
    return columns.map(c => {
      let val = r[c.key]
      if (c.getter && typeof c.getter === 'function') {
        val = c.getter(r)
      } else if (val === null || val === undefined) {
        val = '—'
      } else if (typeof val === 'object') {
        val = JSON.stringify(val)
      }
      return String(val)
    })
  })

  autoTable(doc, {
    startY: startY + 4,
    head: headers,
    body: body,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: columns.length > 6 ? 7.5 : 8,
      cellPadding: 2.6,
      lineColor: THEME.borderGold,
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: THEME.maroon,
      textColor: THEME.goldLight,
      fontStyle: 'bold',
      fontSize: columns.length > 6 ? 8 : 8.5
    },
    alternateRowStyles: {
      fillColor: THEME.ivory
    }
  })

  setupPageDecorations(doc, logoData, {})
  doc.save(`${filename}_${formatDateStamp()}.pdf`)
}

function formatDateStamp() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}
