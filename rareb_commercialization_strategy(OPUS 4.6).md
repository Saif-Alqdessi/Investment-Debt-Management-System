# 🏦 Rareb Commercialization Strategy

> **Objective:** Transform a single-client investment management platform into a sellable B2B product for investment offices and agencies across the Middle East and beyond.

---

## 0. Current Architecture Snapshot

Before proposing models, here is what we're working with:

| Layer | Current State | SaaS-Readiness |
|---|---|:---:|
| **Auth** | Supabase GoTrue — `signInWithPassword` only, no signup page | 🟡 |
| **Multi-tenancy** | RLS on `user_id` — per-user isolation | 🟢 |
| **Roles** | `profiles.role`: `owner / admin / viewer` — defined but **not enforced in code** | 🔴 |
| **Branding** | Hardcoded "Rareb" across login page, sidebar, emails | 🔴 |
| **Onboarding** | No self-service signup, no organization concept, no billing | 🔴 |
| **Cron System** | GitHub Actions → API route (service role) — single-tenant SMTP config | 🟡 |
| **Data Schema** | 8 tables: profiles, investments, shared_investors, debts, debt_payments, investment_transactions, notifications, audit_log | 🟢 |
| **i18n** | Full Arabic + English, RTL support | 🟢 |
| **Deployment** | Netlify (SSR), single Supabase project | 🟡 |

---

## 1. Three Commercialization Models

---

### Model A — Shared Multi-Tenant SaaS (Recommended)

> **Concept:** One deployment, one database, many organizations. Each "tenant" is an investment office that signs up, manages their team, and sees only their own data. You charge a monthly subscription.

```
┌────────────────────────────────────────────────────┐
│             rareb.app (single deployment)           │
│                                                     │
│  Tenant A (Org)     Tenant B (Org)     Tenant C     │
│  ├─ Owner           ├─ Owner           ├─ Owner     │
│  ├─ Admin (2)       ├─ Admin (1)       └─ (solo)    │
│  └─ Viewer (3)      └─ Viewer (5)                   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │     Single Supabase DB + RLS on org_id       │   │
│  └──────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

#### What Needs to Change

| Component | Current | Required Change |
|---|---|---|
| **Schema** | `user_id` per row | Add `organizations` table + `org_id` FK on every data table. RLS shifts from `auth.uid() = user_id` → `auth.uid() IN (SELECT user_id FROM org_members WHERE org_id = row.org_id)` |
| **Auth** | Login-only | Add self-service signup page → creates user + org in a single transaction |
| **Roles** | `profiles.role` (unused) | Create `org_members` table with `role` column. Enforce in middleware and server actions. Owner invites admins/viewers |
| **Onboarding** | None | Build `/onboarding` wizard: org name, currency, upload logo, invite team |
| **Billing** | None | Integrate Stripe or LemonSqueezy. Plans gated by seat count or investment volume |
| **Branding** | Hardcoded | Move to `organizations.name / logo_url / primary_color` — login page shows org branding dynamically |
| **Cron** | Groups by `created_by` | Groups by `org_id`, sends to org owner's email (or per-org notification settings) |
| **Email Config** | Single Gmail SMTP | Keep centralized (you send on behalf of Rareb). Add `Reply-To` from org settings |

#### Pricing Suggestion

| Plan | Price (USD/mo) | Limits |
|---|---|---|
| **Starter** | Free / $0 | 1 user, ≤10 investments, ≤5 debts, no email alerts |
| **Professional** | $29/mo | Up to 3 seats, unlimited investments, email alerts, Excel export |
| **Business** | $79/mo | Up to 10 seats, priority support, custom branding, audit log access |
| **Enterprise** | $199+/mo | Unlimited seats, dedicated subdomain, SLA, API access |

> [!TIP]
> For the MENA market, consider offering **annual billing with SAR pricing** (e.g., SAR 99/mo Professional) to reduce friction. Many regional offices prefer annual invoicing over monthly credit card charges.

---

### Model B — White-Label Instance-per-Client

> **Concept:** Each client gets their own isolated deployment: their own Supabase project, their own Netlify site, their own branding. You deploy and manage it for them as a managed service.

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  client-a.rareb.app │  │  client-b.rareb.app │  │  acme-invest.com    │
│  Supabase Project A │  │  Supabase Project B │  │  Supabase Project C │
│  Netlify Site A     │  │  Netlify Site B     │  │  Netlify Site C     │
│  Their logo/colors  │  │  Their logo/colors  │  │  Their logo/colors  │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
            │                      │                        │
            └──────── You manage all instances ─────────────┘
```

