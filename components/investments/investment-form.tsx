'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { investmentSchema, type InvestmentFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calculator, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/context'
import { SharedInvestorsForm } from './shared-investors-form'

interface InvestmentFormProps {
  initialData?: Partial<InvestmentFormData>
  onSubmit?: (data: InvestmentFormData) => Promise<{ success: boolean; error?: string }>
  isLoading?: boolean
}

export function InvestmentForm({ initialData, onSubmit, isLoading: externalLoading }: InvestmentFormProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [calculatedAmounts, setCalculatedAmounts] = useState({
    profitAmount: 0,
    commissionAmount: 0,
    totalPayout: 0,
  })

  const isLoading = externalLoading || submitting

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    control,
  } = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      is_shared: false,
      auto_renew: false,
      is_profit_delivered: false,
      shared_investors: [],
      ...initialData,
    },
  })

  const watchedValues = watch()
  const { principal_amount, profit_rate, commission_rate, is_shared, auto_renew, is_profit_delivered, duration, category_id, starting_date, due_date } = watchedValues

  const toDateInputValue = (val: Date | string | undefined) => {
    if (!val) return ''
    const d = val instanceof Date ? val : new Date(val)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().split('T')[0]
  }

  // Auto-calculate amounts when principal, profit rate, or commission rate changes
  useEffect(() => {
    if (principal_amount && profit_rate !== undefined && commission_rate !== undefined) {
      const profitAmount = principal_amount * (profit_rate / 100)
      const commissionAmount = principal_amount * (commission_rate / 100)
      const totalPayout = principal_amount + profitAmount

      setCalculatedAmounts({
        profitAmount,
        commissionAmount,
        totalPayout,
      })
    }
  }, [principal_amount, profit_rate, commission_rate])

  const handleFormSubmit = async (data: InvestmentFormData) => {
    setSubmitError(null)
    setSubmitting(true)

    try {
      if (onSubmit) {
        const result = await onSubmit(data)
        if (result.success) {
          router.push('/dashboard/investments')
        } else {
          setSubmitError(result.error || 'Failed to save investment')
        }
      } else {
        console.log('Investment submitted (no handler):', data)
        router.push('/dashboard/investments')
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{t('forms.investment_details')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="investor_name">{t('forms.investor_name')} *</Label>
                  <Input
                    id="investor_name"
                    {...register('investor_name')}
                    placeholder="Enter investor name"
                  />
                  {errors.investor_name && (
                    <p className="text-sm text-red-600">{errors.investor_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="principal_amount">{t('forms.principal_amount')} *</Label>
                  <Input
                    id="principal_amount"
                    type="number"
                    step="0.01"
                    {...register('principal_amount', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {errors.principal_amount && (
                    <p className="text-sm text-red-600">{errors.principal_amount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="starting_date">{t('forms.starting_date')} *</Label>
                  <Input
                    id="starting_date"
                    type="date"
                    value={toDateInputValue(starting_date)}
                    {...register('starting_date', { 
                      setValueAs: (value) => value ? new Date(value) : undefined 
                    })}
                  />
                  {errors.starting_date && (
                    <p className="text-sm text-red-600">{errors.starting_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">{t('forms.due_date')} *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={toDateInputValue(due_date)}
                    {...register('due_date', { 
                      setValueAs: (value) => value ? new Date(value) : undefined 
                    })}
                  />
                  {errors.due_date && (
                    <p className="text-sm text-red-600">{errors.due_date.message}</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="duration">{t('forms.duration')} *</Label>
                    <Select
                      value={duration ?? ''}
                      onValueChange={(value) => setValue('duration', value as 'monthly' | 'quarterly' | 'semi_annual' | 'annual', { shouldValidate: true })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('forms.select_duration')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">{t('investments.monthly')}</SelectItem>
                        <SelectItem value="quarterly">{t('investments.quarterly')}</SelectItem>
                        <SelectItem value="semi_annual">{t('investments.semi_annual')}</SelectItem>
                        <SelectItem value="annual">{t('investments.annual')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.duration && (
                      <p className="text-sm text-red-600">{errors.duration.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-4 shrink-0">
                    <div className="flex flex-col items-center justify-center space-y-2 pt-[6px]">
                      <Label htmlFor="auto_renew" className="text-sm">{t('forms.auto_renew')}</Label>
                      <Switch
                        id="auto_renew"
                        checked={auto_renew}
                        onCheckedChange={(checked) => setValue('auto_renew', checked)}
                      />
                    </div>
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Label htmlFor="is_profit_delivered" className="text-sm text-center leading-tight">{t('forms.profit_delivered')}</Label>
                      <Switch
                        id="is_profit_delivered"
                        checked={is_profit_delivered ?? false}
                        onCheckedChange={(checked) => setValue('is_profit_delivered', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">{t('forms.category')}</Label>
                  <Select
                    value={category_id ?? ''}
                    onValueChange={(value) => setValue('category_id', value, { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('forms.select_category')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rateb">Rateb</SelectItem>
                      <SelectItem value="fixed-deposit">Fixed Deposit</SelectItem>
                      <SelectItem value="business-loan">Business Loan</SelectItem>
                      <SelectItem value="personal-loan">Personal Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profit_rate">{t('forms.profit_rate')} *</Label>
                  <Input
                    id="profit_rate"
                    type="number"
                    step="0.01"
                    {...register('profit_rate', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {errors.profit_rate && (
                    <p className="text-sm text-red-600">{errors.profit_rate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commission_rate">{t('forms.commission_rate')} *</Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    step="0.01"
                    {...register('commission_rate', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {errors.commission_rate && (
                    <p className="text-sm text-red-600">{errors.commission_rate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t('forms.notes')}</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder={t('forms.notes_placeholder')}
                  rows={3}
                />
              </div>

              {submitError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
                  {submitError}
                </div>
              )}

              {/* Shared Investment Toggle */}
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Switch
                  id="is_shared"
                  checked={is_shared}
                  onCheckedChange={(checked) => setValue('is_shared', checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="is_shared" className="text-sm font-medium">
                    {t('forms.split_investors')}
                  </Label>
                  <p className="text-xs text-gray-600">
                    {t('forms.split_desc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shared Investors Section */}
          {is_shared && (
            <SharedInvestorsForm
              control={control}
              setValue={setValue}
              watch={watch}
              errors={errors}
              principalAmount={principal_amount || 0}
              profitAmount={calculatedAmounts.profitAmount}
              commissionAmount={calculatedAmounts.commissionAmount}
            />
          )}
        </div>

        {/* Calculations Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                <span>{t('forms.auto_calculations')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('forms.principal_amount')}:</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(principal_amount || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('forms.profit_amount')}:</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    +{formatCurrency(calculatedAmounts.profitAmount)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('forms.commission')}:</span>
                  <span className="font-mono font-semibold text-amber-600">
                    {formatCurrency(calculatedAmounts.commissionAmount)}
                  </span>
                </div>
                
                <hr className="border-gray-200" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">{t('forms.total_payout')}:</span>
                  <span className="font-mono font-bold text-lg">
                    {formatCurrency(calculatedAmounts.totalPayout)}
                  </span>
                </div>
              </div>

              {profit_rate && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-600 font-medium">{t('forms.roi_calculation')}</div>
                  <div className="text-sm text-blue-800">
                    {profit_rate}% {t('forms.return_on')} {formatCurrency(principal_amount || 0)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? t('forms.saving') : initialData ? t('forms.update') : t('forms.create')}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
            >
              {t('forms.save_draft')}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
