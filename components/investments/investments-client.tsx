'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Download, X } from 'lucide-react'
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
}

export function InvestmentsClient({ investments }: InvestmentsClientProps) {
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{totalStats.totalInvestments}</div>
            <p className="text-sm text-gray-600">{t('investments.total_investments')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{totalStats.activeInvestments}</div>
            <p className="text-sm text-gray-600">{t('investments.active_investments')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalStats.totalValue)}</div>
            <p className="text-sm text-gray-600">{t('investments.total_value')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalStats.totalProfits)}</div>
            <p className="text-sm text-gray-600">{t('investments.expected_profits')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters, Search, and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('investments.portfolio')}</CardTitle>
            <Button variant="outline" size="sm" className="text-gray-600" onClick={handleExport}>
              <Download className="me-2 h-4 w-4" />
              {t('investments.export')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('investments.search_placeholder')}
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
            <div className="flex items-center gap-2">
              {(['all', 'active', 'matured', 'renewed', 'withdrawn'] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={statusFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(filter)}
                >
                  {t(`investments.${filter === 'all' ? 'all' : filter}`)}
                </Button>
              ))}
            </div>
          </div>

          <InvestmentTable
            investments={filteredInvestments.map(i => ({ ...i, notes: i.notes ?? undefined }))}
            onDelete={isPending ? undefined : handleDelete}
          />
        </CardContent>
      </Card>
    </>
  )
}
