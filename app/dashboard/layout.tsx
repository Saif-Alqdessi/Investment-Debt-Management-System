import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex bg-gray-50">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto p-6 print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
    </div>
  )
}
