import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Calendar, Users, TrendingUp, Wallet, Percent, DollarSign } from 'lucide-react'
import { formatCurrency, formatPercentage, calculateDaysRemaining, getStatusColor, getDaysRemainingColor } from '@/lib/utils'
import Link from 'next/link'
import { getInvestment, getTransactions } from '../actions'
import { TransactionPanel } from '@/components/investments/transaction-panel'
import { PrintButton } from '@/components/print-button'
import type { Database } from '@/types/database'

type Investment      = Database['public']['Tables']['investments']['Row']
type SharedInvestor  = Database['public']['Tables']['shared_investors']['Row']
type Transaction     = Database['public']['Tables']['investment_transactions']['Row']
type InvestmentFull  = Investment & { shared_investors: SharedInvestor[] }

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

const durationLabels: Record<string, string> = {
  monthly: 'شهري',
  quarterly: 'ربع سنوي',
  semi_annual: 'نصف سنوي',
  annual: 'سنوي',
}

export default async function InvestmentDetailPage({ params }: { params: { id: string } }) {
  const [investmentResult, transactionsResult] = await Promise.all([
    getInvestment(params.id),
    getTransactions(params.id),
  ])
  const investment  = investmentResult.success ? (investmentResult.data as InvestmentFull) : null
  const transactions = (transactionsResult.success && transactionsResult.data ? transactionsResult.data : []) as Transaction[]

  if (!investment) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/investments" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          العودة إلى الاستثمارات
        </Link>
        <div className="bg-white rounded-2xl p-20 text-center shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">لم يتم العثور على الاستثمار</h2>
          <p className="text-slate-500 mb-6">قد يكون الاستثمار غير موجود أو تم حذفه.</p>
          <Link href="/dashboard/investments">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
              عرض جميع الاستثمارات
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const daysRemaining = calculateDaysRemaining(new Date(investment.due_date))
  const progressColor = getDaysRemainingColor(daysRemaining)
  const printDate = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-8 print:space-y-4">

      {/* ── Print-only Header ────────────────────────────────── */}
      <div className="hidden print:block border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">كشف حساب استثماري</h1>
            <p className="text-sm text-gray-600 mt-1">Investment Account Statement</p>
          </div>
          <div className="text-end">
            <p className="text-sm font-semibold text-gray-800">تاريخ الإصدار</p>
            <p className="text-sm text-gray-600">{printDate}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-8 text-sm text-gray-700">
          <span><strong>المستثمر:</strong> {investment.investor_name}</span>
          {investment.category_id && (
            <span><strong>التصنيف:</strong> {categoryConfig[investment.category_id]?.label ?? investment.category_id}</span>
          )}
          <span><strong>الحالة:</strong> {statusLabels[investment.status] ?? investment.status}</span>
        </div>
      </div>

      {/* ── Navigation & Actions (screen only) ──────────────────── */}
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard/investments" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          العودة إلى الاستثمارات
        </Link>
        <div className="flex items-center gap-3">
          <PrintButton />
          <Link href={`/dashboard/investments/${params.id}/edit`}>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
              <Edit className="h-4 w-4" />
              تعديل الاستثمار
            </button>
          </Link>
        </div>
      </div>

      {/* ── Investor hero header (screen only) ──────────────────── */}
      <div className="print:hidden bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex items-start justify-between">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{investment.investor_name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {investment.category_id && (
                <Badge
                  variant="outline"
                  style={{
                    borderColor: categoryConfig[investment.category_id]?.color || '#6B7280',
                    color: categoryConfig[investment.category_id]?.color || '#6B7280',
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

        {/* Days remaining badge */}
        <div className="text-end">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">الأيام المتبقية</p>
          <p className={`text-4xl font-extrabold tabular-nums ${daysRemaining < 0 ? 'text-red-600' : daysRemaining < 30 ? 'text-amber-600' : 'text-blue-600'}`}>
            {daysRemaining > 0 ? daysRemaining : 'متأخر'}
          </p>
          {daysRemaining >= 0 && (
            <div className="w-32 h-2 bg-slate-100 rounded-full mt-2 ms-auto">
              <div
                className={`h-full rounded-full ${progressColor}`}
                style={{ width: `${Math.max(5, Math.min(100, 100 - (daysRemaining / 365) * 100))}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Key Metrics Bento Row ────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 print:grid-cols-4 print:gap-3">
        {/* Principal */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 print:border print:shadow-none print:rounded-none">
          <div className="flex items-center gap-2 mb-3 print:hidden">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Wallet className="h-4 w-4" /></div>
          </div>
          <p className="text-xs font-semibold text-slate-500 print:text-gray-500">رأس المال</p>
          <p className="text-2xl font-extrabold tabular-nums text-slate-900 print:text-xl mt-1">{formatCurrency(investment.principal_amount)}</p>
        </div>

        {/* Profit */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 print:border print:shadow-none print:rounded-none">
          <div className="flex items-center gap-2 mb-3 print:hidden">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="h-4 w-4" /></div>
          </div>
          <p className="text-xs font-semibold text-slate-500 print:text-gray-500">الربح</p>
          <p className="text-2xl font-extrabold tabular-nums text-emerald-600 print:text-xl mt-1">+{formatCurrency(investment.profit_amount)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{formatPercentage(investment.profit_rate)} على رأس المال</p>
        </div>

        {/* Commission */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 print:border print:shadow-none print:rounded-none">
          <div className="flex items-center gap-2 mb-3 print:hidden">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Percent className="h-4 w-4" /></div>
          </div>
          <p className="text-xs font-semibold text-slate-500 print:text-gray-500">العمولة</p>
          <p className="text-2xl font-extrabold tabular-nums text-amber-600 print:text-xl mt-1">{formatCurrency(investment.commission_amount)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{formatPercentage(investment.commission_rate)}</p>
        </div>

        {/* Total payout */}
        <div className="bg-blue-600 rounded-2xl p-5 shadow-sm print:border print:shadow-none print:rounded-none print:bg-white">
          <div className="flex items-center gap-2 mb-3 print:hidden">
            <div className="p-2 bg-white/20 text-white rounded-xl"><DollarSign className="h-4 w-4" /></div>
          </div>
          <p className="text-xs font-semibold text-white/70 print:text-gray-500 print:text-slate-500">إجمالي الصرف</p>
          <p className="text-2xl font-extrabold tabular-nums text-white print:text-slate-900 print:text-xl mt-1">{formatCurrency(investment.total_payout)}</p>
        </div>
      </div>

      {/* ── Details + Summary Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
        {/* Investment Details */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 print:border print:shadow-none print:rounded-none">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-6 print:text-base">
            <Calendar className="h-5 w-5 text-blue-600 print:h-4 print:w-4" />
            تفاصيل الاستثمار
          </h3>
          <div className="grid grid-cols-2 gap-6 print:gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">تاريخ البدء</p>
              <p className="font-bold tabular-nums print:text-sm">{new Date(investment.starting_date).toLocaleDateString('ar-SA')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">تاريخ الاستحقاق</p>
              <p className="font-bold tabular-nums print:text-sm">{new Date(investment.due_date).toLocaleDateString('ar-SA')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">مدة الاستثمار</p>
              <p className="font-bold print:text-sm">{durationLabels[investment.duration] ?? investment.duration}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">الأيام المتبقية</p>
              <div className="flex items-center gap-2">
                <span className="font-bold print:text-sm">
                  {daysRemaining > 0 ? `${daysRemaining} يوم` : 'متأخر'}
                </span>
                <div className="w-14 bg-slate-100 rounded-full h-1.5 print:hidden">
                  <div className={`h-1.5 rounded-full ${progressColor}`}
                    style={{ width: `${Math.max(10, Math.min(100, daysRemaining < 0 ? 100 : (90 - daysRemaining) / 90 * 100))}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 print:border print:shadow-none print:rounded-none">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-6 print:text-base">
            <TrendingUp className="h-5 w-5 text-blue-600 print:h-4 print:w-4" />
            ملخص الحسابات
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-sm text-slate-500">رأس المال</span>
              <span className="font-mono font-bold tabular-nums print:text-sm">{formatCurrency(investment.principal_amount)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-sm text-slate-500">الربح ({formatPercentage(investment.profit_rate)})</span>
              <span className="font-mono font-bold text-emerald-600 tabular-nums print:text-sm">+{formatCurrency(investment.profit_amount)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-sm text-slate-500">العمولة ({formatPercentage(investment.commission_rate)})</span>
              <span className="font-mono font-bold text-amber-600 tabular-nums print:text-sm">{formatCurrency(investment.commission_amount)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-bold text-slate-900">إجمالي الصرف</span>
              <span className="font-mono font-extrabold text-lg tabular-nums print:text-base">{formatCurrency(investment.total_payout)}</span>
            </div>
            <div className="mt-2 p-3 bg-blue-50 rounded-xl flex items-center justify-between print:bg-gray-50 print:border print:border-gray-300">
              <span className="text-xs font-semibold text-blue-700 print:text-gray-600">العائد على الاستثمار (ROI)</span>
              <span className="text-sm font-extrabold text-blue-800 print:text-gray-900 tabular-nums">
                {((investment.profit_amount / investment.principal_amount) * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notes ────────────────────────────────────────────────── */}
      {investment.notes && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 print:border print:shadow-none print:rounded-none">
          <h3 className="font-bold text-slate-900 mb-3 print:text-base">ملاحظات</h3>
          <p className="text-slate-600 leading-relaxed print:text-sm">{investment.notes}</p>
        </div>
      )}

      {/* ── Shared Investors Table ───────────────────────────────── */}
      {investment.is_shared && investment.shared_investors && investment.shared_investors.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:border print:shadow-none print:rounded-none print:break-inside-avoid">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600 print:h-4 print:w-4" />
            <h3 className="font-bold text-slate-900 print:text-base">المستثمرون المشتركون</h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 print:hidden">
              {investment.shared_investors.length} مستثمر
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm print:text-xs">
              <thead>
                <tr className="border-b bg-slate-50 print:bg-gray-100">
                  <th className="text-start p-4 font-semibold text-slate-600 print:p-2">اسم المستثمر</th>
                  <th className="text-end p-4 font-semibold text-slate-600 print:p-2">نسبة الحصة %</th>
                  <th className="text-end p-4 font-semibold text-slate-600 print:p-2">رأس مال الحصة</th>
                  <th className="text-end p-4 font-semibold text-slate-600 print:p-2">ربح الحصة</th>
                  <th className="text-end p-4 font-semibold text-slate-600 print:p-2">عمولة خاصة</th>
                  <th className="text-end p-4 font-semibold text-slate-600 print:p-2">عمولة الحصة</th>
                  <th className="text-end p-4 font-semibold text-slate-600 print:p-2">إجمالي الصرف</th>
                </tr>
              </thead>
              <tbody>
                {investment.shared_investors.map((si: SharedInvestor, idx: number) => (
                  <tr key={si.id ?? idx} className="border-b hover:bg-slate-50 transition-colors print:hover:bg-transparent">
                    <td className="p-4 font-semibold text-slate-900 print:p-2">{si.investor_name}</td>
                    <td className="p-4 text-end font-mono tabular-nums print:p-2">{si.share_percentage}%</td>
                    <td className="p-4 text-end font-mono tabular-nums text-slate-700 print:p-2">{formatCurrency(si.share_principal)}</td>
                    <td className="p-4 text-end font-mono tabular-nums text-emerald-600 print:p-2">+{formatCurrency(si.share_profit)}</td>
                    <td className="p-4 text-end font-mono tabular-nums text-slate-500 print:p-2">
                      {si.custom_commission_rate != null ? formatPercentage(si.custom_commission_rate) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="p-4 text-end font-mono tabular-nums text-amber-600 print:p-2">{formatCurrency(si.share_commission)}</td>
                    <td className="p-4 text-end font-mono tabular-nums font-bold text-slate-900 print:p-2">{formatCurrency(si.share_total_payout)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold print:bg-gray-100">
                  <td className="p-4 text-slate-700 print:p-2">المجموع</td>
                  <td className="p-4 text-end font-mono tabular-nums print:p-2">
                    {investment.shared_investors.reduce((s: number, si: SharedInvestor) => s + si.share_percentage, 0)}%
                  </td>
                  <td className="p-4 text-end font-mono tabular-nums print:p-2">{formatCurrency(investment.shared_investors.reduce((s: number, si: SharedInvestor) => s + si.share_principal, 0))}</td>
                  <td className="p-4 text-end font-mono tabular-nums text-emerald-600 print:p-2">+{formatCurrency(investment.shared_investors.reduce((s: number, si: SharedInvestor) => s + si.share_profit, 0))}</td>
                  <td className="p-4 print:p-2"></td>
                  <td className="p-4 text-end font-mono tabular-nums text-amber-600 print:p-2">{formatCurrency(investment.shared_investors.reduce((s: number, si: SharedInvestor) => s + si.share_commission, 0))}</td>
                  <td className="p-4 text-end font-mono tabular-nums font-extrabold print:p-2">{formatCurrency(investment.shared_investors.reduce((s: number, si: SharedInvestor) => s + si.share_total_payout, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Transaction History ──────────────────────────────────── */}
      <div className="print:break-inside-avoid">
        <TransactionPanel
          investmentId={params.id}
          transactions={transactions}
        />
      </div>

      {/* ── Print footer ─────────────────────────────────────────── */}
      <div className="hidden print:block border-t border-gray-300 mt-8 pt-4 text-center text-xs text-gray-400">
        تم إنشاء هذا الكشف بتاريخ {printDate} — منصة Rareb للاستثمارات
      </div>
    </div>
  )
}
