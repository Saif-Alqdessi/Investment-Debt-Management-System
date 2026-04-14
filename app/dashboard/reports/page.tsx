import { getInvestments } from '@/app/dashboard/investments/actions'
import { formatCurrency } from '@/lib/utils'
import { ReportExportButton } from '@/components/report-export-button'
import { TrendingUp, CalendarDays, Clock } from 'lucide-react'
import type { Database } from '@/types/database'

type Investment = Database['public']['Tables']['investments']['Row']

const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

const categoryConfig: Record<string, { label: string }> = {
  rateb: { label: 'Rateb' },
  'fixed-deposit': { label: 'Fixed Deposit' },
  'business-loan': { label: 'Business Loan' },
  'personal-loan': { label: 'Personal Loan' },
}

export default async function ReportsPage() {
  const [investmentsResult] = await Promise.all([
    getInvestments(),
  ])

  const investments = (investmentsResult.success ? investmentsResult.data : []) as Investment[]

  // ── KPI Calculations ─────────────────────────────────────────────────────
  const totalCapital   = investments.reduce((s, i) => s + (Number(i.principal_amount) || 0), 0)
  const totalProfits   = investments.reduce((s, i) => s + (Number(i.profit_amount)    || 0), 0)
  const totalROI       = totalCapital > 0 ? (totalProfits / totalCapital) * 100 : 0
  const monthlyProfit  = totalProfits / 12

  // Risk score: % of investments past due
  const overdueCount   = investments.filter(i => {
    if (!i.due_date) return false
    return new Date(i.due_date as string) < new Date() && i.status === 'active'
  }).length
  const riskPct        = investments.length > 0 ? (overdueCount / investments.length) * 100 : 0
  const riskLabel      = riskPct < 15 ? 'منخفض' : riskPct < 40 ? 'متوسط' : 'مرتفع'
  const riskColor      = riskPct < 15 ? 'text-emerald-600 bg-emerald-50' : riskPct < 40 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'
  const riskBarColor   = riskPct < 15 ? 'bg-emerald-500' : riskPct < 40 ? 'bg-amber-500' : 'bg-red-500'

  // ── Portfolio Growth: group by month (last 12) ──────────────────────────
  const now = new Date()
  const growthMonths: { label: string; value: number; count: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthInvs = investments.filter((inv) => {
      const c = new Date(inv.created_at as string)
      return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth()
    })
    growthMonths.push({
      label: MONTH_NAMES_AR[d.getMonth()],
      value: monthInvs.reduce((s, inv) => s + (Number(inv.principal_amount) || 0), 0),
      count: monthInvs.length,
    })
  }
  // maxGrowth used only if rendering bar heights — kept via cumulativeValues below

  // Compute cumulative for SVG path
  const cumulativeValues = growthMonths.reduce<number[]>((acc, m, i) => {
    acc.push((acc[i - 1] ?? 0) + m.value)
    return acc
  }, [])
  const maxCumulative = Math.max(...cumulativeValues, 1)

  // SVG area path (0-1000 wide, 0-100 tall, inverted Y)
  const points = cumulativeValues.map((v, i) => {
    const x = (i / (cumulativeValues.length - 1)) * 1000
    const y = 100 - (v / maxCumulative) * 90
    return `${x},${y}`
  })
  const linePath = `M${points.join(' L')}`
  const areaPath = `${linePath} L1000,100 L0,100 Z`

  // ── Category Distribution ────────────────────────────────────────────────
  const categoryTotals: Record<string, number> = {}
  investments.forEach((inv) => {
    const key = inv.category_id ?? 'other'
    categoryTotals[key] = (categoryTotals[key] ?? 0) + (inv.principal_amount ?? 0)
  })
  const totalPortfolio = Object.values(categoryTotals).reduce((s, v) => s + v, 0) || 1
  const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])

  // SVG donut segments
  const donutColors = ['stroke-blue-600', 'stroke-emerald-600', 'stroke-amber-500', 'stroke-purple-500', 'stroke-pink-500']
  const dotColors   = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500']
  const circumference = 2 * Math.PI * 16
  let donutOffset = 0
  const donutSegments = categoryEntries.map(([key, val], i) => {
    const pct = val / totalPortfolio
    const dash = pct * circumference
    const gap  = circumference - dash
    const seg  = { key, val, pct, dash, gap, offset: donutOffset, colorClass: donutColors[i % donutColors.length] }
    donutOffset += dash
    return seg
  })

  // ── Revenue Schedule ─────────────────────────────────────────────────────
  const scheduleMonths: { label: string; date: Date; items: Investment[] }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const due = investments.filter((inv) => {
      if (!inv.due_date) return false
      const dd = new Date(inv.due_date)
      return dd >= d && dd < next
    })
    if (due.length > 0 || i < 3) {
      scheduleMonths.push({ label: MONTH_NAMES_AR[d.getMonth()], date: d, items: due })
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">التقارير المالية</h1>
        <p className="text-slate-500 text-base mt-1">نظرة تحليلية شاملة على أداء محفظتك الاستثمارية ونمو الأصول</p>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* ROI */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-s-4 border-s-blue-600 border-y border-e border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-1">إجمالي العائد ROI</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-slate-900">{totalROI.toFixed(1)}%</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              نشط
            </span>
          </div>
        </div>

        {/* Monthly profit */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-1">صافي الربح الشهري</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-slate-900">{formatCurrency(monthlyProfit)}</span>
          </div>
        </div>

        {/* Annual revenue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-1">الإيرادات السنوية المتوقعة</p>
          <span className="text-2xl font-bold tabular-nums text-slate-900">{formatCurrency(totalProfits)}</span>
        </div>

        {/* Risk */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-2">مؤشر مخاطر المحفظة</p>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${riskBarColor}`} style={{ width: `${Math.max(riskPct, 5)}%` }} />
            </div>
            <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${riskColor}`}>{riskLabel}</span>
          </div>
        </div>
      </div>

      {/* ── Area Chart ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900">نمو الاستثمارات بمرور الوقت</h3>
            <p className="text-sm text-slate-500 mt-0.5">تحليل تراكمي للأصول خلال الـ 12 شهراً الماضية</p>
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <span className="px-4 py-1.5 text-xs font-bold bg-white text-blue-600 rounded-md shadow-sm">سنوي</span>
            <span className="px-4 py-1.5 text-xs font-bold text-slate-500">شهري</span>
          </div>
        </div>

        {/* SVG Area Chart */}
        <div className="h-64 w-full relative">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
            {[0,1,2,3].map(i => <div key={i} className="border-b border-slate-400 w-full" />)}
          </div>
          {investments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <TrendingUp className="h-12 w-12 mb-2" />
              <p className="text-sm text-slate-400">لا توجد بيانات استثمار بعد</p>
            </div>
          ) : (
            <svg
              className="absolute bottom-8 inset-x-0 w-full"
              style={{ height: '85%' }}
              viewBox="0 0 1000 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chart-grad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#004ac6" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#004ac6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#chart-grad)" />
              <path d={linePath} fill="none" stroke="#004ac6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {/* Month labels */}
          <div className="absolute bottom-0 inset-x-0 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">
            {growthMonths.filter((_, i) => i % 2 === 0).map(m => <span key={m.label}>{m.label}</span>)}
          </div>
        </div>
      </div>

      {/* ── Split: Distribution + Top Performers ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Donut: Investment Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">توزيع الاستثمارات</h3>
          {categoryEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300">
              <p className="text-sm text-slate-400 mt-2">لا توجد بيانات فئات</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* SVG Donut */}
              <div className="relative w-40 h-40 mb-8">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle className="stroke-slate-100" cx="18" cy="18" fill="none" r="16" strokeWidth="4" />
                  {donutSegments.map(seg => (
                    <circle
                      key={seg.key}
                      className={seg.colorClass}
                      cx="18" cy="18" fill="none" r="16"
                      strokeWidth="4"
                      strokeDasharray={`${seg.dash} ${seg.gap}`}
                      strokeDashoffset={-seg.offset}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold tabular-nums">100%</span>
                  <span className="text-[10px] text-slate-500 font-bold">إجمالي المحفظة</span>
                </div>
              </div>
              {/* Legend */}
              <div className="w-full space-y-3">
                {donutSegments.map((seg, i) => (
                  <div key={seg.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${dotColors[i % dotColors.length]}`} />
                      <span className="text-sm font-medium text-slate-500">
                        {categoryConfig[seg.key]?.label ?? seg.key}
                      </span>
                    </div>
                    <span className="text-sm font-bold tabular-nums">{(seg.pct * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Revenue Schedule */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">جدول الإيرادات الشهري</h3>
          {investments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300">
              <CalendarDays className="h-12 w-12 mb-2" />
              <p className="text-sm text-slate-400">لا توجد استثمارات مجدولة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-4 text-start">المستثمر</th>
                    <th className="pb-4 text-center">تاريخ الاستحقاق</th>
                    <th className="pb-4 text-end">الأرباح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {scheduleMonths
                    .filter(m => m.items.length > 0)
                    .flatMap(m => m.items)
                    .slice(0, 6)
                    .map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                              <TrendingUp className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{inv.investor_name}</p>
                              <p className="text-[10px] text-slate-400">{formatCurrency(inv.principal_amount)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <span className="text-sm font-medium text-slate-600 tabular-nums">
                            {new Date(inv.due_date).toLocaleDateString('ar-SA')}
                          </span>
                        </td>
                        <td className="py-4 text-end">
                          <span className="text-sm font-bold text-emerald-600 tabular-nums">
                            +{formatCurrency(inv.profit_amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  {scheduleMonths.every(m => m.items.length === 0) && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-sm text-slate-400">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                        لا توجد استحقاقات في الأشهر القادمة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Export Footer Banner ─────────────────────────────────── */}
      <div className="bg-blue-600 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-600/20">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <span className="text-white font-bold text-xl">📄</span>
          </div>
          <div>
            <h4 className="text-white text-xl font-bold mb-1">التقرير السنوي الكامل {new Date().getFullYear()}</h4>
            <p className="text-white/70 text-sm">يتضمن تحليل المخاطر، العوائد التفصيلية، والتوقعات المالية للعام القادم.</p>
          </div>
        </div>
        <ReportExportButton />
      </div>
    </div>
  )
}
