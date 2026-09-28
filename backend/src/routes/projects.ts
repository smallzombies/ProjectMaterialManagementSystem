import { Router } from 'express'
import { projectsRepo } from '../repositories/projects.js'
import { authMiddleware, requirePerm } from '../auth.js'
import type { AuthedRequest } from '../auth.js'
import type { AuthUser } from '../types.js'

export const projectsRouter = Router()

projectsRouter.use(authMiddleware)

// 首页—项目入口：仅返回当前用户有权限的项目
projectsRouter.get('/', async (req, res) => {
  const u: AuthUser = (req as AuthedRequest).authUser!
  const all = await projectsRepo.list()
  const list = u.roleId === 'admin' || u.scope === 'all' ? all : all.filter((p) => u.projectIds.includes(p.id))
  res.json({ list })
})

projectsRouter.get('/:id', async (req, res) => {
  const p = await projectsRepo.findById(req.params.id)
  if (!p) return res.status(404).json({ message: '项目不存在' })
  res.json({ item: p })
})

projectsRouter.post('/', requirePerm('project.manage'), async (req, res) => {
  const body = req.body || {}
  if (!body.name || !body.code) return res.status(400).json({ message: '请填写名称和编号' })
  const id = `p_${Date.now().toString(36)}`
  const item = await projectsRepo.create({
    id,
    name: body.name,
    code: body.code,
    ownerId: body.ownerId,
    status: body.status || '在建',
    createdAt: new Date().toISOString().slice(0, 19),
  })
  res.json({ item })
})

projectsRouter.put('/:id', requirePerm('project.manage'), async (req, res) => {
  const patch: any = {}
  if (req.body.name !== undefined) patch.name = req.body.name
  if (req.body.code !== undefined) patch.code = req.body.code
  if (req.body.status !== undefined) patch.status = req.body.status
  if (req.body.ownerId !== undefined) patch.owner_id = req.body.ownerId
  const item = await projectsRepo.update(req.params.id, patch)
  if (!item) return res.status(404).json({ message: '项目不存在' })
  res.json({ item })
})

projectsRouter.delete('/:id', requirePerm('project.manage'), async (req, res) => {
  await projectsRepo.remove(req.params.id)
  res.json({ ok: true })
})
