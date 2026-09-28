import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { usersRepo } from '../repositories/users.js'
import { authMiddleware, requirePerm } from '../auth.js'

export const usersRouter = Router()

usersRouter.use(authMiddleware)

usersRouter.get('/', async (req, res) => {
  const list = await usersRepo.list()
  res.json({ list })
})

usersRouter.post('/', requirePerm('member.manage'), async (req, res) => {
  const body = req.body || {}
  if (!body.name || !body.phone || !body.roleId) return res.status(400).json({ message: '请填写姓名、手机号与角色' })
  const password = await bcrypt.hash(body.password || '123456', 10)
  const item = await usersRepo.create({
    id: `u_${Date.now().toString(36)}`,
    name: body.name,
    phone: body.phone,
    unitId: body.unitId,
    roleId: body.roleId,
    projectIds: body.projectIds || [],
    status: body.status || '启用',
    password,
  })
  res.json({ item })
})

usersRouter.put('/:id', requirePerm('member.manage'), async (req, res) => {
  const patch: any = {}
  if (req.body.name !== undefined) patch.name = req.body.name
  if (req.body.phone !== undefined) patch.phone = req.body.phone
  if (req.body.unitId !== undefined) patch.unit_id = req.body.unitId
  if (req.body.roleId !== undefined) patch.role_id = req.body.roleId
  if (req.body.projectIds !== undefined) patch.project_ids = req.body.projectIds
  if (req.body.status !== undefined) patch.status = req.body.status
  if (req.body.password) patch.password = await bcrypt.hash(req.body.password, 10)
  const item = await usersRepo.update(req.params.id, patch)
  if (!item) return res.status(404).json({ message: '用户不存在' })
  res.json({ item })
})

usersRouter.delete('/:id', requirePerm('member.manage'), async (req, res) => {
  await usersRepo.remove(req.params.id)
  res.json({ ok: true })
})
