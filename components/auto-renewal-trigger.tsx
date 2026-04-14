'use client'

import { useEffect } from 'react'
import { processAutoRenewals } from '@/app/dashboard/investments/actions'

export function AutoRenewalTrigger() {
  useEffect(() => {
    // Silently process any due auto-renewals on dashboard mount.
    // Errors are caught and logged to avoid disrupting the UI.
    processAutoRenewals().catch((err) => {
      console.error('[AutoRenewalTrigger] Failed to process renewals:', err)
    })
  }, [])

  return null
}
