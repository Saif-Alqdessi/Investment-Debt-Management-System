import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { BRANDING } from '@/lib/config/branding'

// ── Runtime: Node.js (required for Nodemailer TCP sockets) ────────────────────
export const runtime = 'nodejs'

// ── Plain interfaces (avoids Database generic narrowing issues) ───────────────
interface RawInvestment {
  id: string
  created_by: string | null
  investor_name: string
  principal_amount: number
  profit_amount: number
  total_payout: number
  due_date: string
  duration: string
  status: string
  is_profit_delivered: boolean
}

interface RawProfile {
  id: string
  email: string
  preferred_currency: string
  email_notifications: boolean
}

// ── Supabase Admin client (Service Role — bypasses RLS) ───────────────────────
function createAdminClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL')
  // No Database generic — we cast results manually to avoid 'never' narrowing
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ── Nodemailer transporter ─────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// ── Currency formatting ────────────────────────────────────────────────────────
const CURRENCY_LOCALE: Record<string, string> = {
  SAR: 'ar-SA',
  USD: 'en-US',
  TRY: 'tr-TR',
}

function fmt(amount: number, currencyCode = 'SAR') {
  const locale = CURRENCY_LOCALE[currencyCode] ?? 'ar-SA'
  return new Intl.NumberFormat(locale, {
    style:                 'currency',
    currency:              currencyCode,
    minimumFractionDigits: 2,
  }).format(amount)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-SA', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  })
}