#### What Needs to Change

| Component | Current | Required Change |
|---|---|---|
| **Schema** | No change needed | Each instance is a fresh DB — just run the migration |
| **Auth** | No change needed | Each Supabase project has its own auth |
| **Branding** | Hardcoded | Extract to env vars: `APP_NAME`, `APP_LOGO_URL`, `APP_PRIMARY_COLOR`, `APP_TAGLINE` |
| **Deployment** | Manual | Build a deployment script/CLI: `./deploy.sh --client=acme --domain=acme-invest.com` — provisions Supabase project + Netlify site + sets env vars |
| **Cron** | Single endpoint | Each instance has its own cron — multiply GitHub Action workflows per client, or build a central "control plane" |
| **Email** | Single Gmail | Per-client SMTP config via env vars (already supports this) |
| **Billing** | None | Invoice-based. No Stripe needed — send annual invoices directly |

#### Pricing Suggestion

| Plan | Price (USD) | Includes |
|---|---|---|
| **Setup Fee** | $500–$1,000 one-time | Provisioning, branding, migration, onboarding call |
| **Monthly Hosting** | $99–$199/mo | Managed hosting, monitoring, email alerts, updates |
| **Annual License** | $999–$1,999/yr | Discounted rate, priority support |
| **Custom Domain** | +$50 setup | DNS configuration + SSL |

> [!TIP]
> This model works extremely well for the **first 5–15 clients** while you validate product-market fit. It's high-margin because each client feels they're getting a "custom" system.

---

### Model C — Marketplace License (Self-Hosted / One-Time Sale)

> **Concept:** Package Rareb as a downloadable product on platforms like CodeCanyon, Gumroad, or your own storefront. The buyer gets the source code, deploys it themselves (or pays you for deployment assistance).

```
Customer purchases license
        ↓
Downloads source code (.zip)
        ↓
Deploys to their own Vercel/Netlify + Supabase
        ↓
You provide documentation + optional paid support
```

#### What Needs to Change

| Component | Current | Required Change |
|---|---|---|
| **Documentation** | README exists | Expand to full deployment guide with screenshots, video walkthrough |
| **Branding** | Hardcoded | Extract ALL branding to a single `config/branding.ts` file (name, logo, colors, tagline) |
| **Schema** | Migration files exist | Create a single idempotent `setup.sql` that builds the entire schema from scratch |
| **Onboarding** | None | Add a first-run `/setup` page that creates the admin user and org |
| **License** | Private | Add license key validation or honor-system (common on CodeCanyon) |
| **Support** | None | Offer paid "Extended Support" tier ($50–$100 for 6-month support) |

#### Pricing Suggestion

| Item | Price (USD) |
|---|---|
| **Regular License** (single end product, non-SaaS) | $59–$99 |
| **Extended License** (SaaS / resale rights) | $299–$499 |
| **Deployment Service** | $200–$400 (one-time, optional) |
| **6-month Extended Support** | $50–$99 |

> [!WARNING]
> This model generates revenue per-sale but not recurring revenue. It also means you lose control — buyers can fork, resell, or never update. Only recommended as a **secondary revenue stream**, not the primary business model.

---

## 2. Comparison Matrix

