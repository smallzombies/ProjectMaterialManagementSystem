import { Router } from 'express'
import { approvalsRepo } from '../repositories/approvals.js'
import { authMiddleware } from '../auth.js'

export const approvalsRouter = Router()

approvalsRouter.use(authMiddleware)

approvalsRouter.get('/', async (req, res) => {
  const materialId = typeof req.query.materialId === 'string' ? req.query.materialId : undefined
  const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined
  if (materialId) {
    const list = await approvalsRepo.listByMaterial(materialId)
    return res.json({ list })
  }
  if (projectId) {
    const list = await approvalsRepo.listByProject(projectId)
    return res.json({ list })
  }
  res.json({ list: [] })
})
