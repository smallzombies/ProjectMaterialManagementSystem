import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { authMiddleware, requirePerm } from '../auth.js'
import { query } from '../db.js'

export const adminRouter = Router()

adminRouter.use(authMiddleware)
adminRouter.use(requirePerm('project.manage'))

adminRouter.post('/reset', async (_req, res) => {
  try {
    const tables = [
      'logs', 'approvals', 'comments', 'material_tags',
      'materials', 'folders', 'trash',
      'points', 'projects', 'tags', 'users', 'units', 'roles',
    ]
    for (const t of tables) {
      await query(`DELETE FROM ${t}`)
    }

    const pwd = await bcrypt.hash('123456', 10)

    await query(`INSERT INTO roles (id, name, is_builtin, perms, scope) VALUES
      ($1,$2,$3,$4,$5),($6,$7,$8,$9,$10),($11,$12,$13,$14,$15),($16,$17,$18,$19,$20),($21,$22,$23,$24,$25)`,
      [
        'admin', '管理员', true, ['project.view','project.manage','folder.manage','material.upload','material.edit','material.delete','material.download','material.tag','material.exif','material.move','material.rename','material.preview','share.send','share.view','member.manage','log.view'], 'all',
        'leader', '项目负责人', true, ['project.view','folder.manage','material.upload','material.edit','material.delete','material.download','material.tag','material.exif','material.move','material.rename','material.preview','share.send','share.view','member.manage','log.view'], 'project',
        'clerk', '资料员', true, ['project.view','folder.manage','material.upload','material.edit','material.delete','material.download','material.tag','material.exif','material.move','material.rename','material.preview'], 'project',
        'field', '外业采集', true, ['project.view','material.upload','material.download','material.tag','material.exif','material.preview'], 'project',
        'guest', '协作方/业主', true, ['project.view','material.preview','material.download','share.view'], 'project',
      ])

    await query(
      `INSERT INTO units (id, name, unit_type, is_enabled, config) VALUES ($1,$2,$3,$4,$5)`,
      ['u1', '本公司', '内部', true, JSON.stringify({ showDetailMeta: true, showApproval: true, showFailed: true })],
    )

    await query(
      `INSERT INTO users (id, name, phone, unit_id, role_id, project_ids, status, password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      ['u_admin', '系统管理员', '13800000001', 'u1', 'admin', '{}', '启用', pwd],
    )

    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})