| Dimension | Model A (Multi-Tenant SaaS) | Model B (White-Label) | Model C (Marketplace) |
|---|---|---|---|
| **Engineering Effort** | 🔴 High (4–8 weeks) | 🟡 Medium (2–3 weeks) | 🟢 Low (1–2 weeks) |
| **Revenue Model** | Recurring (MRR) | Recurring (managed service) | One-time + support |
| **Revenue Ceiling** | Highest (scales infinitely) | Medium (limited by ops capacity) | Lowest (volume-dependent) |
| **Maintenance** | Single codebase + single DB | N codebases × N databases | Zero (buyer's problem) |
| **Customer Trust** | Medium (shared infrastructure) | High (dedicated isolation) | N/A (self-hosted) |
| **Scalability** | Linear (add rows, not servers) | O(n) operational cost | Unlimited sales, zero ops |
| **Time to First Dollar** | 6–10 weeks | 2–4 weeks | 1–2 weeks |
| **Best For** | Long-term SaaS business | High-value enterprise clients | Passive income + validation |
| **MENA Fit** | 🟢 Great (regulatory comfort with "hosted in Supabase") | 🟢 Great (agencies love "their own system") | 🟡 Okay (tech-savvy buyers only) |

---

## 3. Strategic Recommendation

> [!IMPORTANT]
> ### The Optimal Path: Start B → Graduate to A
>
> 1. **Months 1–3:** Launch with **Model B (White-Label)** for 3–5 paying clients. Each pays $99–$199/mo. This validates demand, generates cash flow, and requires minimal engineering.
>
> 2. **Months 3–6:** While managing those clients, build the **Model A (Multi-Tenant SaaS)** infrastructure in parallel. Use revenue from Model B to fund development.
>
> 3. **Month 6+:** Launch Model A publicly. Migrate smaller clients to the SaaS. Keep enterprise clients on Model B at premium pricing.
>
> 4. **Passive Income (anytime):** List a "starter" version on Gumroad/CodeCanyon as **Model C** for $59–$99. This generates leads and passive income with near-zero effort.

---

## 4. Immediate Next Steps (Top 3)

These 3 tasks prepare the codebase for **Model B** (fastest to revenue) while laying groundwork for **Model A**:

### Step 1: Extract Branding to a Config Layer

**What:** Create `lib/config/branding.ts` that exports all hardcoded strings and colors:

```typescript
// lib/config/branding.ts
export const BRANDING = {
  appName:     process.env.NEXT_PUBLIC_APP_NAME     ?? 'Rareb',
  tagline:     process.env.NEXT_PUBLIC_APP_TAGLINE  ?? 'Private Wealth Management',
  taglineAr:   process.env.NEXT_PUBLIC_APP_TAGLINE_AR ?? 'إدارة الثروات الخاصة',
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? '#2563eb',
  logoUrl:     process.env.NEXT_PUBLIC_LOGO_URL      ?? '/logo.svg',
}
```

**Files to update:** Login page, sidebar, header, email templates, page titles.

**Why:** This single change unlocks **Model B** immediately. Each client's Netlify instance just sets different env vars.

---

### Step 2: Build Self-Service Signup

**What:** Create `/signup` page that:
1. Calls `supabase.auth.signUp({ email, password })`
2. Inserts a row in `profiles` with the new user's ID
3. Redirects to `/dashboard`

**Why:** Currently, new users must be manually created in the Supabase Auth dashboard. No commercial product can survive without self-service registration. This is required for **all three models**.

---

### Step 3: Enforce the Role System

**What:** The `profiles.role` column (`owner | admin | viewer`) already exists but is **never checked anywhere in the code**. Implement:

1. **Server-side guard:** Create a `requireRole('owner')` helper that reads the user's profile and throws if they lack the required role
2. **UI enforcement:** Hide destructive actions (delete investment, edit settings) from `viewer` role
3. **Middleware-level:** Add role to the session claims or fetch it in the dashboard layout once

**Why:** No agency will buy a system where every user has god-mode access. Role enforcement is table-stakes for B2B sales. It also pre-builds the `owner → admin → viewer` hierarchy that Model A's `org_members` table will extend.

---

## 5. Long-Term Feature Backlog (Post-Launch)

Once the 3 immediate steps are done, these features unlock higher-tier pricing:

| Feature | Model Impact | Pricing Tier |
|---|---|---|
| **Audit Log UI** (table exists, no frontend) | All | Business+ |
| **Team Invitations** (email-based invite flow) | A, B | Professional+ |
| **API Access** (REST/GraphQL for external integrations) | A | Enterprise |
| **Multi-Currency Portfolio** (per-investment currency, not just per-user) | All | Professional+ |
| **Custom PDF Reports** (branded, downloadable) | B | Business+ |
| **Supabase Realtime** (live dashboard updates across team) | A | Business+ |
| **2FA / SSO** (Supabase supports TOTP, SAML) | All | Enterprise |
| **Webhook Notifications** (Slack, Teams, Telegram) | All | Business+ |
| **White-Label Mobile App** (React Native / Expo) | B | Enterprise |
