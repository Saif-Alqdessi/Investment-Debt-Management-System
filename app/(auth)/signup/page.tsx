'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, Mail, Shield, UserPlus } from 'lucide-react'
import { BRANDING } from '@/lib/config/branding'
import Link from 'next/link'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Client-side validation
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.')
      return
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.')
      return
    }

    setLoading(true)

    try {
      // 1. Create auth user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (!data.user) {
        setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.')
        return
      }

      // 2. Upsert profile row — role defaults to 'owner' (first user of this instance)
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          full_name: fullName.trim(),
          role: 'owner',
          preferred_currency: 'SAR',
          email_notifications: true,
          browser_notifications: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

      if (profileError) {
        console.error('[signup] Profile upsert error:', profileError)
        // Non-fatal — auth user was created; profile can be completed later
      }

      // 3. If Supabase email confirmation is disabled the session is ready —
      //    redirect immediately.  If confirmation is required, show success message.
      if (data.session) {
        router.push('/dashboard')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6" dir="rtl">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-100 p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">تحقق من بريدك الإلكتروني</h2>
          <p className="text-slate-500 leading-relaxed">
            تم إنشاء حسابك بنجاح. أرسلنا رسالة تأكيد إلى{' '}
            <span className="font-semibold text-slate-800">{email}</span>. افتح الرسالة وانقر على
            رابط التأكيد لتفعيل حسابك.
          </p>
          <Link
            href="/login"
            className="inline-block w-full h-12 bg-brand-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-brand-700 transition-colors leading-[3rem]"
          >
            العودة لصفحة الدخول
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" dir="rtl">

      {/* ── Left panel: branding visual ─────────────────────────────── */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/80 to-brand-950/60" />
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 max-w-lg text-white space-y-8">
          <div className="space-y-4">
            <span className="inline-block px-3 py-1 bg-brand-600 text-white text-xs font-bold tracking-widest uppercase rounded-full shadow-lg shadow-brand-600/30">
              {BRANDING.tagline}
            </span>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight font-sans">
              {BRANDING.appName} <br />
              <span className="text-brand-400">Digital Ledger</span>
            </h1>
            <p className="text-slate-300 text-lg font-light leading-relaxed">
              Architecting your financial future with mathematical precision and editorial clarity.
            </p>
          </div>
          <div className="flex gap-12 pt-8 border-t border-white/10">
            <div className="space-y-1">
              <p className="text-2xl font-bold tabular-nums">+2.4M</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest">Active Assets</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold tabular-nums">0.08%</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest">Fee Transparency</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: signup form ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-slate-50 relative">
        {/* Floating header */}
        <header className="flex justify-between items-center px-6 py-4 h-16">
          <div className="text-2xl font-bold tracking-tight text-slate-900">{BRANDING.appName}</div>
          <Link
            href="/login"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
          >
            تسجيل الدخول
          </Link>
        </header>

        {/* Form area */}
        <main className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24">
          <div className="w-full max-w-md space-y-10">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">إنشاء حساب جديد</h2>
              <p className="text-slate-500 font-medium">أنشئ حسابك للبدء في إدارة استثماراتك</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-5">
                {/* Full Name */}
                <div className="relative group">
                  <input
                    id="full-name"
                    type="text"
                    placeholder="الاسم الكامل"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="peer w-full bg-white border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 h-14 ps-12 pe-4 rounded-xl transition-all outline-none text-slate-900 placeholder:text-slate-400 text-sm"
                  />
                  <div className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors">
                    <UserPlus className="h-5 w-5" />
                  </div>
                </div>

                {/* Email */}
                <div className="relative group">
                  <input
                    id="email"
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="peer w-full bg-white border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 h-14 ps-12 pe-4 rounded-xl transition-all outline-none text-slate-900 placeholder:text-slate-400 text-sm"
                  />
                  <div className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                </div>

                {/* Password */}
                <div className="relative group">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="كلمة المرور (8 أحرف على الأقل)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="peer w-full bg-white border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 h-14 ps-12 pe-12 rounded-xl transition-all outline-none text-slate-900 placeholder:text-slate-400 text-sm"
                  />
                  <div className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative group">
                  <input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="تأكيد كلمة المرور"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="peer w-full bg-white border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 h-14 ps-12 pe-12 rounded-xl transition-all outline-none text-slate-900 placeholder:text-slate-400 text-sm"
                  />
                  <div className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showConfirm ? 'إخفاء التأكيد' : 'إظهار التأكيد'}
                  >
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                id="signup-submit"
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-brand-600 text-white rounded-xl font-bold text-base shadow-lg shadow-brand-600/20 hover:bg-brand-700 hover:shadow-brand-600/40 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'إنشاء الحساب'
                )}
              </button>

              <p className="text-center text-sm text-slate-500">
                لديك حساب بالفعل؟{' '}
                <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors">
                  سجل دخولك
                </Link>
              </p>
            </form>

            {/* Security badge */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 text-xs font-medium">
                <Shield className="h-4 w-4 text-brand-600" />
                تشفير آمن بمستوى مصرفي 256-بت
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="flex flex-col sm:flex-row justify-between items-center px-8 py-6 gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">{BRANDING.appName}</span>
            <span className="uppercase tracking-widest">{BRANDING.tagline}</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-brand-600 transition-colors">Security</a>
            <a href="#" className="hover:text-brand-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand-600 transition-colors">Terms of Service</a>
          </div>
          <span>© {new Date().getFullYear()} {BRANDING.copyrightName}. All rights reserved.</span>
        </footer>
      </div>
    </div>
  )
}
