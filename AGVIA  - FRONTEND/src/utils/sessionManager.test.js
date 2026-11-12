/**
 * Node-based automated verification for Session Isolation and Role Barriers
 */
import assert from 'node:assert'

// Mock browser window, localStorage, sessionStorage
class StorageMock {
  constructor() {
    this.store = {}
  }
  getItem(key) {
    return this.store[key] || null
  }
  setItem(key, value) {
    this.store[key] = String(value)
  }
  removeItem(key) {
    delete this.store[key]
  }
  clear() {
    this.store = {}
  }
}

globalThis.window = {
  location: { pathname: '/' }
}
globalThis.localStorage = new StorageMock()
globalThis.sessionStorage = new StorageMock()

const {
  STORAGE_KEYS,
  getActiveTabContext,
  setActiveTabContext,
  setTabSession,
  getTabToken,
  getTabUser,
  clearTabSession
} = await import('./sessionManager.js')

console.log('🧪 Starting AGVIA Cross-Tab Session Isolation Automated Tests...')

// Test 1: Customer login in Tab A
setActiveTabContext('CUSTOMER')
assert.strictEqual(getActiveTabContext(), 'CUSTOMER')

const customerUser = { id: 10, name: 'Customer Priya', email: 'priya@example.com', role: 'CUSTOMER' }
const customerToken = 'jwt_customer_token_123'
setTabSession({ role: 'CUSTOMER', user: customerUser, token: customerToken })

assert.strictEqual(getTabToken('CUSTOMER'), customerToken)
assert.strictEqual(getTabUser('CUSTOMER').name, 'Customer Priya')
console.log('✅ Scenario 1 Passed: Customer login in Tab A succeeds and persists to customer keys.')

// Test 2: Admin login in Tab B
setActiveTabContext('ADMIN')
assert.strictEqual(getActiveTabContext(), 'ADMIN')

const adminUser = { id: 1, name: 'Admin Atelier', email: 'admin@agvia.com', role: 'ADMIN' }
const adminToken = 'jwt_admin_token_999'
setTabSession({ role: 'ADMIN', user: adminUser, token: adminToken })

assert.strictEqual(getTabToken('ADMIN'), adminToken)
assert.strictEqual(getTabUser('ADMIN').name, 'Admin Atelier')
console.log('✅ Scenario 2 Passed: Admin login in Tab B succeeds and persists to admin keys.')

// Test 3: Customer Tab A still has customer credentials (NO OVERWRITE)
assert.strictEqual(getTabToken('CUSTOMER'), customerToken)
assert.strictEqual(getTabUser('CUSTOMER').name, 'Customer Priya')
assert.notStrictEqual(getTabToken('CUSTOMER'), adminToken)
console.log('✅ Scenario 3 Passed: Tab A customer session remains completely untouched by Tab B admin login.')

// Test 4: Tab A customer logout does NOT log out Tab B admin
clearTabSession('CUSTOMER')
assert.strictEqual(getTabToken('CUSTOMER'), null)
assert.strictEqual(getTabUser('CUSTOMER'), null)
assert.strictEqual(getTabToken('ADMIN'), adminToken)
assert.strictEqual(getTabUser('ADMIN').name, 'Admin Atelier')
console.log('✅ Scenario 4 Passed: Logging out Customer in Tab A does NOT log out Admin in Tab B.')

// Test 5: Re-login customer, then logout Admin in Tab B
setTabSession({ role: 'CUSTOMER', user: customerUser, token: customerToken })
clearTabSession('ADMIN')
assert.strictEqual(getTabToken('ADMIN'), null)
assert.strictEqual(getTabUser('ADMIN'), null)
assert.strictEqual(getTabToken('CUSTOMER'), customerToken)
assert.strictEqual(getTabUser('CUSTOMER').name, 'Customer Priya')
console.log('✅ Scenario 5 Passed: Logging out Admin in Tab B does NOT log out Customer in Tab A.')

console.log('🎉 ALL 5 CROSS-TAB SESSION ISOLATION TESTS PASSED!')

