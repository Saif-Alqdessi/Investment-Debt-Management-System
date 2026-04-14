'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" dir="rtl">

      {/* ── Left panel: branding visual ─────────────────────────────── */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/80 to-blue-950/60" />
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
            <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold tracking-widest uppercase rounded-full shadow-lg shadow-blue-600/30">
              Private Wealth Management
            </span>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight font-sans">
              Rareb <br />
              <span className="text-blue-400">Digital Ledger</span>
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

      {/* ── Right panel: login form ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-slate-50 relative">
        {/* Floating header */}
        <header className="flex justify-between items-center px-6 py-4 h-16">
          <div className="text-2xl font-bold tracking-tight text-slate-900">Rareb</div>
        </header>

        {/* Form area */}
        <main className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24">
          <div className="w-full max-w-md space-y-10">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">مرحباً بك مجدداً</h2>
              <p className="text-slate-500 font-medium">سجل دخولك للوصول إلى محفظتك الاستثمارية</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-5">
                {/* Email field */}
                <div className="relative group">
                  <input
                    id="email"
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="peer w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 h-14 ps-12 pe-4 rounded-xl transition-all outline-none text-slate-900 placeholder:text-slate-400 text-sm"
                  />
                  <div className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                </div>

                {/* Password field */}
                <div className="relative group">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="peer w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 h-14 ps-12 pe-12 rounded-xl transition-all outline-none text-slate-900 placeholder:text-slate-400 text-sm"
                  />
                  <div className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 select-none">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" />
                  تذكرني
                </label>
                <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                  نسيت كلمة المرور؟
                </a>
              </div>

              {/* Error */}
              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-blue-600 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/40 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </form>

            {/* Security badge */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 text-xs font-medium">
                <Shield className="h-4 w-4 text-blue-600" />
                تشفير آمن بمستوى مصرفي 256-بت
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="flex flex-col sm:flex-row justify-between items-center px-8 py-6 gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Rareb</span>
            <span className="uppercase tracking-widest">Private Wealth</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-blue-600 transition-colors">Security</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
          </div>
          <span>© 2024 Rareb Private Wealth. All rights reserved.</span>
        </footer>
      </div>
    </div>
  )
}
