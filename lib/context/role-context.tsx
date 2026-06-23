'use client'

import { createContext, useContext, ReactNode } from 'react'

export type UserRole = 'owner' | 'admin' | 'viewer'

interface RoleContextType {
  role: UserRole | null
  isViewer: boolean
  isAdmin: boolean
  isOwner: boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ role, children }: { role: UserRole | null, children: ReactNode }) {
  return (
    <RoleContext.Provider
      value={{
        role,
        isViewer: role === 'viewer',
        isAdmin: role === 'admin' || role === 'owner',
        isOwner: role === 'owner',
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}
