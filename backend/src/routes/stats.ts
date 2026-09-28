import { Router } from 'express'
import { authMiddleware } from '../auth.js'
import { query } from '../db.js'
import type { AuthedRequest } from '../auth.js'

export const statsRouter = Router()

statsRouter.use(authMiddleware)

statsRouter.get('/dashboard', async (req, res) => {
  const au = (req as AuthedRequest).authUser!
  const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined

  // 确定用户可见的项目列表
  let projectFilter = ''
  let projectParams: any[] = []
  if (projectId) {
    projectFilter = 'AND project_id = $1'
    projectParams = [projectId]
  } else if (au.scope !== 'all' && au.projectIds?.length) {
    projectFilter = `AND project_id = ANY($1)`
    projectParams = [au.projectIds]
  }

  const totalMaterialsRes = await query(
    `SELECT COUNT(*)::int AS n FROM materials WHERE status = '正常' ${projectFilter}`,
    projectParams,
  )
  const totalMaterials = totalMaterialsRes.rows[0].n

  const totalSizeRes = await query(
    `SELECT COALESCE(SUM(size),0)::bigint AS s FROM materials WHERE status = '正常' ${projectFilter}`,
    projectParams,
  )
  const totalSize = Number(totalSizeRes.rows[0].s)

  const totalFoldersRes = await query(
    `SELECT COUNT(*)::int AS n FROM folders WHERE 1=1 ${projectFilter.replace('project_id', 'project_id')}`,
    projectParams,
  )
  const totalFolders = totalFoldersRes.rows[0].n

  const totalProjectsRes = au.scope === 'all'
    ? await query('SELECT COUNT(*)::int AS n FROM projects')
    : await query('SELECT COUNT(*)::int AS n FROM projects WHERE id = ANY($1)', [au.projectIds || []])
  const totalProjects = totalProjectsRes.rows[0].n

  const totalPointsRes = await query(
    `SELECT COUNT(*)::int AS n FROM points WHERE 1=1 ${projectFilter.replace('project_id', 'project_id')}`,
    projectParams,
  )
  const totalPoints = totalPointsRes.rows[0].n

  const totalLogsRes = await query(
    `SELECT COUNT(*)::int AS n FROM logs WHERE 1=1 ${projectFilter.replace('project_id', 'project_id')}`,
    projectParams,
  )
  const totalLogs = totalLogsRes.rows[0].n

  // 最近日志（限制8条）
  const recentLogsRes = projectId
    ? await query('SELECT * FROM logs WHERE project_id = $1 ORDER BY created_at DESC LIMIT 8', [projectId])
    : au.scope === 'all'
      ? await query('SELECT * FROM logs ORDER BY created_at DESC LIMIT 8')
      : await query('SELECT * FROM logs WHERE project_id = ANY($1) ORDER BY created_at DESC LIMIT 8', [au.projectIds || []])

  res.json({
    stats: {
      totalMaterials,
      totalSize,
      totalFolders,
      totalProjects,
      totalPoints,
      totalLogs,
    },
    recentLogs: recentLogsRes.rows.map((r) => ({
      id: r.id,
      materialId: r.material_id,
      materialName: r.material_name,
      projectId: r.project_id,
      userId: r.user_id,
      actionType: r.action_type,
      detail: r.detail,
      ip: r.ip,
      createdAt: r.created_at,
    })),
  })
})
