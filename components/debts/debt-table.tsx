'use client'

import { Fragment, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, DollarSign, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { formatCurrency, calculateDaysRemaining } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/context'

interface DebtPayment {
  id: string
  amount: number
  payment_date: string
  payment_method?: string
  notes?: string
}

interface Debt {
  id: string
  creditor_name: string
  debtor_name: string
  principal_amount: number
  interest_rate: number
  total_due: number
  issue_date: string
  due_date?: string | null
  debt_type: string
  status: 'pending' | 'partial' | 'paid' | 'defaulted'
  amount_paid: number
  remaining_amount: number
  notes?: string
  payments?: DebtPayment[]
}

interface DebtTableProps {
  debts: Debt[]
  onRecordPayment?: (debtId: string) => void
  onEdit?: (debt: Debt) => void
  onDelete?: (debtId: string) => void
  loading?: boolean
}

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  defaulted: 'bg-red-100 text-red-800',
}

const typeStyles: Record<string, string> = {
  personal: 'bg-purple-100 text-purple-800',
  trust: 'bg-indigo-100 text-indigo-800',
  business: 'bg-cyan-100 text-cyan-800',
  loan: 'bg-orange-100 text-orange-800',
}

export function DebtTable({ debts, onRecordPayment, onEdit, onDelete, loading }: DebtTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const { t } = useLanguage()

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const getPaymentProgress = (amountPaid: number, totalDue: number) => {
    if (totalDue === 0) return 0
    return Math.min(100, (amountPaid / totalDue) * 100)
  }

  const getStatusLabel = (status: string) => t(`debts.${status}`)
  const getTypeLabel = (type: string) => t(`debts.${type}`)

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>{t('debts.creditor')}</TableHead>
            <TableHead>{t('debts.debtor')}</TableHead>
            <TableHead className="text-right ltr:text-right rtl:text-left">{t('debts.principal')}</TableHead>
            <TableHead className="text-right ltr:text-right rtl:text-left">{t('debts.interest_pct')}</TableHead>
            <TableHead className="text-right ltr:text-right rtl:text-left">{t('debts.total_due')}</TableHead>
            <TableHead>{t('debts.due_date')}</TableHead>
            <TableHead>{t('debts.type_label')}</TableHead>
            <TableHead>{t('debts.status')}</TableHead>
            <TableHead className="text-right ltr:text-right rtl:text-left">{t('debts.paid_col')}</TableHead>
            <TableHead className="text-right ltr:text-right rtl:text-left">{t('debts.remaining')}</TableHead>
            <TableHead>{t('debts.progress')}</TableHead>
            <TableHead className="text-right ltr:text-right rtl:text-left">{t('debts.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={13} className="h-32">
                <div className="flex items-center justify-center gap-3 text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  <span>جاري تحميل البيانات…</span>
                </div>
              </TableCell>
            </TableRow>
          ) : debts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={13} className="h-40">
                <div className="flex flex-col items-center justify-center gap-2 text-gray-500 py-4">
                  <DollarSign className="h-10 w-10 text-gray-300" />
                  <p className="text-base font-medium text-gray-700">لا توجد ديون حالياً</p>
                  <p className="text-sm text-gray-400">سجّل أول دين لبدء متابعة سجلاتك المالية</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            debts.map((debt) => {
              const isExpanded = expandedRows.has(debt.id)
              const daysRemaining = debt.due_date ? calculateDaysRemaining(new Date(debt.due_date)) : null
              const progress = getPaymentProgress(debt.amount_paid, debt.total_due)

              return (
                <Fragment key={debt.id}>
                  <TableRow className="hover:bg-gray-50">
                    <TableCell>
                      {debt.payments && debt.payments.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleRow(debt.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{debt.creditor_name}</TableCell>
                    <TableCell>{debt.debtor_name}</TableCell>
                    <TableCell className="text-right ltr:text-right rtl:text-left font-mono">
                      {formatCurrency(debt.principal_amount)}
                    </TableCell>
                    <TableCell className="text-right ltr:text-right rtl:text-left font-mono">
                      {debt.interest_rate ? `${(debt.interest_rate * 100).toFixed(1)}%` : t('debts.na')}
                    </TableCell>
                    <TableCell className="text-right ltr:text-right rtl:text-left font-mono font-semibold">
                      {formatCurrency(debt.total_due)}
                    </TableCell>
                    <TableCell>
                      {debt.due_date ? (
                        <>
                          <div className="text-sm">
                            {new Date(debt.due_date).toLocaleDateString()}
                          </div>
                          {daysRemaining !== null && (
                            <div className={`text-xs ${daysRemaining < 0 ? 'text-red-600' : daysRemaining < 7 ? 'text-amber-600' : 'text-gray-500'}`}>
                              {daysRemaining < 0
                                ? `${Math.abs(daysRemaining)} ${t('debts.days_overdue')}`
                                : `${daysRemaining} ${t('debts.days_left')}`}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">{t('debts.no_due_date')}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={typeStyles[debt.debt_type] || typeStyles.personal}>{getTypeLabel(debt.debt_type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusStyles[debt.status] || statusStyles.pending}>{getStatusLabel(debt.status)}</Badge>
                    </TableCell>
                    <TableCell className="text-right ltr:text-right rtl:text-left font-mono text-green-600">
                      {formatCurrency(debt.amount_paid)}
                    </TableCell>
                    <TableCell className="text-right ltr:text-right rtl:text-left font-mono text-red-600">
                      {formatCurrency(debt.remaining_amount)}
                    </TableCell>
                    <TableCell>
                      <div className="w-20">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              progress >= 100
                                ? 'bg-green-500'
                                : progress > 50
                                ? 'bg-blue-500'
                                : progress > 0
                                ? 'bg-amber-500'
                                : 'bg-gray-300'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1 text-center">
                          {progress.toFixed(0)}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 ltr:justify-end rtl:justify-start">
                        {debt.status !== 'paid' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                            onClick={() => onRecordPayment?.(debt.id)}
                            title={t('debts.record_payment')}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                          onClick={() => onEdit?.(debt)}
                          title={t('debts.edit')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => onDelete?.(debt.id)}
                          title={t('debts.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {isExpanded && debt.payments && debt.payments.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={13} className="bg-gray-50 p-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-gray-700 mb-3">
                            {t('debts.payment_history')} ({debt.payments.length} {t('debts.payments_count')})
                          </h4>
                          <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-500 pb-2 border-b">
                            <span>{t('debts.date')}</span>
                            <span>{t('debts.amount')}</span>
                            <span>{t('debts.method')}</span>
                            <span>{t('debts.notes')}</span>
                          </div>
                          {debt.payments.map((payment) => (
                            <div key={payment.id} className="grid grid-cols-4 gap-4 text-sm py-2 border-b border-gray-100">
                              <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                              <span className="font-mono text-green-600">
                                {formatCurrency(payment.amount)}
                              </span>
                              <span className="text-gray-600">{payment.payment_method || t('debts.na')}</span>
                              <span className="text-gray-500 truncate">{payment.notes || '-'}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
