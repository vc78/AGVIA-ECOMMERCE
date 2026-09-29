import { createSlice } from '@reduxjs/toolkit'

function getStoredCartItems() {
  try {
    const rawUser = localStorage.getItem('ps_user')
    const user = rawUser ? JSON.parse(rawUser) : null
    const key = (user?.id || user?.email) ? `ps_cart_${user.id || user.email}` : 'ps_cart_guest'
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: getStoredCartItems(),
  },
  reducers: {
    syncCart: (state) => {
      state.items = getStoredCartItems()
    }
  }
})

export const { syncCart } = cartSlice.actions
export default cartSlice.reducer
