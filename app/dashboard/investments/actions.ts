'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { investmentSchema, type InvestmentFormData } from '@/lib/validations'

export async function createInvestment(formData: InvestmentFormData) {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('Auth error in createInvestment:', userError?.message || 'No user session')
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const validated = investmentSchema.parse(formData)

    const profitAmount = validated.principal_amount * (validated.profit_rate / 100)
    const commissionAmount = validated.principal_amount * (validated.commission_rate / 100)
    const totalPayout = validated.principal_amount + profitAmount

    const investmentData = {
      investor_name: validated.investor_name,
      principal_amount: validated.principal_amount,
      starting_date: validated.starting_date.toISOString().split('T')[0],
      due_date: validated.due_date.toISOString().split('T')[0],
      category_id: validated.category_id || null,
      duration: validated.duration,
      profit_rate: validated.profit_rate / 100,
      commission_rate: validated.commission_rate / 100,
      profit_amount: profitAmount,
      commission_amount: commissionAmount,
      total_payout: totalPayout,
      status: 'active' as const,
      is_shared: validated.is_shared || false,
      notes: validated.notes || null,
      created_by: user.id,
    }

    const { data: investment, error: investmentError } = await supabase
      .from('investments')
      .insert(investmentData)
      .select()
      .single()

    if (investmentError) {
      console.error('Insert error details:', { code: investmentError.code, message: investmentError.message, hint: investmentError.hint, userId: user.id })
      throw new Error(`Failed to create investment: ${investmentError.message}`)
    }

    if (validated.is_shared && validated.shared_investors?.length) {
      const sharedInvestors = validated.shared_investors.map((si: { investor_name: string; share_percentage: number; custom_commission_rate?: number }) => ({
        investment_id: investment.id,
        investor_name: si.investor_name,
        share_percentage: si.share_percentage,
        share_principal: validated.principal_amount * (si.share_percentage / 100),
        share_profit: profitAmount * (si.share_percentage / 100),
        share_commission: si.custom_commission_rate 
          ? validated.principal_amount * (si.share_percentage / 100) * (si.custom_commission_rate / 100)
          : commissionAmount * (si.share_percentage / 100),
        share_total_payout: (validated.principal_amount + profitAmount) * (si.share_percentage / 100),
        custom_commission_rate: si.custom_commission_rate ? si.custom_commission_rate / 100 : null,
      }))

      const { error: sharedError } = await supabase
        .from('shared_investors')
        .insert(sharedInvestors)

      if (sharedError) {
        await supabase.from('investments').delete().eq('id', investment.id)
        throw new Error(`Failed to create shared investors: ${sharedError.message}`)
      }
    }

    revalidatePath('/dashboard/investments')
    return { success: true, data: investment }
  } catch (error) {
    console.error('Error creating investment:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function updateInvestment(id: string, formData: InvestmentFormData) {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('Auth error in updateInvestment:', userError?.message || 'No user session')
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const validated = investmentSchema.parse(formData)

    const profitAmount = validated.principal_amount * (validated.profit_rate / 100)
    const commissionAmount = validated.principal_amount * (validated.commission_rate / 100)
    const totalPayout = validated.principal_amount + profitAmount

    const investmentData = {
      investor_name: validated.investor_name,
      principal_amount: validated.principal_amount,
      starting_date: validated.starting_date.toISOString().split('T')[0],
      due_date: validated.due_date.toISOString().split('T')[0],
      category_id: validated.category_id || null,
      duration: validated.duration,
      profit_rate: validated.profit_rate / 100,
      commission_rate: validated.commission_rate / 100,
      profit_amount: profitAmount,
      commission_amount: commissionAmount,
      total_payout: totalPayout,
      is_shared: validated.is_shared || false,
      notes: validated.notes || null,
      updated_at: new Date().toISOString(),
    }

    const { data: investment, error: investmentError } = await supabase
      .from('investments')
      .update(investmentData)
      .eq('id', id)
      .select()
      .single()

    if (investmentError) {
      throw new Error(`Failed to update investment: ${investmentError.message}`)
    }

    if (validated.is_shared) {
      await supabase.from('shared_investors').delete().eq('investment_id', id)

      if (validated.shared_investors?.length) {
        const sharedInvestors = validated.shared_investors.map((si: { investor_name: string; share_percentage: number; custom_commission_rate?: number }) => ({
          investment_id: id,
          investor_name: si.investor_name,
          share_percentage: si.share_percentage,
          share_principal: validated.principal_amount * (si.share_percentage / 100),
          share_profit: profitAmount * (si.share_percentage / 100),
          share_commission: si.custom_commission_rate 
            ? validated.principal_amount * (si.share_percentage / 100) * (si.custom_commission_rate / 100)
            : commissionAmount * (si.share_percentage / 100),
          share_total_payout: (validated.principal_amount + profitAmount) * (si.share_percentage / 100),
          custom_commission_rate: si.custom_commission_rate ? si.custom_commission_rate / 100 : null,
        }))

        const { error: sharedError } = await supabase
          .from('shared_investors')
          .insert(sharedInvestors)

        if (sharedError) {
          throw new Error(`Failed to update shared investors: ${sharedError.message}`)
        }
      }
    } else {
      await supabase.from('shared_investors').delete().eq('investment_id', id)
    }

    revalidatePath('/dashboard/investments')
    return { success: true, data: investment }
  } catch (error) {
    console.error('Error updating investment:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function deleteInvestment(id: string) {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('Auth error in deleteInvestment:', userError?.message || 'No user session')
    return { success: false, error: 'Unauthorized' }
  }

  try {

    const { error } = await supabase
      .from('investments')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete investment: ${error.message}`)
    }

    revalidatePath('/dashboard/investments')
    return { success: true }
  } catch (error) {
    console.error('Error deleting investment:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function getInvestments() {
  const supabase = createClient()
  
  try {
    const { data: investments, error } = await supabase
      .from('investments')
      .select(`
        *,
        shared_investors(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch investments: ${error.message}`)
    }

    return { success: true, data: investments }
  } catch (error) {
    console.error('Error fetching investments:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function getInvestment(id: string) {
  const supabase = createClient()
  
  try {
    const { data: investment, error } = await supabase
      .from('investments')
      .select(`
        *,
        shared_investors(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch investment: ${error.message}`)
    }

    return { success: true, data: investment }
  } catch (error) {
    console.error('Error fetching investment:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function getTransactions(investmentId: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('investment_transactions')
      .select('*')
      .eq('investment_id', investmentId)
      .order('transaction_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function recordTransaction(payload: {
  investment_id: string
  action_type: 'payout_profit' | 'add_capital' | 'withdraw_partial'
  amount: number
  transaction_date: string
  notes?: string
}) {
  const supabase = createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const { data, error } = await supabase
      .from('investment_transactions')
      .insert({
        investment_id: payload.investment_id,
        action_type: payload.action_type,
        amount: payload.amount,
        transaction_date: payload.transaction_date,
        notes: payload.notes || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to record transaction: ${error.message}`)
    }

    revalidatePath(`/dashboard/investments/${payload.investment_id}`)
    return { success: true, data }
  } catch (error) {
    console.error('Error recording transaction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
