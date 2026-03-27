'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { debtSchema, paymentSchema, type DebtFormData, type PaymentFormData } from '@/lib/validations'

export async function createDebt(formData: DebtFormData) {
  const supabase = createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('Auth error in createDebt:', userError?.message || 'No user session')
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const validated = debtSchema.parse(formData)

    const debtData = {
      creditor_name: validated.creditor_name,
      debtor_name: validated.debtor_name,
      principal_amount: validated.principal_amount,
      interest_rate: validated.interest_rate ? validated.interest_rate / 100 : null,
      total_due: validated.interest_rate
        ? validated.principal_amount * (1 + validated.interest_rate / 100)
        : validated.principal_amount,
      issue_date: validated.issue_date.toISOString().split('T')[0],
      due_date: validated.due_date ? validated.due_date.toISOString().split('T')[0] : null,
      debt_type: validated.debt_type,
      status: 'pending' as const,
      amount_paid: 0,
      remaining_amount: validated.interest_rate
        ? validated.principal_amount * (1 + validated.interest_rate / 100)
        : validated.principal_amount,
      notes: validated.notes || null,
      created_by: user.id,
    }

    const { data: debt, error } = await supabase
      .from('debts')
      .insert(debtData)
      .select()
      .single()

    if (error) {
      console.error('Insert error details:', { code: error.code, message: error.message, hint: error.hint, userId: user.id })
      throw new Error(`Failed to create debt: ${error.message}`)
    }

    revalidatePath('/dashboard/debts')
    return { success: true, data: debt }
  } catch (error) {
    console.error('Error creating debt:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function updateDebt(id: string, formData: DebtFormData) {
  const supabase = createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('Auth error in updateDebt:', userError?.message || 'No user session')
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const validated = debtSchema.parse(formData)

    const debtData = {
      creditor_name: validated.creditor_name,
      debtor_name: validated.debtor_name,
      principal_amount: validated.principal_amount,
      interest_rate: validated.interest_rate ? validated.interest_rate / 100 : null,
      total_due: validated.interest_rate
        ? validated.principal_amount * (1 + validated.interest_rate / 100)
        : validated.principal_amount,
      issue_date: validated.issue_date.toISOString().split('T')[0],
      due_date: validated.due_date ? validated.due_date.toISOString().split('T')[0] : null,
      debt_type: validated.debt_type,
      notes: validated.notes || null,
      updated_at: new Date().toISOString(),
    }

    const { data: debt, error } = await supabase
      .from('debts')
      .update(debtData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update debt: ${error.message}`)
    }

    revalidatePath('/dashboard/debts')
    return { success: true, data: debt }
  } catch (error) {
    console.error('Error updating debt:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function deleteDebt(id: string) {
  const supabase = createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('Auth error in deleteDebt:', userError?.message || 'No user session')
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete debt: ${error.message}`)
    }

    revalidatePath('/dashboard/debts')
    return { success: true }
  } catch (error) {
    console.error('Error deleting debt:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function recordPayment(formData: PaymentFormData) {
  const supabase = createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('Auth error in recordPayment:', userError?.message || 'No user session')
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const validated = paymentSchema.parse(formData)

    // Insert the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('debt_payments')
      .insert({
        debt_id: validated.debt_id,
        amount: validated.amount,
        payment_date: validated.payment_date.toISOString().split('T')[0],
        payment_method: validated.payment_method || null,
        notes: validated.notes || null,
        recorded_by: user.id,
      })
      .select()
      .single()

    if (paymentError) {
      throw new Error(`Failed to record payment: ${paymentError.message}`)
    }

    // Update the debt's amount_paid, remaining_amount, and status
    const { data: debt, error: debtFetchError } = await supabase
      .from('debts')
      .select('total_due, amount_paid')
      .eq('id', validated.debt_id)
      .single()

    if (debtFetchError || !debt) {
      throw new Error('Failed to fetch debt for update')
    }

    const newAmountPaid = (debt.amount_paid || 0) + validated.amount
    const newRemaining = debt.total_due - newAmountPaid
    let newStatus: 'pending' | 'partial' | 'paid' | 'defaulted' = 'pending'

    if (newAmountPaid >= debt.total_due) {
      newStatus = 'paid'
    } else if (newAmountPaid > 0) {
      newStatus = 'partial'
    }

    const { error: debtUpdateError } = await supabase
      .from('debts')
      .update({
        amount_paid: newAmountPaid,
        remaining_amount: Math.max(0, newRemaining),
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.debt_id)

    if (debtUpdateError) {
      throw new Error(`Failed to update debt: ${debtUpdateError.message}`)
    }

    revalidatePath('/dashboard/debts')
    return { success: true, data: payment }
  } catch (error) {
    console.error('Error recording payment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function getDebts() {
  const supabase = createClient()

  try {
    const { data: debts, error } = await supabase
      .from('debts')
      .select(`
        *,
        payments:debt_payments(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch debts: ${error.message}`)
    }

    return { success: true, data: debts }
  } catch (error) {
    console.error('Error fetching debts:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
