import { Router } from 'express'
import { unitsRepo } from '../repositories/units.js'
import { authMiddleware, requirePerm } from '../auth.js'

export const unitsRouter = Router()

unitsRouter.use(authMiddleware)

unitsRouter.get('/', async (req, res) => {
  const list = await unitsRepo.list()
  res.json({ list })
})

unitsRouter.post('/', requirePerm('member.manage'), async (req, res) => {
  const body = req.body || {}
  if (!body.name) return res.status(400).json({ message: '请填写单位名称' })
  const item = await unitsRepo.create({
    id: `unit_${Date.now().toString(36)}`,
    name: body.name,
    unitType: body.unitType || '内部',
    isEnabled: body.isEnabled ?? true,
    config: body.config,
  })
  res.json({ item })
})

unitsRouter.put('/:id', requirePerm('member.manage'), async (req, res) => {
  const patch: any = {}
  for (const k of ['name', 'unitType', 'isEnabled', 'config'] as const) {
    if (req.body[k] !== undefined) patch[k] = req.body[k]
  }
  const item = await unitsRepo.update(req.params.id, patch)
  if (!item) return res.status(404).json({ message: '单位不存在' })
  res.json({ item })
})

unitsRouter.delete('/:id', requirePerm('member.manage'), async (req, res) => {
  await unitsRepo.remove(req.params.id)
  res.json({ ok: true })
})
