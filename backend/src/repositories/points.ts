import { query } from '../db.js'

export interface PointRow {
  id: string
  project_id: string
  name: string
  code: string
  lat: number | null
  lng: number | null
  status: string
  remark: string | null
}

export function mapPoint(r: PointRow): any {
  return {
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    code: r.code,
    lat: r.lat ?? undefined,
    lng: r.lng ?? undefined,
    status: (r.status as '启用' | '停用') || '启用',
    remark: r.remark ?? undefined,
  }
}

export const pointsRepo = {
  async list(projectId?: string) {
    const res = projectId
      ? await query<PointRow>('SELECT * FROM points WHERE project_id = $1 ORDER BY name', [projectId])
      : await query<PointRow>('SELECT * FROM points ORDER BY project_id, name')
    return res.rows.map(mapPoint)
  },
  async findById(id: string) {
    const res = await query<PointRow>('SELECT * FROM points WHERE id = $1', [id])
    return res.rows[0] || null
  },
  async create(data: { id: string; projectId: string; name: string; code: string; lat?: number; lng?: number; status: string; remark?: string }) {
    const res = await query<PointRow>(
      `INSERT INTO points (id, project_id, name, code, lat, lng, status, remark) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [data.id, data.projectId, data.name, data.code, data.lat ?? null, data.lng ?? null, data.status, data.remark ?? null],
    )
    return mapPoint(res.rows[0])
  },
  async update(id: string, patch: Partial<PointRow>) {
    const fields: string[] = []
    const vals: any[] = []
    let i = 1
    for (const [k, v] of Object.entries(patch)) {
      fields.push(`${k} = $${i}`)
      vals.push(v)
      i++
    }
    if (!fields.length) return null
    const res = await query<PointRow>(`UPDATE points SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, [...vals, id])
    return res.rows[0] ? mapPoint(res.rows[0]) : null
  },
  async remove(id: string) {
    await query('DELETE FROM points WHERE id = $1', [id])
  },
}
