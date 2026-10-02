'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { loadPrefs, savePrefs, type UserPrefs } from '@/lib/user-prefs'

interface UserPrefsContextValue {
  prefs: UserPrefs
  updatePrefs: (patch: Partial<UserPrefs>) => void
  hasSetup: boolean
}

const UserPrefsContext = createContext<UserPrefsContextValue | null>(null)

export function UserPrefsProvider({ children }: { children: ReactNode }) {
  // ponytail: lazy initializer reads localStorage once on mount instead of an effect + setState round-trip
  const [prefs, setPrefs] = useState<UserPrefs>(() => loadPrefs())

  function updatePrefs(patch: Partial<UserPrefs>) {
    setPrefs((prev) => {
      const next = { ...prev, ...patch }
      savePrefs(next)
      return next
    })
  }

  return (
    <UserPrefsContext.Provider value={{ prefs, updatePrefs, hasSetup: prefs.hasSetup }}>
      {children}
    </UserPrefsContext.Provider>
  )
}

export function useUserPrefs() {
  const ctx = useContext(UserPrefsContext)
  if (!ctx) throw new Error('useUserPrefs must be used inside UserPrefsProvider')
  return ctx
}
