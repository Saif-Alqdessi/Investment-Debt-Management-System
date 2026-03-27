import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { InvestmentsClient } from '@/components/investments/investments-client'
import Link from 'next/link'
import { getInvestments } from './actions'

export default async function InvestmentsPage() {
  const result = await getInvestments()
  const investments = result.success && result.data ? (result.data as any[]) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الاستثمارات</h1>
          <p className="text-gray-600 mt-1">إدارة محفظتك الاستثمارية</p>
        </div>
        <Link href="/dashboard/investments/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="me-2 h-4 w-4" />
            استثمار جديد
          </Button>
        </Link>
      </div>

      <InvestmentsClient investments={investments} />
    </div>
  )
}
