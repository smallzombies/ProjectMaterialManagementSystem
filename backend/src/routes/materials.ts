import { Router } from 'express'
import { materialsRepo } from '../repositories/materials.js'
import { foldersRepo } from '../repositories/folders.js'
import { commentsRepo } from '../repositories/comments.js'
import { approvalsRepo } from '../repositories/approvals.js'
import { materialTagsRepo } from '../repositories/materialTags.js'
import { trashRepo } from '../repositories/trash.js'
import { authMiddleware, requirePerm } from '../auth.js'
import { query } from '../db.js'

export const materialsRouter = Router()

materialsRouter.use(authMiddleware)

materialsRouter.get('/', async (req, res) => {
  const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined
  if (!projectId) return res.status(400).json({ message: '缺少 projectId' })
  const list = await materialsRepo.listByProject(projectId, '正常')
  res.json({ list })
})

materialsRouter.get('/:id', async (req, res) => {
  const item = await materialsRepo.findById(req.params.id)
  if (!item) return res.status(404).json({ message: '素材不存在' })
  res.json({ item })
})

materialsRouter.get('/:id/comments', async (req, res) => {
  const list = await commentsRepo.listByMaterial(req.params.id)
  res.json({ list })
})

materialsRouter.get('/:id/approvals', async (req, res) => {
  const list = await approvalsRepo.listByMaterial(req.params.id)
  res.json({ list })
})

materialsRouter.post('/', requirePerm('material.upload'), async (req, res) => {
  const body = req.body || {}
  if (!body.projectId || !body.name) return res.status(400).json({ message: '缺少项目或文件名' })
  const now = new Date().toISOString().slice(0, 19)
  const m = await materialsRepo.create({
    id: `m_${Date.now().toString(36)}`,
    projectId: body.projectId,
    folderId: body.folderId ?? null,
    name: body.name,
    type: body.type || 'other',
    size: body.size || 0,
    uploaderId: (req as any).authUser?.id || '',
    uploadTime: now,
    pointId: body.pointId ?? null,
    shootingTime: body.shootingTime ?? null,
    remark: body.remark ?? '',
    tags: body.tags || [],
    hasExif: body.hasExif ?? false,
    exif: body.exif ?? null,
    versions: body.versions || [],
    commentCount: 0,
    status: '正常',
    approval: body.approval ?? null,
  })
  res.json({ item: m })
})

materialsRouter.put('/:id', requirePerm('material.edit'), async (req, res) => {
  const patch: any = {}
  for (const k of ['name', 'folderId', 'pointId', 'remark', 'tags', 'hasExif', 'exif', 'approval', 'status', 'deletedAt', 'deletedBy', 'commentCount', 'versions', 'type', 'size', 'shootingTime'] as const) {
    if (req.body[k] !== undefined) patch[k] = req.body[k]
  }
  const item = await materialsRepo.update(req.params.id, patch)
  if (!item) return res.status(404).json({ message: '素材不存在' })
  res.json({ item })
})

materialsRouter.delete('/:id', requirePerm('material.delete'), async (req, res) => {
  const m = await materialsRepo.findById(req.params.id)
  if (!m) return res.status(404).json({ message: '素材不存在' })
  await materialsRepo.update(req.params.id, { status: '回收站', deletedAt: new Date().toISOString().slice(0, 19), deletedBy: (req as any).authUser?.id })
  await trashRepo.create({
    id: m.id, projectId: m.projectId, folderId: m.folderId,
    name: m.name, type: m.type, size: m.size, material: m,
    deletedBy: (req as any).authUser?.id,
  })
  res.json({ ok: true })
})

materialsRouter.post('/:id/comments', requirePerm('material.edit'), async (req, res) => {
  const body = req.body || {}
  if (!body.content) return res.status(400).json({ message: '请输入评论内容' })
  const now = new Date().toISOString().slice(0, 19)
  const c = await commentsRepo.create({
    id: `c_${Date.now().toString(36)}`,
    materialId: req.params.id,
    authorId: (req as any).authUser?.id || '',
    content: body.content,
    parentId: body.parentId,
    createdAt: now,
    mentions: body.mentions || [],
  })
  await materialsRepo.update(req.params.id, { commentCount: (await commentsRepo.listByMaterial(req.params.id)).length })
  res.json({ item: c })
})

materialsRouter.post('/:id/approvals', requirePerm('material.edit'), async (req, res) => {
  const body = req.body || {}
  if (!body.result) return res.status(400).json({ message: '请选择审批意见' })
  const now = new Date().toISOString().slice(0, 19)
  const a = await approvalsRepo.create({
    id: `a_${Date.now().toString(36)}`,
    materialId: req.params.id,
    userId: (req as any).authUser?.id || '',
    result: body.result,
    tagChange: body.tagChange || '无变化',
    changedNames: body.changedNames || [],
    createdAt: now,
  })
  await materialsRepo.update(req.params.id, { approval: body.result })
  res.json({ item: a })
})

