import { createSlice } from '@reduxjs/toolkit'

const initialSoundPreference = (() => {
  try {
    return localStorage.getItem('agvia_admin_sound_enabled') !== 'false'
  } catch (e) {
    return true
  }
})()

const initialState = {
  items: [],
  unreadCount: 0,
  connectionStatus: 'OFFLINE', // 'CONNECTED' | 'RECONNECTING' | 'OFFLINE'
  soundEnabled: initialSoundPreference,
  loading: false,
  page: 0,
  hasMore: true,
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setNotifications: (state, action) => {
      const { content = [], totalPages = 1, page = 0, unreadCount } = action.payload || {}
      state.items = content
      state.page = page
      state.hasMore = page + 1 < totalPages
      if (typeof unreadCount === 'number') {
        state.unreadCount = unreadCount
      } else {
        state.unreadCount = content.filter(n => !n.isRead).length
      }
    },
    appendNotifications: (state, action) => {
      const { content = [], totalPages = 1, page = 0 } = action.payload || {}
      const existingIds = new Set(state.items.map(n => n.id))
      const fresh = content.filter(n => !existingIds.has(n.id))
      state.items.push(...fresh)
      state.page = page
      state.hasMore = page + 1 < totalPages
    },
    addNotification: (state, action) => {
      const notif = action.payload
      if (!notif) return
      // Duplicate prevention by id
      const existsIndex = state.items.findIndex(n => n.id === notif.id)
      if (existsIndex >= 0) {
        state.items[existsIndex] = notif
        return
      }
      state.items.unshift(notif)
      if (!notif.isRead) {
        state.unreadCount += 1
      }
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = Math.max(0, action.payload ?? 0)
    },
    markNotificationRead: (state, action) => {
      const id = action.payload
      const item = state.items.find(n => n.id === id)
      if (item && !item.isRead) {
        item.isRead = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllNotificationsRead: (state) => {
      state.items.forEach(n => {
        n.isRead = true
      })
      state.unreadCount = 0
    },
    removeNotification: (state, action) => {
      const id = action.payload
      const index = state.items.findIndex(n => n.id === id)
      if (index !== -1) {
        const item = state.items[index]
        if (!item.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
        state.items.splice(index, 1)
      }
    },
    setConnectionStatus: (state, action) => {
      state.connectionStatus = action.payload
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled
      try {
        localStorage.setItem('agvia_admin_sound_enabled', String(state.soundEnabled))
      } catch (e) {}
    }
  }
})

export const {
  setLoading,
  setNotifications,
  appendNotifications,
  addNotification,
  setUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  setConnectionStatus,
  toggleSound
} = notificationsSlice.actions

export default notificationsSlice.reducer
