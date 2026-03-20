'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, Check, CheckCheck, Trophy, TrendingUp, TrendingDown, Lightbulb, BarChart3, AlertTriangle, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown> | null
  read: boolean
  createdAt: string
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  LOW_SCORE: TrendingDown,
  HIGH_SCORE: TrendingUp,
  BADGE_EARNED: Trophy,
  WEEKLY_REPORT: BarChart3,
  COACHING_TIP: Lightbulb,
  STREAK_AT_RISK: AlertTriangle,
  TEAM_MILESTONE: Users,
}

const TYPE_COLORS: Record<string, string> = {
  LOW_SCORE: 'text-red-400',
  HIGH_SCORE: 'text-emerald-400',
  BADGE_EARNED: 'text-amber-400',
  WEEKLY_REPORT: 'text-indigo-400',
  COACHING_TIP: 'text-blue-400',
  STREAK_AT_RISK: 'text-orange-400',
  TEAM_MILESTONE: 'text-purple-400',
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return 'עכשיו'
  if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דקות`
  if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שעות`
  if (diff < 604800) return `לפני ${Math.floor(diff / 86400)} ימים`
  return new Date(dateStr).toLocaleDateString('he-IL')
}

function getNotificationHref(notification: Notification): string | null {
  const data = notification.data
  if (!data) return null

  if (data.callId) return `/dashboard/calls/${data.callId}`
  return null
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/count')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count)
      }
    } catch {
      // Silently fail
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications?limit=15')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
      }
    } catch {
      // Silently fail
    }
    setLoading(false)
  }, [])

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [fetchCount])

  // Fetch notifications when panel opens
  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open, fetchNotifications])

  // Close panel on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  async function handleMarkRead(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      // Silently fail
    }
  }

  async function handleMarkAllRead() {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // Silently fail
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      handleMarkRead(notification.id)
    }
    const href = getNotificationHref(notification)
    if (href) {
      window.location.href = href
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative text-muted-foreground hover:text-foreground hover:bg-muted"
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div role="menu" className="absolute left-0 top-full mt-2 w-80 rounded-xl bg-card border border-border shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">התראות</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <CheckCheck className="h-3 w-3" />
                סמן הכל כנקרא
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                טוען...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">אין התראות</p>
              </div>
            )}

            {notifications.map((notification) => {
              const Icon = TYPE_ICONS[notification.type] || Bell
              const color = TYPE_COLORS[notification.type] || 'text-muted-foreground'
              const href = getNotificationHref(notification)

              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 text-right transition-colors',
                    !notification.read
                      ? 'bg-indigo-500/5 hover:bg-indigo-500/10'
                      : 'hover:bg-muted',
                    href && 'cursor-pointer'
                  )}
                >
                  <div className={cn('mt-0.5 shrink-0', color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        'text-sm truncate',
                        !notification.read ? 'font-semibold text-foreground' : 'text-foreground/70'
                      )}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {notification.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkRead(notification.id)
                      }}
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      title="סמן כנקרא"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
