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
 * Export Master Atelier Enterprise Dossier (All Admin Panel Lists & Intelligence)
 * Consolidates all 9 admin registries into an official luxury audit document:
 *  - Executive KPI summary
 *  - Section I: Website Intelligence & Telemetry (Traffic, Funnel, Devices, Sources)
 *  - Section II: Atelier Orders & Storefront Transactions (Complete List)
 *  - Section III: Patrons & Clientele Directory (Complete List)
 *  - Section IV: Haute Couture Silhouettes Catalog (Complete List)
 *  - Section V: Fabric & Stock Inventory Audit (Complete List)
 *  - Section VI: Collections & Categories Architecture (Complete List)
 *  - Section VII: Privilege Codes & Discount Campaigns (Complete List)
 *  - Section VIII: Atelier Circle VIP Membership Registry (Complete List)
 *  - Section IX: Patron Reviews & Testimonials (Complete List)
 */
export async function exportMasterAdminPDF({
  startDate,
  endDate,
  overview = {},
  trends = [],
  funnel = null,
  topProducts = [],
  topPages = [],
  devices = [],
  sources = [],
  recentActivity = [],
  orders = [],
  customers = [],
  products = [],
  inventory = [],
  categories = [],
  coupons = [],
  subscriptions = [],
  reviews = [],
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const logoData = await loadLogoBase64()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const dateRangeStr = (startDate && endDate)
    ? `${new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} to ${new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : `Full Atelier Records as of ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`

  const startY = drawDocumentHeader(doc, logoData, {
    title: 'Master Atelier Enterprise Dossier',
    subtitle: 'Comprehensive Executive Audit • Complete Admin Panel Registries & Business Intelligence',
    dateRange: dateRangeStr,
    documentId: `MST-${Date.now().toString().slice(-6)}`
  })

  // Executive KPI summary calculations
  const totalRevenue = overview.revenue || orders.reduce((sum, o) => sum + Number(o.total || o.finalAmount || 0), 0)
  const totalOrdersCount = orders.length || overview.orders || 0
  const totalPatronsCount = customers.length
  const totalProductsCount = products.length
  const totalVisitorsCount = overview.visitors || 0
  const overallConversion = funnel?.overallConversionRate ?? funnel?.overallConversionPct ?? 0

  const afterKpiY = drawKpiBoxes(doc, startY, [
    { label: 'Cumulative Revenue', value: `₹${Number(totalRevenue).toLocaleString('en-IN')}` },
    { label: 'Total Store Orders', value: totalOrdersCount },
    { label: 'Registered Patrons', value: totalPatronsCount },
    { label: 'Couture Silhouettes', value: totalProductsCount },
    { label: 'Audited Fabric Stock', value: inventory.length },
    { label: 'VIP Circle Patrons', value: subscriptions.length },
  ])

  // Helper function to safely render section title with auto-page-breaking
  const addSectionTitle = (title) => {
    const currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY : afterKpiY
    let y = currentY + 8
    if (y > pageHeight - 35) {
      doc.addPage()
      y = 20
    }
    doc.setFont('times', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(...THEME.maroon)
    doc.text(title, 14, y)

    doc.setDrawColor(...THEME.gold)
    doc.setLineWidth(0.3)
    doc.line(14, y + 1.5, pageWidth - 14, y + 1.5)
    return y + 4.5
  }

  const tableBaseStyles = {
    font: 'helvetica',
    fontSize: 7.5,
    cellPadding: 2.2,
    lineColor: THEME.borderGold,
    lineWidth: 0.2,
    textColor: THEME.charcoal
  }

  const tableHeadStyles = {
    fillColor: THEME.maroon,
    textColor: THEME.goldLight,
    fontStyle: 'bold',
    fontSize: 8
  }

  // ── SECTION I: WEBSITE INTELLIGENCE & FUNNEL TELEMETRY ──
  const sec1Y = addSectionTitle('I. REAL-TIME WEBSITE INTELLIGENCE & CONVERSION FUNNEL')
  const funnelStages = [
    ['Discovery / Traffic', 'Unique Anonymous Visitors', Number(totalVisitorsCount).toLocaleString('en-IN'), '100% Top of Funnel'],
    ['Catalog Interest', 'Couture Silhouette Views', Number(overview.productViews || 0).toLocaleString('en-IN'), `${funnel?.productViewRate ?? funnel?.visitorsToViewsPct ?? 0}% Catalog Views`],
    ['Purchase Intent', 'Silhouettes Added to Bag', Number(overview.addToCart || 0).toLocaleString('en-IN'), `${funnel?.cartRate ?? funnel?.viewsToCartPct ?? 0}% Bag Rate`],
    ['Order Initiation', 'Checkout Workflows Started', Number(overview.checkouts || funnel?.checkoutStarted || 0).toLocaleString('en-IN'), `${funnel?.checkoutRate ?? funnel?.cartToCheckoutsPct ?? 0}% Checkout Rate`],
    ['Completed Purchases', 'Verified Storefront Orders', Number(totalOrdersCount).toLocaleString('en-IN'), `${overallConversion}% Conversion Rate`]
  ]

  autoTable(doc, {
    startY: sec1Y,
    head: [['FUNNEL STAGE', 'METRIC / ACTIVITY', 'VOLUME RECORDED', 'CONVERSION EFFICIENCY']],
    body: funnelStages,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: tableBaseStyles,
    headStyles: tableHeadStyles,
    alternateRowStyles: { fillColor: THEME.ivory }
  })

  // ── SECTION II: CALENDAR WINDOW DAILY TRAFFIC & PERFORMANCE TRENDS ──
  if (trends && trends.length > 0) {
    const secTrendsY = addSectionTitle('II. CALENDAR WINDOW DAILY TRAFFIC & PERFORMANCE TRENDS')
    const trendRows = trends.map(t => [
      t.date || t.month || 'Day',
      Number(t.visitors || 0).toLocaleString('en-IN'),
      Number(t.pageViews || 0).toLocaleString('en-IN'),
      Number(t.productViews || 0).toLocaleString('en-IN'),
      Number(t.addToCart || 0).toLocaleString('en-IN'),
      Number(t.orders || 0).toLocaleString('en-IN'),
      `₹${Number(t.revenue || t.sales || 0).toLocaleString('en-IN')}`
    ])

    autoTable(doc, {
      startY: secTrendsY,
      head: [['DATE / TIMEFRAME', 'VISITORS', 'PAGE VIEWS', 'PRODUCT VIEWS', 'ADD TO CART', 'ORDERS', 'SALES REVENUE (INR)']],
      body: trendRows,
      margin: { left: 14, right: 14, bottom: 16 },
      theme: 'grid',
      styles: tableBaseStyles,
      headStyles: tableHeadStyles,
      alternateRowStyles: { fillColor: THEME.ivory }
    })
  }

  // ── SECTION III: DEVICE TELEMETRY & TRAFFIC SOURCES ──
  if ((devices && devices.length > 0) || (sources && sources.length > 0)) {
    const secDevY = addSectionTitle('III. CLIENT DEVICE TELEMETRY & ACQUISITION CHANNELS')
    const deviceBody = (devices || []).map(d => [
      d.deviceType || 'Device Category',
      Number(d.count || 0).toLocaleString('en-IN'),
      `${d.percentage || 0}% Share`,
      'Active Hardware Session'
    ])
    const sourceBody = (sources || []).map(s => [
      s.source || 'Direct Acquisition',
      Number(s.count || 0).toLocaleString('en-IN'),
      '—',
      'Inbound Traffic Channel'
    ])
    const combinedTelemetry = [...deviceBody, ...sourceBody]

    autoTable(doc, {
      startY: secDevY,
      head: [['TELEMETRY DIMENSION', 'SESSION / VISITOR COUNT', 'SHARE RATIO', 'CLASSIFICATION']],
      body: combinedTelemetry.length > 0 ? combinedTelemetry : [['No device or source data available.', '—', '—', '—']],
      margin: { left: 14, right: 14, bottom: 16 },
      theme: 'grid',
      styles: tableBaseStyles,
      headStyles: tableHeadStyles,
      alternateRowStyles: { fillColor: THEME.ivory }
    })
  }

  // ── SECTION IV: TOP VIEWED SILHOUETTES & PUBLIC ROUTES ──
  if ((topProducts && topProducts.length > 0) || (topPages && topPages.length > 0)) {
    const secTopY = addSectionTitle('IV. TOP VIEWED SILHOUETTES & CATALOG PAGES')
    const topProdRows = (topProducts || []).map(p => [
      'Silhouettes',
      p.productName || p.name || 'Couture Silhouette',
      p.sku || `AGV-${p.productId || p.id || '—'}`,
      Number(p.views || 0).toLocaleString('en-IN'),
      `${p.percentage || 0}%`
    ])
    const topPageRows = (topPages || []).map(pg => [
      'Page Route',
      pg.pagePath || '/',
      'Public Route',
      Number(pg.views || 0).toLocaleString('en-IN'),
      `${pg.percentage || 0}%`
    ])
    const combinedTop = [...topProdRows, ...topPageRows]

    autoTable(doc, {
      startY: secTopY,
      head: [['TYPE', 'CREATION / ROUTE NAME', 'IDENTIFIER / PATH', 'TOTAL VIEWS', 'CATALOG / ROUTE SHARE']],
      body: combinedTop.length > 0 ? combinedTop : [['No top pages or products logged.', '—', '—', '—', '—']],
      margin: { left: 14, right: 14, bottom: 16 },
      theme: 'grid',
      styles: tableBaseStyles,
      headStyles: tableHeadStyles,
      alternateRowStyles: { fillColor: THEME.ivory }
    })
  }

  // ── SECTION V: REAL-TIME AUDIT STREAM ──
  if (recentActivity && recentActivity.length > 0) {
    const secActY = addSectionTitle('V. REAL-TIME AUDIT STREAM & RECENT TELEMETRY EVENTS')
    const actRows = recentActivity.slice(0, 30).map(act => [
      act.createdAt || act.timestamp || 'Recent',
      String(act.eventType || 'EVENT').toUpperCase(),
      act.description || act.eventLabel || 'User Interaction',
      act.pagePath || '—',
      act.deviceType || '—'
    ])

    autoTable(doc, {
      startY: secActY,
      head: [['TIMESTAMP', 'EVENT TYPE', 'DESCRIPTION / CONTEXT', 'PAGE ROUTE', 'DEVICE']],
      body: actRows,
      margin: { left: 14, right: 14, bottom: 16 },
      theme: 'grid',
      styles: tableBaseStyles,
      headStyles: tableHeadStyles,
      alternateRowStyles: { fillColor: THEME.ivory }
    })
  }

  // ── SECTION VI: ATELIER ORDERS & TRANSACTIONS ──
  const sec2Y = addSectionTitle(`VI. ATELIER ORDERS & DISPATCH REGISTER (${orders.length} TOTAL TRANSACTIONS)`)
  const orderHeaders = [['ORDER ID', 'PATRON NAME', 'DATE', 'ITEMS', 'TOTAL (INR)', 'PAYMENT', 'DISPATCH STATUS', 'COUPON']]
  const orderBody = orders.length > 0
    ? orders.map(o => [
        o.orderNumber || `#${o.id}`,
        o.customer || 'Guest Patron',
        o.date || o.createdAt?.split('T')[0] || '—',
        `${o.items || (Array.isArray(o.orderItems) ? o.orderItems.length : 1)} pc(s)`,
        `₹${Number(o.total || o.finalAmount || 0).toLocaleString('en-IN')}`,
        String(o.payment || o.paymentMethod || 'PAID').toUpperCase(),
        String(o.status || 'PENDING').toUpperCase(),
        o.couponCode || 'None'
      ])
    : [['No orders recorded in current database.', '—', '—', '—', '—', '—', '—', '—']]

  autoTable(doc, {
    startY: sec2Y,
    head: orderHeaders,
    body: orderBody,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: tableBaseStyles,
    headStyles: tableHeadStyles,
    alternateRowStyles: { fillColor: THEME.ivory },
    didParseCell: (data) => {
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

  // ── SECTION VII: PATRONS & CLIENTELE DIRECTORY ──
  const sec3Y = addSectionTitle(`VII. PATRONS & CLIENTELE DIRECTORY (${customers.length} REGISTERED CLIENTS)`)
  const custHeaders = [['PATRON ID', 'FULL NAME', 'EMAIL ADDRESS', 'PHONE', 'LIFETIME ORDERS', 'TOTAL SPEND (INR)', 'MEMBERSHIP TIER']]
  const custBody = customers.length > 0
    ? customers.map(c => [
        `#${c.id}`,
        c.name || 'Patron',
        c.email || '—',
        c.phone || '—',
        c.orders ?? 0,
        `₹${Number(c.spent || 0).toLocaleString('en-IN')}`,
        (c.orders > 0 ? 'Active Patron' : 'New Client')
      ])
    : [['No registered patrons logged.', '—', '—', '—', '—', '—', '—']]

  autoTable(doc, {
    startY: sec3Y,
    head: custHeaders,
    body: custBody,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: tableBaseStyles,
    headStyles: tableHeadStyles,
    alternateRowStyles: { fillColor: THEME.ivory }
  })

  // ── SECTION VIII: HAUTE COUTURE SILHOUETTES & CATALOG ──
  const sec4Y = addSectionTitle(`VIII. HAUTE COUTURE SILHOUETTES & PRODUCT CATALOG (${products.length} CREATIONS)`)
  const prodHeaders = [['SKU', 'SILHOUETTE NAME', 'LINE / CATEGORY', 'ORIGINAL (INR)', 'OFFER PRICE (INR)', 'STOCK QUANTITY', 'STATUS']]
  const prodBody = products.length > 0
    ? products.map(p => [
        p.sku || `AGV-${p.id}`,
        p.name || 'Silhouette Creation',
        p.category || p.categoryName || 'Couture',
        `₹${Number(p.price || 0).toLocaleString('en-IN')}`,
        p.discountPrice ? `₹${Number(p.discountPrice).toLocaleString('en-IN')}` : '—',
        `${p.stock ?? p.stockQuantity ?? 0} in stock`,
        p.active !== false ? 'ACTIVE' : 'INACTIVE'
      ])
    : [['No products in catalog.', '—', '—', '—', '—', '—', '—']]

  autoTable(doc, {
    startY: sec4Y,
    head: prodHeaders,
    body: prodBody,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: tableBaseStyles,
    headStyles: tableHeadStyles,
    alternateRowStyles: { fillColor: THEME.ivory }
  })

  // ── SECTION IX: FABRIC & STOCK INVENTORY AUDIT ──
  const sec5Y = addSectionTitle(`IX. FABRIC & STOCK INVENTORY AUDIT (${inventory.length} AUDITED ITEMS)`)
  const invHeaders = [['SKU IDENTIFIER', 'SILHOUETTE NAME', 'CATEGORY / LINE', 'QUANTITY', 'HEALTH STATUS']]
  const invBody = inventory.length > 0
    ? inventory.map(i => [
        i.sku || `AGV-${i.id}`,
        i.name || 'Garment Piece',
        i.category || 'Atelier',
        `${i.stock ?? 0} ${i.unit || 'piece'}`,
        Number(i.stock ?? 0) <= 10 ? 'LOW STOCK ALERT' : 'OPTIMAL INVENTORY'
      ])
    : [['No inventory items recorded.', '—', '—', '—', '—']]

  autoTable(doc, {
    startY: sec5Y,
    head: invHeaders,
    body: invBody,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: tableBaseStyles,
    headStyles: tableHeadStyles,
    alternateRowStyles: { fillColor: THEME.ivory },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        if (String(data.cell.raw).includes('ALERT')) {
          data.cell.styles.textColor = THEME.red
          data.cell.styles.fontStyle = 'bold'
        } else {
          data.cell.styles.textColor = THEME.green
        }
      }
    }
  })

  // ── SECTION X: COLLECTIONS & CATEGORIES ──
  const sec6Y = addSectionTitle(`X. ATELIER COLLECTIONS & CATEGORY ARCHITECTURE (${categories.length} LINES)`)
  const catHeaders = [['ID', 'COLLECTION NAME', 'DESCRIPTION', 'STATUS']]
  const catBody = categories.length > 0
    ? categories.map(c => [
        `#${c.id}`,
        c.name || 'Collection Line',
        c.description || 'Exclusive handcrafted collection',
        c.active !== false ? 'ACTIVE' : 'INACTIVE'
      ])
    : [['No category lines created.', '—', '—', '—']]

  autoTable(doc, {
    startY: sec6Y,
    head: catHeaders,
    body: catBody,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: tableBaseStyles,
    headStyles: tableHeadStyles,
    alternateRowStyles: { fillColor: THEME.ivory }
  })

  // ── SECTION XI: PRIVILEGE CODES & DISCOUNT CAMPAIGNS ──
  const sec7Y = addSectionTitle(`XI. PRIVILEGE CODES & PROMOTIONAL CAMPAIGNS (${coupons.length} CODES)`)
  const cpnHeaders = [['CODE', 'CAMPAIGN TITLE', 'DISCOUNT BENEFIT', 'MIN SPEND (INR)', 'VALIDITY', 'STATUS']]
  const cpnBody = coupons.length > 0
    ? coupons.map(c => [
        c.code,
        c.title || c.code,
        c.discount || (c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`),
        c.minOrderAmount ? `₹${c.minOrderAmount}` : 'None',
        c.expires || 'No Expiry',
        c.active ? 'ACTIVE' : 'PAUSED'
      ])
    : [['No privilege coupons configured.', '—', '—', '—', '—', '—']]

  autoTable(doc, {
    startY: sec7Y,
    head: cpnHeaders,
    body: cpnBody,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: tableBaseStyles,
    headStyles: tableHeadStyles,
    alternateRowStyles: { fillColor: THEME.ivory }
  })

  // ── SECTION XII: ATELIER CIRCLE VIP MEMBERSHIPS ──
  const sec8Y = addSectionTitle(`XII. ATELIER CIRCLE VIP MEMBERSHIP REGISTER (${subscriptions.length} VIP PATRONS)`)
  const subHeaders = [['ID', 'PATRON NAME', 'EMAIL ADDRESS', 'PHONE', 'CIRCLE PLAN', 'TIER', 'FEE (INR)', 'STATUS', 'VALIDITY']]
  const subBody = subscriptions.length > 0
    ? subscriptions.map(s => [
        `#${s.id}`,
        s.customerName || 'VIP Member',
        s.email || '—',
        s.customerPhone || '—',
        s.planName || 'AGVIA VIP',
        s.planTier || 'VIP',
        `₹${s.amount || 299}`,
        s.status || 'ACTIVE',
        s.endDate ? new Date(s.endDate).toLocaleDateString('en-IN') : 'Annual'
      ])
    : [['No VIP circle memberships active.', '—', '—', '—', '—', '—', '—', '—', '—']]

  autoTable(doc, {
    startY: sec8Y,
    head: subHeaders,
    body: subBody,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: tableBaseStyles,
    headStyles: tableHeadStyles,
    alternateRowStyles: { fillColor: THEME.ivory }
  })

  // ── SECTION XIII: PATRON REVIEWS & RATINGS ──
  const sec9Y = addSectionTitle(`XIII. PATRON REVIEWS & TESTIMONIALS (${reviews.length} REVIEWS)`)
  const revHeaders = [['PRODUCT / SILHOUETTE', 'PATRON NAME', 'RATING', 'PATRON FEEDBACK', 'DATE']]
  const revBody = reviews.length > 0
    ? reviews.map(r => [
        r.product || r.productName || 'Couture Garment',
        r.customer || r.customerName || 'Valued Patron',
        `${r.rating || 5} / 5 ★`,
        r.comment || 'Verified purchase feedback',
        r.date || r.createdAt?.split('T')[0] || '—'
      ])
    : [['No customer reviews logged yet.', '—', '—', '—', '—']]

  autoTable(doc, {
    startY: sec9Y,
    head: revHeaders,
    body: revBody,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: tableBaseStyles,
    headStyles: tableHeadStyles,
    alternateRowStyles: { fillColor: THEME.ivory }
  })

  setupPageDecorations(doc, logoData, {})
  doc.save(`agvia_master_atelier_dossier_${formatDateStamp()}.pdf`)
}

/**
 * Export Comprehensive Website Analytics PDF Report
 */
export async function exportAnalyticsPDF({
  startDate,
  endDate,
  overview = {},
  summary = {},
  trends = [],
  dailyTrend = [],
  funnel = null,
  devices = [],
  sources = [],
  topPages = [],
  topProducts = [],
  recentActivity = [],
  orders = [],
  filteredOrders = []
}) {
  const actualOrders = (orders && orders.length > 0) ? orders : (filteredOrders || [])
  const actualTrends = (trends && trends.length > 0) ? trends : (dailyTrend || [])
  const totalRevenue = overview.revenue || summary.totalRevenue || actualOrders.reduce((sum, o) => sum + Number(o.total || o.finalAmount || 0), 0)
  const totalOrdersCount = overview.orders || summary.totalOrders || actualOrders.length || 0
  const totalVisitorsCount = overview.visitors || 0
  const overallConversion = funnel?.overallConversionRate ?? funnel?.overallConversionPct ?? 0

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const logoData = await loadLogoBase64()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const dateRangeStr = (startDate && endDate)
    ? `${new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} to ${new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : `Lifetime Telemetry as of ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`

  const startY = drawDocumentHeader(doc, logoData, {
    title: 'Website Analytics & Performance Dossier',
    subtitle: 'Comprehensive Web Telemetry • E-Commerce Funnel • Traffic Acquisition • Device Intelligence',
    dateRange: dateRangeStr,
    documentId: `ANL-${Date.now().toString().slice(-6)}`
  })

  // Executive KPI summary boxes
  const afterKpiY = drawKpiBoxes(doc, startY, [
    { label: 'Window Revenue', value: `₹${Number(totalRevenue).toLocaleString('en-IN')}` },
    { label: 'Verified Orders', value: totalOrdersCount },
    { label: 'Unique Visitors', value: Number(totalVisitorsCount).toLocaleString('en-IN') },
    { label: 'Public Page Views', value: Number(overview.pageViews || 0).toLocaleString('en-IN') },
    { label: 'Silhouette Views', value: Number(overview.productViews || 0).toLocaleString('en-IN') },
    { label: 'Funnel Conversion', value: `${overallConversion}%` },
  ])

  // Helper for section title
  const addSectionTitle = (title) => {
    const currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY : afterKpiY
    let y = currentY + 8
    if (y > pageHeight - 35) {
      doc.addPage()
      y = 20
    }
    doc.setFont('times', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(...THEME.maroon)
    doc.text(title, 14, y)

    doc.setDrawColor(...THEME.gold)
    doc.setLineWidth(0.3)
    doc.line(14, y + 1.5, pageWidth - 14, y + 1.5)
    return y + 4.5
  }

  const tableBaseStyles = {
    font: 'helvetica',
    fontSize: 7.5,
    cellPadding: 2.2,
    lineColor: THEME.borderGold,
    lineWidth: 0.2,
    textColor: THEME.charcoal
  }

  const tableHeadStyles = {
    fillColor: THEME.maroon,
    textColor: THEME.goldLight,
    fontStyle: 'bold',
    fontSize: 8
  }

  // ── SECTION I: CONVERSION FUNNEL METRICS ──
  const sec1Y = addSectionTitle('I. E-COMMERCE CONVERSION FUNNEL & VISITOR PROGRESSION')
  const funnelStages = [
    ['Discovery / Traffic', 'Unique Anonymous Visitors', Number(totalVisitorsCount).toLocaleString('en-IN'), '100% Top of Funnel'],
    ['Catalog Interest', 'Couture Detail Views', Number(overview.productViews || 0).toLocaleString('en-IN'), `${funnel?.productViewRate ?? funnel?.visitorsToViewsPct ?? 0}% Catalog Views`],
    ['Purchase Intent', 'Silhouettes Added to Bag', Number(overview.addToCart || 0).toLocaleString('en-IN'), `${funnel?.cartRate ?? funnel?.viewsToCartPct ?? 0}% Bag Rate`],
    ['Order Initiation', 'Checkout Workflows Started', Number(overview.checkouts || funnel?.checkoutStarted || 0).toLocaleString('en-IN'), `${funnel?.checkoutRate ?? funnel?.cartToCheckoutsPct ?? 0}% Checkout Rate`],
    ['Completed Purchases', 'Verified Storefront Orders', Number(totalOrdersCount).toLocaleString('en-IN'), `${overallConversion}% Conversion Rate`]
  ]

  autoTable(doc, {
    startY: sec1Y,
    head: [['FUNNEL STAGE', 'METRIC / ACTIVITY', 'VOLUME RECORDED', 'CONVERSION EFFICIENCY']],
    body: funnelStages,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: tableBaseStyles,
    headStyles: tableHeadStyles,
    alternateRowStyles: { fillColor: THEME.ivory }
  })

  // ── SECTION II: DAILY TRAFFIC & PERFORMANCE TRENDS ──
  if (actualTrends && actualTrends.length > 0) {
    const secTrendsY = addSectionTitle('II. CALENDAR WINDOW DAILY TRAFFIC & COMMERCE TRENDS')
    const trendRows = actualTrends.map(t => [
      t.date || t.month || 'Day',
      Number(t.visitors || 0).toLocaleString('en-IN'),
      Number(t.pageViews || 0).toLocaleString('en-IN'),
      Number(t.productViews || 0).toLocaleString('en-IN'),
      Number(t.addToCart || 0).toLocaleString('en-IN'),
      Number(t.orders || 0).toLocaleString('en-IN'),
      `₹${Number(t.revenue || t.sales || 0).toLocaleString('en-IN')}`
    ])

    autoTable(doc, {
      startY: secTrendsY,
      head: [['DATE / TIMEFRAME', 'VISITORS', 'PAGE VIEWS', 'PRODUCT VIEWS', 'ADD TO CART', 'ORDERS', 'SALES REVENUE (INR)']],
      body: trendRows,
      margin: { left: 14, right: 14, bottom: 16 },
      theme: 'grid',
      styles: tableBaseStyles,
      headStyles: tableHeadStyles,
      alternateRowStyles: { fillColor: THEME.ivory }
    })
  }

  // ── SECTION III: DEVICE TELEMETRY & ACQUISITION CHANNELS ──
  if ((devices && devices.length > 0) || (sources && sources.length > 0)) {
    const secDevY = addSectionTitle('III. CLIENT HARDWARE TELEMETRY & TRAFFIC ACQUISITION')
    const deviceBody = (devices || []).map(d => [
      'Device Distribution',
      d.deviceType || 'Hardware',
      Number(d.count || 0).toLocaleString('en-IN'),
      `${d.percentage || 0}% Share`
    ])
    const sourceBody = (sources || []).map(s => [
      'Traffic Acquisition',
      s.source || 'Direct Acquisition',
      Number(s.count || 0).toLocaleString('en-IN'),
      'Inbound Channel'
    ])
    const combined = [...deviceBody, ...sourceBody]

    autoTable(doc, {
      startY: secDevY,
      head: [['CATEGORY', 'CHANNEL / HARDWARE', 'RECORDED SESSIONS', 'SHARE RATIO']],
      body: combined.length > 0 ? combined : [['No hardware or traffic source records.', '—', '—', '—']],
      margin: { left: 14, right: 14, bottom: 16 },
      theme: 'grid',
      styles: tableBaseStyles,
      headStyles: tableHeadStyles,
      alternateRowStyles: { fillColor: THEME.ivory }
    })
  }

  // ── SECTION IV: TOP VIEWED SILHOUETTES & STORE ROUTES ──
  if ((topProducts && topProducts.length > 0) || (topPages && topPages.length > 0)) {
    const secTopY = addSectionTitle('IV. TOP VIEWED SILHOUETTES & CATALOG ROUTES')
    const topProdRows = (topProducts || []).map(p => [
      'Silhouettes',
      p.productName || p.name || 'Couture Silhouette',
      p.sku || `AGV-${p.productId || p.id || '—'}`,
      Number(p.views || 0).toLocaleString('en-IN'),
      `${p.percentage || 0}%`
    ])
    const topPageRows = (topPages || []).map(pg => [
      'Store Routes',
      pg.pagePath || '/',
      'Public Route',
      Number(pg.views || 0).toLocaleString('en-IN'),
      `${pg.percentage || 0}%`
    ])
    const combinedTop = [...topProdRows, ...topPageRows]

    autoTable(doc, {
      startY: secTopY,
      head: [['TYPE', 'CREATION / ROUTE NAME', 'IDENTIFIER / PATH', 'TOTAL VIEWS', 'TRAFFIC SHARE']],
      body: combinedTop.length > 0 ? combinedTop : [['No top pages or products logged.', '—', '—', '—', '—']],
      margin: { left: 14, right: 14, bottom: 16 },
      theme: 'grid',
      styles: tableBaseStyles,
      headStyles: tableHeadStyles,
      alternateRowStyles: { fillColor: THEME.ivory }
    })
  }

  // ── SECTION V: RECENT TELEMETRY AUDIT STREAM ──
  if (recentActivity && recentActivity.length > 0) {
    const secActY = addSectionTitle('V. REAL-TIME EVENT STREAM & AUDIT TELEMETRY')
    const actRows = recentActivity.slice(0, 30).map(act => [
      act.createdAt || act.timestamp || 'Recent',
      String(act.eventType || 'EVENT').toUpperCase(),
      act.description || act.eventLabel || 'User Interaction',
      act.pagePath || '—',
      act.deviceType || '—'
    ])

    autoTable(doc, {
      startY: secActY,
      head: [['TIMESTAMP', 'EVENT TYPE', 'DESCRIPTION / CONTEXT', 'PAGE ROUTE', 'DEVICE']],
      body: actRows,
      margin: { left: 14, right: 14, bottom: 16 },
      theme: 'grid',
      styles: tableBaseStyles,
      headStyles: tableHeadStyles,
      alternateRowStyles: { fillColor: THEME.ivory }
    })
  }

  // ── SECTION VI: ORDERS LOGGED IN CALENDAR WINDOW ──
  if (actualOrders && actualOrders.length > 0) {
    const secOrdY = addSectionTitle(`VI. VERIFIED STORE TRANSACTIONS IN CALENDAR WINDOW (${actualOrders.length} ORDERS)`)
    const orderHeaders = [['ORDER ID', 'PATRON', 'DATE', 'ITEMS', 'TOTAL (INR)', 'STATUS', 'PAYMENT']]
    const orderBody = actualOrders.slice(0, 60).map(o => [
      o.orderNumber || `#${o.id}`,
      o.customer || 'Patron',
      o.date || o.createdAt?.split('T')[0] || '—',
      `${o.items || (Array.isArray(o.orderItems) ? o.orderItems.length : 1)} pc(s)`,
      `₹${Number(o.total || o.finalAmount || 0).toLocaleString('en-IN')}`,
      String(o.status || 'CONFIRMED').toUpperCase(),
      String(o.payment || o.paymentMethod || 'PAID').toUpperCase()
    ])

    autoTable(doc, {
      startY: secOrdY,
      head: orderHeaders,
      body: orderBody,
      margin: { left: 14, right: 14, bottom: 16 },
      theme: 'grid',
      styles: tableBaseStyles,
      headStyles: {
        fillColor: THEME.maroonDark,
        textColor: THEME.goldLight,
        fontStyle: 'bold',
        fontSize: 8
      },
      alternateRowStyles: { fillColor: THEME.ivory }
    })
  }

  setupPageDecorations(doc, logoData, {})
  doc.save(`agvia_website_analytics_${startDate}_to_${endDate}.pdf`)
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
