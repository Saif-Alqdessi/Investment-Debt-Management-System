'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search, Download, X, CreditCard, CheckCircle2, Clock } from 'lucide-react'
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
  status: 'pending' | 'partial' | 'paid' | 'defaulted' | 'forgiven'
  amount_paid: number
  remaining_amount: number
  notes?: string | null
  payments?: DebtPayment[]
}

interface DebtsClientProps {
  debts: Debt[]
  currency?: string
}

export function DebtsClient({ debts, currency = 'SAR' }: DebtsClientProps) {
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
      {/* ── Bento Stats ─── */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-100">
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="p-2 bg-slate-200 rounded-lg text-slate-600"><CreditCard className="h-4 w-4" /></div>
          <div>
            <div className="text-2xl font-extrabold tabular-nums text-slate-900">{totalStats.totalDebts}</div>
            <p className="text-xs font-medium text-slate-500">{t('debts.total_debts')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="p-2 bg-red-100 rounded-lg text-red-600"><CreditCard className="h-4 w-4" /></div>
          <div>
            <div className="text-xl font-extrabold tabular-nums text-slate-900">{formatCurrency(totalStats.totalDue, currency)}</div>
            <p className="text-xs font-medium text-slate-500">{t('debts.total_due')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><CheckCircle2 className="h-4 w-4" /></div>
          <div>
            <div className="text-xl font-extrabold tabular-nums text-emerald-600">{formatCurrency(totalStats.totalPaid, currency)}</div>
            <p className="text-xs font-medium text-slate-500">{t('debts.total_paid')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Clock className="h-4 w-4" /></div>
          <div>
            <div className="text-xl font-extrabold tabular-nums text-amber-600">{formatCurrency(totalStats.totalRemaining, currency)}</div>
            <p className="text-xs font-medium text-slate-500">{t('debts.total_remaining')}</p>
          </div>
        </div>
      </div>

      {/* ── Filters + Table ─── */}
      <div className="p-6">
        <div className="flex flex-col gap-5 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">{t('debts.debt_records')}</h2>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <Download className="h-4 w-4" />
              {t('debts.export')}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t('debts.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10 pe-9 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="مسح البحث"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl flex-wrap">
              {(['all', 'pending', 'partial', 'paid', 'defaulted'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === filter
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t(`debts.${filter === 'all' ? 'all' : filter}`)}
                </button>
              ))}
            </div>
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
          currency={currency}
        />
      </div>

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
