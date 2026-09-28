import { query } from '../db.js'

export interface FolderRow {
  id: string
  project_id: string
  parent_id: string | null
  name: string
  remark: string | null
}

function mapFolder(r: FolderRow): any {
  return {
    id: r.id,
    projectId: r.project_id,
    parentId: r.parent_id ?? null,
    name: r.name,
    remark: r.remark ?? '',
  }
}

export const foldersRepo = {
  async listByProject(projectId: string) {
    const res = await query<FolderRow>(
      'SELECT * FROM folders WHERE project_id = $1 ORDER BY name',
      [projectId],
    )
    return res.rows.map(mapFolder)
  },

  async findById(id: string) {
    const res = await query<FolderRow>('SELECT * FROM folders WHERE id = $1', [id])
    return res.rows[0] ? mapFolder(res.rows[0]) : null
  },

  async create(data: { id: string; projectId: string; parentId: string | null; name: string; remark?: string }) {
    const res = await query<FolderRow>(
      'INSERT INTO folders (id, project_id, parent_id, name, remark) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [data.id, data.projectId, data.parentId ?? null, data.name, data.remark ?? ''],
    )
    return mapFolder(res.rows[0])
  },

  async update(id: string, patch: any) {
    const fields: string[] = []
    const vals: any[] = []
    let i = 1
    const colMap: Record<string, string> = { name: 'name', remark: 'remark', parentId: 'parent_id' }
    for (const [k, v] of Object.entries(patch)) {
      const col = colMap[k] || k
      fields.push(`${col} = $${i}`)
      vals.push(v)
      i++
    }
    if (!fields.length) return null
    const res = await query<FolderRow>(`UPDATE folders SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, [...vals, id])
    return res.rows[0] ? mapFolder(res.rows[0]) : null
  },

  async remove(id: string) {
    await query('DELETE FROM folders WHERE id = $1', [id])
  },

  async removeByProject(projectId: string) {
    await query('DELETE FROM folders WHERE project_id = $1', [projectId])
  },

  async countByProject(projectId: string) {
    const res = await query('SELECT COUNT(*)::int AS n FROM folders WHERE project_id = $1', [projectId])
    return res.rows[0].n
  },
}
