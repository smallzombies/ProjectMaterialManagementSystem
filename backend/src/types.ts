export interface UnitConfig {
  showDetailMeta: boolean
  showApproval: boolean
  showFailed: boolean
}

export interface Role {
  id: string
  name: string
  isBuiltin: boolean
  perms: string[]
  scope: 'all' | 'project'
}

export interface Unit {
  id: string
  name: string
  unitType: '内部' | '外包' | '监理'
  isEnabled: boolean
  config?: UnitConfig
}

export interface User {
  id: string
  name: string
  phone: string
  unitId?: string
  roleId: string
  projectIds: string[]
  status: '启用' | '停用'
  password?: string
}

export interface Project {
  id: string
  name: string
  code: string
  ownerId?: string
  status: '在建' | '归档'
  createdAt: string
}

export interface Point {
  id: string
  projectId: string
  name: string
  code: string
  lat?: number
  lng?: number
  status: '启用' | '停用'
  remark?: string
}

export interface Tag {
  id: string
  parentId: string | null
  name: string
}

// 登录后返回给前端的当前用户（含解析后的角色信息）
export interface AuthUser extends User {
  roleName: string
  perms: string[]
  scope: 'all' | 'project'
}
