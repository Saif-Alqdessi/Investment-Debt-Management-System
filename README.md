# 🏦 Rareb — Investment & Debt Management System

> **Take full control of your financial portfolio.** Rareb is a private, secure, full-stack platform for tracking investments, managing debts, calculating returns, and maintaining a complete audit trail — with first-class Arabic (RTL) and English support.

---

## ✨ Key Features

| | Feature | Description |
|---|---|---|
| 📈 | **Investment Tracking** | Create and manage investments with automatic ROI, commission, and total payout calculations across four duration types (annual, semi-annual, quarterly, monthly). |
| 🤝 | **Multi-Investor Sharing** | Split a single investment among multiple sub-investors with percentage-based profit and custom commission rates. Real-time validation ensures splits always total 100%. |
| 💳 | **Debt Management** | Record creditor/debtor relationships with optional interest rates and due dates. Log partial payments over time, with automatic remaining-balance tracking. |
| 🧾 | **Transaction History** | Every financial event — deposits, withdrawals, renewals, profit distributions — is logged in a per-investment timeline with full audit detail. |
| 🔔 | **Notification Center** | Unread alerts fetched live from the database appear in the header bell menu. Mark individual or all notifications as read in one click. |
| 📊 | **Reports Dashboard** | Portfolio growth bar chart, category distribution donut chart, and a 12-month revenue/maturity schedule — all driven by live data. |
| 🌐 | **Dual Language (AR / EN)** | Full Arabic localization with RTL layout flipping via Tailwind logical properties. Language preference is persisted to `localStorage` and applied globally. |
| 🔒 | **Secure by Default** | Supabase Row Level Security ensures every user can only read and write their own data — enforced at the database level, not just the application layer. |
| 📤 | **Excel Export** | Export filtered investment or debt records to `.xlsx` with one click using the `xlsx` library. |
| 🔍 | **Global Search** | A shared search context syncs the header search bar with the in-table search bar in real time — typing anywhere filters everywhere on that page. |

---

## 🛠️ Tech Stack

