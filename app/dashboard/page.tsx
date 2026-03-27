import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, DollarSign, Percent, Calendar, Plus, TrendingDown } from 'lucide-react'
import { formatCurrency, calculateDaysRemaining, getDaysRemainingColor } from '@/lib/utils'
import Link from 'next/link'
import { getInvestments } from './investments/actions'
import { getDebts } from './debts/actions'

export default async function DashboardPage() {
  const [investmentsResult, debtsResult] = await Promise.all([
    getInvestments(),
    getDebts(),
  ])

  const investments: any[] = investmentsResult.success && investmentsResult.data ? investmentsResult.data as any[] : []
  const debts: any[] = debtsResult.success && debtsResult.data ? debtsResult.data as any[] : []

  const activeInvestments = investments.filter((i) => i.status === 'active')
  const totalPortfolioValue = activeInvestments.reduce((sum, i) => sum + (i.principal_amount || 0), 0)
  const totalPendingProfits = activeInvestments.reduce((sum, i) => sum + (i.profit_amount || 0), 0)
  const totalCommissions = activeInvestments.reduce((sum, i) => sum + (i.commission_amount || 0), 0)
  const totalDebtRemaining = debts.reduce((sum, d) => sum + (d.remaining_amount || 0), 0)

  // Investments maturing within 90 days, sorted by soonest
  const maturingInvestments = activeInvestments
    .filter((i) => {
      if (!i.due_date) return false
      const days = calculateDaysRemaining(new Date(i.due_date))
      return days >= 0 && days <= 90
    })
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5)

  // Recent investments (last 5 created)
  const recentInvestments = [...investments]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-600 mt-1">مرحباً بك — إليك نظرة عامة على محفظتك</p>
        </div>
        <Link href="/dashboard/investments/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="me-2 h-4 w-4" />
            استثمار جديد
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">إجمالي قيمة المحفظة</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalPortfolioValue)}</div>
            <p className="text-xs text-gray-500 mt-1">{activeInvestments.length} استثمار نشط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">الأرباح المتوقعة</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPendingProfits)}</div>
            <p className="text-xs text-gray-500 mt-1">عائد متوقع على المحفظة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">إجمالي العمولات</CardTitle>
            <Percent className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalCommissions)}</div>
            <p className="text-xs text-gray-500 mt-1">عمولات محققة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">الديون المتبقية</CardTitle>
            <TrendingDown className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDebtRemaining)}</div>
            <p className="text-xs text-gray-500 mt-1">{debts.filter(d => d.status !== 'paid').length} دين نشط</p>
          </CardContent>
        </Card>
      </div>

      {/* Maturing Soon Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">استثمارات تستحق قريباً</CardTitle>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              {maturingInvestments.length} استثمار
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {maturingInvestments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p>لا توجد استثمارات تستحق خلال الـ 90 يوماً القادمة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {maturingInvestments.map((investment) => {
                const daysRemaining = calculateDaysRemaining(new Date(investment.due_date))
                const progressColor = getDaysRemainingColor(daysRemaining)
                return (
                  <div
                    key={investment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{investment.investor_name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-600">
                          رأس المال: {formatCurrency(investment.principal_amount)}
                        </span>
                        {investment.category_id && (
                          <Badge variant="outline" className="text-xs">
                            {investment.category_id}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-end">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(investment.total_payout)}
                        </div>
                        <div className="text-xs text-emerald-600">
                          +{formatCurrency(investment.profit_amount)} ربح
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div className="text-end">
                          <div className="text-sm font-medium text-gray-900">
                            {daysRemaining} يوم متبقي
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className={`h-2 rounded-full ${progressColor}`}
                              style={{
                                width: `${Math.max(10, Math.min(100, (90 - daysRemaining) / 90 * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <Link href={`/dashboard/investments/${investment.id}`}>
                        <Button variant="outline" size="sm">عرض التفاصيل</Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Investments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">آخر الاستثمارات</CardTitle>
            <Link href="/dashboard/investments">
              <Button variant="ghost" size="sm" className="text-blue-600">عرض الكل</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentInvestments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p>لا توجد استثمارات حالياً — ابدأ بإضافة أول استثمار</p>
              <Link href="/dashboard/investments/new">
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                  <Plus className="me-2 h-4 w-4" />
                  استثمار جديد
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInvestments.map((investment) => (
                <div
                  key={investment.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{investment.investor_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(investment.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-end">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(investment.principal_amount)}</p>
                      <p className="text-xs text-emerald-600">+{formatCurrency(investment.profit_amount)}</p>
                    </div>
                    <Badge
                      className={
                        investment.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : investment.status === 'matured'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                      }
                    >
                      {investment.status === 'active' ? 'نشط' : investment.status === 'matured' ? 'منتهي' : investment.status}
                    </Badge>
                    <Link href={`/dashboard/investments/${investment.id}`}>
                      <Button variant="ghost" size="sm">عرض</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
