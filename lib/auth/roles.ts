'use server'

/**
 * Role enforcement helpers (Model B White-Label + Model A foundation)
 *
 * The `profiles.role` column already exists with values: owner | admin | viewer
 * This module reads that role and provides server-side guards so destructive
 * actions are rejected before touching the database.
 *
 * Usage in a Server Action or Route Handler:
 *   import { requireRole, getCurrentRole } from '@/lib/auth/roles'
 *
 *   // Throws if user is not at least 'admin':
 *   await requireRole('admin')
 *
 *   // Or read the role for conditional UI logic:
 *   const role = await getCurrentRole()
 *   const canDelete = role === 'owner' || role === 'admin'
 */

import { createClient } from '@/lib/supabase/server'

export type UserRole = 'owner' | 'admin' | 'viewer'

/**
 * Role hierarchy — higher index = more permissions.
 * 'owner' can do everything an admin or viewer can.
 */
const ROLE_HIERARCHY: UserRole[] = ['viewer', 'admin', 'owner']

function roleRank(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role)
}

/**
 * Returns the current user's role from the `profiles` table.
 * Returns null if the user is not authenticated or has no profile row.
 */
export async function getCurrentRole(): Promise<UserRole | null> {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.role) return null

  return profile.role as UserRole
}

/**
 * Returns the current user's profile data (id, role, full_name).
 * Useful for injecting into layouts and passing to child components.
 */
export async function getCurrentProfile(): Promise<{
  id: string
  role: UserRole
  full_name: string | null
  email: string | null
} | null> {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return {
    id: user.id,
    role: (profile.role ?? 'viewer') as UserRole,
    full_name: profile.full_name ?? null,
    email: user.email ?? null,
  }
}

/**
 * Server-side role guard.  Throws a descriptive error if the current user
 * does not have *at least* the required role.
 *
 * @param required  Minimum role: 'viewer' | 'admin' | 'owner'
 * @throws Error   With a localized Arabic message (safe to surface in UI)
 *
 * @example
 *   // In a Server Action:
 *   export async function deleteInvestment(id: string) {
 *     await requireRole('admin')  // viewers cannot delete
 *     ...
 *   }
 */
export async function requireRole(required: UserRole): Promise<void> {
  const role = await getCurrentRole()

  if (!role) {
    throw new Error('غير مصرح: يجب تسجيل الدخول للقيام بهذا الإجراء.')
  }

  if (roleRank(role) < roleRank(required)) {
    throw new Error(
      `غير مصرح: هذا الإجراء يتطلب صلاحية "${required}". صلاحيتك الحالية: "${role}".`
    )
  }
}

/**
 * Returns true if the current user has AT LEAST the given role.
 * Useful for conditional rendering in Server Components (non-throwing version).
 */
export async function hasRole(required: UserRole): Promise<boolean> {
  const role = await getCurrentRole()
  if (!role) return false
  return roleRank(role) >= roleRank(required)
}

/**
 * Convenience: is the current user an owner?
 */
export async function isOwner(): Promise<boolean> {
  return hasRole('owner')
}

/**
 * Convenience: can the current user edit (admin or owner)?
 */
export async function canEdit(): Promise<boolean> {
  return hasRole('admin')
}

/**
 * Convenience: is the current user read-only (viewer only)?
 */
export async function isViewer(): Promise<boolean> {
  const role = await getCurrentRole()
  return role === 'viewer'
}
