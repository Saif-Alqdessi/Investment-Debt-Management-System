'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search, Download, X, TrendingUp, Wallet, Activity, DollarSign } from 'lucide-react'
import { InvestmentTable } from '@/components/investments/investment-table'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/context'
import { useSearch } from '@/lib/context/search-context'
import { deleteInvestment } from '@/app/dashboard/investments/actions'
import { exportInvestmentsToExcel } from '@/lib/export'

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
  notes?: string | null | undefined
  created_at: string
}

interface InvestmentsClientProps {
  investments: Investment[]
  currency?: string
}

export function InvestmentsClient({ investments, currency = 'SAR' }: InvestmentsClientProps) {
  const { searchQuery, setSearchQuery, clearSearch } = useSearch()
  const [statusFilter, setStatusFilter] = useState('all')
  const [isPending, startTransition] = useTransition()
  const { t } = useLanguage()
  const router = useRouter()

  const filteredInvestments = investments.filter(investment => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      investment.investor_name.toLowerCase().includes(q) ||
      (investment.category_id || '').toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || investment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalStats = {
    totalInvestments: investments.length,
    activeInvestments: investments.filter(i => i.status === 'active').length,
    totalValue: investments.reduce((sum, i) => sum + i.principal_amount, 0),
    totalProfits: investments.reduce((sum, i) => sum + i.profit_amount, 0),
  }

  const handleExport = () => {
    exportInvestmentsToExcel(filteredInvestments.map(i => ({ ...i, notes: i.notes || '' })))
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteInvestment(id)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Failed to delete investment')
      }
    })
  }

  return (
    <>
      {/* ── Bento Stats ─── */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-100">
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Activity className="h-4 w-4" /></div>
          <div>
            <div className="text-2xl font-extrabold tabular-nums text-slate-900">{totalStats.totalInvestments}</div>
            <p className="text-xs font-medium text-slate-500">{t('investments.total_investments')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingUp className="h-4 w-4" /></div>
          <div>
            <div className="text-2xl font-extrabold tabular-nums text-emerald-600">{totalStats.activeInvestments}</div>
            <p className="text-xs font-medium text-slate-500">{t('investments.active_investments')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Wallet className="h-4 w-4" /></div>
          <div>
            <div className="text-xl font-extrabold tabular-nums text-slate-900">{formatCurrency(totalStats.totalValue, currency)}</div>
            <p className="text-xs font-medium text-slate-500">{t('investments.total_value')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><DollarSign className="h-4 w-4" /></div>
          <div>
            <div className="text-xl font-extrabold tabular-nums text-emerald-600">{formatCurrency(totalStats.totalProfits, currency)}</div>
            <p className="text-xs font-medium text-slate-500">{t('investments.expected_profits')}</p>
          </div>
        </div>
      </div>

      {/* ── Filters + Table ─── */}
      <div className="p-6">
        <div className="flex flex-col gap-5 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">{t('investments.portfolio')}</h2>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <Download className="h-4 w-4" />
              {t('investments.export')}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t('investments.search_placeholder')}
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
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {(['all', 'active', 'matured', 'renewed', 'withdrawn'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === filter
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t(`investments.${filter === 'all' ? 'all' : filter}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <InvestmentTable
          investments={filteredInvestments.map(i => ({ ...i, notes: i.notes ?? undefined }))}
          onDelete={isPending ? undefined : handleDelete}
          currency={currency}
        />
      </div>
    </>
  )
}
