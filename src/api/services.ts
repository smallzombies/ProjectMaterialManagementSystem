import { api } from './client'

export interface AuthUser {
  id: string
  name: string
  phone: string
  unitId?: string
  roleId: string
  projectIds: string[]
  status: '启用' | '停用'
  roleName: string
  perms: string[]
  scope: 'all' | 'project'
}

export const authApi = {
  login: (login: string, password: string) =>
    api.post<{ token: string; user: AuthUser }>('/auth/login', { login, password }),
  me: () => api.get<{ user: AuthUser }>('/auth/me'),
}

export const projectsApi = {
  list: () => api.get<{ list: any[] }>('/projects').then((r) => r.list),
  get: (id: string) => api.get<{ item: any }>(`/projects/${id}`).then((r) => r.item),
  create: (body: any) => api.post<{ item: any }>('/projects', body).then((r) => r.item),
  update: (id: string, body: any) => api.put<{ item: any }>(`/projects/${id}`, body).then((r) => r.item),
  remove: (id: string) => api.del(`/projects/${id}`),
}

export const pointsApi = {
  list: (projectId?: string) =>
    api.get<{ list: any[] }>(`/points${projectId ? `?projectId=${projectId}` : ''}`).then((r) => r.list),
  create: (body: any) => api.post<{ item: any }>('/points', body).then((r) => r.item),
  update: (id: string, body: any) => api.put<{ item: any }>(`/points/${id}`, body).then((r) => r.item),
  remove: (id: string) => api.del(`/points/${id}`),
}

export const tagsApi = {
  list: () => api.get<{ list: any[] }>('/tags').then((r) => r.list),
  create: (body: any) => api.post<{ item: any }>('/tags', body).then((r) => r.item),
  update: (id: string, body: any) => api.put<{ item: any }>(`/tags/${id}`, body).then((r) => r.item),
  remove: (id: string) => api.del(`/tags/${id}`),
}

export const unitsApi = {
  list: () => api.get<{ list: any[] }>('/units').then((r) => r.list),
  create: (body: any) => api.post<{ item: any }>('/units', body).then((r) => r.item),
  update: (id: string, body: any) => api.put<{ item: any }>(`/units/${id}`, body).then((r) => r.item),
  remove: (id: string) => api.del(`/units/${id}`),
}

export const usersApi = {
  list: () => api.get<{ list: any[] }>('/users').then((r) => r.list),
  create: (body: any) => api.post<{ item: any }>('/users', body).then((r) => r.item),
  update: (id: string, body: any) => api.put<{ item: any }>(`/users/${id}`, body).then((r) => r.item),
  remove: (id: string) => api.del(`/users/${id}`),
}

export const rolesApi = {
  list: () => api.get<{ list: any[] }>('/roles').then((r) => r.list),
  create: (body: any) => api.post<{ item: any }>('/roles', body).then((r) => r.item),
  update: (id: string, body: any) => api.put<{ item: any }>(`/roles/${id}`, body).then((r) => r.item),
  remove: (id: string) => api.del(`/roles/${id}`),
}

export const trashApi = {
  list: () => api.get<{ list: any[] }>('/trash').then((r) => r.list),
  create: (material: any) => api.post<{ item: any }>('/trash', { material }).then((r) => r.item),
  restore: (id: string) => api.post<{ material: any }>(`/trash/${id}/restore`).then((r) => r.material),
  purge: (ids: string[]) => api.post('/trash/purge', { ids }),
  remove: (id: string) => api.del(`/trash/${id}`),
}

