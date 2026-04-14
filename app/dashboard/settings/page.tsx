'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  User, Settings2, Save, Check, Languages, DollarSign,
  CheckCircle2, XCircle, Loader2,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { SecurityForm } from '@/components/settings/security-form'
import { NotificationTestPanel } from '@/components/settings/notification-test-panel'
import { getProfile, saveProfile, type ProfileData } from '@/app/dashboard/settings/actions'

// ── Minimal inline status toast ───────────────────────────────────────────────
type ToastState = { type: 'success' | 'error'; msg: string } | null
function Toast({ status }: { status: ToastState }) {
  if (!status) return null
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold mt-3 ${
      status.type === 'success'
        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        : 'bg-red-50 border border-red-200 text-red-700'
    }`}>
      {status.type === 'success'
        ? <CheckCircle2 className="h-4 w-4 shrink-0" />
        : <XCircle className="h-4 w-4 shrink-0" />}
      {status.msg}
    </div>
  )
}

export default function SettingsPage() {
  const { locale, setLocale } = useLanguage()

  // Profile fields — all controlled
  const [displayName, setDisplayName]               = useState('')
  const [phone, setPhone]                           = useState('')
  const [currency, setCurrency]                     = useState('USD')
  const [notifEmail, setNotifEmail]                 = useState(true)
  const [notifBrowser, setNotifBrowser]             = useState(false)

  // UI state
  const [loading, setLoading]                       = useState(true)
  const [saving, setSaving]                         = useState(false)
  const [prefSaved, setPrefSaved]                   = useState(false)
  const [toast, setToast]                           = useState<ToastState>(null)

  // ── Load profile from Supabase on mount ──────────────────────────────────
  useEffect(() => {
    getProfile().then((result) => {
      if (result.success && result.data) {
        const d = result.data as ProfileData
        setDisplayName(d.full_name ?? '')
        setPhone(d.phone ?? '')
        setCurrency(d.preferred_currency ?? 'SAR')
        setNotifEmail(d.email_notifications ?? true)
        setNotifBrowser(d.browser_notifications ?? false)
      }
      setLoading(false)
    })
  }, [])

  // ── Save profile to Supabase ──────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    setToast(null)
    const result = await saveProfile({
      full_name:            displayName,
      phone,
      preferred_currency:   currency,
      email_notifications:  notifEmail,
      browser_notifications: notifBrowser,
    })
    setSaving(false)
    if (result.success) {
      setPrefSaved(true)
      setToast({ type: 'success', msg: 'تم حفظ الإعدادات بنجاح ✓' })
      setTimeout(() => { setPrefSaved(false); setToast(null) }, 3000)
    } else {
      setToast({ type: 'error', msg: result.error ?? 'فشل الحفظ، يرجى المحاولة مرة أخرى.' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <header>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">الإعدادات</h1>
        <p className="text-slate-500 text-base mt-1">إدارة حسابك، الأمان، وتفضيلات المنصة</p>
      </header>

      {/* ── Main 12-col grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Left col (8): Profile + Security ───────────────────── */}
        <div className="lg:col-span-8 space-y-8">

          {/* Account Profile Section */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                <User className="h-5 w-5 text-blue-600" />
                الملف الشخصي
              </h3>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-slate-200 overflow-hidden">
                  <User className="h-10 w-10 text-white" />
                </div>
              </div>

              {/* Fields */}
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">الاسم الكامل</label>
                  <input
                    className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                    type="text"
                    placeholder="أدخل اسمك الكامل"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">رقم الهاتف</label>
                  <div className="relative">
                    <input
                      className="tabular-nums w-full bg-slate-50 border-0 rounded-xl ps-12 pe-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                      dir="ltr"
                      type="text"
                      placeholder="+966 50 000 0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400">📞</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Security & Privacy — extracted interactive Client Component */}
          <SecurityForm />

          {/* Notification Testing — interactive client component */}
          <NotificationTestPanel />
        </div>

        {/* ── Right col (4): Preferences ───────────────────────────── */}
        <div className="lg:col-span-4 space-y-8">

          {/* Platform Preferences */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-900">
              <Settings2 className="h-5 w-5 text-blue-600" />
              تفضيلات المنصة
            </h3>
            <div className="space-y-6">
              {/* Language */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Languages className="h-4 w-4 text-slate-400" />
                  اللغة
                </label>
                <Select value={locale} onValueChange={(v) => setLocale(v as 'en' | 'ar')}>
                  <SelectTrigger className="w-full bg-slate-50 border-0 rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية 🇸🇦</SelectItem>
                    <SelectItem value="en">English 🇬🇧</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  العملة الأساسية
                </label>
                <div className="flex gap-2">
                  {(['SAR', 'USD', 'TRY'] as const).map((code) => (
                    <button
                      key={code}
                      onClick={() => setCurrency(code)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold tabular-nums transition-all ${
                        currency === code
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {currency === 'SAR' && '＊ العملة الافتراضية: الريال السعودي ر.س'}
                  {currency === 'USD' && '＊ الدولار الأمريكي $'}
                  {currency === 'TRY' && '＊ الليرة التركية ₺'}
                </p>
              </div>

              {/* Notifications */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <p className="text-sm font-bold text-slate-900">التنبيهات</p>
                <div className="flex items-center justify-between">
                  <label htmlFor="notif-email" className="text-sm font-medium text-slate-700 cursor-pointer">
                    البريد الإلكتروني
                  </label>
                  <Switch
                    id="notif-email"
                    checked={notifEmail}
                    onCheckedChange={setNotifEmail}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="notif-browser" className="text-sm font-medium text-slate-700 cursor-pointer">
                    تنبيهات المتصفح
                  </label>
                  <Switch
                    id="notif-browser"
                    checked={notifBrowser}
                    onCheckedChange={setNotifBrowser}
                  />
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* ── Footer: Global Save ───────────────────────────────────── */}
      <footer className="flex flex-col items-end gap-3 pb-8">
        <Toast status={toast} />
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-10 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 transition-all text-sm"
          >
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري الحفظ...</>
              : prefSaved
              ? <><Check className="h-4 w-4" /> تم الحفظ</>
              : <><Save className="h-4 w-4" /> حفظ التغييرات</>}
          </button>
        </div>
      </footer>
    </div>
  )
}
