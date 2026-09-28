import { Router } from 'express'
import { trashRepo } from '../repositories/trash.js'
import { authMiddleware, requirePerm } from '../auth.js'

export const trashRouter = Router()

trashRouter.use(authMiddleware)

function scopeProjectIds(req: any): string[] | null {
  const au: any = req.authUser
  if (au.scope === 'all') return null
  return au.projectIds || []
}

// 列表（按项目权限过滤）
trashRouter.get('/', (req, res) => {
  trashRepo
    .list(scopeProjectIds(req))
    .then((list) => res.json({ list }))
    .catch((e) => res.status(500).json({ message: e.message }))
})

// 移入回收站（文件删除时调用）
trashRouter.post('/', requirePerm('material.delete'), (req, res) => {
  const m = req.body?.material
  if (!m || !m.id) return res.status(400).json({ message: '缺少素材数据' })
  trashRepo
    .create({
      id: m.id,
      projectId: m.projectId,
      folderId: m.folderId ?? null,
      name: m.name,
      type: m.type,
      size: m.size,
      material: m,
      deletedBy: (req as any).authUser?.id ?? null,
    })
    .then((item) => res.json({ item }))
    .catch((e) => res.status(500).json({ message: e.message }))
})

// 恢复
trashRouter.post('/:id/restore', requirePerm('material.delete'), async (req, res) => {
  try {
    const item = await trashRepo.findById(req.params.id)
    if (!item) return res.status(404).json({ message: '回收站项不存在' })
    const scope = scopeProjectIds(req)
    if (scope && !scope.includes(item.projectId)) return res.status(403).json({ message: '无权操作该项目' })
    await trashRepo.remove(item.id)
    res.json({ material: item.data })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// 彻底删除单个
trashRouter.delete('/:id', requirePerm('material.delete'), async (req, res) => {
  try {
    const item = await trashRepo.findById(req.params.id)
    if (!item) return res.status(404).json({ message: '回收站项不存在' })
    const scope = scopeProjectIds(req)
    if (scope && !scope.includes(item.projectId)) return res.status(403).json({ message: '无权操作该项目' })
    await trashRepo.remove(item.id)
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// 批量彻底删除
trashRouter.post('/purge', requirePerm('material.delete'), async (req, res) => {
  try {
    const ids: string[] = req.body?.ids || []
    const scope = scopeProjectIds(req)
    if (scope && ids.length) {
      const rows = await Promise.all(ids.map((id) => trashRepo.findById(id)))
      const blocked = rows.some((r) => r && !scope.includes(r.projectId))
      if (blocked) return res.status(403).json({ message: '无权操作其中部分项目' })
    }
    await trashRepo.removeMany(ids)
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})
