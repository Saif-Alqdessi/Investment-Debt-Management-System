'use client'

import { Bell, Search, Languages, LogOut, User, CheckCheck, Loader2, Info, AlertTriangle, TrendingUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/lib/i18n/context'
import { useSearch } from '@/lib/context/search-context'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

const notifIcon = (type: string) => {
  if (type === 'warning' || type === 'overdue') return <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
  if (type === 'investment' || type === 'maturity') return <TrendingUp className="h-4 w-4 text-blue-500 flex-shrink-0" />
  return <Info className="h-4 w-4 text-gray-400 flex-shrink-0" />
}

const formatRelative = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'الآن'
  if (mins < 60) return `منذ ${mins} دقيقة`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `منذ ${hrs} ساعة`
  const days = Math.floor(hrs / 24)
  return `منذ ${days} يوم`
}

export function Header() {
  const { t, locale, setLocale } = useLanguage()
  const { searchQuery, setSearchQuery, clearSearch } = useSearch()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [signingOut, setSigningOut] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)

  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const fetchNotifications = async () => {
    setNotifLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(5)
    setNotifications(data ?? [])
    setNotifLoading(false)
  }

  const markAsRead = async (id: string) => {
    setMarkingId(id)
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setMarkingId(null)
  }

  const markAllRead = async () => {
    const ids = notifications.map((n) => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ is_read: true }).in('id', ids)
    setNotifications([])
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    setProfileOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleLanguage = () => setLocale(locale === 'en' ? 'ar' : 'en')

  // Clear search when navigating away
  useEffect(() => {
    clearSearch()
  }, [pathname, clearSearch])

  // Open notif panel and fetch fresh data
  const handleNotifToggle = () => {
    const opening = !notifOpen
    setNotifOpen(opening)
    setProfileOpen(false)
    if (opening) fetchNotifications()
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-40">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('header.search_placeholder')}
            className="ps-10 pe-8 bg-gray-50 border-gray-200 focus:bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="مسح البحث"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          <Languages className="h-4 w-4" />
          <span className="text-xs font-semibold">{locale === 'en' ? 'العربية' : 'English'}</span>
        </Button>

        {/* ── Notifications ── */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            onClick={handleNotifToggle}
            aria-label="الإشعارات"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -end-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {notifOpen && (
            <div className="absolute end-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="font-semibold text-sm text-gray-900">الإشعارات</span>
                {notifications.length > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <CheckCheck className="h-3 w-3" />
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="max-h-80 overflow-y-auto">
                {notifLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <Bell className="h-8 w-8 mb-2 text-gray-200" />
                    <p className="text-sm">لا توجد إشعارات جديدة</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex gap-3 px-4 py-3 border-b border-gray-50 hover:bg-blue-50/40 transition-colors"
                    >
                      <div className="mt-0.5">{notifIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{formatRelative(n.created_at)}</p>
                      </div>
                      <button
                        onClick={() => markAsRead(n.id)}
                        disabled={markingId === n.id}
                        className="flex-shrink-0 mt-0.5 text-gray-300 hover:text-blue-500 transition-colors"
                        title="تحديد كمقروء"
                      >
                        {markingId === n.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <CheckCheck className="h-4 w-4" />}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Profile / Sign-out ── */}
        <div className="relative" ref={profileRef}>
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            onClick={() => { setProfileOpen((p) => !p); setNotifOpen(false) }}
          >
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          </Button>

          {profileOpen && (
            <div className="absolute end-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {signingOut
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <LogOut className="h-4 w-4" />}
                {signingOut ? 'جاري الخروج…' : t('sidebar.sign_out')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
