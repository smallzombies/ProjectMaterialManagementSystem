import { Router } from 'express'
import { rolesRepo } from '../repositories/roles.js'
import { authMiddleware, requirePerm } from '../auth.js'

export const rolesRouter = Router()

rolesRouter.use(authMiddleware)

rolesRouter.get('/', async (req, res) => {
  const list = await rolesRepo.list()
  res.json({ list })
})

rolesRouter.post('/', requirePerm('member.manage'), async (req, res) => {
  const body = req.body || {}
  if (!body.name) return res.status(400).json({ message: '请填写角色名称' })
  const item = await rolesRepo.create({
    id: `role_${Date.now().toString(36)}`,
    name: body.name,
    isBuiltin: false,
    perms: body.perms || [],
    scope: body.scope || 'project',
  })
  res.json({ item })
})

rolesRouter.put('/:id', requirePerm('member.manage'), async (req, res) => {
  const patch: any = {}
  for (const k of ['name', 'perms', 'scope'] as const) {
    if (req.body[k] !== undefined) patch[k] = req.body[k]
  }
  const item = await rolesRepo.update(req.params.id, patch)
  if (!item) return res.status(404).json({ message: '角色不存在' })
  res.json({ item })
})

rolesRouter.delete('/:id', requirePerm('member.manage'), async (req, res) => {
  await rolesRepo.remove(req.params.id)
  res.json({ ok: true })
})
