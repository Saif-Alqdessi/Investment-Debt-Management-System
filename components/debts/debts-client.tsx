'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Download, X } from 'lucide-react'
import { DebtTable } from '@/components/debts/debt-table'
import { PaymentModal } from '@/components/debts/payment-modal'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/context'
import { useSearch } from '@/lib/context/search-context'
import { deleteDebt, recordPayment } from '@/app/dashboard/debts/actions'
import { exportDebtsToExcel } from '@/lib/export'

interface DebtPayment {
  id: string
  amount: number
  payment_date: string
  payment_method?: string | null
  notes?: string | null
}

interface Debt {
  id: string
  creditor_name: string
  debtor_name: string
  principal_amount: number
  interest_rate: number | null
  total_due: number
  issue_date: string
  due_date?: string | null
  debt_type: string
  status: 'pending' | 'partial' | 'paid' | 'defaulted'
  amount_paid: number
  remaining_amount: number
  notes?: string | null
  payments?: DebtPayment[]
}

interface DebtsClientProps {
  debts: Debt[]
}

export function DebtsClient({ debts }: DebtsClientProps) {
  const { searchQuery, setSearchQuery, clearSearch } = useSearch()
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { t } = useLanguage()
  const router = useRouter()

  const filteredDebts = debts.filter(debt => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      debt.creditor_name.toLowerCase().includes(q) ||
      debt.debtor_name.toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || debt.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalStats = {
    totalDebts: debts.length,
    totalDue: debts.reduce((sum, d) => sum + d.total_due, 0),
    totalPaid: debts.reduce((sum, d) => sum + d.amount_paid, 0),
    totalRemaining: debts.reduce((sum, d) => sum + d.remaining_amount, 0),
  }

  const selectedDebt = debts.find(d => d.id === selectedDebtId)

  const handleRecordPayment = (debtId: string) => {
    setSelectedDebtId(debtId)
    setPaymentModalOpen(true)
  }

  const handlePaymentSubmit = async (payment: {
    debt_id: string
    amount: number
    payment_date: Date
    payment_method?: string
    notes?: string
  }) => {
    const result = await recordPayment(payment)
    if (result.success) {
      setPaymentModalOpen(false)
      setSelectedDebtId(null)
      router.refresh()
    } else {
      alert(result.error || 'Failed to record payment')
    }
  }

  const handleDelete = (debtId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الدين؟')) return
    startTransition(async () => {
      const result = await deleteDebt(debtId)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Failed to delete debt')
      }
    })
  }

  const handleExport = () => {
    exportDebtsToExcel(
      filteredDebts.map(d => ({
        ...d,
        interest_rate: d.interest_rate ?? 0,
        due_date: d.due_date ?? '',
        notes: d.notes || '',
      }))
    )
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{totalStats.totalDebts}</div>
            <p className="text-sm text-gray-600">{t('debts.total_debts')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalStats.totalDue)}</div>
            <p className="text-sm text-gray-600">{t('debts.total_due')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalStats.totalPaid)}</div>
            <p className="text-sm text-gray-600">{t('debts.total_paid')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalStats.totalRemaining)}</div>
            <p className="text-sm text-gray-600">{t('debts.total_remaining')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters, Search, and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('debts.debt_records')}</CardTitle>
            <Button variant="outline" size="sm" className="text-gray-600" onClick={handleExport}>
              <Download className="me-2 h-4 w-4" />
              {t('debts.export')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('debts.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-10 pe-8"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="مسح البحث"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(['all', 'pending', 'partial', 'paid', 'defaulted'] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={statusFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(filter)}
                >
                  {t(`debts.${filter === 'all' ? 'all' : filter}`)}
                </Button>
              ))}
            </div>
          </div>

          <DebtTable
            debts={filteredDebts.map(d => ({
              ...d,
              interest_rate: d.interest_rate ?? 0,
              notes: d.notes ?? undefined,
              payments: d.payments?.map(p => ({
                ...p,
                payment_method: p.payment_method ?? undefined,
                notes: p.notes ?? undefined,
              })),
            }))}
            onRecordPayment={isPending ? undefined : handleRecordPayment}
            onDelete={isPending ? undefined : handleDelete}
          />
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {selectedDebt && (
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          debtId={selectedDebt.id}
          remainingAmount={selectedDebt.remaining_amount}
          creditorName={selectedDebt.creditor_name}
          onSubmit={handlePaymentSubmit}
        />
      )}
    </>
  )
}
