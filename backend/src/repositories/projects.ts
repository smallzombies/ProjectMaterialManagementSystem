import { query } from '../db.js'

export interface ProjectRow {
  id: string
  name: string
  code: string
  owner_id: string | null
  status: string
  created_at: string
}

export function mapProject(r: ProjectRow): any {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    ownerId: r.owner_id ?? undefined,
    status: (r.status as '在建' | '归档') || '在建',
    createdAt: r.created_at,
  }
}

export const projectsRepo = {
  async list() {
    const res = await query<ProjectRow>('SELECT * FROM projects ORDER BY created_at DESC')
    return res.rows.map(mapProject)
  },
  async findById(id: string) {
    const res = await query<ProjectRow>('SELECT * FROM projects WHERE id = $1', [id])
    return res.rows[0] || null
  },
  async create(data: { id: string; name: string; code: string; ownerId?: string; status: string; createdAt: string }) {
    const res = await query<ProjectRow>(
      `INSERT INTO projects (id, name, code, owner_id, status, created_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [data.id, data.name, data.code, data.ownerId ?? null, data.status, data.createdAt],
    )
    return mapProject(res.rows[0])
  },
  async update(id: string, patch: Partial<ProjectRow>) {
    const fields: string[] = []
    const vals: any[] = []
    let i = 1
    for (const [k, v] of Object.entries(patch)) {
      fields.push(`${k} = $${i}`)
      vals.push(v)
      i++
    }
    if (!fields.length) return null
    const res = await query<ProjectRow>(`UPDATE projects SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, [...vals, id])
    return res.rows[0] ? mapProject(res.rows[0]) : null
  },
  async remove(id: string) {
    await query('DELETE FROM projects WHERE id = $1', [id])
  },
}
