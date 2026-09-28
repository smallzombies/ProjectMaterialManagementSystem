import { Router } from 'express'
import { foldersRepo } from '../repositories/folders.js'
import { authMiddleware, requirePerm } from '../auth.js'

export const foldersRouter = Router()

foldersRouter.use(authMiddleware)

foldersRouter.get('/', async (req, res) => {
  const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined
  if (!projectId) return res.status(400).json({ message: '缺少 projectId' })
  const list = await foldersRepo.listByProject(projectId)
  res.json({ list })
})

foldersRouter.get('/:id', async (req, res) => {
  const item = await foldersRepo.findById(req.params.id)
  if (!item) return res.status(404).json({ message: '文件夹不存在' })
  res.json({ item })
})

foldersRouter.post('/', requirePerm('folder.manage'), async (req, res) => {
  const body = req.body || {}
  if (!body.projectId || !body.name) return res.status(400).json({ message: '请填写项目与名称' })
  const item = await foldersRepo.create({
    id: `f_${Date.now().toString(36)}`,
    projectId: body.projectId,
    parentId: body.parentId ?? null,
    name: body.name,
    remark: body.remark,
  })
  res.json({ item })
})

foldersRouter.put('/:id', requirePerm('folder.manage'), async (req, res) => {
  const patch: any = {}
  if (req.body.name !== undefined) patch.name = req.body.name
  if (req.body.remark !== undefined) patch.remark = req.body.remark
  if (req.body.parentId !== undefined) patch.parentId = req.body.parentId
  const item = await foldersRepo.update(req.params.id, patch)
  if (!item) return res.status(404).json({ message: '文件夹不存在' })
  res.json({ item })
})

foldersRouter.delete('/:id', requirePerm('folder.manage'), async (req, res) => {
  await foldersRepo.remove(req.params.id)
  res.json({ ok: true })
})
