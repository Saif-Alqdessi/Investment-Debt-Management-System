'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TrendingUp,
  TrendingDown,
  PlusCircle,
  ClipboardList,
  Plus,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { recordTransaction } from '@/app/dashboard/investments/actions'

type ActionType = 'payout_profit' | 'add_capital' | 'withdraw_partial'

interface Transaction {
  id: string
  investment_id: string
  action_type: ActionType
  amount: number
  transaction_date: string
  notes?: string | null
  created_at: string
}

interface TransactionPanelProps {
  investmentId: string
  transactions: Transaction[]
}

const actionConfig: Record<ActionType, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  payout_profit: {
    label: 'صرف أرباح',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100 border-emerald-200',
    icon: TrendingUp,
  },
  add_capital: {
    label: 'إضافة رأس مال',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 border-blue-200',
    icon: PlusCircle,
  },
  withdraw_partial: {
    label: 'سحب جزئي',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100 border-amber-200',
    icon: TrendingDown,
  },
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TransactionPanel({ investmentId, transactions }: TransactionPanelProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const [actionType, setActionType] = useState<ActionType>('payout_profit')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const resetForm = () => {
    setActionType('payout_profit')
    setAmount('')
    setDate(new Date().toISOString().split('T')[0])
    setNotes('')
    setFormError(null)
  }

  const handleSubmit = () => {
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setFormError('يرجى إدخال مبلغ صحيح أكبر من الصفر')
      return
    }
    if (!date) {
      setFormError('يرجى تحديد تاريخ العملية')
      return
    }

    setFormError(null)
    startTransition(async () => {
      const result = await recordTransaction({
        investment_id: investmentId,
        action_type: actionType,
        amount: parsed,
        transaction_date: date,
        notes: notes.trim() || undefined,
      })

      if (result.success) {
        setOpen(false)
        resetForm()
        router.refresh()
      } else {
        setFormError(result.error || 'حدث خطأ أثناء حفظ العملية')
      }
    })
  }

  const totalPayouts = transactions
    .filter((t) => t.action_type === 'payout_profit')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalAdded = transactions
    .filter((t) => t.action_type === 'add_capital')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalWithdrawn = transactions
    .filter((t) => t.action_type === 'withdraw_partial')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              سجل العمليات
            </CardTitle>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 print:hidden"
              onClick={() => { resetForm(); setOpen(true) }}
            >
              <Plus className="me-2 h-4 w-4" />
              تسجيل عملية
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary row */}
          {transactions.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                <p className="text-xs text-emerald-600 mb-1">إجمالي الأرباح المصروفة</p>
                <p className="font-bold text-emerald-700 font-mono">{formatCurrency(totalPayouts)}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-center">
                <p className="text-xs text-blue-600 mb-1">إجمالي رأس المال المضاف</p>
                <p className="font-bold text-blue-700 font-mono">{formatCurrency(totalAdded)}</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-center">
                <p className="text-xs text-amber-600 mb-1">إجمالي المسحوب</p>
                <p className="font-bold text-amber-700 font-mono">{formatCurrency(totalWithdrawn)}</p>
              </div>
            </div>
          )}

          {/* Timeline */}
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <ClipboardList className="h-12 w-12 mb-3 text-gray-200" />
              <p className="text-base font-medium text-gray-500">لا توجد عمليات مسجلة بعد</p>
              <p className="text-sm mt-1">سجّل أول عملية لبدء توثيق الحركات المالية</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute start-[18px] top-0 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-4">
                {transactions.map((tx, idx) => {
                  const config = actionConfig[tx.action_type]
                  const Icon = config.icon
                  return (
                    <div key={tx.id} className="relative flex gap-4">
                      {/* Circle dot on timeline */}
                      <div className={`relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 ${config.bgColor}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`text-xs border ${config.bgColor} ${config.color} hover:${config.bgColor}`}>
                                {config.label}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {formatDate(tx.transaction_date)}
                              </span>
                            </div>
                            {tx.notes && (
                              <p className="text-sm text-gray-600 mt-1">{tx.notes}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              سُجّل في: {formatDateTime(tx.created_at)}
                            </p>
                          </div>
                          <div className="text-end flex-shrink-0">
                            <p className={`font-mono font-bold text-base ${config.color}`}>
                              {tx.action_type === 'payout_profit' || tx.action_type === 'withdraw_partial' ? '−' : '+'}
                              {formatCurrency(tx.amount)}
                            </p>
                          </div>
                        </div>
                        {idx < transactions.length - 1 && (
                          <div className="mt-4 border-b border-gray-100" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Transaction Modal */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل عملية جديدة</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>نوع العملية *</Label>
              <Select
                value={actionType}
                onValueChange={(v) => setActionType(v as ActionType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payout_profit">صرف أرباح</SelectItem>
                  <SelectItem value="add_capital">إضافة رأس مال</SelectItem>
                  <SelectItem value="withdraw_partial">سحب جزئي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-amount">المبلغ *</Label>
              <Input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-date">تاريخ العملية *</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="tx-notes"
                placeholder="أي تفاصيل إضافية عن هذه العملية..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setOpen(false); resetForm() }}
              disabled={isPending}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? 'جاري الحفظ…' : 'تسجيل العملية'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
