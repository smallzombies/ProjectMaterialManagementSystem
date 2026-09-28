import { query } from '../db.js'

export interface TagRow {
  id: string
  parent_id: string | null
  name: string
}

export function mapTag(r: TagRow): any {
  return {
    id: r.id,
    parentId: r.parent_id ?? null,
    name: r.name,
  }
}

export const tagsRepo = {
  async list() {
    const res = await query<TagRow>('SELECT * FROM tags ORDER BY name')
    return res.rows.map(mapTag)
  },
  async create(data: { id: string; parentId: string | null; name: string }) {
    const res = await query<TagRow>(
      `INSERT INTO tags (id, parent_id, name) VALUES ($1,$2,$3) RETURNING *`,
      [data.id, data.parentId ?? null, data.name],
    )
    return mapTag(res.rows[0])
  },
  async update(id: string, patch: Partial<TagRow>) {
    const fields: string[] = []
    const vals: any[] = []
    let i = 1
    for (const [k, v] of Object.entries(patch)) {
      fields.push(`${k} = $${i}`)
      vals.push(v)
      i++
    }
    if (!fields.length) return null
    const res = await query<TagRow>(`UPDATE tags SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, [...vals, id])
    return res.rows[0] ? mapTag(res.rows[0]) : null
  },
  // 删除标签及其所有子孙，返回被删除的 id 集合
  async removeRecursive(id: string): Promise<string[]> {
    const all = await query<TagRow>('SELECT * FROM tags')
    const childrenOf = (pid: string): string[] => {
      const direct = all.rows.filter((t) => t.parent_id === pid)
      return direct.flatMap((d) => [d.id, ...childrenOf(d.id)])
    }
    const ids = [id, ...childrenOf(id)]
    await query(`DELETE FROM tags WHERE id = ANY($1)`, [ids])
    return ids
  },
}
