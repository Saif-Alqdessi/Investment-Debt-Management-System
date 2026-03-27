import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { DebtsClient } from '@/components/debts/debts-client'
import Link from 'next/link'
import { getDebts } from './actions'

export default async function DebtsPage() {
  const result = await getDebts()
  const debts = result.success && result.data ? (result.data as any[]) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الديون</h1>
          <p className="text-gray-600 mt-1">تتبع ديونك وسجلاتك المالية</p>
        </div>
        <Link href="/dashboard/debts/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="me-2 h-4 w-4" />
            دين جديد
          </Button>
        </Link>
      </div>

      <DebtsClient debts={debts} />
    </div>
  )
}
