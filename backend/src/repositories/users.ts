import { query } from '../db.js'

export interface UserRow {
  id: string
  name: string
  phone: string
  unit_id: string | null
  role_id: string
  project_ids: string[]
  status: string
  password: string
}

export function mapUser(r: UserRow): any {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    unitId: r.unit_id ?? undefined,
    roleId: r.role_id,
    projectIds: r.project_ids || [],
    status: (r.status as '启用' | '停用') || '启用',
  }
}

export const usersRepo = {
  async findById(id: string) {
    const res = await query<UserRow>('SELECT * FROM users WHERE id = $1', [id])
    return res.rows[0] || null
  },
  async findByLogin(login: string) {
    const res = await query<UserRow>('SELECT * FROM users WHERE id = $1 OR name = $1 OR phone = $1', [login])
    return res.rows[0] || null
  },
  async list() {
    const res = await query<UserRow>('SELECT * FROM users ORDER BY name')
    return res.rows.map(mapUser)
  },
  async listByUnit(unitId: string) {
    const res = await query<UserRow>('SELECT * FROM users WHERE unit_id = $1', [unitId])
    return res.rows.map(mapUser)
  },
  async create(data: { id: string; name: string; phone: string; unitId?: string; roleId: string; projectIds: string[]; status: string; password: string }) {
    const res = await query<UserRow>(
      `INSERT INTO users (id, name, phone, unit_id, role_id, project_ids, status, password)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [data.id, data.name, data.phone, data.unitId ?? null, data.roleId, data.projectIds, data.status, data.password],
    )
    return mapUser(res.rows[0])
  },
  async update(id: string, patch: Partial<UserRow>) {
    const fields: string[] = []
    const vals: any[] = []
    let i = 1
    for (const [k, v] of Object.entries(patch)) {
      fields.push(`${k} = $${i}`)
      vals.push(v)
      i++
    }
    if (!fields.length) return null
    const res = await query<UserRow>(`UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, [...vals, id])
    return res.rows[0] ? mapUser(res.rows[0]) : null
  },
  async remove(id: string) {
    await query('DELETE FROM users WHERE id = $1', [id])
  },
}
