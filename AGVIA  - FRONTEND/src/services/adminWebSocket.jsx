import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import toast from 'react-hot-toast'
import { store } from '../store'
import {
  addNotification,
  setConnectionStatus,
  setNotifications,
  setUnreadCount
} from '../store/notificationsSlice'
import { adminService } from './adminService'

// Gentle, luxury high-end synthesised chime for AGVIA Haute Couture
export function playLuxuryChime() {
  try {
    const isSoundEnabled = store.getState().notifications?.soundEnabled
    if (isSoundEnabled === false) return

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime

    // Note 1: E5 (659.25 Hz) - Bell strike
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(659.25, now)
    gain1.gain.setValueAtTime(0.12, now)
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.5)

    // Note 2: B5 (987.77 Hz) - Crystalline harmonic
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(987.77, now + 0.1)
    gain2.gain.setValueAtTime(0.1, now + 0.1)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.7)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.1)
    osc2.stop(now + 0.7)
  } catch (err) {
    // Ignore autoplay restriction errors safely
  }
}

class AdminWebSocketManager {
  constructor() {
    this.client = null
    this.status = 'OFFLINE'
    this.reconnectAttempt = 0
    this.reconnectTimeout = null
    this.listeners = new Set()
    this.settingsListeners = new Set()
    this.navigateHandler = null
    this.isManualDisconnect = false
    this.pollingTimer = null

    // Multi-Window / Multi-Tab deduplication coordinates
    this.tabId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    
    this.channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
      ? new BroadcastChannel('agvia_admin_ws_channel')
      : null

    this.isLeader = false
    this.leaderHeartbeatTimer = null

    if (this.channel) {
      this.channel.onmessage = (event) => {
        this.handleBroadcastMessage(event.data)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.releaseLeadership()
      })
    }
  }

  setNavigateHandler(navigate) {
    this.navigateHandler = navigate
  }

  getWebSocketUrl() {
    const rawUrl =
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:8080/api')

    const clean = rawUrl.trim().replace(/\/+$/, '')
    const origin = clean.endsWith('/api') ? clean.slice(0, -4) : clean
    return `${origin}/ws`
  }

  connect() {
    try {
      const state = store.getState()
      const token = state.auth?.token
      const user = state.auth?.user

      // Authorize admin: Accept both 'ADMIN' and 'ROLE_ADMIN'
      const isAdmin = user && (user.role === 'ADMIN' || user.role === 'ROLE_ADMIN')
      if (!token || !isAdmin) {
        return
      }

      this.isManualDisconnect = false
      this.syncInitialNotifications()

      // Multi-Window Deduplication: Elect a single leader tab to own the WebSocket & polling
      this.initTabLeaderElection()
    } catch (err) {
      console.error('[AdminWS] connect() error:', err)
      this.handleConnectionDrop()
    }
  }

  initTabLeaderElection() {
    if (typeof window === 'undefined') {
      this.activateConnection()
      return
    }

    const evaluateLeadership = () => {
      try {
        const raw = localStorage.getItem('agvia_ws_leader')
        const now = Date.now()
        let currentLeader = null
        try {
          currentLeader = raw ? JSON.parse(raw) : null
        } catch (_) {}

        // If no leader or leader has expired (> 6 seconds without heartbeat), this tab assumes leadership
        if (!currentLeader || !currentLeader.id || (now - currentLeader.timestamp > 6000) || currentLeader.id === this.tabId) {
          this.claimLeadership()
        } else {
          // Another tab is currently the active leader
          if (this.isLeader) {
            this.demoteToFollower()
          }
        }
      } catch (err) {
        // Fallback for private browsing without localStorage access
        if (!this.isLeader && (!this.client || !this.client.active)) {
          this.isLeader = true
          this.activateConnection()
          this.startPolling()
        }
      }
    }

    evaluateLeadership()

    if (!this.leaderHeartbeatTimer) {
      this.leaderHeartbeatTimer = setInterval(evaluateLeadership, 2500)
    }
  }

  claimLeadership() {
    try {
      localStorage.setItem('agvia_ws_leader', JSON.stringify({
        id: this.tabId,
        timestamp: Date.now()
      }))
    } catch (_) {}

    if (!this.isLeader) {
      this.isLeader = true
      this.activateConnection()
      this.startPolling()
      this.broadcastEvent({ type: 'LEADER_ELECTED', leaderId: this.tabId })
    }
  }

  demoteToFollower() {
    this.isLeader = false
    this.stopPolling()
    if (this.client) {
      try {
        this.client.deactivate()
      } catch (_) {}
      this.client = null
    }
    this.updateStatus('CONNECTED')
  }

  releaseLeadership() {
    if (this.isLeader) {
      try {
        localStorage.removeItem('agvia_ws_leader')
      } catch (_) {}
      this.broadcastEvent({ type: 'LEADER_EXIT', leaderId: this.tabId })
    }
    if (this.leaderHeartbeatTimer) {
      clearInterval(this.leaderHeartbeatTimer)
      this.leaderHeartbeatTimer = null
    }
    if (this.channel) {
      try {
        this.channel.close()
      } catch (_) {}
    }
  }

  broadcastEvent(data) {
    if (this.channel) {
      try {
        this.channel.postMessage({ ...data, senderTabId: this.tabId })
      } catch (_) {}
    }
  }

  handleBroadcastMessage(data) {
    if (!data || data.senderTabId === this.tabId) return

    if (data.type === 'NOTIFICATION_BROADCAST') {
      this.handleIncomingNotification(data.payload, true)
    } else if (data.type === 'SETTINGS_BROADCAST') {
      this.handleIncomingSettings(data.payload, true)
    } else if (data.type === 'LEADER_EXIT') {
      this.claimLeadership()
    }
  }

  activateConnection() {
    if (this.client && this.client.active) return

    const state = store.getState()
    const token = state.auth?.token
    const user = state.auth?.user
    if (!token) return

    this.updateStatus('CONNECTING')
    const sockJsUrl = this.getWebSocketUrl()

    this.client = new Client({
      webSocketFactory: () => {
        try {
          return new SockJS(sockJsUrl, null, {
            timeout: 60000,
            transports: ['websocket', 'xhr-streaming', 'xhr-polling']
          })
        } catch (e) {
          console.warn('[AdminWS] SockJS instantiation warning:', e)
          throw e
        }
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      heartbeatIncoming: 25000,
      heartbeatOutgoing: 25000,
      reconnectDelay: 0,
      debug: () => {},
      onConnect: (frame) => {
        this.updateStatus('CONNECTED')
        this.reconnectAttempt = 0
        this.syncInitialNotifications()

        // 1. Subscribe to global admin notifications topic
        this.client.subscribe('/topic/admin/notifications', (message) => {
          try {
            const payload = JSON.parse(message.body)
            this.handleIncomingNotification(payload)
          } catch (err) {
            console.error('[AdminWS] Failed to parse message body:', err)
          }
        })

        // 2. Subscribe to user-specific queue if user ID is known
        if (user.id) {
          this.client.subscribe(`/user/queue/admin/notifications`, (message) => {
            try {
              const payload = JSON.parse(message.body)
              this.handleIncomingNotification(payload)
            } catch (err) {
              console.error('[AdminWS] Failed to parse user-specific message body:', err)
            }
          })
        }

        // 3. Subscribe to real-time e-commerce settings updates
        this.client.subscribe('/topic/admin/settings', (message) => {
          try {
            const settingsPayload = JSON.parse(message.body)
            this.handleIncomingSettings(settingsPayload)
          } catch (err) {
            console.error('[AdminWS] Failed to parse settings update:', err)
          }
        })

        this.client.subscribe('/topic/settings', (message) => {
          try {
            const settingsPayload = JSON.parse(message.body)
            this.handleIncomingSettings(settingsPayload)
          } catch (err) {
            console.error('[AdminWS] Failed to parse public settings update:', err)
          }
        })
      },
      onDisconnect: () => {
        if (!this.isManualDisconnect) {
          this.handleConnectionDrop()
        } else {
          this.updateStatus('OFFLINE')
        }
      },
      onStompError: (frame) => {
        console.warn('[AdminWS] STOMP Error:', frame.headers?.['message'] || 'Unknown')
        if (!this.isManualDisconnect) {
          this.handleConnectionDrop()
        }
      },
      onWebSocketClose: () => {
        if (!this.isManualDisconnect) {
          this.handleConnectionDrop()
        }
      },
      onWebSocketError: (evt) => {
        // Suppress uncaught SockJS timeout/transport errors (silent reconnect handles them)
        console.warn('[AdminWS] WebSocket transport error (will auto-reconnect):', evt?.message || '')
      }
    })

    try {
      this.client.activate()
    } catch (err) {
      console.error('[AdminWS] Activation error:', err)
      this.handleConnectionDrop()
    }
  }

  handleConnectionDrop() {
    this.updateStatus('RECONNECTING')
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    // Controlled exponential backoff: 2s, 4s, 8s, 16s, max 30s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempt + 1), 30000)
    this.reconnectAttempt += 1

    this.reconnectTimeout = setTimeout(() => {
      if (!this.isManualDisconnect) {
        this.connect()
      }
    }, delay)
  }

  disconnect() {
    this.isManualDisconnect = true
    this.stopPolling()
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    if (this.client) {
      try {
        this.client.deactivate()
      } catch (e) {}
      this.client = null
    }
    this.updateStatus('OFFLINE')
  }

  startPolling() {
    if (this.pollingTimer) return
    // Resilient background sync: guarantees notifications remain real-time even on network changes
    this.pollingTimer = setInterval(() => {
      this.syncInitialNotifications()
    }, 25000)
  }

  stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = null
    }
  }

  updateStatus(newStatus) {
    this.status = newStatus
    store.dispatch(setConnectionStatus(newStatus))
  }

  async syncInitialNotifications() {
    try {
      const [listData, unreadCount] = await Promise.allSettled([
        adminService.getNotifications(0, 20),
        adminService.getUnreadNotificationCount()
      ])

      if (listData.status === 'fulfilled') {
        const paginated = listData.value
        store.dispatch(
          setNotifications({
            content: paginated.content || [],
            totalPages: paginated.totalPages || 1,
            page: 0,
            unreadCount: unreadCount.status === 'fulfilled' ? unreadCount.value : undefined
          })
        )
      } else if (unreadCount.status === 'fulfilled') {
        store.dispatch(setUnreadCount(unreadCount.value))
      }
    } catch (err) {
      console.warn('[AdminWS] Sync notifications error:', err)
    }
  }

  handleIncomingNotification(notification, fromBroadcast = false) {
    if (!notification || !notification.id) return

    // 1. Commit to Redux store in this window/tab
    store.dispatch(addNotification(notification))

    // 2. Play luxury audio chime & toast ONLY on the primary active window to prevent duplicate sound/dialogs
    if (!fromBroadcast) {
      playLuxuryChime()
      this.displayNotificationToast(notification)
      this.broadcastEvent({
        type: 'NOTIFICATION_BROADCAST',
        payload: notification
      })
    }

    // 3. Notify registered domain listeners (Dashboard, Orders, etc.) across all open windows
    this.listeners.forEach((listener) => {
      try {
        listener(notification)
      } catch (err) {
        console.error('[AdminWS] Listener callback error:', err)
      }
    })
  }

  handleIncomingSettings(settingsPayload, fromBroadcast = false) {
    if (!settingsPayload) return
    logSettingChange(settingsPayload)
    if (!fromBroadcast) {
      this.broadcastEvent({
        type: 'SETTINGS_BROADCAST',
        payload: settingsPayload
      })
    }
    this.settingsListeners.forEach((listener) => {
      try {
        listener(settingsPayload)
      } catch (err) {
        console.error('[AdminWS] Settings listener callback error:', err)
      }
    })
  }

  displayNotificationToast(notification) {
    const isOrderEvent =
      notification.type === 'NEW_ORDER' ||
      notification.type === 'ORDER_CANCELLED' ||
      notification.type === 'ORDER_STATUS_CHANGED' ||
      notification.type === 'PAYMENT_RECEIVED'

    const isSettingsEvent = notification.type === 'SETTINGS_UPDATED'

    const orderId = notification.referenceId

    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-[#1A0B10] text-[#FBF3E7] shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-[#C9A45C]/40 p-4 border border-[#C9A45C]/20 backdrop-blur-xl transition-all`}
        >
          <div className="flex-1 w-0">
            <div className="flex items-start">
              <div className="shrink-0 pt-0.5 text-2xl select-none">
                {this.getTypeIcon(notification.type)}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#C9A45C]">
                    {notification.title || 'Atelier Event'}
                  </p>
                  <span className="text-[10px] text-[#FBF3E7]/40">Just now</span>
                </div>
                <p className="mt-1 text-xs text-[#FBF3E7]/90 leading-relaxed font-serif">
                  {notification.message}
                </p>
                {isOrderEvent && orderId && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={() => {
                        toast.dismiss(t.id)
                        if (this.navigateHandler) {
                          this.navigateHandler(`/admin/orders/${orderId}`)
                        }
                      }}
                      className="px-3 py-1 bg-[#C9A45C] hover:bg-[#B38F46] text-[#1A0B10] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm"
                    >
                      View Order →
                    </button>
                  </div>
                )}
                {isSettingsEvent && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={() => {
                        toast.dismiss(t.id)
                        if (this.navigateHandler) {
                          this.navigateHandler('/admin/settings')
                        }
                      }}
                      className="px-3 py-1 bg-[#C9A45C] hover:bg-[#B38F46] text-[#1A0B10] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm"
                    >
                      Inspect Settings →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="ml-3 flex border-l border-white/10 pl-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-1 flex items-center justify-center text-xs font-medium text-[#FBF3E7]/50 hover:text-white focus:outline-hidden"
            >
              ✕
            </button>
          </div>
        </div>
      ),
      { duration: 6500 }
    )
  }

  getTypeIcon(type) {
    switch (type) {
      case 'NEW_ORDER':
        return '🛍️'
      case 'PAYMENT_RECEIVED':
        return '💳'
      case 'LOW_STOCK':
        return '📦'
      case 'OUT_OF_STOCK':
        return '⚠️'
      case 'ORDER_CANCELLED':
        return '❌'
      case 'ORDER_STATUS_CHANGED':
        return '🔄'
      case 'NEW_CUSTOMER':
        return '👤'
      case 'SETTINGS_UPDATED':
        return '⚙️'
      case 'SYSTEM_ALERT':
        return '📢'
      case 'REFUND_REQUESTED':
        return '💸'
      default:
        return '🔔'
    }
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  subscribeSettings(listener) {
    this.settingsListeners.add(listener)
    return () => {
      this.settingsListeners.delete(listener)
    }
  }
}

function logSettingChange(payload) {
  if (import.meta.env.DEV) {
    console.info('[AdminWS] Real-time setting synchronized:', payload)
  }
}

export const adminWebSocket = new AdminWebSocketManager()
export default adminWebSocket
