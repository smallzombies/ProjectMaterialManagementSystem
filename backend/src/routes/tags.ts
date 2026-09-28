import { Router } from 'express'
import { tagsRepo } from '../repositories/tags.js'
import { authMiddleware, requirePerm } from '../auth.js'

export const tagsRouter = Router()

tagsRouter.use(authMiddleware)

tagsRouter.get('/', async (req, res) => {
  const list = await tagsRepo.list()
  res.json({ list })
})

tagsRouter.post('/', requirePerm('material.tag'), async (req, res) => {
  const body = req.body || {}
  if (!body.name) return res.status(400).json({ message: '请填写标签名称' })
  const item = await tagsRepo.create({
    id: `t_${Date.now().toString(36)}`,
    parentId: body.parentId ?? null,
    name: body.name,
  })
  res.json({ item })
})

tagsRouter.put('/:id', requirePerm('material.tag'), async (req, res) => {
  const patch: any = {}
  if (req.body.name !== undefined) patch.name = req.body.name
  if (req.body.parentId !== undefined) patch.parent_id = req.body.parentId
  const item = await tagsRepo.update(req.params.id, patch)
  if (!item) return res.status(404).json({ message: '标签不存在' })
  res.json({ item })
})

tagsRouter.delete('/:id', requirePerm('material.tag'), async (req, res) => {
  const ids = await tagsRepo.removeRecursive(req.params.id)
  res.json({ ok: true, removedIds: ids })
})
