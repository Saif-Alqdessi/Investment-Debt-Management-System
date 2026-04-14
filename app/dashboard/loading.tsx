// Shared skeleton loading UI — used by dashboard, investments, and debts routes
// Next.js renders this instantly on every navigation while the server component fetches data

function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-200" />
        <div className="w-12 h-5 rounded-full bg-slate-200" />
      </div>
      <div className="h-3 bg-slate-200 rounded w-2/3 mb-3" />
      <div className="h-7 bg-slate-200 rounded w-1/2" />
    </div>
  )
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-0 animate-pulse">
      <div className="h-4 bg-slate-200 rounded flex-1" />
      <div className="h-4 bg-slate-200 rounded w-24" />
      <div className="h-4 bg-slate-200 rounded w-20" />
      <div className="h-4 bg-slate-200 rounded w-16" />
      <div className="h-6 bg-slate-200 rounded-full w-14" />
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-end justify-between animate-pulse">
        <div className="space-y-2">
          <div className="h-9 bg-slate-200 rounded-lg w-64" />
          <div className="h-4 bg-slate-200 rounded w-48" />
        </div>
        <div className="h-11 bg-slate-200 rounded-xl w-36" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <KpiCardSkeleton key={i} />)}
      </div>

      {/* Table card skeleton */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-40" />
          <div className="flex gap-2">
            <div className="h-9 bg-slate-200 rounded-xl w-24" />
            <div className="h-9 bg-slate-200 rounded-xl w-24" />
          </div>
        </div>
        {/* Table rows */}
        {[...Array(6)].map((_, i) => <TableRowSkeleton key={i} />)}
      </div>
    </div>
  )
}
