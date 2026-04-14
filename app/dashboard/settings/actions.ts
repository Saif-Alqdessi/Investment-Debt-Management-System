'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ProfileData {
  full_name: string
  phone: string
  preferred_currency: string
  email_notifications: boolean
  browser_notifications: boolean
}

// ── Fetch the current user's profile ─────────────────────────────────────────
export async function getProfile() {
  const supabase = createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Unauthorized', data: null }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, phone, preferred_currency, email_notifications, browser_notifications')
    .eq('id', user.id)
    .single()

  if (error) {
    // Profile may not exist yet (first login) — return safe defaults
    return {
      success: true,
      data: {
        full_name: user.user_metadata?.full_name ?? '',
        phone: '',
        preferred_currency: 'USD',
        email_notifications: true,
        browser_notifications: false,
      } as ProfileData,
    }
  }

  return { success: true, data: data as ProfileData }
}

// ── Save profile preferences ──────────────────────────────────────────────────
export async function saveProfile(payload: ProfileData) {
  const supabase = createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('[saveProfile] auth failed:', userError)
    return { success: false, error: 'Unauthorized' }
  }

  const { data: updatedRows, error } = await supabase
    .from('profiles')
    .update({
      full_name:             payload.full_name.trim(),
      phone:                 payload.phone.trim() || null,
      preferred_currency:    payload.preferred_currency,
      email_notifications:   payload.email_notifications,
      browser_notifications: payload.browser_notifications,
      updated_at:            new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('id, preferred_currency, email_notifications, browser_notifications') // forces row-level confirmation

  if (error) {
    console.error('[saveProfile] Supabase error:', error)
    return { success: false, error: `DB error: ${error.message}` }
  }

  // .select() returns an empty array if RLS blocked the UPDATE silently
  if (!updatedRows || updatedRows.length === 0) {
    console.error('[saveProfile] UPDATE was silently blocked — 0 rows affected. Check RLS policies.')
    return {
      success: false,
      error: 'لم يتم تحديث البيانات. تأكد من صلاحيات الوصول (RLS) في Supabase.',
    }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/investments')
  revalidatePath('/dashboard/debts')
  revalidatePath('/dashboard/reports')
  revalidatePath('/', 'layout')
  return { success: true }
}

