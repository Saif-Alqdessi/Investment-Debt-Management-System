'use client'

import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Users,
  Loader2
} from 'lucide-react'
import { formatCurrency, formatPercentage, calculateDaysRemaining, getStatusColor, getDaysRemainingColor } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/context'
import Link from 'next/link'

const categoryConfig: Record<string, { label: string; color: string }> = {
  rateb: { label: 'Rateb', color: '#3B82F6' },
  'fixed-deposit': { label: 'Fixed Deposit', color: '#10B981' },
  'business-loan': { label: 'Business Loan', color: '#F59E0B' },
  'personal-loan': { label: 'Personal Loan', color: '#8B5CF6' },
}

interface Investment {
  id: string
  investor_name: string
  principal_amount: number
  starting_date: string
  due_date: string
  category_id: string | null
  duration: 'annual' | 'semi_annual' | 'quarterly' | 'monthly'
  profit_rate: number
  commission_rate: number
  profit_amount: number
  commission_amount: number
  total_payout: number
  status: 'active' | 'matured' | 'renewed' | 'withdrawn'
  is_shared: boolean
  notes?: string
  created_at: string
}

interface InvestmentTableProps {
  investments: Investment[]
  onDelete?: (id: string) => void
  loading?: boolean
}

export function InvestmentTable({ investments, onDelete, loading }: InvestmentTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const router = useRouter()
  const { t } = useLanguage()

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const getDurationLabel = (duration: string) => t(`investments.${duration}`)

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      onDelete?.(id)
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">{t('investments.investor')}</TableHead>
            <TableHead className="text-right ltr:text-right rtl:text-left">{t('forms.principal_amount')}</TableHead>
            <TableHead>{t('investments.start_date')}</TableHead>
            <TableHead>{t('investments.due_date')}</TableHead>
            <TableHead>{t('investments.category')}</TableHead>
            <TableHead>{t('investments.duration')}</TableHead>
            <TableHead className="text-right ltr:text-right rtl:text-left">{t('investments.profit_pct')}</TableHead>
            <TableHead className="text-right ltr:text-right rtl:text-left">{t('investments.com_pct')}</TableHead>
            <TableHead className="text-right ltr:text-right rtl:text-left">{t('investments.profit_amt')}</TableHead>
            <TableHead className="text-right ltr:text-right rtl:text-left">{t('investments.commission_amt')}</TableHead>
            <TableHead className="text-right ltr:text-right rtl:text-left">{t('investments.total_payout')}</TableHead>
            <TableHead>{t('investments.status')}</TableHead>
            <TableHead>{t('investments.days_remaining')}</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {investments.map((investment) => {
            const daysRemaining = calculateDaysRemaining(new Date(investment.due_date))
            const progressColor = getDaysRemainingColor(daysRemaining)
            const isExpanded = expandedRows.has(investment.id)
            
            return (
              <Fragment key={investment.id}>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{investment.investor_name}</span>
                      {investment.is_shared && (
                        <span title={t('investments.shared_investment')}>
                          <Users className="h-4 w-4 text-blue-500" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right ltr:text-right rtl:text-left font-mono">
                    {formatCurrency(investment.principal_amount)}
                  </TableCell>
                  <TableCell>
                    {new Date(investment.starting_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{new Date(investment.due_date).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {investment.category_id ? (
                      <Badge 
                        variant="outline" 
                        style={{ 
                          borderColor: categoryConfig[investment.category_id]?.color || '#6B7280',
                          color: categoryConfig[investment.category_id]?.color || '#6B7280' 
                        }}
                      >
                        {categoryConfig[investment.category_id]?.label || investment.category_id}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getDurationLabel(investment.duration)}</TableCell>
                  <TableCell className="text-right ltr:text-right rtl:text-left font-mono">
                    {formatPercentage(investment.profit_rate)}
                  </TableCell>
                  <TableCell className="text-right ltr:text-right rtl:text-left font-mono">
                    {formatPercentage(investment.commission_rate)}
                  </TableCell>
                  <TableCell className="text-right ltr:text-right rtl:text-left font-mono text-emerald-600">
                    {formatCurrency(investment.profit_amount)}
                  </TableCell>
                  <TableCell className="text-right ltr:text-right rtl:text-left font-mono text-amber-600">
                    {formatCurrency(investment.commission_amount)}
                  </TableCell>
                  <TableCell className="text-right ltr:text-right rtl:text-left font-mono font-semibold">
                    {formatCurrency(investment.total_payout)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(investment.status)}>
                      {investment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium min-w-[60px]">
                        {daysRemaining > 0 ? `${daysRemaining} ${t('investments.days')}` : t('investments.overdue')}
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${progressColor}`}
                          style={{ 
                            width: `${Math.max(10, Math.min(100, daysRemaining < 0 ? 100 : (90 - daysRemaining) / 90 * 100))}%` 
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(investment.id)}
                        title={t('investments.details')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/investments/${investment.id}/edit`)}
                        title={t('investments.edit_investment')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(investment.id)}
                        title={t('debts.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={14} className="bg-gray-50 p-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">{t('investments.details')}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">{t('investments.created')}</label>
                            <p className="text-sm text-gray-900">
                              {new Date(investment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">{t('investments.investment_id')}</label>
                            <p className="text-sm text-gray-900 font-mono">{investment.id}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">{t('investments.type')}</label>
                            <p className="text-sm text-gray-900">
                              {investment.is_shared ? t('investments.shared_investment') : t('investments.individual_investment')}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">{t('investments.roi')}</label>
                            <p className="text-sm text-emerald-600 font-semibold">
                              {((investment.profit_amount / investment.principal_amount) * 100).toFixed(2)}%
                            </p>
                          </div>
                        </div>
                        {investment.notes && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">{t('forms.notes')}</label>
                            <p className="text-sm text-gray-900 mt-1">{investment.notes}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-3 pt-2">
                          <Link href={`/dashboard/investments/${investment.id}`}>
                            <Button size="sm" variant="outline">
                              {t('investments.view_full_details')}
                            </Button>
                          </Link>
                          <Link href={`/dashboard/investments/${investment.id}/edit`}>
                            <Button size="sm" variant="outline">
                              {t('investments.edit_investment')}
                            </Button>
                          </Link>
                          {investment.is_shared && (
                            <Button size="sm" variant="outline">
                              {t('investments.manage_sub_investors')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
      
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ms-3 text-gray-500">جاري تحميل البيانات…</span>
        </div>
      )}
      {!loading && investments.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-700">لا توجد استثمارات حالياً</p>
          <p className="text-sm text-gray-500 mt-1">ابدأ بإضافة أول استثمار لعميلك</p>
          <Link href="/dashboard/investments/new">
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
              إضافة استثمار
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
