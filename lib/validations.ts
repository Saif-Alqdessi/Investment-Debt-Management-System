import { z } from 'zod'

// Investment form validation schema
export const investmentSchema = z.object({
  investor_name: z.string().min(1, 'Investor name is required'),
  principal_amount: z.number().min(0.01, 'Principal amount must be greater than 0'),
  starting_date: z.date(),
  due_date: z.date(),
  category_id: z.string().optional(),
  duration: z.enum(['annual', 'semi_annual', 'quarterly', 'monthly']),
  profit_rate: z.number().min(0).max(100, 'Profit rate must be between 0 and 100'),
  commission_rate: z.number().min(0).max(100, 'Commission rate must be between 0 and 100'),
  notes: z.string().optional(),
  is_shared: z.boolean().default(false),
  auto_renew: z.boolean().default(false),
  is_profit_delivered: z.boolean().default(false),
  shared_investors: z.array(z.object({
    investor_name: z.string().min(1, 'Investor name is required'),
    amount_paid: z.number().min(0.01, 'Amount paid must be greater than 0'),
    custom_commission_rate: z.number().min(0).max(100).optional(),
  })).optional(),
}).refine((data) => {
  if (data.due_date <= data.starting_date) {
    return false
  }
  return true
}, {
  message: 'Due date must be after starting date',
  path: ['due_date']
}).refine((data) => {
  if (data.is_shared && data.shared_investors && data.principal_amount > 0) {
    const totalAllocated = data.shared_investors.reduce((sum, si) => sum + (si.amount_paid || 0), 0)
    return totalAllocated <= data.principal_amount
  }
  return true
}, {
  message: 'Total allocated amount cannot exceed the principal amount',
  path: ['shared_investors']
})

// Debt form validation schema
export const debtSchema = z.object({
  creditor_name: z.string().min(1, 'Creditor name is required'),
  debtor_name: z.string().min(1, 'Debtor name is required'),
  principal_amount: z.number().min(0.01, 'Principal amount must be greater than 0'),
  interest_rate: z.number().min(0).max(100).optional().nullable(),
  issue_date: z.date(),
  due_date: z.date().optional().nullable(),
  debt_type: z.enum(['personal', 'trust', 'business', 'loan']),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.due_date && data.due_date <= data.issue_date) {
    return false
  }
  return true
}, {
  message: 'Due date must be after issue date',
  path: ['due_date']
})

// Payment form validation schema
export const paymentSchema = z.object({
  debt_id: z.string().uuid(),
  amount: z.number().min(0.01, 'Payment amount must be greater than 0'),
  payment_date: z.date(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
})

// Login form validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Category form validation schema
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
})

export type InvestmentFormData = z.infer<typeof investmentSchema>
export type DebtFormData = z.infer<typeof debtSchema>
export type PaymentFormData = z.infer<typeof paymentSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type CategoryFormData = z.infer<typeof categorySchema>
