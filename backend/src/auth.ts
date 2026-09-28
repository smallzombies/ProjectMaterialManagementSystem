import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { query } from './db.js'
import type { AuthUser, Role, UnitConfig } from './types.js'

const JWT_SECRET = process.env.JWT_SECRET || 'material-manager-demo-secret'

export interface AuthPayload {
  sub: string
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' })
}

export async function resolveAuthUser(userId: string): Promise<AuthUser | null> {
  const users = await query<{
    id: string
    name: string
    phone: string
    unit_id: string | null
    role_id: string
    project_ids: string[]
    status: string
    password: string
  }>('SELECT * FROM users WHERE id = $1', [userId])
  const u = users.rows[0]
  if (!u) return null
  const roles = await query<Role>('SELECT * FROM roles WHERE id = $1', [u.role_id])
  const role = roles.rows[0] || { id: u.role_id, name: '未知', isBuiltin: false, perms: [], scope: 'project' as const }
  const au: AuthUser = {
    id: u.id,
    name: u.name,
    phone: u.phone,
    unitId: u.unit_id ?? undefined,
    roleId: u.role_id,
    projectIds: u.project_ids || [],
    status: (u.status as '启用' | '停用') || '启用',
    roleName: role.name,
    perms: role.perms || [],
    scope: role.scope,
  }
  return au
}

export interface AuthedRequest extends Request {
  authUser?: AuthUser
}

export async function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未登录' })
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload
    const user = await resolveAuthUser(payload.sub)
    if (!user || user.status !== '启用') {
      return res.status(401).json({ message: '账号不可用' })
    }
    req.authUser = user
    next()
  } catch {
    return res.status(401).json({ message: '登录已过期' })
  }
}

// 校验当前用户是否拥有某权限
export function requirePerm(perm: string) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const u = req.authUser
    if (!u) return res.status(401).json({ message: '未登录' })
    if (u.roleId === 'admin' || u.perms.includes(perm) || u.perms.includes('*')) return next()
    return res.status(403).json({ message: '无权限' })
  }
}

export function defaultUnitConfig(): UnitConfig {
  return { showDetailMeta: true, showApproval: true, showFailed: true }
}
