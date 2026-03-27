'use client'

import { InvestmentForm } from '@/components/investments/investment-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { createInvestment } from '../actions'
import { type InvestmentFormData } from '@/lib/validations'
import Link from 'next/link'

export default function NewInvestmentPage() {
  const { t } = useLanguage()

  const handleSubmit = async (data: InvestmentFormData) => {
    return await createInvestment(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/investments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t('forms.back_to_investments')}
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('forms.new_investment')}</h1>
        <p className="text-gray-600 mt-1">
          {t('forms.new_investment_subtitle')}
        </p>
      </div>

      <InvestmentForm onSubmit={handleSubmit} />
    </div>
  )
}
