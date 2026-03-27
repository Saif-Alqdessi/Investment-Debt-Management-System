'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface SearchContextValue {
  searchQuery: string
  setSearchQuery: (query: string) => void
  clearSearch: () => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQueryRaw] = useState('')

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryRaw(query)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQueryRaw('')
  }, [])

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery, clearSearch }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('useSearch must be used inside SearchProvider')
  return ctx
}
