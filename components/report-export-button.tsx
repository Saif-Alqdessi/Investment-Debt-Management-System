'use client'

export function ReportExportButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-3 shrink-0 print:hidden"
    >
      <span>⬇</span>
      تحميل التقرير بصيغة PDF
    </button>
  )
}