// ── Build HTML email ──────────────────────────────────────────────────────────
function buildEmailHtml(
  investments: RawInvestment[],
  generatedAt: string,
  currency = 'SAR',
): string {
  const rows = investments
    .map(
      (inv) => `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#0f172a;">${inv.investor_name}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;font-family:monospace;text-align:right;direction:ltr;color:#334155;">${fmt(Number(inv.principal_amount), currency)}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;font-family:monospace;text-align:right;direction:ltr;color:#16a34a;">${fmt(Number(inv.profit_amount), currency)}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;font-family:monospace;text-align:right;direction:ltr;color:#1d4ed8;font-weight:700;">${fmt(Number(inv.total_payout), currency)}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;color:#dc2626;font-weight:700;">${fmtDate(inv.due_date)}</td>
      </tr>`,
    )
    .join('')

  const appUrl = BRANDING.appUrl

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>تنبيه استحقاق الاستثمارات</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);max-width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">⚠️ تنبيه استحقاق الاستثمارات</h1>
            <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">منصة ${BRANDING.appName} للاستثمارات · ${generatedAt}</p>
          </td>
        </tr>

        <!-- Summary Banner -->
        <tr>
          <td style="padding:24px 40px;background:#eff6ff;border-bottom:2px solid #dbeafe;">
            <p style="margin:0;font-size:15px;color:#1e40af;font-weight:700;">
              يوجد <span style="font-size:20px;color:#dc2626;">${investments.length}</span>
              استثمار${investments.length > 1 ? 'ات' : ''} تستحق خلال الـ 7 أيام القادمة ولم يتم تسليم أرباحها بعد.
            </p>
          </td>
        </tr>

        <!-- Table -->
        <tr>
          <td style="padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:12px 16px;text-align:right;font-size:12px;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0;">المستثمر</th>
                  <th style="padding:12px 16px;text-align:right;font-size:12px;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0;">رأس المال</th>
                  <th style="padding:12px 16px;text-align:right;font-size:12px;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0;">الربح</th>
                  <th style="padding:12px 16px;text-align:right;font-size:12px;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0;">إجمالي الصرف</th>
                  <th style="padding:12px 16px;text-align:right;font-size:12px;font-weight:700;color:#dc2626;border-bottom:2px solid #e2e8f0;">تاريخ الاستحقاق</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 40px 32px;text-align:center;">
            <a href="${appUrl}/dashboard/investments"
               style="display:inline-block;background:${BRANDING.primaryColor};color:#ffffff;font-weight:700;font-size:14px;padding:14px 36px;border-radius:12px;text-decoration:none;">
              فتح لوحة التحكم
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              هذا البريد تم إرساله تلقائياً من منصة ${BRANDING.appName}. يُرجى عدم الرد عليه.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── GET /api/cron/alerts ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // ── 1. Verify secret ───────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[cron/alerts] CRON_SECRET env var is not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[cron/alerts] Unauthorized attempt — bad or missing secret')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Init admin Supabase client ──────────────────────────────────────────
  let supabase: ReturnType<typeof createAdminClient>
  try {
    supabase = createAdminClient()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[cron/alerts] Admin client init failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  try {
    // ── 3. Calculate date window (UTC) ─────────────────────────────────────
    const now      = new Date()
    const in7Days  = new Date(now)
    in7Days.setUTCDate(now.getUTCDate() + 7)

    const todayStr   = now.toISOString().split('T')[0]      // YYYY-MM-DD
    const in7DaysStr = in7Days.toISOString().split('T')[0]

    console.log(`[cron/alerts] Scanning investments due between ${todayStr} and ${in7DaysStr}`)

    // ── 4. Fetch ALL qualifying investments across ALL users ───────────────
    // Service role bypasses RLS → returns every user's rows
    const { data: investments, error: invError } = await supabase
      .from('investments')
      .select('*')
      .eq('status', 'active')
      .eq('is_profit_delivered', false)
      .gte('due_date', todayStr)
      .lte('due_date', in7DaysStr)
      .order('due_date', { ascending: true })

    if (invError) throw new Error(`Investment query failed: ${invError.message}`)
    if (!investments || investments.length === 0) {
      console.log('[cron/alerts] No maturing investments found — no emails sent.')
      return NextResponse.json({ success: true, usersNotified: 0, totalInvestments: 0 })
    }

    console.log(`[cron/alerts] Found ${investments.length} investments across users`)

    // ── 5. Group investments by owner (created_by) ─────────────────────────
    const groups = new Map<string, RawInvestment[]>()
    for (const inv of investments as RawInvestment[]) {
      const ownerId = inv.created_by
      if (!ownerId) continue
      const existing = groups.get(ownerId) ?? []
      existing.push(inv)
      groups.set(ownerId, existing)
    }

    if (groups.size === 0) {
      console.warn('[cron/alerts] Investments found but no owner IDs resolved.')
      return NextResponse.json({ success: true, usersNotified: 0, totalInvestments: investments.length })
    }

    // ── 6. Fetch profiles for all owner IDs in a single query ─────────────
    const ownerIds = Array.from(groups.keys())
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, preferred_currency, email_notifications')
      .in('id', ownerIds)

    if (profileError) throw new Error(`Profile query failed: ${profileError.message}`)

    const profileMap = new Map<string, RawProfile>()
    for (const p of (profiles ?? []) as RawProfile[]) {
      profileMap.set(p.id, p)
    }

    // ── 7. Send one grouped email per user ─────────────────────────────────
    const generatedAt = now.toLocaleDateString('ar-SA', {
      year:  'numeric',
      month: 'long',
      day:   'numeric',
    })

    let usersNotified = 0
    let usersSkipped  = 0
    const errors: string[] = []

    for (const [userId, userInvestments] of Array.from(groups.entries())) {
      const profile = profileMap.get(userId)

      // Skip if profile missing or user opted out of email notifications
      if (!profile?.email) {
        console.warn(`[cron/alerts] No profile/email for user ${userId} — skipping`)
        usersSkipped++
        continue
      }
      if (profile.email_notifications === false) {
        console.log(`[cron/alerts] User ${userId} has email_notifications=false — skipping`)
        usersSkipped++
        continue
      }

      const currency = profile.preferred_currency ?? 'SAR'
      const html     = buildEmailHtml(userInvestments, generatedAt, currency)

      try {
        await transporter.sendMail({
          from:    `"${BRANDING.emailFromName}" <${process.env.EMAIL_USER}>`,
          to:      profile.email,
          subject: `⚠️ تنبيه: ${userInvestments.length} استثمار يستحق خلال 7 أيام — ${generatedAt}`,
          html,
        })
        console.log(`[cron/alerts] ✅ Email sent to ${profile.email} (${userInvestments.length} investments)`)
        usersNotified++
      } catch (mailErr) {
        const msg = mailErr instanceof Error ? mailErr.message : String(mailErr)
        console.error(`[cron/alerts] ❌ Failed to send to ${profile.email}: ${msg}`)
        errors.push(`${profile.email}: ${msg}`)
      }
    }

    // ── 8. Return summary ──────────────────────────────────────────────────
    const response = {
      success:          errors.length === 0,
      usersNotified,
      usersSkipped,
      totalInvestments: investments.length,
      errors:           errors.length > 0 ? errors : undefined,
      scannedWindow:    { from: todayStr, to: in7DaysStr },
    }

    console.log('[cron/alerts] Done:', response)
    return NextResponse.json(response, { status: 200 })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[cron/alerts] Fatal error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
