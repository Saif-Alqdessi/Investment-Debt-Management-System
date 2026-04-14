'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  Loader2,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'investments', href: '/dashboard/investments', icon: TrendingUp },
  { key: 'debts', href: '/dashboard/debts', icon: CreditCard },
  { key: 'reports', href: '/dashboard/reports', icon: FileText },
  { key: 'settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const [signingOut, setSigningOut] = useState(false)

  // ── Real user identity ──────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState('')
  const [userEmail, setUserEmail]     = useState('')

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      // Always have a fallback email from auth
      setUserEmail(user.email ?? '')

      // Try to get full_name from the profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      setDisplayName(profile?.full_name?.trim() || '')
    })
  }, [])

  // Derived display values with Arabic fallback
  const name    = displayName || 'مستخدم'
  const initial = (displayName || userEmail || 'م').charAt(0).toUpperCase()

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-full w-64 flex-col bg-slate-950 border-e border-slate-800/50 shadow-2xl">

      {/* ── Logo ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/50">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 flex-shrink-0">
          <span className="text-white font-bold text-sm tracking-wider">R</span>
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight leading-none">Rareb Fintech</h1>
          <p className="text-[10px] text-slate-500 mt-0.5">Wealth Management</p>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98]',
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              )}
            >
              <item.icon
                className={cn(
                  'h-[18px] w-[18px] flex-shrink-0',
                  isActive ? 'text-white' : 'text-slate-500'
                )}
              />
              <span>{t(`sidebar.${item.key}`)}</span>
            </Link>
          )
        })}
      </nav>

      {/* ── User / Sign-out (pinned to bottom) ──────────────────────────── */}
      <div className="border-t border-slate-800/50 px-3 py-4 space-y-1">
        {/* User info row */}
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-xs font-bold text-white">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate leading-none">{name}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate" dir="ltr">{userEmail}</p>
          </div>
        </div>

        {/* Sign-out button */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 disabled:opacity-50"
        >
          {signingOut
            ? <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
            : <LogOut className="h-4 w-4 flex-shrink-0" />
          }
          <span>{signingOut ? '...' : t('sidebar.sign_out')}</span>
        </button>
      </div>
    </div>
  )
}
