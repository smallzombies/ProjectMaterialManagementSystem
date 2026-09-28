import { query } from '../db.js'

export interface RoleRow {
  id: string
  name: string
  is_builtin: boolean
  perms: string[]
  scope: string
}

export function mapRole(r: RoleRow): any {
  return {
    id: r.id,
    name: r.name,
    isBuiltin: r.is_builtin,
    perms: r.perms || [],
    scope: (r.scope as 'all' | 'project') || 'project',
  }
}

export const rolesRepo = {
  async list() {
    const res = await query<RoleRow>('SELECT * FROM roles ORDER BY name')
    return res.rows.map(mapRole)
  },
  async findById(id: string) {
    const res = await query<RoleRow>('SELECT * FROM roles WHERE id = $1', [id])
    return res.rows[0] || null
  },
  async create(data: { id: string; name: string; isBuiltin: boolean; perms: string[]; scope: string }) {
    const res = await query<RoleRow>(
      `INSERT INTO roles (id, name, is_builtin, perms, scope) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [data.id, data.name, data.isBuiltin, data.perms, data.scope],
    )
    return mapRole(res.rows[0])
  },
  async update(id: string, patch: Partial<RoleRow>) {
    const fields: string[] = []
    const vals: any[] = []
    let i = 1
    for (const [k, v] of Object.entries(patch)) {
      fields.push(`${k} = $${i}`)
      vals.push(v)
      i++
    }
    if (!fields.length) return null
    const res = await query<RoleRow>(`UPDATE roles SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, [...vals, id])
    return res.rows[0] ? mapRole(res.rows[0]) : null
  },
  async remove(id: string) {
    await query('DELETE FROM roles WHERE id = $1', [id])
  },
}
