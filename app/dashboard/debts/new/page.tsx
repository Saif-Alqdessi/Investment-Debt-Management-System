'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Calculator } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/context'
import { createDebt } from '../actions'
import Link from 'next/link'

export default function NewDebtPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)

  const [creditorName, setCreditorName] = useState('')
  const [debtorName, setDebtorName] = useState('')
  const [principalAmount, setPrincipalAmount] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [debtType, setDebtType] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const principal = parseFloat(principalAmount) || 0
  const interest = parseFloat(interestRate) || 0
  const totalDue = principal * (1 + interest / 100)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await createDebt({
        creditor_name: creditorName,
        debtor_name: debtorName,
        principal_amount: principal,
        interest_rate: interest || null,
        issue_date: new Date(issueDate),
        due_date: dueDate ? new Date(dueDate) : null,
        debt_type: debtType as 'personal' | 'trust' | 'business' | 'loan',
        notes: notes || undefined,
      })

      if (result.success) {
        router.push('/dashboard/debts')
      } else {
        setError(result.error || 'Failed to create debt')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create debt')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/debts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t('forms.back_to_debts')}
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('forms.new_debt')}</h1>
        <p className="text-gray-600 mt-1">
          {t('forms.new_debt_subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('forms.debt_details')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="creditor_name">{t('forms.creditor_name')} *</Label>
                    <Input
                      id="creditor_name"
                      value={creditorName}
                      onChange={(e) => setCreditorName(e.target.value)}
                      placeholder={t('forms.who_is_owed')}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="debtor_name">{t('forms.debtor_name')} *</Label>
                    <Input
                      id="debtor_name"
                      value={debtorName}
                      onChange={(e) => setDebtorName(e.target.value)}
                      placeholder={t('forms.who_owes')}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="principal_amount">{t('forms.principal_amount')} *</Label>
                    <Input
                      id="principal_amount"
                      type="number"
                      step="0.01"
                      value={principalAmount}
                      onChange={(e) => setPrincipalAmount(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interest_rate">{t('forms.interest_rate')} {t('common.optional')}</Label>
                    <Input
                      id="interest_rate"
                      type="number"
                      step="0.01"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issue_date">{t('forms.issue_date')} *</Label>
                    <Input
                      id="issue_date"
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due_date">{t('forms.due_date')} {t('common.optional')}</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="debt_type">{t('forms.debt_type')} *</Label>
                    <Select onValueChange={setDebtType}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('forms.select_type')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">{t('debts.personal')}</SelectItem>
                        <SelectItem value="trust">{t('debts.trust')}</SelectItem>
                        <SelectItem value="business">{t('debts.business')}</SelectItem>
                        <SelectItem value="loan">{t('debts.loan')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t('forms.notes')}</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('forms.debt_notes_placeholder')}
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Calculations Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  <span>{t('forms.calculations')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('forms.principal_label')}:</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(principal)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('forms.interest_label')} ({interest}%):</span>
                    <span className="font-mono font-semibold text-amber-600">
                      +{formatCurrency(principal * (interest / 100))}
                    </span>
                  </div>

                  <hr className="border-gray-200" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">{t('forms.total_due')}:</span>
                    <span className="font-mono font-bold text-lg text-red-600">
                      {formatCurrency(totalDue)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? t('forms.saving') : t('forms.create_debt')}
              </Button>

              <Link href="/dashboard/debts" className="block">
                <Button type="button" variant="outline" className="w-full">
                  {t('forms.cancel')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
