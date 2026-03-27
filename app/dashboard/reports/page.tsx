import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart2,
  PieChart,
  CalendarDays,
  TrendingUp,
  DollarSign,
  Clock,
  Construction,
} from 'lucide-react'
import { getInvestments } from '@/app/dashboard/investments/actions'
import { getDebts } from '@/app/dashboard/debts/actions'
import { formatCurrency } from '@/lib/utils'

const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
  rateb: { label: 'Rateb', color: 'text-blue-700', bg: 'bg-blue-500' },
  'fixed-deposit': { label: 'Fixed Deposit', color: 'text-emerald-700', bg: 'bg-emerald-500' },
  'business-loan': { label: 'Business Loan', color: 'text-amber-700', bg: 'bg-amber-500' },
  'personal-loan': { label: 'Personal Loan', color: 'text-purple-700', bg: 'bg-purple-500' },
}

const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

export default async function ReportsPage() {
  const [investmentsResult, debtsResult] = await Promise.all([
    getInvestments(),
    getDebts(),
  ])

  const investments = (investmentsResult.success ? investmentsResult.data : []) as any[]
  const debts = (debtsResult.success ? debtsResult.data : []) as any[]

  // ── Portfolio Growth data: group investments by creation month (last 6 months) ──
  const now = new Date()
  const growthMonths: { label: string; value: number; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = MONTH_NAMES_AR[d.getMonth()]
    const monthInvs = investments.filter((inv) => {
      const c = new Date(inv.created_at)
      return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth()
    })
    growthMonths.push({
      label,
      value: monthInvs.reduce((s: number, inv: any) => s + (inv.principal_amount ?? 0), 0),
      count: monthInvs.length,
    })
  }
  const maxGrowth = Math.max(...growthMonths.map((m) => m.value), 1)

  // ── Category Distribution ──
  const categoryTotals: Record<string, number> = {}
  investments.forEach((inv: any) => {
    const key = inv.category_id ?? 'other'
    categoryTotals[key] = (categoryTotals[key] ?? 0) + (inv.principal_amount ?? 0)
  })
  const totalPortfolio = Object.values(categoryTotals).reduce((s, v) => s + v, 0) || 1
  const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])

  // ── Monthly Revenue Schedule: investments due within next 12 months ──
  const scheduleMonths: { label: string; date: Date; items: any[] }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const due = investments.filter((inv: any) => {
      if (!inv.due_date) return false
      const dd = new Date(inv.due_date)
      return dd >= d && dd < nextMonth
    })
    if (due.length > 0 || i < 3) {
      scheduleMonths.push({ label: MONTH_NAMES_AR[d.getMonth()], date: d, items: due })
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">التقارير</h1>
          <p className="text-gray-500 mt-1">تحليل شامل لأداء محفظتك الاستثمارية</p>
        </div>
        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 flex items-center gap-1.5 px-3 py-1.5">
          <Construction className="h-3.5 w-3.5" />
          قيد التطوير — الرسوم البيانية التفاعلية قادمة
        </Badge>
      </div>

      {/* ── 1. Portfolio Growth (Bar Chart) ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="h-5 w-5 text-blue-600" />
            نمو المحفظة — آخر 6 أشهر
          </CardTitle>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <BarChart2 className="h-14 w-14 mb-3" />
              <p className="text-sm text-gray-400">لا توجد بيانات استثمار بعد</p>
            </div>
          ) : (
            <div className="mt-4">
              {/* Bar chart */}
              <div className="flex items-end gap-3 h-40">
                {growthMonths.map((m, idx) => {
                  const pct = maxGrowth > 0 ? (m.value / maxGrowth) * 100 : 0
                  const isCurrentMonth = idx === growthMonths.length - 1
                  return (
                    <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-500 font-mono">
                        {m.value > 0 ? formatCurrency(m.value).replace('SAR', '').trim() : '—'}
                      </span>
                      <div className="w-full flex items-end h-28 relative group">
                        <div
                          className={`w-full rounded-t-md transition-all ${isCurrentMonth ? 'bg-blue-600' : 'bg-blue-200'} group-hover:bg-blue-400`}
                          style={{ height: `${Math.max(pct, m.value > 0 ? 4 : 0)}%` }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 start-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                            {m.count} استثمار — {formatCurrency(m.value)}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500">{m.label}</span>
                    </div>
                  )
                })}
              </div>
              {/* Summary */}
              <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-xs text-gray-500">إجمالي الاستثمارات</p>
                  <p className="font-bold text-gray-900">{investments.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">إجمالي رأس المال</p>
                  <p className="font-bold text-gray-900">{formatCurrency(investments.reduce((s: number, i: any) => s + (i.principal_amount ?? 0), 0))}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">إجمالي الأرباح المتوقعة</p>
                  <p className="font-bold text-emerald-600">{formatCurrency(investments.reduce((s: number, i: any) => s + (i.profit_amount ?? 0), 0))}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 2. Category Distribution (Pie placeholder) ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="h-5 w-5 text-purple-600" />
            توزيع المحفظة حسب الفئة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <PieChart className="h-14 w-14 mb-3" />
              <p className="text-sm text-gray-400">لا توجد بيانات فئات بعد</p>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-8 mt-2">
              {/* Donut SVG */}
              <div className="relative flex-shrink-0">
                <svg viewBox="0 0 120 120" className="w-36 h-36 -rotate-90">
                  {(() => {
                    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280']
                    let offset = 0
                    const circumference = 2 * Math.PI * 40
                    return categoryEntries.map(([key, val], i) => {
                      const pct = val / totalPortfolio
                      const dash = pct * circumference
                      const gap = circumference - dash
                      const el = (
                        <circle
                          key={key}
                          cx="60" cy="60" r="40"
                          fill="none"
                          stroke={colors[i % colors.length]}
                          strokeWidth="20"
                          strokeDasharray={`${dash} ${gap}`}
                          strokeDashoffset={-offset}
                        />
                      )
                      offset += dash
                      return el
                    })
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-gray-500">المجموع</span>
                  <span className="text-sm font-bold text-gray-900">{investments.length}</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-3 w-full">
                {categoryEntries.map(([key, val], i) => {
                  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500', 'bg-gray-500']
                  const pct = ((val / totalPortfolio) * 100).toFixed(1)
                  const conf = categoryConfig[key]
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full flex-shrink-0 ${colors[i % colors.length]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {conf?.label ?? key}
                          </span>
                          <span className="text-xs text-gray-500 ms-2">{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${colors[i % colors.length]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{formatCurrency(val)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 3. Monthly Revenue Schedule ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
            جدول الإيرادات الشهري — الاستحقاقات القادمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <CalendarDays className="h-14 w-14 mb-3" />
              <p className="text-sm text-gray-400">لا توجد استثمارات مجدولة</p>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {scheduleMonths.filter(m => m.items.length > 0).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Clock className="h-10 w-10 mb-2 text-gray-200" />
                  <p className="text-sm">لا توجد استحقاقات في الأشهر الـ 12 القادمة</p>
                </div>
              ) : (
                scheduleMonths
                  .filter((m) => m.items.length > 0)
                  .map((month) => {
                    const totalPayout = month.items.reduce((s: number, i: any) => s + (i.total_payout ?? 0), 0)
                    const totalProfit = month.items.reduce((s: number, i: any) => s + (i.profit_amount ?? 0), 0)
                    return (
                      <div key={month.label} className="border border-gray-100 rounded-xl overflow-hidden">
                        {/* Month header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold text-sm text-gray-800">
                              {month.label} {month.date.getFullYear()}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {month.items.length} استثمار
                            </Badge>
                          </div>
                          <div className="text-end">
                            <p className="text-xs text-gray-500">إجمالي الصرف</p>
                            <p className="font-bold text-sm text-gray-900">{formatCurrency(totalPayout)}</p>
                          </div>
                        </div>

                        {/* Investment rows */}
                        <div className="divide-y divide-gray-50">
                          {month.items.map((inv: any) => (
                            <div key={inv.id} className="flex items-center justify-between px-4 py-3 hover:bg-blue-50/30 transition-colors">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{inv.investor_name}</p>
                                <p className="text-xs text-gray-500">
                                  استحقاق: {new Date(inv.due_date).toLocaleDateString('ar-SA')}
                                </p>
                              </div>
                              <div className="text-end space-y-0.5">
                                <div className="flex items-center gap-2 justify-end">
                                  <span className="text-xs text-gray-400">رأس المال:</span>
                                  <span className="text-sm font-mono text-gray-700">{formatCurrency(inv.principal_amount)}</span>
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                                  <span className="text-sm font-mono font-semibold text-emerald-600">+{formatCurrency(inv.profit_amount)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Month footer totals */}
                        <div className="flex items-center justify-between px-4 py-2 bg-emerald-50 border-t border-emerald-100">
                          <span className="text-xs text-emerald-700 font-medium">إجمالي الأرباح المتوقعة هذا الشهر</span>
                          <span className="font-bold text-emerald-700 font-mono">{formatCurrency(totalProfit)}</span>
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
