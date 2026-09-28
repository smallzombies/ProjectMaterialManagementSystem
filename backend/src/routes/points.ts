import { Router } from 'express'
import { pointsRepo } from '../repositories/points.js'
import { authMiddleware, requirePerm } from '../auth.js'

export const pointsRouter = Router()

pointsRouter.use(authMiddleware)

pointsRouter.get('/', async (req, res) => {
  const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined
  const list = await pointsRepo.list(projectId)
  res.json({ list })
})

pointsRouter.get('/:id', async (req, res) => {
  const item = await pointsRepo.findById(req.params.id)
  if (!item) return res.status(404).json({ message: '船舱不存在' })
  res.json({ item })
})

pointsRouter.post('/', requirePerm('project.manage'), async (req, res) => {
  const body = req.body || {}
  if (!body.projectId || !body.name || !body.code) return res.status(400).json({ message: '请填写项目、名称与编号' })
  const item = await pointsRepo.create({
    id: `pt_${Date.now().toString(36)}`,
    projectId: body.projectId,
    name: body.name,
    code: body.code,
    lat: body.lat,
    lng: body.lng,
    status: body.status || '启用',
    remark: body.remark,
  })
  res.json({ item })
})

pointsRouter.put('/:id', requirePerm('project.manage'), async (req, res) => {
  const patch: any = {}
  if (req.body.projectId !== undefined) patch.project_id = req.body.projectId
  if (req.body.name !== undefined) patch.name = req.body.name
  if (req.body.code !== undefined) patch.code = req.body.code
  if (req.body.lat !== undefined) patch.lat = req.body.lat
  if (req.body.lng !== undefined) patch.lng = req.body.lng
  if (req.body.status !== undefined) patch.status = req.body.status
  if (req.body.remark !== undefined) patch.remark = req.body.remark
  const item = await pointsRepo.update(req.params.id, patch)
  if (!item) return res.status(404).json({ message: '船舱不存在' })
  res.json({ item })
})

pointsRouter.delete('/:id', requirePerm('project.manage'), async (req, res) => {
  await pointsRepo.remove(req.params.id)
  res.json({ ok: true })
})