materialsRouter.post('/:id/tags', requirePerm('material.tag'), async (req, res) => {
  const body = req.body || {}
  const tagIds: string[] = body.tagIds || []
  const now = new Date().toISOString().slice(0, 19)
  const userId = (req as any).authUser?.id || ''
  const m = await materialsRepo.findById(req.params.id)
  if (!m) return res.status(404).json({ message: '素材不存在' })
  for (const tagId of tagIds) {
    await materialTagsRepo.add({ materialId: req.params.id, tagId, userId, time: now })
  }
  const allTags = [...new Set([...m.tags, ...tagIds])]
  await materialsRepo.update(req.params.id, { tags: allTags })
  res.json({ ok: true, tags: allTags })
})

materialsRouter.delete('/:id/tags/:tagId', requirePerm('material.tag'), async (req, res) => {
  const m = await materialsRepo.findById(req.params.id)
  if (!m) return res.status(404).json({ message: '素材不存在' })
  await materialTagsRepo.removeByMaterialAndTag(req.params.id, req.params.tagId)
  const allTags = m.tags.filter((t: string) => t !== req.params.tagId)
  await materialsRepo.update(req.params.id, { tags: allTags })
  res.json({ ok: true, tags: allTags })
})

// 批量移动
materialsRouter.post('/batch/move', requirePerm('material.move'), async (req, res) => {
  const { ids, targetFolderId } = req.body || {}
  if (!ids?.length) return res.status(400).json({ message: '缺少文件 ID' })
  for (const id of ids) {
    await materialsRepo.update(id, { folderId: targetFolderId ?? null })
  }
  res.json({ ok: true })
})

// 批量打标签
materialsRouter.post('/batch/tag', requirePerm('material.tag'), async (req, res) => {
  const { ids, tagIds } = req.body || {}
  if (!ids?.length || !tagIds?.length) return res.status(400).json({ message: '缺少参数' })
  const now = new Date().toISOString().slice(0, 19)
  const userId = (req as any).authUser?.id || ''
  for (const id of ids) {
    const m = await materialsRepo.findById(id)
    if (!m) continue
    for (const tagId of tagIds) {
      await materialTagsRepo.add({ materialId: id, tagId, userId, time: now })
    }
    await materialsRepo.update(id, { tags: [...new Set([...m.tags, ...tagIds])] })
  }
  res.json({ ok: true })
})

// 批量设置船舱
materialsRouter.post('/batch/point', requirePerm('material.edit'), async (req, res) => {
  const { ids, pointId } = req.body || {}
  if (!ids?.length) return res.status(400).json({ message: '缺少文件 ID' })
  for (const id of ids) {
    await materialsRepo.update(id, { pointId: pointId ?? null })
  }
  res.json({ ok: true })
})

// 批量清除 EXIF
materialsRouter.post('/batch/clear-exif', requirePerm('material.exif'), async (req, res) => {
  const { ids } = req.body || {}
  if (!ids?.length) return res.status(400).json({ message: '缺少文件 ID' })
  for (const id of ids) {
    const m = await materialsRepo.findById(id)
    if (m) await materialsRepo.update(id, { hasExif: false })
  }
  res.json({ ok: true })
})

// 批量删除（移入回收站）
materialsRouter.post('/batch/delete', requirePerm('material.delete'), async (req, res) => {
  const { ids } = req.body || {}
  if (!ids?.length) return res.status(400).json({ message: '缺少文件 ID' })
  const now = new Date().toISOString().slice(0, 19)
  const userId = (req as any).authUser?.id
  for (const id of ids) {
    const m = await materialsRepo.findById(id)
    if (!m) continue
    await materialsRepo.update(id, { status: '回收站', deletedAt: now, deletedBy: userId })
    await trashRepo.create({ id: m.id, projectId: m.projectId, folderId: m.folderId, name: m.name, type: m.type, size: m.size, material: m, deletedBy: userId })
  }
  res.json({ ok: true })
})

// 重命名
materialsRouter.post('/:id/rename', requirePerm('material.rename'), async (req, res) => {
  const { name } = req.body || {}
  if (!name) return res.status(400).json({ message: '请输入新名称' })
  const item = await materialsRepo.update(req.params.id, { name })
  if (!item) return res.status(404).json({ message: '素材不存在' })
  res.json({ item })
})
