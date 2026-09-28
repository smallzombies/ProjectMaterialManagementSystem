import { Router } from 'express'
import { logsRepo } from '../repositories/logs.js'
import { authMiddleware } from '../auth.js'

export const logsRouter = Router()

logsRouter.use(authMiddleware)

logsRouter.get('/', async (req, res) => {
  const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined
  const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 100
  const list = await logsRepo.list(projectId, limit)
  res.json({ list })
})

logsRouter.post('/', async (req, res) => {
  const body = req.body || {}
  if (!body.actionType || !body.userId) return res.status(400).json({ message: '缺少必填字段' })
  const log = await logsRepo.create({
    id: `l_${Date.now().toString(36)}`,
    materialId: body.materialId,
    materialName: body.materialName,
    projectId: body.projectId,
    userId: body.userId,
    actionType: body.actionType,
    detail: body.detail || '',
    ip: body.ip || '',
    createdAt: new Date().toISOString().slice(0, 19),
  })
  res.json({ item: log })
})
