import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { DB } from '../mock/db'
import { getDB, setDB, resetDB } from '../mock/db'
import type { User, UnitConfig, PermCode } from '../types'
import { getToken, setToken } from '../api/client'
import { authApi, unitsApi, usersApi, rolesApi, projectsApi, pointsApi, tagsApi, materialsApi, foldersApi, commentsApi, approvalsApi, logsApi } from '../api/services'
import type { AuthUser } from '../api/services'

interface AppCtx {
  db: DB
  currentUser: User | null
  token: string | null
  authLoading: boolean
  loginTime: string | null
  refresh: () => void
  reloadFromApi: () => Promise<void>
  loadProjectData: (projectId: string) => Promise<void>
  update: (next: DB) => void
  login: (token: string, user: AuthUser) => void
  logout: () => void
  reset: () => void
  can: (perm: PermCode) => boolean
  canScope: (perm: PermCode) => 'all' | 'project' | false
  isAdmin: boolean
  unitConfig: UnitConfig
}

const Ctx = createContext<AppCtx | null>(null)

const TIME_KEY = 'material_mgr_login_time'

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => {
    if (getToken()) resetDB()
    return getDB()
  })
  const [loginTime, setLoginTime] = useState<string | null>(() => localStorage.getItem(TIME_KEY))
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [authLoading, setAuthLoading] = useState<boolean>(() => !!getToken())

  const refresh = () => setDb(getDB())

  // 后端托管实体：从 API 重新拉取并合并进内存 db
  const reloadFromApi = async () => {
    const [units, users, roles, projects, points, tags] = await Promise.all([
      unitsApi.list(),
      usersApi.list(),
      rolesApi.list(),
      projectsApi.list(),
      pointsApi.list(),
      tagsApi.list(),
    ])
    setDb((prev) => ({
      ...prev,
      units, users, roles, projects, points, tags,
      materials: [], folders: [], comments: [], approvals: [], materialTags: [], logs: [], shares: [], models: [], notifications: [],
    }))
  }

  // 加载指定项目的文件管理数据（素材、文件夹、评论、审批、标签关联、日志）
  const loadProjectData = async (projectId: string) => {
    const [materials, folders, comments, approvals, materialTags, logs] = await Promise.all([
      materialsApi.list(projectId),
      foldersApi.list(projectId),
      commentsApi.list({ projectId }),
      approvalsApi.list({ projectId }),
      // materialTags 通过 materials 自带的 tags 字段即可，无需单独加载
      Promise.resolve([]),
      logsApi.list(projectId),
    ])
    setDb((prev) => ({ ...prev, materials, folders, comments, approvals, materialTags, logs }))
  }

  const update = (next: DB) => {
    setDB(next)
    setDb(next)
  }

  const currentUser = useMemo<User | null>(() => {
    if (!authUser) return null
    return {
      id: authUser.id,
      name: authUser.name,
      phone: authUser.phone,
      unitId: authUser.unitId,
      roleId: authUser.roleId,
      projectIds: authUser.projectIds,
      status: authUser.status,
    }
  }, [authUser])

  const role = useMemo(
    () =>
      authUser
        ? { id: authUser.roleId, name: authUser.roleName, perms: authUser.perms, scope: authUser.scope, isBuiltin: false }
        : null,
    [authUser],
  )

  const login = (newToken: string, user: AuthUser) => {
    setToken(newToken)
    setTokenState(newToken)
    setAuthUser(user)
    setAuthLoading(false)
    const ts = new Date().toISOString()
    localStorage.setItem(TIME_KEY, ts)
    setLoginTime(ts)
    // 清除旧的 localStorage 数据，避免显示过期内容
    resetDB()
    setDb({ ...getDB(), currentUserId: user.id })
    reloadFromApi().catch(() => {})
  }

  const logout = () => {
    setToken(null)
    setTokenState(null)
    setAuthUser(null)
    setAuthLoading(false)
    localStorage.removeItem(TIME_KEY)
    setLoginTime(null)
    resetDB()
    setDb(getDB())
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

  const unitConfig = useMemo<UnitConfig>(() => {
    const unit = db.units.find((u) => u.id === currentUser?.unitId)
    return unit?.config || { showDetailMeta: true, showApproval: true, showFailed: true }
  }, [db, currentUser])

  useEffect(() => {
    if (token && !authUser) {
      setAuthLoading(true)
      // 清除旧 localStorage 数据
      resetDB()
      setDb(getDB())
      authApi
        .me()
        .then((r) => {
          setAuthUser(r.user)
          setDb((prev) => ({ ...prev, currentUserId: r.user.id }))
          return reloadFromApi()
        })
        .catch(() => {
          setToken(null)
          setTokenState(null)
        })
        .finally(() => setAuthLoading(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(
    () => ({ db, currentUser, token, authLoading, loginTime, refresh, reloadFromApi, loadProjectData, update, login, logout, reset, can, canScope, isAdmin, unitConfig }),
    [db, currentUser, role, token, authLoading, loginTime, unitConfig],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
