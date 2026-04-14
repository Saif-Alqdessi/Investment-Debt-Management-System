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
      auto_renew: validated.auto_renew || false,
      is_shared: validated.is_shared || false,
      is_profit_delivered: validated.is_profit_delivered || false,
      notes: validated.notes || null,
      user_id: user.id,       // strict multi-tenancy
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
      // Derive share_percentage from amount_paid for DB storage
      const safeTotal = validated.principal_amount > 0 ? validated.principal_amount : 1
      const sharedInvestors = validated.shared_investors.map((si: { investor_name: string; amount_paid: number; custom_commission_rate?: number }) => {
        const sharePct = si.amount_paid / safeTotal
        return {
          investment_id: investment.id,
          investor_name: si.investor_name,
          share_percentage: sharePct * 100,
          share_principal: si.amount_paid,
          share_profit: profitAmount * sharePct,
          share_commission: si.custom_commission_rate
            ? si.amount_paid * (si.custom_commission_rate / 100)
            : commissionAmount * sharePct,
          share_total_payout: si.amount_paid + profitAmount * sharePct,
          custom_commission_rate: si.custom_commission_rate ? si.custom_commission_rate / 100 : null,
        }
      })

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
      auto_renew: validated.auto_renew || false,
      is_shared: validated.is_shared || false,
      is_profit_delivered: validated.is_profit_delivered || false,
      notes: validated.notes || null,
      updated_at: new Date().toISOString(),
    }

    const { data: investment, error: investmentError } = await supabase
      .from('investments')
      .update(investmentData)
      .eq('id', id)
      .eq('user_id', user.id)   // prevent cross-tenant writes
      .select()
      .single()

    if (investmentError) {
      throw new Error(`Failed to update investment: ${investmentError.message}`)
    }

    if (validated.is_shared) {
      await supabase.from('shared_investors').delete().eq('investment_id', id)

      if (validated.shared_investors?.length) {
        // Derive share_percentage from amount_paid for DB storage
        const safeTotal = validated.principal_amount > 0 ? validated.principal_amount : 1
        const sharedInvestors = validated.shared_investors.map((si: { investor_name: string; amount_paid: number; custom_commission_rate?: number }) => {
          const sharePct = si.amount_paid / safeTotal
          return {
            investment_id: id,
            investor_name: si.investor_name,
            share_percentage: sharePct * 100,
            share_principal: si.amount_paid,
            share_profit: profitAmount * sharePct,
            share_commission: si.custom_commission_rate
              ? si.amount_paid * (si.custom_commission_rate / 100)
              : commissionAmount * sharePct,
            share_total_payout: si.amount_paid + profitAmount * sharePct,
            custom_commission_rate: si.custom_commission_rate ? si.custom_commission_rate / 100 : null,
          }
        })

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
      .eq('user_id', user.id)   // prevent cross-tenant deletes

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
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return { success: false, error: 'Unauthorized', data: null }

    const { data: investments, error } = await supabase
      .from('investments')
      .select(`
        *,
        shared_investors(*)
      `)
      .eq('user_id', user.id)   // explicit tenant filter (belt-and-suspenders)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch investments: ${error.message}`)
    }

    return { success: true, data: investments }
  } catch (error) {
    console.error('Error fetching investments:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function getInvestment(id: string) {
  const supabase = createClient()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return { success: false, error: 'Unauthorized', data: null }

    const { data: investment, error } = await supabase
      .from('investments')
      .select(`
        *,
        shared_investors(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)   // explicit tenant filter
      .single()

    if (error) {
      throw new Error(`Failed to fetch investment: ${error.message}`)
    }

    return { success: true, data: investment }
  } catch (error) {
    console.error('Error fetching investment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
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

export async function processAutoRenewals() {
  const supabase = createClient()
  
  try {
    const today = new Date().toISOString().split('T')[0]

    // Find all investments ready for renewal
    const { data: investmentsToRenew, error: fetchError } = await supabase
      .from('investments')
      .select('*, shared_investors(*)')
      .eq('status', 'active')
      .eq('auto_renew', true)
      .lte('due_date', today)

    if (fetchError) {
      throw new Error(`Failed to fetch auto-renew investments: ${fetchError.message}`)
    }

    if (!investmentsToRenew || investmentsToRenew.length === 0) {
      return { success: true, count: 0, message: 'No investments need auto-renewal' }
    }

    let renewedCount = 0

    for (const oldInvestment of investmentsToRenew) {
      // 1. Calculate new dates
      const newStartingDate = oldInvestment.due_date
      const newDueDateObj = new Date(newStartingDate)
      
      switch (oldInvestment.duration) {
        case 'monthly':
          newDueDateObj.setMonth(newDueDateObj.getMonth() + 1)
          break
        case 'quarterly':
          newDueDateObj.setMonth(newDueDateObj.getMonth() + 3)
          break
        case 'semi_annual':
          newDueDateObj.setMonth(newDueDateObj.getMonth() + 6)
          break
        case 'annual':
          newDueDateObj.setFullYear(newDueDateObj.getFullYear() + 1)
          break
      }
      const newDueDate = newDueDateObj.toISOString().split('T')[0]

      // 2. Insert new investment record (reset is_profit_delivered to false on renewal)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _oldId, created_at: _ca, updated_at: _ua, shared_investors, alert_dismissed: _ad, is_profit_delivered: _ipd, ...newInvestmentData } = oldInvestment
      
      const { data: newInvestment, error: insertError } = await supabase
        .from('investments')
        .insert({
          ...newInvestmentData,
          starting_date: newStartingDate,
          due_date: newDueDate,
          status: 'active',
          is_profit_delivered: false,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to renew investment', oldInvestment.id, insertError)
        continue
      }

      // 3. Clone shared investors if applicable
      if (oldInvestment.is_shared && shared_investors && shared_investors.length > 0) {
        const newSharedInvestors = shared_investors.map((si: Record<string, unknown>) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _id, investment_id: _iid, ...restSi } = si
          return {
            ...restSi,
            investment_id: newInvestment.id
          }
        })

        const { error: sharedInsertError } = await supabase
          .from('shared_investors')
          .insert(newSharedInvestors)
          
        if (sharedInsertError) {
          console.error('Failed to copy shared investors for', newInvestment.id, sharedInsertError)
        }
      }

      // 4. Update old investment status
      const { error: updateOldError } = await supabase
        .from('investments')
        .update({ status: 'renewed' })
        .eq('id', oldInvestment.id)

      if (updateOldError) {
        console.error('Failed to update old investment status', oldInvestment.id, updateOldError)
      }

      // 5. Add a transaction note for the renewal
      await supabase
        .from('investment_transactions')
        .insert([
          {
            investment_id: oldInvestment.id,
            action_type: 'payout_profit',
            amount: 0,
            transaction_date: today,
            notes: `تم التجديد التلقائي إلى الاستثمار الجديد (رقم: ${newInvestment.id})`,
            created_by: oldInvestment.created_by
          },
          {
            investment_id: newInvestment.id,
            action_type: 'add_capital',
            amount: newInvestment.principal_amount,
            transaction_date: today,
            notes: `استثمار مجدد تلقائياً من الاستثمار السابق (رقم: ${oldInvestment.id})`,
            created_by: oldInvestment.created_by
          }
        ])

      renewedCount++
    }

    revalidatePath('/dashboard/investments')
    return { success: true, count: renewedCount }
  } catch (error) {
    console.error('Error processing auto renewals:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function dismissInvestmentAlert(id: string) {
  const supabase = createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const { error } = await supabase
      .from('investments')
      .update({ alert_dismissed: true })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to dismiss alert: ${error.message}`)
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error dismissing alert:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function toggleProfitDelivered(id: string, currentValue: boolean) {
  const supabase = createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const { error } = await supabase
      .from('investments')
      .update({ is_profit_delivered: !currentValue })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to update profit delivery status: ${error.message}`)
    }

    revalidatePath(`/dashboard/investments/${id}`)
    revalidatePath('/dashboard/investments')
    return { success: true, newValue: !currentValue }
  } catch (error) {
    console.error('Error toggling profit delivered:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
