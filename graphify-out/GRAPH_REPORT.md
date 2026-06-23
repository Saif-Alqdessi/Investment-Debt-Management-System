# Graph Report - .  (2026-06-23)

## Corpus Check
- Corpus is ~32,272 words - fits in a single context window. You may not need a graph.

## Summary
- 103 nodes · 51 edges · 69 communities (6 shown, 63 thin omitted)
- Extraction: 80% EXTRACTED · 16% INFERRED · 4% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Feature Actions & i18n|Feature Actions & i18n]]
- [[_COMMUNITY_B2B Commercialization Models|B2B Commercialization Models]]
- [[_COMMUNITY_Cron Alerts & Notifications|Cron Alerts & Notifications]]
- [[_COMMUNITY_Platform Core & Auth|Platform Core & Auth]]
- [[_COMMUNITY_Multi-Tenancy & RLS|Multi-Tenancy & RLS]]
- [[_COMMUNITY_Supabase Auth Layer|Supabase Auth Layer]]
- [[_COMMUNITY_Alerts API Route|Alerts API Route]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_Home Page|Home Page]]
- [[_COMMUNITY_Source License Model|Source License Model]]
- [[_COMMUNITY_Auto-Renewal Trigger|Auto-Renewal Trigger]]
- [[_COMMUNITY_Direction Wrapper|Direction Wrapper]]
- [[_COMMUNITY_Print Button|Print Button]]
- [[_COMMUNITY_App Providers|App Providers]]
- [[_COMMUNITY_Report Export|Report Export]]
- [[_COMMUNITY_Search Provider|Search Provider]]
- [[_COMMUNITY_Search Hook|Search Hook]]
- [[_COMMUNITY_Dashboard Layout|Dashboard Layout]]
- [[_COMMUNITY_Create Debt Action|Create Debt Action]]
- [[_COMMUNITY_Delete Debt Action|Delete Debt Action]]
- [[_COMMUNITY_Update Debt Action|Update Debt Action]]
- [[_COMMUNITY_Debt Table|Debt Table]]
- [[_COMMUNITY_Debts Client|Debts Client]]
- [[_COMMUNITY_Payment Modal|Payment Modal]]
- [[_COMMUNITY_Investment Form|Investment Form]]
- [[_COMMUNITY_Investment Table|Investment Table]]
- [[_COMMUNITY_Investments Client|Investments Client]]
- [[_COMMUNITY_Shared Investors Form|Shared Investors Form]]
- [[_COMMUNITY_Transaction Panel|Transaction Panel]]
- [[_COMMUNITY_Header Component|Header Component]]
- [[_COMMUNITY_Sidebar Component|Sidebar Component]]
- [[_COMMUNITY_Security Settings|Security Settings]]
- [[_COMMUNITY_Notification Test|Notification Test]]
- [[_COMMUNITY_UI Badge|UI Badge]]
- [[_COMMUNITY_UI Button|UI Button]]
- [[_COMMUNITY_UI Card|UI Card]]
- [[_COMMUNITY_UI Dialog|UI Dialog]]
- [[_COMMUNITY_UI Input|UI Input]]
- [[_COMMUNITY_UI Label|UI Label]]
- [[_COMMUNITY_UI Select|UI Select]]
- [[_COMMUNITY_UI Slider|UI Slider]]
- [[_COMMUNITY_UI Switch|UI Switch]]
- [[_COMMUNITY_UI Table|UI Table]]
- [[_COMMUNITY_UI Textarea|UI Textarea]]
- [[_COMMUNITY_Export Utilities|Export Utilities]]
- [[_COMMUNITY_i18n Context|i18n Context]]
- [[_COMMUNITY_i18n Translations|i18n Translations]]
- [[_COMMUNITY_Supabase Client|Supabase Client]]
- [[_COMMUNITY_Supabase Server|Supabase Server]]
- [[_COMMUNITY_Utility Functions|Utility Functions]]
- [[_COMMUNITY_Form Validations|Form Validations]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_Package Config|Package Config]]
- [[_COMMUNITY_Components Config|Components Config]]
- [[_COMMUNITY_Investments Actions|Investments Actions]]
- [[_COMMUNITY_Create Investment|Create Investment]]
- [[_COMMUNITY_Delete Investment|Delete Investment]]
- [[_COMMUNITY_Update Investment|Update Investment]]
- [[_COMMUNITY_Settings Actions|Settings Actions]]
- [[_COMMUNITY_Auth Actions|Auth Actions]]
- [[_COMMUNITY_Dashboard Page|Dashboard Page]]
- [[_COMMUNITY_Debts Page|Debts Page]]
- [[_COMMUNITY_Investments Page|Investments Page]]
- [[_COMMUNITY_Settings Page|Settings Page]]
- [[_COMMUNITY_Middleware Auth|Middleware Auth]]
- [[_COMMUNITY_Database Types|Database Types]]

