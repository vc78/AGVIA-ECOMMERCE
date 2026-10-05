import * as XLSX from 'xlsx'

/**
 * Generates and downloads the official AGVIA_ORDERS.xlsx luxury workbook.
 * Contains 3 dedicated sheets:
 * 1. Orders Master
 * 2. Order Line Items
 * 3. Payments Ledger
 * 
 * Works seamlessly in real time directly from active order data.
 */
export function generateAndDownloadOrdersExcel(orders = []) {
  if (!orders || orders.length === 0) {
    throw new Error('No orders available to compile AGVIA_ORDERS.xlsx.')
  }

  // ── Sheet 1: Orders Master ──────────────────────────────────────────────────
  const masterRows = orders.map((o) => ({
    'Order ID': o.orderNumber || `#${o.id}`,
    'Placement Date': o.date || (o.createdAt ? o.createdAt.split('T')[0] : 'N/A'),
    'Patron Name': o.customer || o.userName || 'Valued Patron',
    'Patron Email': o.userEmail || o.email || 'N/A',
    'Contact Phone': o.contactPhone || o.phone || 'N/A',
    'Pieces Count': o.items || (Array.isArray(o.itemsList) ? o.itemsList.length : 1),
    'Subtotal (INR)': Number(o.subtotal || o.total || 0),
    'Discount (INR)': Number(o.discountAmount || 0),
    'Final Total (INR)': Number(o.finalAmount || o.total || 0),
    'Coupon Code': o.couponCode || 'NONE',
    'Payment Method': o.paymentMethod || 'COD',
    'Payment Status': o.paymentStatus || o.payment || 'PENDING',
    'Order Status': o.status || 'PENDING',
    'Shipping Address': o.shippingAddress || 'N/A',
    'Order Notes': o.notes || ''
  }))

  const wsOrders = XLSX.utils.json_to_sheet(masterRows)

  // Auto column widths
  wsOrders['!cols'] = [
    { wch: 18 }, // Order ID
    { wch: 16 }, // Date
    { wch: 22 }, // Patron Name
    { wch: 28 }, // Patron Email
    { wch: 18 }, // Phone
    { wch: 14 }, // Pieces
    { wch: 16 }, // Subtotal
    { wch: 16 }, // Discount
    { wch: 18 }, // Final Total
    { wch: 16 }, // Coupon
    { wch: 16 }, // Payment Method
    { wch: 16 }, // Payment Status
    { wch: 16 }, // Order Status
    { wch: 35 }, // Address
    { wch: 25 }  // Notes
  ]

  // ── Sheet 2: Order Line Items ───────────────────────────────────────────────
  const itemRows = []
  orders.forEach((o) => {
    const trackingRef = o.orderNumber || `#${o.id}`
    const orderDate = o.date || (o.createdAt ? o.createdAt.split('T')[0] : 'N/A')

    if (Array.isArray(o.itemsList) && o.itemsList.length > 0) {
      o.itemsList.forEach((it) => {
        itemRows.push({
          'Order ID': trackingRef,
          'Placement Date': orderDate,
          'Product / Silhouette': it.productName || it.name || 'Couture Silhouette',
          'SKU Identifier': it.product?.sku || it.sku || 'N/A',
          'Unit Price (INR)': Number(it.price || 0),
          'Quantity': Number(it.quantity || 1),
          'Line Total (INR)': Number(it.subtotal || ((it.price || 0) * (it.quantity || 1)))
        })
      })
    } else {
      // Default single row if line items not expanded
      itemRows.push({
        'Order ID': trackingRef,
        'Placement Date': orderDate,
        'Product / Silhouette': 'AGVIA Atelier Ensemble',
        'SKU Identifier': 'AGV-ENS-01',
        'Unit Price (INR)': Number(o.finalAmount || o.total || 0),
        'Quantity': Number(o.items || 1),
        'Line Total (INR)': Number(o.finalAmount || o.total || 0)
      })
    }
  })

  const wsItems = XLSX.utils.json_to_sheet(itemRows)
  wsItems['!cols'] = [
    { wch: 18 }, // Order ID
    { wch: 16 }, // Date
    { wch: 30 }, // Product
    { wch: 18 }, // SKU
    { wch: 16 }, // Price
    { wch: 12 }, // Qty
    { wch: 16 }  // Subtotal
  ]

  // ── Sheet 3: Payments Ledger ───────────────────────────────────────────────
  const paymentRows = orders.map((o) => ({
    'Order ID': o.orderNumber || `#${o.id}`,
    'Payment Method': o.paymentMethod || 'COD',
    'Gateway Order ID': o.razorpayOrderId || 'N/A',
    'Gateway Payment ID': o.razorpayPaymentId || 'N/A',
    'Payment Status': o.paymentStatus || o.payment || 'PENDING',
    'Amount Paid (INR)': Number(o.finalAmount || o.total || 0),
    'Currency': 'INR',
    'Transaction Date': o.date || (o.createdAt ? o.createdAt.split('T')[0] : 'N/A')
  }))

  const wsPayments = XLSX.utils.json_to_sheet(paymentRows)
  wsPayments['!cols'] = [
    { wch: 18 },
    { wch: 16 },
    { wch: 24 },
    { wch: 24 },
    { wch: 16 },
    { wch: 18 },
    { wch: 10 },
    { wch: 18 }
  ]

  // Assemble Workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, wsOrders, 'Orders Master')
  XLSX.utils.book_append_sheet(workbook, wsItems, 'Order Line Items')
  XLSX.utils.book_append_sheet(workbook, wsPayments, 'Payments Ledger')

  // Write and trigger download
  XLSX.writeFile(workbook, 'AGVIA_ORDERS.xlsx')
  return true
}
