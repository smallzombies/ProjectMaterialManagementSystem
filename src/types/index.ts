// 全局类型定义

export type FileType =
  | 'image'
  | 'video'
  | 'pdf'
  | 'cad'
  | 'office'
  | 'zip'
  | 'model'
  | 'pointcloud'
  | 'other'

export type RoleId = 'admin' | 'leader' | 'clerk' | 'field' | 'guest'
export type PermCode =
  | 'project.view'
  | 'project.manage'
  | 'folder.manage'
  | 'material.upload'
  | 'material.edit'
  | 'material.delete'
  | 'material.download'
  | 'material.tag'
  | 'material.exif'
  | 'material.move'
  | 'material.rename'
  | 'material.preview'
  | 'share.send'
  | 'share.view'
  | 'member.manage'
  | 'log.view'

export interface UnitConfig {
  showDetailMeta: boolean
  showApproval: boolean
  showFailed: boolean
}

export interface Unit {
  id: string
  name: string
  unitType: '内部' | '外包' | '监理'
  isEnabled: boolean
  config?: UnitConfig
}

export interface Role {
  id: string
  name: string
  isBuiltin: boolean
  perms: PermCode[]
  scope: 'all' | 'project'
}

export interface User {
  id: string
  name: string
  phone: string
  unitId?: string
  roleId: RoleId | string
  projectIds: string[]
  pointIds?: string[]
  status: '启用' | '停用'
  password?: string
}

export interface Project {
  id: string
  name: string
  code: string
  ownerId: string
  status: '在建' | '归档'
  createdAt: string
}

export interface Folder {
  id: string
  projectId: string
  parentId: string | null
  name: string
  remark?: string
}

export interface MaterialVersion {
  version: number
  storageKey: string
  fileHash: string
  size: number
  createBy: string
  createTime: string
  note: string
}

export interface ExifData {
  cameraBrand?: string
  cameraModel?: string
  aperture?: string
  shutter?: string
  isoSpeed?: string
  focalLength?: string
  whiteBalance?: string
  colorSpace?: string
  gpsLat?: string
  gpsLng?: string
  gpsAltitude?: string
}

export interface Material {
  id: string
  projectId: string
  folderId: string | null
  name: string
  type: FileType
  size: number
  uploaderId: string
  uploadTime: string
  pointId?: string
  shootingTime?: string
  remark?: string
  tags: string[]
  hasExif?: boolean
  exif?: ExifData
  versions: MaterialVersion[]
  commentCount: number
  status: '正常' | '回收站'
  approval?: '合格' | '不合格'
  deletedAt?: string
  deletedBy?: string
}

export interface Tag {
  id: string
  parentId: string | null
  name: string
  projectId?: string
}

export interface MaterialTag {
  materialId: string
  tagId: string
  userId: string
  time: string
}

export interface Approval {
  id: string
  materialId: string
  userId: string
  result: '合格' | '不合格'
  tagChange: '新增' | '删除' | '无变化'
  changedNames: string[]
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

export interface Comment {
  id: string
  materialId: string
  authorId: string
  content: string
  parentId?: string
  createdAt: string
  mentions: string[]
}

export interface ShareLink {
  id: string
  materialIds: string[]
  folderIds: string[]
  projectId: string
  password?: string
  expireAt: string
  accessMode: '免登录' | '需登录'
  downloadAllowed: boolean
  createBy: string
  createTime: string
  status: '有效' | '已撤回'
  url: string
}

export interface LogEntry {
  id: string
  materialId?: string
  materialName?: string
  projectId?: string
  userId: string
  actionType: string
  detail: string
  ip: string
  createdAt: string
}

export interface Model {
  id: string
  projectId: string
  modelType: '倾斜摄影' | '点云'
  name: string
  format: string
  size: number
  storagePath: string
  crs?: string
  createBy: string
  createTime: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  content: string
  isRead: boolean
  createdAt: string
}
