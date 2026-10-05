import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { 
  CheckCheck, 
  Trash2, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  RefreshCw,
  Bell,
  Radio
} from 'lucide-react'
import { 
  markNotificationRead, 
  markAllNotificationsRead, 
  removeNotification, 
  toggleSound,
  appendNotifications
} from '../../store/notificationsSlice'
import { adminService } from '../../services/adminService'
import { playLuxuryChime } from '../../services/adminWebSocket'
import toast from 'react-hot-toast'

function formatTimeAgo(isoString) {
  if (!isoString) return 'Just now'
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffSec = Math.floor((now - date) / 1000)

    if (diffSec < 60) return 'Just now'
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    if (diffSec < 172800) return 'Yesterday'
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  } catch (e) {
    return 'Recently'
  }
}

function getNotificationBadge(type) {
  switch (type) {
    case 'NEW_ORDER':
      return { icon: '🛍️', label: 'New Order', bg: 'bg-[#5A1020]/10 text-[#5A1020]' }
    case 'PAYMENT_RECEIVED':
      return { icon: '💳', label: 'Payment', bg: 'bg-emerald-50 text-emerald-700' }
    case 'LOW_STOCK':
      return { icon: '📦', label: 'Low Stock', bg: 'bg-amber-50 text-amber-700' }
    case 'OUT_OF_STOCK':
      return { icon: '⚠️', label: 'Out of Stock', bg: 'bg-rose-50 text-rose-700' }
    case 'ORDER_CANCELLED':
      return { icon: '❌', label: 'Cancelled', bg: 'bg-red-50 text-red-700' }
    case 'ORDER_STATUS_CHANGED':
      return { icon: '🔄', label: 'Status Update', bg: 'bg-blue-50 text-blue-700' }
    case 'NEW_CUSTOMER':
      return { icon: '👤', label: 'New Patron', bg: 'bg-purple-50 text-purple-700' }
    case 'SETTINGS_UPDATED':
      return { icon: '⚙️', label: 'Settings', bg: 'bg-[#C9A45C]/15 text-[#5A1020]' }
    case 'SYSTEM_ALERT':
      return { icon: '📢', label: 'Broadcast', bg: 'bg-indigo-50 text-indigo-700' }
    case 'REFUND_REQUESTED':
      return { icon: '💸', label: 'Refund', bg: 'bg-rose-50 text-rose-700' }
    default:
      return { icon: '🔔', label: 'Notice', bg: 'bg-neutral-100 text-neutral-700' }
  }
}

