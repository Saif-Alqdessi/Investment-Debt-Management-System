'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/context'

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debtId: string
  remainingAmount: number
  creditorName: string
  onSubmit: (payment: {
    debt_id: string
    amount: number
    payment_date: Date
    payment_method?: string
    notes?: string
  }) => void
  isLoading?: boolean
}

export function PaymentModal({
  open,
  onOpenChange,
  debtId,
  remainingAmount,
  creditorName,
  onSubmit,
  isLoading,
}: PaymentModalProps) {
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const { t } = useLanguage()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid payment amount')
      return
    }

    if (parsedAmount > remainingAmount) {
      setError(`Payment amount cannot exceed remaining balance of ${formatCurrency(remainingAmount)}`)
      return
    }

    onSubmit({
      debt_id: debtId,
      amount: parsedAmount,
      payment_date: new Date(paymentDate),
      payment_method: paymentMethod || undefined,
      notes: notes || undefined,
    })

    // Reset form
    setAmount('')
    setPaymentDate(new Date().toISOString().split('T')[0])
    setPaymentMethod('')
    setNotes('')
  }

  const handlePayFull = () => {
    setAmount(remainingAmount.toString())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('forms.record_payment')}</DialogTitle>
          <DialogDescription>
            {t('forms.payment_for')} {creditorName}.
            {t('forms.remaining_balance')}: <strong>{formatCurrency(remainingAmount)}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-amount">{t('forms.payment_amount')} *</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={remainingAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
              <Button type="button" variant="outline" size="sm" onClick={handlePayFull}>
                {t('forms.pay_full')}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-date">{t('forms.payment_date')} *</Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">{t('forms.payment_method')}</Label>
            <Select onValueChange={setPaymentMethod} value={paymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder={t('forms.select_method')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t('forms.cash')}</SelectItem>
                <SelectItem value="bank_transfer">{t('forms.bank_transfer')}</SelectItem>
                <SelectItem value="check">{t('forms.check')}</SelectItem>
                <SelectItem value="mobile_payment">{t('forms.mobile_payment')}</SelectItem>
                <SelectItem value="other">{t('forms.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-notes">{t('forms.notes')}</Label>
            <Textarea
              id="payment-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('forms.payment_notes_placeholder')}
              rows={2}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('forms.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('forms.recording') : t('forms.record_payment')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
