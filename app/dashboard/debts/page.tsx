import { DebtsClient } from '@/components/debts/debts-client'
import { getDebts } from './actions'
import { getProfile } from '@/app/dashboard/settings/actions'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, Clock, CheckCircle2, PieChart, Plus } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/database'

type Debt = Database['public']['Tables']['debts']['Row']

export default async function DebtsPage() {
  const [result, profileResult] = await Promise.all([
    getDebts(),
    getProfile(),
  ])

  const debts    = (result.success && result.data ? result.data : []) as Debt[]
  const currency = profileResult.success && profileResult.data
    ? profileResult.data.preferred_currency
    : 'USD'

  const totalDebt      = debts.reduce((s, d) => s + (Number(d.total_due)       || 0), 0)
  const totalPaid      = debts.reduce((s, d) => s + (Number(d.amount_paid)     || 0), 0)
  const totalRemaining = debts.reduce((s, d) => s + (Number(d.remaining_amount)|| 0), 0)
  const pendingToday   = debts
    .filter(d => d.status === 'pending' || d.status === 'partial')
    .reduce((s, d) => s + (Number(d.remaining_amount) || 0), 0)

  return (
    <div className="space-y-8">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">محفظة الديون</h1>
          <p className="text-slate-500 mt-1 italic text-sm">سجل شامل للالتزامات المالية الحالية وجداول السداد.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/debts/new">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all">
              <Plus className="h-4 w-4" />
              دين جديد
            </button>
          </Link>
        </div>
      </div>

      {/* ── KPI Bento Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Debts */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-tight uppercase">إجمالي الديون</span>
          </div>
          <h3 className="text-2xl font-extrabold tabular-nums text-slate-900">{formatCurrency(totalDebt, currency)}</h3>
          <p className="text-xs text-slate-500 mt-1">{debts.length} سجل دين</p>
        </div>

        {/* Card 2: Pending/Due */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-s-4 border-s-amber-500 border-y border-e border-slate-100 group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-tight uppercase">مستحق الآن</span>
          </div>
          <h3 className="text-2xl font-extrabold tabular-nums text-slate-900">{formatCurrency(pendingToday, currency)}</h3>
          <p className="text-xs text-slate-500 mt-1 italic">
            {debts.filter(d => d.status === 'pending' || d.status === 'partial').length} قسط معلق
          </p>
        </div>

        {/* Card 3: Total Paid YTD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-s-4 border-s-emerald-600 border-y border-e border-slate-100 group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-tight uppercase">إجمالي المدفوع</span>
          </div>
          <h3 className="text-2xl font-extrabold tabular-nums text-emerald-600">{formatCurrency(totalPaid, currency)}</h3>
          <p className="text-xs text-emerald-700 font-bold mt-1">
            {totalDebt > 0 ? ((totalPaid / totalDebt) * 100).toFixed(1) : '0'}% كفاءة
          </p>
        </div>

        {/* Card 4: Remaining Principal */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <PieChart className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-tight uppercase">المبلغ المتبقي</span>
          </div>
          <h3 className="text-2xl font-extrabold tabular-nums text-slate-900">{formatCurrency(totalRemaining, currency)}</h3>
          <p className="text-xs text-slate-500 mt-1">
            عبر {debts.filter(d => d.status !== 'paid').length} خط نشط
          </p>
        </div>
      </div>

      {/* ── Main table card ─────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <DebtsClient debts={debts} currency={currency} />
      </div>
    </div>
  )
}
