'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Mail, KeyRound, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

// ── Minimal inline toast ────────────────────────────────────────────────────
type Status = { type: 'success' | 'error'; msg: string } | null

function Toast({ status }: { status: Status }) {
  if (!status) return null
  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold mt-4 ${
        status.type === 'success'
          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          : 'bg-red-50 border border-red-200 text-red-700'
      }`}
    >
      {status.type === 'success'
        ? <CheckCircle2 className="h-4 w-4 shrink-0" />
        : <XCircle className="h-4 w-4 shrink-0" />}
      {status.msg}
    </div>
  )
}

// ── Input helper ─────────────────────────────────────────────────────────────
const inputCls =
  'w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none'

// ── Main Component ───────────────────────────────────────────────────────────
export function SecurityForm() {
  const supabase = createClient()

  // Email
  const [newEmail, setNewEmail]       = useState('')
  const [emailStatus, setEmailStatus] = useState<Status>(null)
  const [emailLoading, setEmailLoading] = useState(false)

  // Password
  const [newPw, setNewPw]             = useState('')
  const [confirmPw, setConfirmPw]     = useState('')
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwStatus, setPwStatus]       = useState<Status>(null)
  const [pwLoading, setPwLoading]     = useState(false)

  // ── Update Email ────────────────────────────────────────────────────────────
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) {
      setEmailStatus({ type: 'error', msg: 'الرجاء إدخال بريد إلكتروني صحيح' })
      return
    }
    setEmailLoading(true)
    setEmailStatus(null)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
      if (error) throw error
      setEmailStatus({
        type: 'success',
        msg: 'تم إرسال رابط التأكيد إلى البريد الجديد. يرجى التحقق من صندوق الوارد.',
      })
      setNewEmail('')
    } catch (err: unknown) {
      setEmailStatus({ type: 'error', msg: err instanceof Error ? err.message : 'فشل تحديث البريد الإلكتروني' })
    } finally {
      setEmailLoading(false)
    }
  }

  // ── Update Password ─────────────────────────────────────────────────────────
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPw || newPw.length < 6) {
      setPwStatus({ type: 'error', msg: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
      return
    }
    if (newPw !== confirmPw) {
      setPwStatus({ type: 'error', msg: 'كلمات المرور غير متطابقة' })
      return
    }
    setPwLoading(true)
    setPwStatus(null)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      setPwStatus({ type: 'success', msg: 'تم تحديث كلمة المرور بنجاح' })
      setNewPw('')
      setConfirmPw('')
    } catch (err: unknown) {
      setPwStatus({ type: 'error', msg: err instanceof Error ? err.message : 'فشل تحديث كلمة المرور' })
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="text-xl font-bold flex items-center gap-2 mb-8 text-slate-900">
        <Shield className="h-5 w-5 text-blue-600" />
        الأمان والخصوصية
      </h3>

      <div className="space-y-8">

        {/* ── Update Email ───────────────────────────────────────────── */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" /> تحديث البريد الإلكتروني
          </h4>
          <form onSubmit={handleUpdateEmail} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">البريد الجديد</label>
              <input
                className={inputCls}
                type="email"
                dir="ltr"
                placeholder="new@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={emailLoading}
                autoComplete="email"
              />
            </div>
            <Toast status={emailStatus} />
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={emailLoading || !newEmail.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-sm shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 transition-all text-sm"
              >
                {emailLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري التحديث...</>
                  : <>تحديث البريد</>}
              </button>
            </div>
          </form>
        </div>

        <div className="border-t border-slate-100" />

        {/* ── Update Password ────────────────────────────────────────── */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <KeyRound className="h-3.5 w-3.5" /> تغيير كلمة المرور
          </h4>
          <form onSubmit={handleUpdatePassword} className="space-y-3">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">كلمة المرور الجديدة</label>
              <div className="relative">
                <input
                  className={`${inputCls} pe-11`}
                  type={showNew ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  disabled={pwLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password strength bar */}
              {newPw.length > 0 && (
                <div className="flex gap-1 pt-1">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        newPw.length >= n * 3
                          ? newPw.length < 6 ? 'bg-red-400' : newPw.length < 10 ? 'bg-amber-400' : 'bg-emerald-500'
                          : 'bg-slate-100'
                      }`}
                    />
                  ))}
                  <span className="text-[10px] text-slate-400 ms-1">
                    {newPw.length < 6 ? 'ضعيفة' : newPw.length < 10 ? 'متوسطة' : 'قوية'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">تأكيد كلمة المرور</label>
              <div className="relative">
                <input
                  className={`${inputCls} pe-11 ${
                    confirmPw && confirmPw !== newPw ? 'ring-2 ring-red-400/40 bg-red-50' :
                    confirmPw && confirmPw === newPw ? 'ring-2 ring-emerald-400/40' : ''
                  }`}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  disabled={pwLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPw && confirmPw !== newPw && (
                <p className="text-xs text-red-500 font-medium">كلمات المرور غير متطابقة</p>
              )}
            </div>

            <Toast status={pwStatus} />
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={pwLoading || !newPw || !confirmPw}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-sm shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 transition-all text-sm"
              >
                {pwLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري التحديث...</>
                  : <>تحديث كلمة المرور</>}
              </button>
            </div>
          </form>
        </div>

      </div>
    </section>
  )
}
