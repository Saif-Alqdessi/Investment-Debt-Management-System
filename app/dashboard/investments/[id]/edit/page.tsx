'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { InvestmentForm } from '@/components/investments/investment-form'
import { getInvestment, updateInvestment } from '../../actions'
import { type InvestmentFormData } from '@/lib/validations'

export default function EditInvestmentPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [initialData, setInitialData] = useState<Partial<InvestmentFormData> | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    getInvestment(id).then((result) => {
      if (!result.success || !result.data) {
        setNotFound(true)
      } else {
        const inv = result.data as any
        setInitialData({
          investor_name: inv.investor_name,
          principal_amount: inv.principal_amount,
          starting_date: new Date(inv.starting_date),
          due_date: new Date(inv.due_date),
          category_id: inv.category_id ?? undefined,
          duration: inv.duration,
          profit_rate: parseFloat((inv.profit_rate * 100).toFixed(4)),
          commission_rate: parseFloat((inv.commission_rate * 100).toFixed(4)),
          notes: inv.notes ?? undefined,
          is_shared: inv.is_shared ?? false,
          shared_investors: inv.shared_investors?.map((si: any) => ({
            investor_name: si.investor_name,
            share_percentage: si.share_percentage,
            custom_commission_rate: si.custom_commission_rate
              ? parseFloat((si.custom_commission_rate * 100).toFixed(4))
              : undefined,
          })) ?? [],
        })
      }
      setLoading(false)
    })
  }, [id])

  const handleSubmit = async (data: InvestmentFormData) => {
    const result = await updateInvestment(id, data)
    if (result.success) {
      router.push(`/dashboard/investments/${id}`)
    }
    return result
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل بيانات الاستثمار…</p>
        </div>
      </div>
    )
  }

  if (notFound || !initialData) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/investments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="me-2 h-4 w-4" />
            العودة إلى الاستثمارات
          </Button>
        </Link>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">لم يتم العثور على الاستثمار</h2>
          <p className="text-gray-500">قد يكون الاستثمار غير موجود أو تم حذفه.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/investments/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="me-2 h-4 w-4" />
            العودة إلى التفاصيل
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">تعديل الاستثمار</h1>
        <p className="text-gray-600 mt-1">تحديث بيانات الاستثمار الحالية</p>
      </div>

      <InvestmentForm initialData={initialData} onSubmit={handleSubmit} />
    </div>
  )
}
