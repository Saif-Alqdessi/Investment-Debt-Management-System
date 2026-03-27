# Master Build Prompt: Private Investment & Debt Management System

You are an expert full-stack developer. Build a complete, production-ready investment portfolio management system based on the specifications below. Generate clean, well-documented code with proper error handling.

## Project Overview

A private wealth management dashboard for tracking investments and debts. The system replaces manual Excel tracking with a modern, multi-device web application.

## Tech Stack (MANDATORY)

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database:** Supabase (PostgreSQL + Auth + Realtime)
- **Email:** Resend
- **Charts:** Recharts
- **Tables:** TanStack Table v8
- **Forms:** React Hook Form + Zod validation
- **Export:** SheetJS (xlsx)
- **Icons:** Lucide React

## Database Schema

Use the following Supabase schema (already created):

```sql
-- Tables: profiles, investment_categories, investments, shared_investors, 
-- debts, debt_payments, notifications, audit_log
-- (Full schema provided in architecture document)
```

## Feature Requirements

### 1. Authentication
- Email/password login via Supabase Auth
- Protected routes with middleware
- Session persistence

### 2. Dashboard (Home Page)
Create a hero section with three stat cards:
- Total Portfolio Value (sum of all principal_amount where status = 'active')
- Total Pending Profits (sum of profit_amount for active investments)
- Total Commissions (sum of commission_amount for active investments)

Below, show:
- "Maturing Soon" section: investments due within 30 days as horizontal cards
- "Recent Activity" timeline

### 3. Investments Module

**List View:**
- Sortable, filterable data table
- Columns: Investor Name, Principal, Start Date, Due Date, Category (badge), Duration, Profit %, COM %, Profit $, Commission $, Total Payout, Status, Days Remaining (progress bar)
- Expandable rows for shared investments
- Quick actions: Edit, Delete, View Details

**Create/Edit Form:**
```typescript
interface InvestmentFormData {
  investor_name: string;
  principal_amount: number;
  starting_date: Date;
  due_date: Date;
  category_id: string;
  duration: 'annual' | 'semi_annual' | 'quarterly' | 'monthly';
  profit_rate: number; // Input as percentage, store as decimal
  commission_rate: number;
  notes?: string;
  is_shared: boolean;
  shared_investors?: {
    investor_name: string;
    share_percentage: number;
    custom_commission_rate?: number;
  }[];
}
```

**Auto-Calculations (real-time in form):**
- Profit Amount = Principal × Profit Rate
- Commission Amount = Principal × Commission Rate
- Total Payout = Principal + Profit Amount

**Shared Investments UI:**
- Toggle "Split among multiple investors"
- Dynamic form to add sub-investors
- Each sub-investor: name, percentage (slider), optional custom commission
- Validate total percentage ≤ 100%
- Display calculated amounts per sub-investor

### 4. Debts Module

**List View:**
- Table with: Creditor, Debtor, Principal, Interest %, Total Due, Due Date, Status (badge), Amount Paid, Remaining
- Status badges: Pending (yellow), Partial (blue), Paid (green), Defaulted (red)

**Create/Edit Form:**
```typescript
interface DebtFormData {
  creditor_name: string;
  debtor_name: string;
  principal_amount: number;
  interest_rate?: number;
  issue_date: Date;
  due_date: Date;
  debt_type: 'personal' | 'trust' | 'business' | 'loan';
  notes?: string;
}
```

**Payment Recording:**
- "Record Payment" button opens modal
- Enter amount, date, method, notes
- Auto-update debt status based on amount_paid vs total_due

### 5. Export Feature
- "Export to Excel" button on both modules
- Generate .xlsx with all visible data
- Include a summary sheet with totals
- Filename: `Portfolio_Export_YYYY-MM-DD.xlsx`

### 6. Notifications (Background)
- Auto-generated via database trigger when investment created
- Edge function runs daily at 8am UTC
- Sends emails via Resend for due notifications
- Admin can view notification history

## UI/UX Requirements

