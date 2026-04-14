import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  AlertTriangle,
  Plus,
  X,
  Wallet,
  Percent,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import { formatCurrency, calculateDaysRemaining } from '@/lib/utils'
import Link from 'next/link'
import { getInvestments, dismissInvestmentAlert } from './investments/actions'
import { getDebts } from './debts/actions'
import { AutoRenewalTrigger } from '@/components/auto-renewal-trigger'
import { getProfile } from './settings/actions'
import type { Database } from '@/types/database'

type Investment = Database['public']['Tables']['investments']['Row']
type Debt       = Database['public']['Tables']['debts']['Row']

// ── Status map ────────────────────────────────────────────────────────────────
const statusBadgeClass: Record<string, string> = {
  active:    'bg-emerald-100 text-emerald-700',
  matured:   'bg-blue-100 text-blue-700',
  renewed:   'bg-purple-100 text-purple-700',
  withdrawn: 'bg-slate-100 text-slate-500',
}
const statusLabel: Record<string, string> = {
  active: 'نشط', matured: 'منتهي', renewed: 'مجدد', withdrawn: 'مسحوب',
}

// ── Progress bar color ────────────────────────────────────────────────────────
function barColor(days: number) {
  if (days < 7) return 'bg-red-500'
  if (days < 30) return 'bg-amber-500'
  return 'bg-emerald-500'
}
function barWidth(days: number) {
  return `${Math.max(8, Math.min(100, (90 - days) / 90 * 100))}%`
}

