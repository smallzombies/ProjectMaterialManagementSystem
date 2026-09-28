import { Router } from 'express'
import { commentsRepo } from '../repositories/comments.js'
import { authMiddleware } from '../auth.js'

export const commentsRouter = Router()

commentsRouter.use(authMiddleware)

commentsRouter.get('/', async (req, res) => {
  const materialId = typeof req.query.materialId === 'string' ? req.query.materialId : undefined
  const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined
  if (materialId) {
    const list = await commentsRepo.listByMaterial(materialId)
    return res.json({ list })
  }
  if (projectId) {
    const list = await commentsRepo.listByProject(projectId)
    return res.json({ list })
  }
  res.json({ list: [] })
})

commentsRouter.delete('/:id', async (req, res) => {
  await commentsRepo.remove(req.params.id)
  res.json({ ok: true })
})
