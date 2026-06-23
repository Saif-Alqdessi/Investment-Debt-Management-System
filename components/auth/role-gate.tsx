'use client'

/**
 * RoleGate — Client-side role enforcement component
 *
 * Renders `children` only when the current user's role satisfies the
 * `minRole` requirement.  Falls back to `fallback` (or nothing) otherwise.
 *
 * Usage:
 *   <RoleGate minRole="admin">
 *     <DeleteButton />
 *   </RoleGate>
 *
 *   <RoleGate minRole="owner" fallback={<p>Only the owner can do this.</p>}>
 *     <DangerZone />
 *   </RoleGate>
 *
 * The role is passed in from the server (layout fetches it once via
 * getCurrentProfile()) to avoid a waterfall round-trip from the client.
 */

import type { UserRole } from '@/lib/auth/roles'
import type { ReactNode } from 'react'

const ROLE_RANK: Record<UserRole, number> = {
  viewer: 0,
  admin:  1,
  owner:  2,
}

interface RoleGateProps {
  /** The user's current role — pass this down from the layout/server component */
  userRole: UserRole | null
  /** Minimum role required to see `children` */
  minRole: UserRole
  /** Rendered when the user does not meet the role requirement */
  fallback?: ReactNode
  children: ReactNode
}

export function RoleGate({
  userRole,
  minRole,
  fallback = null,
  children,
}: RoleGateProps) {
  if (!userRole) return <>{fallback}</>
  if (ROLE_RANK[userRole] < ROLE_RANK[minRole]) return <>{fallback}</>
  return <>{children}</>
}

/**
 * ViewerBadge — Small inline badge shown when the user is a viewer (read-only).
 * Use this next to action buttons to explain why they are absent.
 */
export function ViewerBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      للعرض فقط
    </span>
  )
}