![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 — App Router, Server Actions, Server Components |
| **Language** | TypeScript 5 |
| **Database & Auth** | Supabase (PostgreSQL 15, GoTrue Auth, Row Level Security) |
| **Styling** | Tailwind CSS 3 + `tailwindcss-animate` |
| **UI Components** | shadcn/ui (Radix UI primitives) |
| **Icons** | Lucide React |
| **Forms** | React Hook Form 7 + Zod 3 |
| **Tables** | TanStack Table v8 |
| **Charts** | Recharts 2 |
| **Export** | xlsx (SheetJS) |
| **State** | React Context (Language, Search) + TanStack Query |
| **Email** | Resend API *(optional)* |

---

## � Getting Started

### Prerequisites

- **Node.js** 18 or later
- **npm** 9+ (or yarn / pnpm)
- A free [Supabase](https://supabase.com) account

---

### 1 — Clone & Install

```bash
git clone https://github.com/your-username/rareb.git
cd rareb
npm install
```

---

### 2 — Configure Environment Variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Open `.env.local` and set the following:

```env
# ── Supabase ──────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# ── Email Notifications (optional) ───────────────────
RESEND_API_KEY=<your-resend-api-key>
```

> **Where to find these values:** Supabase Dashboard → Project Settings → API.

---

### 3 — Apply the Database Migration

Open the **Supabase SQL Editor** for your project and paste the contents of:

```
supabase/migrations/001_fix_schema.sql
```

This migration is idempotent — safe to run on both a fresh project and an existing one. It will:

- Create / patch the `investments`, `shared_investors`, `debts`, `debt_payments`, `investment_transactions`, and `notifications` tables.
- Add computed columns (`profit_amount`, `commission_amount`, `total_payout`, `remaining_amount`).
- Fix all foreign-key constraints to reference `auth.users`.
- Enable **Row Level Security** and install all CRUD policies.

---

### 4 — Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/login` automatically.

---

### 5 — Build for Production

```bash
npm run build
npm start
```

Recommended hosting: **Vercel** (zero-config Next.js), **Netlify**, or any Node.js server.

---

## 🗄️ Database Schema

The PostgreSQL schema is managed via Supabase and lives in `supabase/migrations/`.

### Core Tables

```
auth.users                  ← Managed by Supabase GoTrue
│
├── investments             ← Principal, duration, profit rate, commission rate,
│   │                          computed payout, status (active/matured/renewed/withdrawn)
│   ├── shared_investors    ← Per-investor share %, profit split, commission split
│   └── investment_transactions  ← Deposit / withdrawal / renewal / profit audit log
│
├── debts                   ← Creditor, debtor, principal, optional interest, due date
│   └── debt_payments       ← Partial payment records with method and notes
│
└── notifications           ← Unread alerts with type, title, message, is_read flag
```

### Row Level Security

Every table enforces `created_by = auth.uid()` at the database level:

```sql
-- Example: users can only SELECT their own investments
CREATE POLICY "Users can view their own investments"
  ON public.investments FOR SELECT TO authenticated
  USING (created_by = auth.uid());
```

Child tables (`shared_investors`, `debt_payments`) are protected transitively — access is granted only when the parent row belongs to the authenticated user. **No application-level bypass is possible.**

---

## 📁 Project Structure

```
rareb/
├── app/
│   ├── (auth)/
│   │   └── login/              # Public login page
│   ├── dashboard/
│   │   ├── layout.tsx          # Sidebar + Header shell
│   │   ├── page.tsx            # Dashboard home (metrics, activity)
│   │   ├── investments/
│   │   │   ├── page.tsx        # Investments list (server)
│   │   │   ├── new/page.tsx    # New investment form
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx    # Investment detail view
│   │   │   │   └── edit/page.tsx  # Edit investment form
│   │   │   └── actions.ts      # Server Actions (CRUD + transactions)
│   │   ├── debts/
│   │   │   ├── page.tsx        # Debts list (server)
│   │   │   ├── new/page.tsx    # New debt form
│   │   │   └── actions.ts      # Server Actions (CRUD + payments)
│   │   ├── reports/page.tsx    # Portfolio analytics
│   │   └── settings/page.tsx   # Profile & app preferences
│   ├── layout.tsx              # Root layout (Providers, DirectionWrapper)
│   └── page.tsx                # Root redirect → /dashboard
│
├── components/
│   ├── ui/                     # shadcn/ui primitives (Button, Card, Dialog…)
│   ├── investments/
│   │   ├── investment-form.tsx        # Create / edit form (RHF + Zod)
│   │   ├── investment-table.tsx       # TanStack Table with actions
│   │   ├── investments-client.tsx     # Client wrapper (search, filter, stats)
│   │   ├── shared-investors-form.tsx  # Dynamic sub-investor split form
│   │   └── transaction-panel.tsx      # Transaction history timeline + modal
│   ├── debts/
│   │   ├── debt-table.tsx             # Debt rows with payment history
│   │   ├── debts-client.tsx           # Client wrapper (search, filter, stats)
│   │   └── payment-modal.tsx          # Record partial payment dialog
│   ├── layout/
│   │   ├── sidebar.tsx         # Navigation + sign-out
│   │   └── header.tsx          # Search bar, notifications bell, profile menu
│   ├── direction-wrapper.tsx   # Sets document dir + lang dynamically
│   └── providers.tsx           # QueryClient + LanguageProvider + SearchProvider
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client (createBrowserClient)
│   │   └── server.ts           # Server Supabase client (createServerClient)
│   ├── i18n/
│   │   ├── context.tsx         # LanguageProvider + useLanguage hook
│   │   └── translations.ts     # Full EN / AR dictionary
│   ├── context/
│   │   └── search-context.tsx  # Global search state (SearchProvider + useSearch)
│   ├── export.ts               # Excel export helpers (investments + debts)
│   ├── utils.ts                # cn(), formatCurrency()
│   └── validations.ts          # Zod schemas (investmentSchema, debtSchema)
│
├── types/                      # TypeScript type definitions
├── supabase/
│   └── migrations/
│       └── 001_fix_schema.sql  # Schema + RLS migration
├── middleware.ts               # Auth-guard: redirects unauthenticated users
├── .env.example                # Environment variable template
└── next.config.mjs
```

---

## 🌍 Internationalization

Rareb ships with a complete **Arabic (ar) / English (en)** translation system:

- All UI strings live in `lib/i18n/translations.ts` as a typed nested dictionary.
- The `useLanguage()` hook exposes `{ t, locale, setLocale, isRTL, dir }`.
- Layout direction (`rtl` / `ltr`) is applied to `document.documentElement` via `DirectionWrapper`.
- Tailwind **logical properties** (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) are used throughout so every spacing and positioning value flips automatically with direction.
- The selected language persists across sessions via `localStorage`.

---

## 🔐 Authentication Flow

```
User visits any /dashboard/* route
        ↓
middleware.ts checks Supabase session cookie
        ↓
No session? → redirect to /login
        ↓
Login page calls supabase.auth.signInWithPassword()
        ↓
Session cookie set → redirect to /dashboard
        ↓
Sign-out: supabase.auth.signOut() → redirect to /login
```

---

## 📬 Contact

| | |
|---|---|
| **GitHub** | [github.com/your-username](https://github.com/your-username) |
| **LinkedIn** | [linkedin.com/in/your-profile](https://linkedin.com/in/your-profile) |

---

<div align="center">

Built with Next.js 14 · Supabase · TypeScript · Tailwind CSS

</div>
