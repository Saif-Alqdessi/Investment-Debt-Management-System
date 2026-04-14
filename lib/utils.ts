import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CURRENCY_LOCALE: Record<string, string> = {
  SAR: 'ar-SA',
  USD: 'en-US',
  TRY: 'tr-TR',
}

export function formatCurrency(amount: number, currencyCode = 'USD'): string {
  const code   = CURRENCY_LOCALE[currencyCode] ? currencyCode : 'USD'
  const locale = CURRENCY_LOCALE[code]
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
  }).format(amount)
}


export function formatPercentage(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`
}

export function calculateDaysRemaining(dueDate: Date): number {
  const today = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-800'
    case 'matured':
      return 'bg-blue-100 text-blue-800'
    case 'renewed':
      return 'bg-purple-100 text-purple-800'
    case 'withdrawn':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getDaysRemainingColor(days: number): string {
  if (days < 0) return 'bg-red-500'
  if (days < 7) return 'bg-red-500'
  if (days < 30) return 'bg-amber-500'
  return 'bg-emerald-500'
}
