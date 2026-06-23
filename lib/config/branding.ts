/**
 * White-Label Branding Configuration (Model B)
 *
 * All brand-specific values are driven by environment variables so that each
 * client deployment only needs a different `.env` file — zero code changes.
 *
 * Usage:
 *   import { BRANDING } from '@/lib/config/branding'
 *   // Server Components, Client Components, Server Actions — all safe.
 *
 * Env vars to set per-deployment:
 *   NEXT_PUBLIC_APP_NAME          — e.g. "Acme Investments"
 *   NEXT_PUBLIC_APP_TAGLINE       — English tagline
 *   NEXT_PUBLIC_APP_TAGLINE_AR    — Arabic tagline
 *   NEXT_PUBLIC_PRIMARY_COLOR     — Hex color, e.g. "#2563eb"
 *   NEXT_PUBLIC_LOGO_URL          — Absolute or relative URL to logo image
 *   NEXT_PUBLIC_APP_URL           — Canonical URL, e.g. "https://acme-invest.com"
 *   NEXT_PUBLIC_COPYRIGHT_NAME    — Name in footer copyright line
 *   NEXT_PUBLIC_SUPPORT_EMAIL     — Reply-to email address for support
 *   NEXT_PUBLIC_EMAIL_FROM_NAME   — "From" display name in outbound emails
 */

export const BRANDING = {
  /** Short display name used in the sidebar, header, and page titles */
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'Rareb',

  /** English tagline shown on the login panel and marketing copy */
  tagline: process.env.NEXT_PUBLIC_APP_TAGLINE ?? 'Private Wealth Management',

  /** Arabic tagline shown on the login panel (RTL) */
  taglineAr:
    process.env.NEXT_PUBLIC_APP_TAGLINE_AR ?? 'إدارة الثروات الخاصة',

  /** Brand primary color — used for buttons, active nav items, accents */
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? '#2563eb',

  /**
   * Logo URL.  If falsy the app falls back to a text-only wordmark.
   * For a white-label instance, set this to a CDN or public asset URL.
   */
  logoUrl: process.env.NEXT_PUBLIC_LOGO_URL ?? null,

  /** Canonical deployment URL — used for email CTA links */
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL ??
    'https://musical-cassata-f4217a.netlify.app',

  /** Name shown in the footer copyright line */
  copyrightName:
    process.env.NEXT_PUBLIC_COPYRIGHT_NAME ?? 'Rareb Private Wealth',

  /** Reply-to / contact email for support links */
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@rareb.app',

  /**
   * "From" display name in all outbound system emails
   * e.g. "Acme Investments" <noreply@acme-invest.com>
   */
  emailFromName:
    process.env.NEXT_PUBLIC_EMAIL_FROM_NAME ?? 'Rareb Investments',

  /** One-letter abbreviation for the icon badge in the sidebar */
  get logoInitial() {
    return (this.appName ?? 'R').charAt(0).toUpperCase()
  },
} as const

export type Branding = typeof BRANDING
