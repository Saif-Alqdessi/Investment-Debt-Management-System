'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/lib/i18n/context'

export function DirectionWrapper({ children }: { children: React.ReactNode }) {
  const { dir, locale } = useLanguage()

  useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = locale
  }, [dir, locale])

  return <>{children}</>
}
