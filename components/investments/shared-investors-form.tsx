'use client'

import { Control, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form'
import { InvestmentFormData } from '@/lib/validations'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Users, AlertCircle, Wallet, TrendingUp, Percent } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/context'

interface SharedInvestorsFormProps {
  control: Control<InvestmentFormData>
  setValue: UseFormSetValue<InvestmentFormData>
  watch: UseFormWatch<InvestmentFormData>
  errors: FieldErrors<InvestmentFormData>
  principalAmount: number
  profitAmount: number
  commissionAmount: number
}

export function SharedInvestorsForm({
  setValue,
  watch,
  errors,
  principalAmount,
  profitAmount,
  commissionAmount,
}: SharedInvestorsFormProps) {
  const { t } = useLanguage()
  const sharedInvestors = watch('shared_investors') || []

  // ── Helpers ─────────────────────────────────────────────────────────────
  const safeTotal = principalAmount > 0 ? principalAmount : 1

  const addInvestor = () => {
    setValue('shared_investors', [
      ...sharedInvestors,
      { investor_name: '', amount_paid: 0, custom_commission_rate: undefined },
    ])
  }

  const removeInvestor = (index: number) => {
    setValue('shared_investors', sharedInvestors.filter((_, i) => i !== index))
  }

  const updateInvestor = (index: number, field: string, value: string | number | undefined) => {
    const updated = [...sharedInvestors]
    updated[index] = { ...updated[index], [field]: value }
    setValue('shared_investors', updated)
  }

  // ── Tracker: total allocated vs remaining ───────────────────────────────
  const totalAllocated = sharedInvestors.reduce((sum, si) => sum + (si.amount_paid || 0), 0)
  const remainingAmount = Math.max(0, principalAmount - totalAllocated)
  const isOverAllocated = totalAllocated > principalAmount && principalAmount > 0

  // ── Per-investor calculations ──────────────────────────────────────────
  const calcInvestor = (amountPaid: number, customCommissionRate?: number) => {
    const ownershipPct = safeTotal > 0 ? (amountPaid / safeTotal) : 0
    const shareProfit = profitAmount * ownershipPct
    const shareCommission = customCommissionRate
      ? amountPaid * (customCommissionRate / 100)
      : commissionAmount * ownershipPct
    const shareTotalPayout = amountPaid + shareProfit
    return { ownershipPct: ownershipPct * 100, shareProfit, shareCommission, shareTotalPayout }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{t('forms.shared_investors_title')}</h3>
            <p className="text-xs text-slate-500">{t('forms.shared_investors_subtitle')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={addInvestor}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          {t('forms.add_investor')}
        </button>
      </div>

      <div className="p-6 space-y-5">
        {/* ── Allocation Tracker ────────────────────────────────────── */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border ${isOverAllocated ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 flex-1">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('forms.allocated')}</p>
              <p className={`text-lg font-extrabold tabular-nums ${isOverAllocated ? 'text-red-600' : 'text-slate-900'}`}>
                {formatCurrency(totalAllocated)}
              </p>
            </div>
            <div className="hidden sm:block h-8 w-px bg-slate-200" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('forms.remaining')}</p>
              <p className={`text-lg font-extrabold tabular-nums ${remainingAmount === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                {formatCurrency(remainingAmount)}
              </p>
            </div>
            <div className="hidden sm:block h-8 w-px bg-slate-200" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('forms.principal_total')}</p>
              <p className="text-lg font-extrabold tabular-nums text-slate-700">{formatCurrency(principalAmount)}</p>
            </div>
          </div>

          {isOverAllocated && (
            <Badge variant="destructive" className="flex items-center gap-1 shrink-0">
              <AlertCircle className="h-3 w-3" />
              {t('forms.over_allocated')}
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        {principalAmount > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>{t('forms.allocation_progress')}</span>
              <span className={isOverAllocated ? 'text-red-600' : 'text-blue-600'}>
                {Math.min(100, (totalAllocated / principalAmount) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isOverAllocated ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, (totalAllocated / safeTotal) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Investor Cards ────────────────────────────────────────── */}
        {sharedInvestors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Users className="h-7 w-7 text-slate-300" />
            </div>
            <p className="font-semibold text-sm">{t('forms.no_sub_investors')}</p>
            <p className="text-xs mt-1">{t('forms.no_sub_investors_hint')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sharedInvestors.map((investor, index) => {
              const { ownershipPct, shareProfit, shareCommission, shareTotalPayout } = calcInvestor(
                investor.amount_paid || 0,
                investor.custom_commission_rate
              )
              const hasAmount = (investor.amount_paid || 0) > 0

              return (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 overflow-hidden hover:border-blue-300 transition-colors"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="text-sm font-bold text-slate-700">
                        {investor.investor_name || `${t('forms.sub_investor_placeholder')} ${index + 1}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeInvestor(index)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Name + Commission */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600">{t('forms.investor_name')} *</label>
                        <Input
                          value={investor.investor_name || ''}
                          onChange={(e) => updateInvestor(index, 'investor_name', e.target.value)}
                          placeholder={t('forms.enter_investor')}
                          className="bg-slate-50 border-slate-200 focus:bg-white rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600">{t('forms.custom_commission_rate')}</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={investor.custom_commission_rate ?? ''}
                          onChange={(e) =>
                            updateInvestor(
                              index,
                              'custom_commission_rate',
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          placeholder={t('forms.optional_rate')}
                          className="bg-slate-50 border-slate-200 focus:bg-white rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Amount Paid (primary input) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">{t('forms.amount_paid')} *</label>
                      <div className="relative">
                        <Wallet className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={investor.amount_paid || ''}
                          onChange={(e) =>
                            updateInvestor(index, 'amount_paid', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                          className="ps-10 bg-slate-50 border-slate-200 focus:bg-white rounded-xl text-base font-semibold tabular-nums"
                        />
                      </div>
                    </div>

                    {/* Auto-computed read-only preview */}
                    {hasAmount && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                        {/* Ownership % */}
                        <div className="text-center space-y-1">
                          <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <Percent className="h-3 w-3" />
                            {t('forms.ownership_share')}
                          </div>
                          <div className="font-extrabold tabular-nums text-blue-700 text-sm">
                            {ownershipPct.toFixed(2)}%
                          </div>
                        </div>

                        {/* Sub-Profit */}
                        <div className="text-center space-y-1">
                          <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <TrendingUp className="h-3 w-3" />
                            {t('forms.sub_profit')}
                          </div>
                          <div className="font-extrabold tabular-nums text-emerald-600 text-sm">
                            +{formatCurrency(shareProfit)}
                          </div>
                        </div>

                        {/* Commission */}
                        <div className="text-center space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {t('forms.commission')}
                          </div>
                          <div className="font-extrabold tabular-nums text-amber-600 text-sm">
                            {formatCurrency(shareCommission)}
                          </div>
                        </div>

                        {/* Total Payout */}
                        <div className="text-center space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {t('forms.total_payout')}
                          </div>
                          <div className="font-extrabold tabular-nums text-slate-900 text-sm">
                            {formatCurrency(shareTotalPayout)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Validation error */}
        {errors.shared_investors && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {errors.shared_investors.message}
          </div>
        )}
      </div>
    </div>
  )
}
