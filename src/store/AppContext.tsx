import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { DB } from '../mock/db'
import { getDB, setDB, resetDB } from '../mock/db'
import type { User, PermCode } from '../types'

interface AppCtx {
  db: DB
  currentUser: User | null
  refresh: () => void
  update: (next: DB) => void
  login: (userId: string) => void
  logout: () => void
  reset: () => void
  can: (perm: PermCode) => boolean
  canScope: (perm: PermCode) => 'all' | 'project' | false
  isAdmin: boolean
}

const Ctx = createContext<AppCtx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => getDB())

  const refresh = () => setDb(getDB())

  const update = (next: DB) => {
    setDB(next)
    setDb(next)
  }

  const currentUser = useMemo(
    () => db.users.find((u) => u.id === db.currentUserId) ?? null,
    [db],
  )

  const role = useMemo(
    () => db.roles.find((r) => r.id === currentUser?.roleId) ?? null,
    [db, currentUser],
  )

  const login = (userId: string) => {
    const next = { ...db, currentUserId: userId }
    setDB(next)
    setDb(next)
  }

  const logout = () => {
    const next = { ...db, currentUserId: '' }
    setDB(next)
    setDb(next)
  }

  const reset = () => {
    resetDB()
    const fresh = getDB()
    setDb(fresh)
  }

  const can = (perm: PermCode) => !!role?.perms.includes(perm)

  const canScope = (perm: PermCode): 'all' | 'project' | false => {
    if (!role?.perms.includes(perm)) return false
    return role.scope === 'all' ? 'all' : 'project'
  }

  const isAdmin = currentUser?.roleId === 'admin'

  useEffect(() => {
    const onStorage = () => setDb(getDB())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo(
    () => ({ db, currentUser, refresh, update, login, logout, reset, can, canScope, isAdmin }),
    [db, currentUser, role],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
