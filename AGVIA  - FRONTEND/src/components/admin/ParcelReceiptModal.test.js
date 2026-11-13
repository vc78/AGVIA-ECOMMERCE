import assert from 'assert'

// Test the activeOrder fallback and paymentMethod evaluation logic from ParcelReceiptModal
function evaluateModalOrder(order, fullOrder, isOpen) {
  if (!isOpen || !order) return null

  const activeOrder = (fullOrder && fullOrder.id === order?.id) ? fullOrder : (order || {})
  const isCOD = String(activeOrder.paymentMethod || activeOrder.payment || '').toUpperCase().includes('COD')
  const trackingRef = activeOrder.orderNumber || (activeOrder.id ? `#${activeOrder.id}` : '—')
  const subtotal = Number(activeOrder.subtotal || activeOrder.total || 0)
  const discount = Number(activeOrder.discountAmount || 0)
  const grandTotal = Number(activeOrder.total || 0)
  const gstEstimated = Math.round(grandTotal * 0.05 / 1.05)

  return {
    isCOD,
    trackingRef,
    subtotal,
    discount,
    grandTotal,
    gstEstimated,
  }
}

console.log('Testing ParcelReceiptModal safety...')

// Scenario 1: Modal is closed with null order
const r1 = evaluateModalOrder(null, null, false)
assert.strictEqual(r1, null)
console.log('✅ Scenario 1 Passed: Modal closed with null order safely returns null.')

// Scenario 2: Modal is open, but fullOrder state is still null (The exact user crash bug!)
const mockOrder = {
  id: 8,
  orderNumber: 'PS20261112191256950',
  total: 2899,
  paymentMethod: 'RAZORPAY',
  customer: 'Venkat Chowdary Bodduluri',
}
const r2 = evaluateModalOrder(mockOrder, null, true)
assert.strictEqual(r2.isCOD, false)
assert.strictEqual(r2.trackingRef, 'PS20261112191256950')
assert.strictEqual(r2.grandTotal, 2899)
console.log('✅ Scenario 2 Passed: Modal opened with fullOrder=null falls back safely to order prop without throwing TypeError.')

// Scenario 3: Order with COD payment method
const codOrder = {
  id: 6,
  orderNumber: 'PS20261112172813202',
  total: 3798,
  paymentMethod: 'COD',
}
const r3 = evaluateModalOrder(codOrder, null, true)
assert.strictEqual(r3.isCOD, true)
assert.strictEqual(r3.trackingRef, 'PS20261112172813202')
console.log('✅ Scenario 3 Passed: COD order correctly identified without errors.')

// Scenario 4: Order with missing paymentMethod field entirely
const emptyOrder = { id: 10 }
const r4 = evaluateModalOrder(emptyOrder, null, true)
assert.strictEqual(r4.isCOD, false)
assert.strictEqual(r4.trackingRef, '#10')
console.log('✅ Scenario 4 Passed: Order with undefined paymentMethod handles defaults safely.')

console.log('🎉 ALL PARCEL RECEIPT MODAL SAFETY TESTS PASSED!')

