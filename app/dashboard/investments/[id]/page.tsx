import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Calendar, Users, TrendingUp } from 'lucide-react'
import { formatCurrency, formatPercentage, calculateDaysRemaining, getStatusColor, getDaysRemainingColor } from '@/lib/utils'
import Link from 'next/link'
import { getInvestment, getTransactions } from '../actions'
import { TransactionPanel } from '@/components/investments/transaction-panel'

const categoryConfig: Record<string, { label: string; color: string }> = {
  rateb: { label: 'Rateb', color: '#3B82F6' },
  'fixed-deposit': { label: 'Fixed Deposit', color: '#10B981' },
  'business-loan': { label: 'Business Loan', color: '#F59E0B' },
  'personal-loan': { label: 'Personal Loan', color: '#8B5CF6' },
}

const statusLabels: Record<string, string> = {
  active: 'نشط',
  matured: 'منتهي',
  renewed: 'مجدد',
  withdrawn: 'مسحوب',
}

export default async function InvestmentDetailPage({ params }: { params: { id: string } }) {
  const [investmentResult, transactionsResult] = await Promise.all([
    getInvestment(params.id),
    getTransactions(params.id),
  ])
  const investment = investmentResult.success ? investmentResult.data as any : null
  const transactions = (transactionsResult.success && transactionsResult.data ? transactionsResult.data : []) as any[]

  if (!investment) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/investments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="me-2 h-4 w-4" />
            العودة إلى الاستثمارات
          </Button>
        </Link>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">لم يتم العثور على الاستثمار</h2>
          <p className="text-gray-500">قد يكون الاستثمار غير موجود أو تم حذفه.</p>
          <Link href="/dashboard/investments">
            <Button className="mt-4">عرض جميع الاستثمارات</Button>
          </Link>
        </div>
      </div>
    )
  }

  const daysRemaining = calculateDaysRemaining(new Date(investment.due_date))
  const progressColor = getDaysRemainingColor(daysRemaining)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/investments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="me-2 h-4 w-4" />
            العودة إلى الاستثمارات
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/investments/${params.id}/edit`}>
            <Button variant="outline">
              <Edit className="me-2 h-4 w-4" />
              تعديل الاستثمار
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{investment.investor_name}</h1>
          <div className="flex items-center gap-3 mt-2">
            {investment.category_id && (
              <Badge
                variant="outline"
                style={{ 
                  borderColor: categoryConfig[investment.category_id]?.color || '#6B7280', 
                  color: categoryConfig[investment.category_id]?.color || '#6B7280' 
                }}
              >
                {categoryConfig[investment.category_id]?.label || investment.category_id}
              </Badge>
            )}
            <Badge className={getStatusColor(investment.status)}>
              {statusLabels[investment.status] ?? investment.status}
            </Badge>
            {investment.is_shared && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <Users className="me-1 h-3 w-3" />
                استثمار مشترك
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">رأس المال</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(investment.principal_amount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">الربح</p>
            <p className="text-2xl font-bold text-emerald-600">+{formatCurrency(investment.profit_amount)}</p>
            <p className="text-xs text-gray-500">{formatPercentage(investment.profit_rate)} على رأس المال</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">العمولة</p>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(investment.commission_amount)}</p>
            <p className="text-xs text-gray-500">{formatPercentage(investment.commission_rate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">إجمالي الصرف</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(investment.total_payout)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              تفاصيل الاستثمار
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">تاريخ البدء</p>
                <p className="font-medium">{new Date(investment.starting_date).toLocaleDateString('ar-SA')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">تاريخ الاستحقاق</p>
                <p className="font-medium">{new Date(investment.due_date).toLocaleDateString('ar-SA')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">مدة الاستثمار</p>
                <p className="font-medium">{investment.duration}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">الأيام المتبقية</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {daysRemaining > 0 ? `${daysRemaining} يوم` : 'متأخر'}
                  </span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${progressColor}`}
                      style={{ width: `${Math.max(10, Math.min(100, daysRemaining < 0 ? 100 : (90 - daysRemaining) / 90 * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              ملخص الحسابات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">رأس المال:</span>
              <span className="font-mono font-semibold">{formatCurrency(investment.principal_amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">الربح ({formatPercentage(investment.profit_rate)}):</span>
              <span className="font-mono font-semibold text-emerald-600">+{formatCurrency(investment.profit_amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">العمولة ({formatPercentage(investment.commission_rate)}):</span>
              <span className="font-mono font-semibold text-amber-600">{formatCurrency(investment.commission_amount)}</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900">إجمالي الصرف:</span>
              <span className="font-mono font-bold text-lg">{formatCurrency(investment.total_payout)}</span>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-blue-600 font-medium">العائد على الاستثمار</div>
              <div className="text-sm text-blue-800">
                {((investment.profit_amount / investment.principal_amount) * 100).toFixed(2)}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {investment.notes && (
        <Card>
          <CardHeader>
            <CardTitle>ملاحظات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{investment.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Shared Investors Table */}
      {investment.is_shared && investment.shared_investors && investment.shared_investors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              المستثمرون المشتركون
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {investment.shared_investors.length} مستثمر
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-start p-3 font-medium text-gray-600">اسم المستثمر</th>
                    <th className="text-end p-3 font-medium text-gray-600">نسبة الحصة %</th>
                    <th className="text-end p-3 font-medium text-gray-600">رأس مال الحصة</th>
                    <th className="text-end p-3 font-medium text-gray-600">ربح الحصة</th>
                    <th className="text-end p-3 font-medium text-gray-600">عمولة خاصة</th>
                    <th className="text-end p-3 font-medium text-gray-600">عمولة الحصة</th>
                    <th className="text-end p-3 font-medium text-gray-600">إجمالي الصرف</th>
                  </tr>
                </thead>
                <tbody>
                  {investment.shared_investors.map((si: any, idx: number) => (
                    <tr key={si.id ?? idx} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium text-gray-900">{si.investor_name}</td>
                      <td className="p-3 text-end font-mono">
                        <Badge variant="outline">{si.share_percentage}%</Badge>
                      </td>
                      <td className="p-3 text-end font-mono text-gray-700">{formatCurrency(si.share_principal)}</td>
                      <td className="p-3 text-end font-mono text-emerald-600">+{formatCurrency(si.share_profit)}</td>
                      <td className="p-3 text-end font-mono text-gray-500">
                        {si.custom_commission_rate != null
                          ? formatPercentage(si.custom_commission_rate)
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="p-3 text-end font-mono text-amber-600">{formatCurrency(si.share_commission)}</td>
                      <td className="p-3 text-end font-mono font-bold text-gray-900">{formatCurrency(si.share_total_payout)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="p-3 text-gray-700">المجموع</td>
                    <td className="p-3 text-end font-mono">
                      {investment.shared_investors.reduce((s: number, si: any) => s + si.share_percentage, 0)}%
                    </td>
                    <td className="p-3 text-end font-mono">{formatCurrency(investment.shared_investors.reduce((s: number, si: any) => s + si.share_principal, 0))}</td>
                    <td className="p-3 text-end font-mono text-emerald-600">+{formatCurrency(investment.shared_investors.reduce((s: number, si: any) => s + si.share_profit, 0))}</td>
                    <td className="p-3"></td>
                    <td className="p-3 text-end font-mono text-amber-600">{formatCurrency(investment.shared_investors.reduce((s: number, si: any) => s + si.share_commission, 0))}</td>
                    <td className="p-3 text-end font-mono font-bold">{formatCurrency(investment.shared_investors.reduce((s: number, si: any) => s + si.share_total_payout, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <TransactionPanel
        investmentId={params.id}
        transactions={transactions}
      />
    </div>
  )
}