export const materialsApi = {
  list: (projectId: string) =>
    api.get<{ list: any[] }>(`/materials?projectId=${projectId}`).then((r) => r.list),
  get: (id: string) => api.get<{ item: any }>(`/materials/${id}`).then((r) => r.item),
  create: (body: any) => api.post<{ item: any }>('/materials', body).then((r) => r.item),
  update: (id: string, body: any) => api.put<{ item: any }>(`/materials/${id}`, body).then((r) => r.item),
  remove: (id: string) => api.del(`/materials/${id}`),
  rename: (id: string, name: string) =>
    api.post<{ item: any }>(`/materials/${id}/rename`, { name }).then((r) => r.item),
  listComments: (id: string) =>
    api.get<{ list: any[] }>(`/materials/${id}/comments`).then((r) => r.list),
  addComment: (id: string, body: any) =>
    api.post<{ item: any }>(`/materials/${id}/comments`, body).then((r) => r.item),
  listApprovals: (id: string) =>
    api.get<{ list: any[] }>(`/materials/${id}/approvals`).then((r) => r.list),
  addApproval: (id: string, body: any) =>
    api.post<{ item: any }>(`/materials/${id}/approvals`, body).then((r) => r.item),
  addTags: (id: string, tagIds: string[]) =>
    api.post<{ ok: boolean; tags: string[] }>(`/materials/${id}/tags`, { tagIds }),
  removeTag: (id: string, tagId: string) =>
    api.del<{ ok: boolean; tags: string[] }>(`/materials/${id}/tags/${tagId}`),
  batchMove: (ids: string[], targetFolderId: string | null) =>
    api.post('/materials/batch/move', { ids, targetFolderId }),
  batchTag: (ids: string[], tagIds: string[]) =>
    api.post('/materials/batch/tag', { ids, tagIds }),
  batchPoint: (ids: string[], pointId: string | null) =>
    api.post('/materials/batch/point', { ids, pointId }),
  batchClearExif: (ids: string[]) =>
    api.post('/materials/batch/clear-exif', { ids }),
  batchDelete: (ids: string[]) =>
    api.post('/materials/batch/delete', { ids }),
}

export const foldersApi = {
  list: (projectId: string) =>
    api.get<{ list: any[] }>(`/folders?projectId=${projectId}`).then((r) => r.list),
  get: (id: string) => api.get<{ item: any }>(`/folders/${id}`).then((r) => r.item),
  create: (body: any) => api.post<{ item: any }>('/folders', body).then((r) => r.item),
  update: (id: string, body: any) => api.put<{ item: any }>(`/folders/${id}`, body).then((r) => r.item),
  remove: (id: string) => api.del(`/folders/${id}`),
}

export const commentsApi = {
  list: (params: { materialId?: string; projectId?: string }) => {
    const q = new URLSearchParams()
    if (params.materialId) q.set('materialId', params.materialId)
    if (params.projectId) q.set('projectId', params.projectId)
    return api.get<{ list: any[] }>(`/comments?${q}`).then((r) => r.list)
  },
  remove: (id: string) => api.del(`/comments/${id}`),
}

export const approvalsApi = {
  list: (params: { materialId?: string; projectId?: string }) => {
    const q = new URLSearchParams()
    if (params.materialId) q.set('materialId', params.materialId)
    if (params.projectId) q.set('projectId', params.projectId)
    return api.get<{ list: any[] }>(`/approvals?${q}`).then((r) => r.list)
  },
}

export const logsApi = {
  list: (projectId?: string, limit?: number) => {
    const q = new URLSearchParams()
    if (projectId) q.set('projectId', projectId)
    if (limit) q.set('limit', String(limit))
    return api.get<{ list: any[] }>(`/logs?${q}`).then((r) => r.list)
  },
  create: (body: any) => api.post<{ item: any }>('/logs', body).then((r) => r.item),
}

export const statsApi = {
  dashboard: (projectId?: string) => {
    const q = projectId ? `?projectId=${projectId}` : ''
    return api.get<{ stats: any; recentLogs: any[] }>(`/stats/dashboard${q}`)
  },
}

export const downloadApi = {
  zip: (ids: string[]) => api.download('/download', { ids }, `files_${Date.now()}.zip`),
}