export default function NotificationCenter({ onClose }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { items, unreadCount, connectionStatus, soundEnabled, page, hasMore } = useSelector(
    (state) => state.notifications
  )
  const [filter, setFilter] = useState('ALL') // 'ALL' | 'UNREAD'
  const [loadingMore, setLoadingMore] = useState(false)

  const filteredItems = filter === 'UNREAD' ? items.filter((n) => !n.isRead) : items

  const handleMarkAsRead = async (e, notif) => {
    e.stopPropagation()
    if (notif.isRead) return
    dispatch(markNotificationRead(notif.id))
    try {
      await adminService.markNotificationAsRead(notif.id)
    } catch (err) {
      console.warn('Error marking notification read on server:', err)
    }
  }

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return
    dispatch(markAllNotificationsRead())
    try {
      await adminService.markAllNotificationsAsRead()
      toast.success('All notifications marked as read')
    } catch (err) {
      console.warn('Error marking all notifications read on server:', err)
    }
  }

  const handleDelete = async (e, notif) => {
    e.stopPropagation()
    dispatch(removeNotification(notif.id))
    try {
      await adminService.deleteNotification(notif.id)
    } catch (err) {
      console.warn('Error deleting notification on server:', err)
    }
  }

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      dispatch(markNotificationRead(notif.id))
      adminService.markNotificationAsRead(notif.id).catch(() => {})
    }

    if (onClose) onClose()

    // Route navigation
    if (notif.referenceType === 'ORDER' && notif.referenceId) {
      navigate(`/admin/orders/${notif.referenceId}`)
    } else if (notif.referenceType === 'PRODUCT') {
      navigate('/admin/inventory')
    } else if (notif.referenceType === 'USER') {
      navigate('/admin/customers')
    } else if (notif.referenceType === 'SETTING' || notif.type === 'SETTINGS_UPDATED') {
      navigate('/admin/settings')
    }
  }

  const handleToggleSound = () => {
    dispatch(toggleSound())
    if (!soundEnabled) {
      // User is enabling sound, give immediate luxury chime feedback
      setTimeout(playLuxuryChime, 50)
      toast.success('Notification chime enabled', { id: 'sound-toggle' })
    } else {
      toast('Notification chime muted', { id: 'sound-toggle' })
    }
  }

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const data = await adminService.getNotifications(nextPage, 20)
      dispatch(
        appendNotifications({
          content: data.content || [],
          totalPages: data.totalPages || 1,
          page: nextPage
        })
      )
    } catch (err) {
      toast.error('Failed to load older notifications')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="w-[360px] sm:w-[420px] max-w-[95vw] bg-white rounded-2xl shadow-2xl border border-[#C9A45C]/30 overflow-hidden flex flex-col font-body animate-in fade-in zoom-in-95 duration-150 z-50">
      {/* Header */}
      <div className="px-4 py-3 bg-[#5A1020] text-[#FBF3E7] flex items-center justify-between border-b border-[#C9A45C]/30">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[#C9A45C]" />
          <span className="font-serif font-bold text-sm tracking-wide">Atelier Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#C9A45C] text-[#1A0B10]">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Connection Status Pill */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              connectionStatus === 'CONNECTED'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                : connectionStatus === 'RECONNECTING'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30 animate-pulse'
                : 'bg-neutral-800 text-neutral-400 border border-white/10'
            }`}
            title={`Real-Time Status: ${connectionStatus}`}
          >
            <Radio size={10} className={connectionStatus === 'CONNECTED' ? 'animate-pulse' : ''} />
            <span>
              {connectionStatus === 'CONNECTED'
                ? 'Live'
                : connectionStatus === 'RECONNECTING'
                ? 'Reconnecting'
                : 'Offline'}
            </span>
          </div>

          {/* Sound Toggle Button */}
          <button
            onClick={handleToggleSound}
            className="p-1 rounded-lg hover:bg-white/10 text-[#FBF3E7]/80 hover:text-white transition-colors"
            title={soundEnabled ? 'Mute notification sound' : 'Enable notification sound'}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} className="text-rose-400" />}
          </button>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="px-3.5 py-2 bg-[#FAF7F2] border-b border-[#C9A45C]/15 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
              filter === 'ALL'
                ? 'bg-[#5A1020] text-white shadow-xs'
                : 'text-[#211D1E]/70 hover:bg-white'
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
              filter === 'UNREAD'
                ? 'bg-[#5A1020] text-white shadow-xs'
                : 'text-[#211D1E]/70 hover:bg-white'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-[11px] font-bold text-[#5A1020] hover:text-[#C9A45C] flex items-center gap-1 transition-colors"
          >
            <CheckCheck size={13} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
        {filteredItems.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#5A1020]/5 flex items-center justify-center text-[#5A1020] mb-2">
              <Bell size={20} />
            </div>
            <p className="text-sm font-semibold text-[#211D1E]">No new notifications</p>
            <p className="text-xs text-[#211D1E]/50 mt-1">
              {filter === 'UNREAD'
                ? 'All incoming events have been reviewed'
                : 'Atelier events will arrive here in real time'}
            </p>
          </div>
        ) : (
          filteredItems.map((notif) => {
            const badge = getNotificationBadge(notif.type)
            return (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`p-3.5 hover:bg-[#FAF7F2] transition-colors cursor-pointer group flex items-start gap-3 relative ${
                  !notif.isRead ? 'bg-[#5A1020]/3' : 'bg-white'
                }`}
              >
                {/* Left Type Icon */}
                <div className="w-8 h-8 rounded-xl bg-white border border-[#C9A45C]/20 shadow-xs flex items-center justify-center shrink-0 text-base">
                  {badge.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${badge.bg}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-[#211D1E] truncate group-hover:text-[#5A1020]">
                    {notif.title}
                  </p>
                  <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5 leading-relaxed font-serif">
                    {notif.message}
                  </p>

                  {notif.referenceType === 'ORDER' && notif.referenceId && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-[#5A1020] group-hover:text-[#C9A45C]">
                      <span>Open Order #{notif.referenceId}</span>
                      <ExternalLink size={10} />
                    </div>
                  )}
                </div>

                {/* Right side actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {!notif.isRead && (
                    <span
                      className="w-2 h-2 rounded-full bg-[#C9A45C] ring-2 ring-[#C9A45C]/20"
                      title="Unread"
                    />
                  )}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {!notif.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(e, notif)}
                        className="p-1 rounded-md text-gray-400 hover:text-[#5A1020] hover:bg-gray-100"
                        title="Mark as read"
                      >
                        <CheckCheck size={12} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, notif)}
                      className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Remove notice"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer / Load More */}
      {hasMore && (
        <div className="p-2.5 bg-[#FAF7F2] border-t border-[#C9A45C]/15 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-xs font-bold text-[#5A1020] hover:text-[#C9A45C] flex items-center justify-center gap-1.5 w-full py-1 disabled:opacity-50"
          >
            <RefreshCw size={12} className={loadingMore ? 'animate-spin' : ''} />
            <span>{loadingMore ? 'Loading older...' : 'Load older notifications'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
