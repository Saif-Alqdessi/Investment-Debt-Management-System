'use client'

import { useState } from 'react'
import { Control, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form'
import { InvestmentFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Plus, Trash2, Users, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

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
  control,
  setValue,
  watch,
  errors,
  principalAmount,
  profitAmount,
  commissionAmount,
}: SharedInvestorsFormProps) {
  const sharedInvestors = watch('shared_investors') || []

  const addInvestor = () => {
    const newInvestor = {
      investor_name: '',
      share_percentage: 0,
      custom_commission_rate: undefined,
    }
    setValue('shared_investors', [...sharedInvestors, newInvestor])
  }

  const removeInvestor = (index: number) => {
    const updated = sharedInvestors.filter((_, i) => i !== index)
    setValue('shared_investors', updated)
  }

  const updateInvestor = (index: number, field: string, value: any) => {
    const updated = [...sharedInvestors]
    updated[index] = { ...updated[index], [field]: value }
    setValue('shared_investors', updated)
  }

  const totalPercentage = sharedInvestors.reduce((sum, investor) => sum + (investor.share_percentage || 0), 0)
  const remainingPercentage = Math.max(0, 100 - totalPercentage)

  const calculateInvestorAmounts = (percentage: number, customCommissionRate?: number) => {
    const sharePrincipal = principalAmount * (percentage / 100)
    const shareProfit = profitAmount * (percentage / 100)
    const shareCommission = customCommissionRate 
      ? sharePrincipal * (customCommissionRate / 100)
      : commissionAmount * (percentage / 100)
    const shareTotalPayout = sharePrincipal + shareProfit

    return {
      sharePrincipal,
      shareProfit,
      shareCommission,
      shareTotalPayout,
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Shared Investors</span>
          </CardTitle>
          <Button type="button" onClick={addInvestor} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Investor
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Percentage Summary */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="font-medium">Total Allocated:</span>
              <span className={`ml-2 ${totalPercentage > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                {totalPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Remaining:</span>
              <span className={`ml-2 ${remainingPercentage < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {remainingPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
          {totalPercentage > 100 && (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <AlertCircle className="h-3 w-3" />
              <span>Over 100%</span>
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              totalPercentage > 100 ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(100, totalPercentage)}%` }}
          />
        </div>

        {/* Investors List */}
        <div className="space-y-4">
          {sharedInvestors.map((investor, index) => {
            const amounts = calculateInvestorAmounts(
              investor.share_percentage || 0,
              investor.custom_commission_rate
            )

            return (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium text-gray-900">
                      Sub-Investor #{index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInvestor(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label>Investor Name *</Label>
                      <Input
                        value={investor.investor_name || ''}
                        onChange={(e) => updateInvestor(index, 'investor_name', e.target.value)}
                        placeholder="Enter investor name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Custom Commission Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={investor.custom_commission_rate || ''}
                        onChange={(e) => updateInvestor(index, 'custom_commission_rate', 
                          e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="Optional custom rate"
                      />
                    </div>
                  </div>

                  {/* Percentage Slider */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <Label>Share Percentage</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={investor.share_percentage || 0}
                          onChange={(e) => updateInvestor(index, 'share_percentage', 
                            parseFloat(e.target.value) || 0)}
                          className="w-20 text-center"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>
                    <Slider
                      value={[investor.share_percentage || 0]}
                      onValueChange={(value) => updateInvestor(index, 'share_percentage', value[0])}
                      max={100}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Calculated Amounts */}
                  {investor.share_percentage > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-xs text-gray-600">Principal</div>
                        <div className="font-mono text-sm font-semibold">
                          {formatCurrency(amounts.sharePrincipal)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-600">Profit</div>
                        <div className="font-mono text-sm font-semibold text-emerald-600">
                          {formatCurrency(amounts.shareProfit)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-600">Commission</div>
                        <div className="font-mono text-sm font-semibold text-amber-600">
                          {formatCurrency(amounts.shareCommission)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-600">Total Payout</div>
                        <div className="font-mono text-sm font-bold">
                          {formatCurrency(amounts.shareTotalPayout)}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {sharedInvestors.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No sub-investors added yet.</p>
            <p className="text-sm">Click "Add Investor" to split this investment.</p>
          </div>
        )}

        {/* Validation Errors */}
        {errors.shared_investors && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.shared_investors.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
