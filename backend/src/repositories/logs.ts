import { query } from '../db.js'

export interface LogRow {
  id: string
  material_id: string | null
  material_name: string | null
  project_id: string | null
  user_id: string
  action_type: string
  detail: string
  ip: string
  created_at: string
}

function mapLog(r: LogRow): any {
  return {
    id: r.id,
    materialId: r.material_id ?? undefined,
    materialName: r.material_name ?? undefined,
    projectId: r.project_id ?? undefined,
    userId: r.user_id,
    actionType: r.action_type,
    detail: r.detail,
    ip: r.ip,
    createdAt: r.created_at,
  }
}

export const logsRepo = {
  async list(projectId?: string, limit = 100) {
    if (projectId) {
      const res = await query<LogRow>(
        'SELECT * FROM logs WHERE project_id = $1 ORDER BY created_at DESC LIMIT $2',
        [projectId, limit],
      )
      return res.rows.map(mapLog)
    }
    const res = await query<LogRow>('SELECT * FROM logs ORDER BY created_at DESC LIMIT $1', [limit])
    return res.rows.map(mapLog)
  },

  async create(data: {
    id: string
    materialId?: string
    materialName?: string
    projectId?: string
    userId: string
    actionType: string
    detail: string
    ip?: string
    createdAt: string
  }) {
    const res = await query<LogRow>(
      'INSERT INTO logs (id, material_id, material_name, project_id, user_id, action_type, detail, ip, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [
        data.id, data.materialId ?? null, data.materialName ?? null,
        data.projectId ?? null, data.userId, data.actionType,
        data.detail, data.ip ?? '', data.createdAt,
      ],
    )
    return mapLog(res.rows[0])
  },

  async count(): Promise<number> {
    const res = await query('SELECT COUNT(*)::int AS n FROM logs')
    return res.rows[0].n
  },
}