## God Nodes (most connected - your core abstractions)
1. `Rareb — Investment & Debt Management System` - 12 edges
2. `Model A — Shared Multi-Tenant SaaS (Recommended)` - 11 edges
3. `Rareb Investment & Debt Management Platform` - 5 edges
4. `Supabase (PostgreSQL 15, GoTrue Auth, Row Level Security)` - 5 edges
5. `send-alerts Job` - 4 edges
6. `Cron Alert Layer (GitHub Action + /api/cron/alerts + Gmail SMTP)` - 4 edges
7. `Tenancy Model (per-user isolation via user_id)` - 3 edges
8. `Row Level Security Policies (auth.uid() = user_id)` - 3 edges
9. `requireRole() Server-Side Guard` - 3 edges
10. `investments/actions.ts (Server Actions CRUD + transactions)` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Supabase Auth (email/password, cookie SSR)` --semantically_similar_to--> `Supabase (PostgreSQL 15, GoTrue Auth, Row Level Security)`  [INFERRED] [semantically similar]
  COMMERCIALIZATION_ROADMAP(GLM 5.2).md → README.md
- `Row Level Security Policies (auth.uid() = user_id)` --semantically_similar_to--> `Row Level Security (created_by = auth.uid())`  [INFERRED] [semantically similar]
  COMMERCIALIZATION_ROADMAP(GLM 5.2).md → README.md
- `Cron Alert Layer (GitHub Action + /api/cron/alerts + Gmail SMTP)` --semantically_similar_to--> `Notification Center (unread alerts, bell menu)`  [INFERRED] [semantically similar]
  COMMERCIALIZATION_ROADMAP(GLM 5.2).md → README.md
- `debts/actions.ts (Server Actions CRUD + payments)` --conceptually_related_to--> `requireRole() Server-Side Guard`  [AMBIGUOUS]
  README.md → COMMERCIALIZATION_ROADMAP(GLM 5.2).md
- `investments/actions.ts (Server Actions CRUD + transactions)` --conceptually_related_to--> `requireRole() Server-Side Guard`  [AMBIGUOUS]
  README.md → COMMERCIALIZATION_ROADMAP(GLM 5.2).md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **B2B Commercialization Core: Org Isolation + Role Enforcement + Billing** — commercialization_roadmap_glm_5_2_organizations_table, commercialization_roadmap_glm_5_2_require_role_guard, commercialization_roadmap_glm_5_2_stripe_billing [EXTRACTED 0.95]
- **Cron Alert Delivery Pipeline: GitHub Action → API Endpoint → Notifications** — workflows_daily_alerts_daily_maturity_alerts, workflows_daily_alerts_cron_alert_endpoint, readme_notification_center [INFERRED 0.85]
- **RLS Multi-Tenancy Isolation Group: RLS Policies + current_org_ids() + org_memberships** — commercialization_roadmap_glm_5_2_rls_policies, commercialization_roadmap_glm_5_2_current_org_ids_fn, commercialization_roadmap_glm_5_2_org_memberships_table [EXTRACTED 0.95]

## Communities (69 total, 63 thin omitted)

### Community 0 - "Feature Actions & i18n"
Cohesion: 0.20
Nodes (12): debts/actions.ts (Server Actions CRUD + payments), Dual Language AR/EN with RTL Support, Excel Export (xlsx / SheetJS library), lib/i18n/context.tsx (LanguageProvider + useLanguage hook), investments/actions.ts (Server Actions CRUD + transactions), supabase/migrations/001_fix_schema.sql, Next.js 14 (App Router, Server Actions, Server Components), Notification Center (unread alerts, bell menu) (+4 more)

### Community 1 - "B2B Commercialization Models"
Cohesion: 0.22
Nodes (9): Invitation Flow (/invite email magic link), Model A — Shared Multi-Tenant SaaS (Recommended), Model B — White-Label Dedicated Deployment, Model C — Hybrid (Shared Core + Dedicated Tier), org_memberships Join Table (user_id, org_id, role), profiles.role Enum (owner|admin|viewer), requireRole() Server-Side Guard, Signup + Onboarding Flow (/signup page) (+1 more)

### Community 2 - "Cron Alerts & Notifications"
Cohesion: 0.33
Nodes (7): Cron Alert Layer (GitHub Action + /api/cron/alerts + Gmail SMTP), Transactional Email Provider (Resend/Postmark) per-tenant sender domains, Cron Alert Endpoint (GET /api/cron/alerts), CRON_SECRET GitHub Secret, Daily Maturity Alerts Workflow, Netlify Deployment (rareb-investments.netlify.app), send-alerts Job

### Community 3 - "Platform Core & Auth"
Cohesion: 0.50
Nodes (4): audit_log Table (No RLS, Appears Unwritten), investment_categories (Global Shared Table - Data Leak Risk), Rareb Investment & Debt Management Platform, Supabase Auth (email/password, cookie SSR)

### Community 4 - "Multi-Tenancy & RLS"
Cohesion: 0.50
Nodes (4): current_org_ids() SQL Helper Function, organizations Table (New - Tenant Boundary), Row Level Security Policies (auth.uid() = user_id), Tenancy Model (per-user isolation via user_id)

### Community 5 - "Supabase Auth Layer"
Cohesion: 0.50
Nodes (4): middleware.ts (Auth Guard — redirects unauthenticated users), Supabase (PostgreSQL 15, GoTrue Auth, Row Level Security), lib/supabase/client.ts (Browser Supabase Client), lib/supabase/server.ts (Server Supabase Client)

## Ambiguous Edges - Review These
- `requireRole() Server-Side Guard` → `debts/actions.ts (Server Actions CRUD + payments)`  [AMBIGUOUS]
  COMMERCIALIZATION_ROADMAP(GLM 5.2).md · relation: conceptually_related_to
- `requireRole() Server-Side Guard` → `investments/actions.ts (Server Actions CRUD + transactions)`  [AMBIGUOUS]
  COMMERCIALIZATION_ROADMAP(GLM 5.2).md · relation: conceptually_related_to

## Knowledge Gaps
- **76 isolated node(s):** `GET`, `createDebt`, `updateDebt`, `deleteDebt`, `recordPayment` (+71 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `requireRole() Server-Side Guard` and `debts/actions.ts (Server Actions CRUD + payments)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `requireRole() Server-Side Guard` and `investments/actions.ts (Server Actions CRUD + transactions)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Rareb — Investment & Debt Management System` connect `Feature Actions & i18n` to `Platform Core & Auth`, `Supabase Auth Layer`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `Model A — Shared Multi-Tenant SaaS (Recommended)` connect `B2B Commercialization Models` to `Cron Alerts & Notifications`, `Platform Core & Auth`, `Multi-Tenancy & RLS`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `Cron Alert Layer (GitHub Action + /api/cron/alerts + Gmail SMTP)` connect `Cron Alerts & Notifications` to `Feature Actions & i18n`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `GET`, `createDebt`, `updateDebt` to the rest of the system?**
  _76 weakly-connected nodes found - possible documentation gaps or missing edges._