### Design System
- Color palette: Deep navy (#1a1a2e) primary, emerald green (#10b981) for profits, amber (#f59e0b) for warnings
- Clean card-based layouts, NO spreadsheet aesthetic
- Generous whitespace, 8px spacing grid
- Smooth animations (Framer Motion optional)

### Component Patterns
```tsx
// Status Badge
<Badge variant={status === 'active' ? 'success' : 'secondary'}>
  {status}
</Badge>

// Days Remaining Progress
<div className="w-full bg-gray-200 rounded-full h-2">
  <div 
    className={cn(
      "h-2 rounded-full",
      daysRemaining < 7 ? "bg-red-500" : 
      daysRemaining < 30 ? "bg-amber-500" : "bg-emerald-500"
    )}
    style={{ width: `${percentageRemaining}%` }}
  />
</div>

// Money Display
<span className="font-mono text-lg">
  ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
</span>
```

### Responsive Breakpoints
- Mobile: Stack cards vertically, collapsible table columns
- Tablet: 2-column grid for stat cards
- Desktop: Full table view, sidebar navigation

## File Structure

```
/app
  /layout.tsx              # Root layout with providers
  /page.tsx                # Dashboard home
  /(auth)
    /login/page.tsx
  /(dashboard)
    /investments
      /page.tsx            # List view
      /new/page.tsx        # Create form
      /[id]/page.tsx       # Detail view
      /[id]/edit/page.tsx  # Edit form
    /debts
      /page.tsx
      /new/page.tsx
      /[id]/page.tsx
    /reports/page.tsx
    /settings/page.tsx
/components
  /ui                      # shadcn components
  /investments
    /investment-table.tsx
    /investment-form.tsx
    /shared-investors-form.tsx
    /investment-card.tsx
  /debts
    /debt-table.tsx
    /debt-form.tsx
    /payment-modal.tsx
  /dashboard
    /stat-card.tsx
    /maturing-soon.tsx
  /layout
    /sidebar.tsx
    /header.tsx
/lib
  /supabase
    /client.ts
    /server.ts
    /middleware.ts
  /utils.ts
  /validations.ts
/hooks
  /use-investments.ts
  /use-debts.ts
/types
  /database.ts             # Generated from Supabase
```

## Server Actions Example

```typescript
// app/investments/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { investmentSchema } from '@/lib/validations'

export async function createInvestment(formData: FormData) {
  const supabase = createClient()
  
  const validated = investmentSchema.parse({
    investor_name: formData.get('investor_name'),
    principal_amount: parseFloat(formData.get('principal_amount') as string),
    // ... other fields
  })
  
  const { data, error } = await supabase
    .from('investments')
    .insert({
      ...validated,
      profit_rate: validated.profit_rate / 100, // Convert percentage to decimal
      commission_rate: validated.commission_rate / 100,
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  
  // Handle shared investors if applicable
  if (validated.is_shared && validated.shared_investors?.length) {
    const sharedInvestors = validated.shared_investors.map(si => ({
      investment_id: data.id,
      investor_name: si.investor_name,
      share_percentage: si.share_percentage,
      share_principal: data.principal_amount * (si.share_percentage / 100),
      share_profit: data.profit_amount * (si.share_percentage / 100),
      share_commission: data.commission_amount * (si.share_percentage / 100),
      share_total_payout: data.total_payout * (si.share_percentage / 100),
      custom_commission_rate: si.custom_commission_rate ? si.custom_commission_rate / 100 : null,
    }))
    
    await supabase.from('shared_investors').insert(sharedInvestors)
  }
  
  revalidatePath('/investments')
  return { success: true, data }
}
```

## Deliverables

Generate the following files with complete, working code:

1. `/app/layout.tsx` - Root layout with Supabase provider, theme, fonts
2. `/app/page.tsx` - Dashboard with stat cards and maturing investments
3. `/app/(auth)/login/page.tsx` - Login form
4. `/app/(dashboard)/investments/page.tsx` - Investment list with table
5. `/components/investments/investment-form.tsx` - Create/edit form with auto-calculations
6. `/components/investments/shared-investors-form.tsx` - Dynamic sub-investor inputs
7. `/components/investments/investment-table.tsx` - Data table with expandable rows
8. `/app/(dashboard)/debts/page.tsx` - Debts list
9. `/components/debts/payment-modal.tsx` - Record payment dialog
10. `/lib/supabase/client.ts` & `/lib/supabase/server.ts` - Supabase clients
11. `/lib/validations.ts` - Zod schemas for all forms
12. `/hooks/use-investments.ts` - Custom hook with TanStack Query
13. `/supabase/functions/check-maturity-dates/index.ts` - Edge function for emails

## Quality Standards

- All components must be fully typed with TypeScript
- Use proper loading and error states
- Implement optimistic updates where applicable
- Follow React Server Component patterns
- Mobile-first responsive design
- Accessible (ARIA labels, keyboard navigation)
- No `any` types
- Proper error boundaries

Begin generating the code, starting with the core layout and authentication flow.
