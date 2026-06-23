'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { translations, type Locale } from './translations'
import { BRANDING } from '@/lib/config/branding'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (path: string) => string
  dir: 'ltr' | 'rtl'
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current === undefined || current === null) return path
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current : path
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  // Use a namespaced key so multiple white-label deployments on the
  // same browser domain don't share locale preferences.
  const localeKey = `${BRANDING.appName}-locale`

  useEffect(() => {
    const saved = localStorage.getItem(localeKey) as Locale | null
    if (saved && (saved === 'en' || saved === 'ar')) {
      setLocaleState(saved)
    }
  }, [localeKey])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(localeKey, newLocale)
  }, [localeKey])

  const t = useCallback((path: string): string => {
    return getNestedValue(translations[locale], path)
  }, [locale])

  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  const isRTL = locale === 'ar'

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dir, isRTL }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
