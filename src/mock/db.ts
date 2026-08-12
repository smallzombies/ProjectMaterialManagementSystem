import type {
  Comment,
  Folder,
  LogEntry,
  Material,
  MaterialTag,
  Model,
  Notification,
  Point,
  Project,
  Role,
  ShareLink,
  Tag,
  Unit,
  User,
} from '../types'

const KEY = 'material_mgr_db_v1'

export interface DB {
  users: User[]
  roles: Role[]
  units: Unit[]
  projects: Project[]
  folders: Folder[]
  materials: Material[]
  tags: Tag[]
  materialTags: MaterialTag[]
  points: Point[]
  comments: Comment[]
  shares: ShareLink[]
  logs: LogEntry[]
  models: Model[]
  notifications: Notification[]
  currentUserId: string
}

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`

const emptyDB = (): DB => ({
  users: [],
  roles: [],
  units: [],
  projects: [],
  folders: [],
  materials: [],
  tags: [],
  materialTags: [],
  points: [],
  comments: [],
  shares: [],
  logs: [],
  models: [],
  notifications: [],
  currentUserId: 'u_admin',
})

export function seedDB(): DB {
  const db = emptyDB()
  const now = Date.now()
  const d = (offsetDays: number) =>
    new Date(now - offsetDays * 86400000).toISOString().slice(0, 19)

  db.roles = [
    { id: 'admin', name: '管理员', isBuiltin: true, scope: 'all', perms: ['project.view','project.manage','folder.manage','material.upload','material.edit','material.delete','material.download','material.tag','material.exif','material.move','material.rename','material.preview','share.send','share.view','member.manage','log.view'] },
    { id: 'leader', name: '项目负责人', isBuiltin: true, scope: 'project', perms: ['project.view','folder.manage','material.upload','material.edit','material.delete','material.download','material.tag','material.exif','material.move','material.rename','material.preview','share.send','share.view','member.manage','log.view'] },
    { id: 'clerk', name: '资料员', isBuiltin: true, scope: 'project', perms: ['project.view','folder.manage','material.upload','material.edit','material.delete','material.download','material.tag','material.exif','material.move','material.rename','material.preview'] },
    { id: 'field', name: '外业采集', isBuiltin: true, scope: 'project', perms: ['project.view','material.upload','material.download','material.tag','material.exif','material.preview'] },
    { id: 'guest', name: '协作方/业主', isBuiltin: true, scope: 'project', perms: ['project.view','material.preview','material.download','share.view'] },
  ]

  db.units = [
    { id: 'u1', name: '本公司', unitType: '内部', isEnabled: true },
    { id: 'u2', name: '某勘察院', unitType: '外包', isEnabled: true },
    { id: 'u3', name: '监理单位', unitType: '监理', isEnabled: true },
  ]

  db.users = [
    { id: 'u_admin', name: '系统管理员', phone: '13800000001', unitId: 'u1', roleId: 'admin', projectIds: [], status: '启用' },
    { id: 'u_wang', name: '王工', phone: '13800000002', unitId: 'u1', roleId: 'leader', projectIds: ['p1'], status: '启用' },
    { id: 'u_li', name: '李工', phone: '13800000003', unitId: 'u1', roleId: 'clerk', projectIds: ['p1', 'p2'], status: '启用' },
    { id: 'u_zhao', name: '赵工', phone: '13800000004', unitId: 'u2', roleId: 'field', projectIds: ['p1'], status: '启用' },
    { id: 'u_sun', name: '孙监理', phone: '13800000005', unitId: 'u3', roleId: 'guest', projectIds: ['p1'], status: '启用' },
  ]

  db.projects = [
    { id: 'p1', name: '滨江大道改造工程', code: 'BJ-2024-01', ownerId: 'u_wang', status: '在建', createdAt: d(120) },
    { id: 'p2', name: '地铁三号线站点项目', code: 'DT-2024-05', ownerId: 'u_admin', status: '在建', createdAt: d(80) },
    { id: 'p3', name: '东湖生态修复工程', code: 'DH-2023-12', ownerId: 'u_admin', status: '归档', createdAt: d(320) },
  ]

  db.folders = [
    { id: 'f1', projectId: 'p1', parentId: null, name: '勘察照片', remark: '现场勘察照片归档' },
    { id: 'f2', projectId: 'p1', parentId: 'f1', name: '桩基施工', remark: '桩基阶段施工记录' },
    { id: 'f3', projectId: 'p1', parentId: 'f1', name: '路基施工', remark: '' },
    { id: 'f4', projectId: 'p1', parentId: null, name: '设计图纸', remark: '施工图及CAD' },
    { id: 'f5', projectId: 'p1', parentId: null, name: '施工日志', remark: '' },
    { id: 'f6', projectId: 'p2', parentId: null, name: '站点现场照片' },
    { id: 'f7', projectId: 'p2', parentId: null, name: '勘测资料' },
  ]

  db.tags = [
    { id: 't1', parentId: null, name: '阶段' },
    { id: 't2', parentId: 't1', name: '施工阶段' },
    { id: 't3', parentId: 't1', name: '验收阶段' },
    { id: 't4', parentId: null, name: '部位' },
    { id: 't5', parentId: 't4', name: '桩基' },
    { id: 't6', parentId: 't4', name: '路基' },
    { id: 't7', parentId: null, name: '类型' },
    { id: 't8', parentId: 't7', name: '现场照片' },
    { id: 't9', parentId: 't7', name: '图纸' },
  ]

  db.points = [
    { id: 'pt1', projectId: 'p1', name: 'K0+120 桩位', code: 'P-001', lat: 30.5101, lng: 114.3012, status: '启用', remark: '起点段' },
    { id: 'pt2', projectId: 'p1', name: 'K0+500 桥墩', code: 'P-002', lat: 30.5152, lng: 114.3123, status: '启用' },
    { id: 'pt3', projectId: 'p1', name: 'K1+020 挡墙', code: 'P-003', lat: 30.5210, lng: 114.3205, status: '启用' },
    { id: 'pt4', projectId: 'p2', name: '站点A出入口', code: 'S-A1', lat: 30.5601, lng: 114.3912, status: '启用' },
  ]

  const mk = (
    id: string,
    projectId: string,
    folderId: string | null,
    name: string,
    type: Material['type'],
    size: number,
    days: number,
    tags: string[],
    pointId?: string,
    remark?: string,
    hasExif = true,
    status: Material['status'] = '正常',
  ): Material => ({
    id,
    projectId,
    folderId,
    name,
    type,
    size,
    uploaderId: 'u_zhao',
    uploadTime: d(days),
    pointId,
    shootingTime: d(days + 0.2),
    remark,
    tags,
    hasExif,
    versions: [{ version: 1, storageKey: `key/${id}`, fileHash: `hash${id}`, size, createBy: 'u_zhao', createTime: d(days), note: '首次上传' }],
    commentCount: 0,
    status,
    deletedAt: status === '回收站' ? d(2) : undefined,
    deletedBy: status === '回收站' ? 'u_li' : undefined,
  })

  db.materials = [
    mk('m1', 'p1', 'f2', '桩基施工_001.jpg', 'image', 2.4 * 1024 * 1024, 20, ['t2', 't5', 't8'], 'pt1', '桩头清理完成', true),
    mk('m2', 'p1', 'f2', '桩基施工_002.jpg', 'image', 3.1 * 1024 * 1024, 20, ['t2', 't5', 't8'], 'pt1'),
    mk('m3', 'p1', 'f3', '路基碾压_现场视频.mp4', 'video', 42 * 1024 * 1024, 15, ['t2', 't6'], 'pt2', '碾压过程记录'),
    mk('m4', 'p1', 'f4', '施工总平面图.dwg', 'cad', 8.6 * 1024 * 1024, 60, ['t9']),
    mk('m5', 'p1', 'f4', '结构设计说明.pdf', 'pdf', 5.2 * 1024 * 1024, 60, ['t9']),
    mk('m6', 'p1', 'f5', '施工日志_0715.docx', 'office', 120 * 1024, 10, []),
    mk('m7', 'p1', 'f1', '现场航拍_总体.jpg', 'image', 6.2 * 1024 * 1024, 8, ['t8'], 'pt3', '航拍总览'),
    mk('m8', 'p1', null, '现场照片打包.zip', 'zip', 120 * 1024 * 1024, 5, []),
    mk('m9', 'p2', 'f6', '站点A_出入口.jpg', 'image', 2.8 * 1024 * 1024, 18, ['t8'], 'pt4'),
    mk('m10', 'p2', 'f6', '站点A_内景.jpg', 'image', 2.2 * 1024 * 1024, 18, ['t8'], 'pt4'),
    mk('m11', 'p2', 'f7', '岩土勘察报告.pdf', 'pdf', 12.4 * 1024 * 1024, 40, []),
    mk('m12', 'p1', 'f3', '重复测试文件.jpg', 'image', 1.2 * 1024 * 1024, 3, []),
  ]
  // 制造一对重复文件(模拟指纹相同)
  db.materials[11] = { ...db.materials[11], versions: [...db.materials[11].versions, { version: 2, storageKey: 'key/m12v2', fileHash: 'hashdup', size: 1.2 * 1024 * 1024, createBy: 'u_li', createTime: d(1), note: '重复上传副本' }] }

  db.materialTags = db.materials.flatMap((m) =>
    m.tags.map((t, i) => ({ materialId: m.id, tagId: t, userId: 'u_li', time: `${d(i + 1)}` })),
  )

  db.comments = [
    { id: 'c1', materialId: 'm1', authorId: 'u_sun', content: '@赵工 桩头清渣不够干净，请复拍。', createdAt: d(19), mentions: ['u_zhao'] },
    { id: 'c2', materialId: 'm3', authorId: 'u_wang', content: '碾压遍数需补充记录。', createdAt: d(14), mentions: [] },
  ]
  db.materials[0] = { ...db.materials[0], commentCount: 1 }
  db.materials[2] = { ...db.materials[2], commentCount: 1 }

  db.shares = [
    { id: 's1', materialIds: ['m1', 'm2', 'm7'], folderIds: [], projectId: 'p1', password: '', expireAt: new Date(now + 7 * 86400000).toISOString().slice(0, 10), accessMode: '免登录', downloadAllowed: false, createBy: 'u_wang', createTime: d(2), status: '有效', url: 'https://mat.example/share/s1' },
  ]

  db.models = [
    { id: 'mo1', projectId: 'p1', modelType: '倾斜摄影', name: '滨江大道倾斜摄影模型', format: 'osgb', size: 4.8 * 1024 * 1024 * 1024, storagePath: '/models/mo1', crs: 'EPSG:4490', createBy: 'u_wang', createTime: d(6) },
    { id: 'mo2', projectId: 'p1', modelType: '点云', name: '全线路激光点云', format: 'las', size: 2.1 * 1024 * 1024 * 1024, storagePath: '/models/mo2', createBy: 'u_wang', createTime: d(5) },
  ]

  db.logs = [
    { id: 'l1', materialId: 'm1', materialName: '桩基施工_001.jpg', projectId: 'p1', userId: 'u_zhao', actionType: '上传', detail: '上传至 勘察照片/桩基施工', ip: '10.0.0.23', createdAt: d(20) },
    { id: 'l2', materialId: 'm1', materialName: '桩基施工_001.jpg', projectId: 'p1', userId: 'u_li', actionType: '打标签', detail: '添加标签: 施工阶段, 桩基, 现场照片', ip: '10.0.0.31', createdAt: d(19) },
    { id: 'l3', materialId: 'm3', materialName: '路基碾压_现场视频.mp4', projectId: 'p1', userId: 'u_zhao', actionType: '上传', detail: '上传至 勘察照片/路基施工', ip: '10.0.0.23', createdAt: d(15) },
    { id: 'l4', materialId: 'm12', materialName: '重复测试文件.jpg', projectId: 'p1', userId: 'u_li', actionType: '下载', detail: '下载原图', ip: '10.0.0.31', createdAt: d(3) },
  ]

  db.notifications = []

  return db
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const db = JSON.parse(raw) as DB
      // 兼容旧数据：外链补充 folderIds
      if (db.shares) {
        db.shares = db.shares.map((s) => ({ ...s, folderIds: s.folderIds ?? [] }))
      }
      return db
    }
  } catch { /* ignore */ }
  const db = seedDB()
  save(db)
  return db
}

function save(db: DB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch { /* ignore */ }
}

export { uid }
export function getDB(): DB {
  return load()
}
export function setDB(db: DB) {
  save(db)
}
export function resetDB() {
  localStorage.removeItem(KEY)
}
