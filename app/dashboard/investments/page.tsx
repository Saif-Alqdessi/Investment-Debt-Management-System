import { InvestmentsClient } from '@/components/investments/investments-client'
import { getInvestments } from './actions'
import { getProfile } from '@/app/dashboard/settings/actions'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Wallet, Clock, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/database'

type Investment = Database['public']['Tables']['investments']['Row']

export default async function InvestmentsPage() {
  const [result, profileResult] = await Promise.all([
    getInvestments(),
    getProfile(),
  ])

  const investments = (result.success && result.data ? result.data : []) as Investment[]
  const currency    = profileResult.success && profileResult.data
    ? profileResult.data.preferred_currency
    : 'USD'

  const totalValue   = investments.reduce((s, i) => s + (Number(i.principal_amount) || 0), 0)
  const totalProfits = investments.reduce((s, i) => s + (Number(i.profit_amount)     || 0), 0)
  const activeCount  = investments.filter(i => i.status === 'active').length
  const pendingValue = investments
    .filter(i => i.status === 'matured')
    .reduce((s, i) => s + (Number(i.principal_amount) || 0), 0)
  const maturedCount = investments.filter(i => i.status === 'matured').length

  return (
    <div className="space-y-8">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">الاستثمارات</h1>
          <p className="text-slate-500 mt-1">إدارة محفظتك الاستثمارية ومتابعة العوائد</p>
        </div>
        <Link href="/dashboard/investments/new">
          <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all text-sm">
            <span className="text-lg leading-none">+</span>
            استثمار جديد
          </button>
        </Link>
      </div>

      {/* ── Bento KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">+12.5%</span>
          </div>
          <p className="text-slate-500 text-sm mb-1">إجمالي المحفظة</p>
          <h3 className="text-2xl font-bold tabular-nums text-slate-900">
            {formatCurrency(totalValue, currency)}
          </h3>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
              إجمالي
            </span>
          </div>
          <p className="text-slate-500 text-sm mb-1">العوائد المحققة</p>
          <h3 className="text-2xl font-bold tabular-nums text-emerald-600">
            {formatCurrency(totalProfits, currency)}
          </h3>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <BarChart3 className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {investments.length} استثمار
            </span>
          </div>
          <p className="text-slate-500 text-sm mb-1">الاستثمارات النشطة</p>
          <h3 className="text-2xl font-bold tabular-nums text-slate-900">{activeCount}</h3>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
            {maturedCount > 0 && (
              <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-1 rounded-full">
                {maturedCount} منتهية
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mb-1">قيد الانتظار</p>
          <h3 className="text-2xl font-bold tabular-nums text-slate-900">
            {formatCurrency(pendingValue, currency)}
          </h3>
        </div>
      </div>

      {/* ── Main table card ─────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <InvestmentsClient investments={investments} currency={currency} />
      </div>
    </div>
  )
}