export default async function DashboardPage() {
  const [investmentsResult, debtsResult, profileResult] = await Promise.all([
    getInvestments(),
    getDebts(),
    getProfile(),
  ])

  const investments = (investmentsResult.success && investmentsResult.data ? investmentsResult.data : []) as Investment[]
  const debts       = (debtsResult.success && debtsResult.data ? debtsResult.data : []) as Debt[]
  const currency: string = profileResult.success && profileResult.data ? profileResult.data.preferred_currency : 'USD'

  const activeInvestments   = investments.filter((i) => i.status === 'active')
  const totalPortfolioValue = activeInvestments.reduce((sum, i) => sum + (Number(i.principal_amount)  || 0), 0)
  const totalPendingProfits = activeInvestments.reduce((sum, i) => sum + (Number(i.profit_amount)     || 0), 0)
  const totalCommissions    = activeInvestments.reduce((sum, i) => sum + (Number(i.commission_amount) || 0), 0)
  const totalDebtRemaining  = debts.reduce((sum, d) => sum + (Number(d.remaining_amount) || 0), 0)

  // Investments maturing within 90 days, sorted by soonest
  const maturingInvestments = activeInvestments
    .filter((i) => {
      if (!i.due_date || i.alert_dismissed) return false
      const days = calculateDaysRemaining(new Date(i.due_date as string))
      return days >= 0 && days <= 90
    })
    .sort((a, b) => new Date(a.due_date as string).getTime() - new Date(b.due_date as string).getTime())
    .slice(0, 5)

  // Recent investments (last 5 created)
  const recentInvestments = [...investments]
    .sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Invisible auto-renewal client trigger */}
      <AutoRenewalTrigger />

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-sans">لوحة التحكم</h1>
          <p className="text-slate-500 mt-1 text-sm">نظرة عامة على أدائك المالي اليوم.</p>
        </div>
        <Link href="/dashboard/investments/new">
          <button className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all">
            <Plus className="h-4 w-4" />
            استثمار جديد
          </button>
        </Link>
      </div>

      {/* ── KPI Bento Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Card 1: Portfolio Value */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between mb-5">
            <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full tabular-nums">
              +{activeInvestments.length} نشط
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">إجمالي قيمة المحفظة</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {formatCurrency(totalPortfolioValue, currency)}
          </p>
        </div>

        {/* Card 2: Expected Profits */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between mb-5">
            <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">آمن</span>
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">الأرباح المتوقعة</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">
            {formatCurrency(totalPendingProfits, currency)}
          </p>
        </div>

        {/* Card 3: Total Commissions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between mb-5">
            <div className="w-11 h-11 bg-amber-50 rounded-2xl flex items-center justify-center">
              <Percent className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">مستحق</span>
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">إجمالي العمولات</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1 tabular-nums">
            {formatCurrency(totalCommissions, currency)}
          </p>
        </div>

        {/* Card 4: Remaining Debts */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between mb-5">
            <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full tabular-nums">
              {debts.filter(d => d.status !== 'paid').length} دين
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">إجمالي الديون المتبقية</p>
          <p className="text-2xl font-extrabold text-red-600 mt-1 tabular-nums">
            {formatCurrency(totalDebtRemaining, currency)}
          </p>
        </div>
      </div>

      {/* ── Lower 3-Column Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Maturing Soon — col-span-2 ─────────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-900">استثمارات تقترب من الاستحقاق</h2>
            <Link href="/dashboard/investments">
              <span className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors">
                عرض الكل
              </span>
            </Link>
          </div>

          {maturingInvestments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                <Calendar className="h-7 w-7 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">لا توجد استثمارات تستحق خلال الـ 90 يوماً القادمة</p>
            </div>
          ) : (
            <div className="space-y-8">
              {maturingInvestments.map((investment) => {
                const daysRemaining = calculateDaysRemaining(new Date(investment.due_date))
                const isUrgent = daysRemaining <= 7
                return (
                  <div key={investment.id} className="group relative">

                    {/* Dismiss server action form — preserve exactly */}
                    <form
                      className="absolute -top-1 end-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      action={async () => {
                        'use server'
                        await dismissInvestmentAlert(investment.id)
                      }}
                    >
                      <button
                        type="submit"
                        title="إخفاء التنبيه"
                        className="h-6 w-6 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </form>

                    {/* Item header row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{investment.investor_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {isUrgent ? 'عاجل' : 'يستحق قريباً'}
                            </span>
                            {investment.due_date && (
                              <span className="text-[10px] text-slate-400">
                                تاريخ الاستحقاق: {new Date(investment.due_date).toLocaleDateString('ar-SA')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right side — payout + CTA */}
                      <div className="text-end">
                        <p className="text-sm font-bold text-slate-800 tabular-nums">
                          {formatCurrency(investment.principal_amount, currency)}
                        </p>
                        <p className="text-[10px] text-emerald-600 mt-0.5">
                          +{formatCurrency(investment.profit_amount, currency)} ربح
                        </p>
                        <Link href={`/dashboard/investments/${investment.id}`}>
                          <button className="mt-2 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                            عرض التفاصيل
                          </button>
                        </Link>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor(daysRemaining)}`}
                        style={{ width: barWidth(daysRemaining) }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-slate-400">تقدم الاستثمار</span>
                      <span className={`text-[10px] font-bold ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
                        باقي {daysRemaining} يوم
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Recent Investments — col-span-1 (timeline) ─────────────── */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-900">آخر العمليات</h2>
          </div>

          {recentInvestments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                <TrendingUp className="h-7 w-7 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500 text-center">لا توجد استثمارات حالياً</p>
              <Link href="/dashboard/investments/new">
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-sm rounded-xl">
                  <Plus className="me-2 h-4 w-4" />
                  استثمار جديد
                </Button>
              </Link>
            </div>
          ) : (
            /* Vertical timeline */
            <div className="relative space-y-8 before:absolute before:inset-y-0 before:start-[23px] before:w-px before:bg-slate-100">
              {recentInvestments.map((investment) => (
                <div key={investment.id} className="relative flex gap-5">
                  {/* Timeline node */}
                  <div className="relative z-10 w-12 h-12 rounded-full bg-blue-50 border-4 border-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-sm text-slate-800 truncate leading-snug">
                        {investment.investor_name}
                      </p>
                      <Badge className={`text-[10px] shrink-0 border-0 ${statusBadgeClass[investment.status] || 'bg-slate-100 text-slate-500'}`}>
                        {statusLabel[investment.status] ?? investment.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(investment.created_at).toLocaleDateString('ar-SA')}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(investment.principal_amount, currency)}
                        </p>
                        <p className="text-xs text-emerald-600 tabular-nums">
                          +{formatCurrency(investment.profit_amount, currency)}
                        </p>
                      </div>
                      <Link href={`/dashboard/investments/${investment.id}`}>
                        <button className="text-[10px] font-bold text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-0.5">
                          التفاصيل <ChevronRight className="h-3 w-3" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
