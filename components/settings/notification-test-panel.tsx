'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMaturityAlerts } from '@/app/dashboard/investments/notification-actions'
import { Bell, CheckCircle2, XCircle, Loader2, Send } from 'lucide-react'

type Status = { type: 'success' | 'error' | 'info'; msg: string } | null

export function NotificationTestPanel() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<Status>(null)

  const handleTestAlert = async () => {
    setLoading(true)
    setStatus(null)

    try {
      // Get the current user's email from Supabase client
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user?.email) {
        setStatus({ type: 'error', msg: 'تعذّر الحصول على بريدك الإلكتروني. الرجاء تسجيل الدخول.' })
        return
      }

      const result = await sendMaturityAlerts(user.email)

      if (!result.success) {
        setStatus({ type: 'error', msg: result.error ?? 'حدث خطأ غير متوقع.' })
        return
      }

      if (!result.sent) {
        setStatus({ type: 'info', msg: 'لا توجد استثمارات مستحقة خلال الأيام السبعة القادمة. لم يتم إرسال أي بريد.' })
        return
      }

      setStatus({
        type: 'success',
        msg: `✅ تم إرسال تنبيه بـ ${result.count} استثمار إلى ${user.email} بنجاح.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل الإرسال.'
      setStatus({ type: 'error', msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="text-xl font-bold flex items-center gap-2 mb-2 text-slate-900">
        <Bell className="h-5 w-5 text-blue-600" />
        اختبار التنبيهات
      </h3>
      <p className="text-sm text-slate-500 mb-6">
        أرسل بريد تنبيه فوري يتضمن الاستثمارات المستحقة خلال 7 أيام وغير المسلّمة إلى بريدك الإلكتروني المسجّل.
      </p>

      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6 flex items-start gap-3">
        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg shrink-0 mt-0.5">
          <Bell className="h-3.5 w-3.5" />
        </div>
        <div className="text-xs text-blue-700 leading-relaxed">
          <strong>المعايير:</strong> الاستثمارات ذات الحالة &quot;نشط&quot; التي تستحق خلال الـ 7 أيام القادمة
          <abbr title="is_profit_delivered = false">وغير مُسلَّمة الأرباح</abbr> بعد.
        </div>
      </div>

      <button
        onClick={handleTestAlert}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-sm shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 transition-all text-sm"
      >
        {loading
          ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري الإرسال...</>
          : <><Send className="h-4 w-4" /> تجربة تنبيهات الإيميل</>}
      </button>

      {/* Inline Status Toast */}
      {status && (
        <div
          className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm font-medium mt-4 ${
            status.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : status.type === 'info'
              ? 'bg-blue-50 border border-blue-200 text-blue-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {status.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
          {status.type === 'error'   && <XCircle      className="h-4 w-4 shrink-0 mt-0.5" />}
          {status.type === 'info'    && <Bell         className="h-4 w-4 shrink-0 mt-0.5" />}
          {status.msg}
        </div>
      )}
    </section>
  )
}
