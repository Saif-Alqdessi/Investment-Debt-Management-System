'use server'

import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'
import { getProfile } from '@/app/dashboard/settings/actions'

// ── Nodemailer transporter (Gmail SMTP, port 465, SSL) ───────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
})

// ── Types ────────────────────────────────────────────────────────────────────
interface MaturingInvestment {
  id: string
  investor_name: string
  principal_amount: number
  profit_amount: number
  total_payout: number
  due_date: string
  duration: string
}

// ── Helper: format currency dynamically ─────────────────────────────────────
const CURRENCY_LOCALE: Record<string, string> = { SAR: 'ar-SA', USD: 'en-US', TRY: 'tr-TR' }

function fmt(amount: number, currencyCode = 'SAR') {
  const locale = CURRENCY_LOCALE[currencyCode] ?? 'ar-SA'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount)
}

// ── Helper: format date in Arabic ────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ── Build HTML email body ────────────────────────────────────────────────────
function buildEmailHtml(investments: MaturingInvestment[], generatedAt: string, currency = 'SAR'): string {
  const rows = investments
    .map(
      (inv) => `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#0f172a;">${inv.investor_name}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;font-family:monospace;text-align:right;direction:ltr;color:#334155;">${fmt(inv.principal_amount, currency)}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;font-family:monospace;text-align:right;direction:ltr;color:#16a34a;">${fmt(inv.profit_amount, currency)}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;font-family:monospace;text-align:right;direction:ltr;color:#1d4ed8;font-weight:700;">${fmt(inv.total_payout, currency)}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;color:#dc2626;font-weight:700;">${fmtDate(inv.due_date)}</td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>تنبيه استحقاق الاستثمارات</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);max-width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">⚠️ تنبيه استحقاق الاستثمارات</h1>
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">منصة Rareb للاستثمارات · ${generatedAt}</p>
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
                    <th style="padding:12px 16px;text-align:right;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0;">المستثمر</th>
                    <th style="padding:12px 16px;text-align:right;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0;">رأس المال</th>
                    <th style="padding:12px 16px;text-align:right;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0;">الربح</th>
                    <th style="padding:12px 16px;text-align:right;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0;">إجمالي الصرف</th>
                    <th style="padding:12px 16px;text-align:right;font-size:12px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0;">تاريخ الاستحقاق</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard/investments"
                 style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:14px;padding:14px 36px;border-radius:12px;text-decoration:none;">
                فتح لوحة التحكم
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                هذا البريد تم إرساله تلقائياً من منصة Rareb للاستثمارات. يُرجى عدم الرد عليه.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Main server action ───────────────────────────────────────────────────────
export async function sendMaturityAlerts(targetEmail: string) {
  const supabase = createClient()

  // Auth guard
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    // Fetch user's preferred currency for email formatting
    const profileResult = await getProfile()
    const currency = profileResult.success && profileResult.data
      ? profileResult.data.preferred_currency
      : 'SAR'

    // Calculate date window: today → +7 days
    const today = new Date()
    const in7Days = new Date(today)
    in7Days.setDate(today.getDate() + 7)

    const todayStr   = today.toISOString().split('T')[0]
    const in7DaysStr = in7Days.toISOString().split('T')[0]

    // Query: active, due within next 7 days, profit NOT yet delivered
    const { data: investments, error: fetchError } = await supabase
      .from('investments')
      .select('id, investor_name, principal_amount, profit_amount, total_payout, due_date, duration')
      .eq('status', 'active')
      .eq('is_profit_delivered', false)
      .gte('due_date', todayStr)
      .lte('due_date', in7DaysStr)
      .order('due_date', { ascending: true })

    if (fetchError) {
      throw new Error(`Failed to fetch investments: ${fetchError.message}`)
    }

    if (!investments || investments.length === 0) {
      return {
        success: true,
        sent: false,
        message: 'لا توجد استثمارات مستحقة خلال الأيام السبعة القادمة.',
      }
    }

    const generatedAt = today.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const html = buildEmailHtml(investments as MaturingInvestment[], generatedAt, currency)

    // Send via Gmail SMTP (nodemailer)
    await transporter.sendMail({
      from: `"Rareb Investments" <${process.env.EMAIL_USER}>`,
      to: targetEmail,
      subject: `⚠️ تنبيه: ${investments.length} استثمار يستحق خلال 7 أيام — ${generatedAt}`,
      html,
    })

    return {
      success: true,
      sent: true,
      count: investments.length,
    }
  } catch (error) {
    console.error('Error sending maturity alerts:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
