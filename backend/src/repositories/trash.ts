import { query } from '../db.js'

export interface TrashRow {
  id: string
  project_id: string
  folder_id: string | null
  name: string
  type: string | null
  size: number
  data: any
  deleted_by: string | null
  deleted_at: string
}

function parseData(d: any) {
  if (typeof d === 'string') {
    try {
      return JSON.parse(d)
    } catch {
      return d
    }
  }
  return d
}

function mapTrash(r: TrashRow) {
  return {
    id: r.id,
    projectId: r.project_id,
    folderId: r.folder_id ?? null,
    name: r.name,
    type: r.type,
    size: r.size,
    data: parseData(r.data),
    deletedBy: r.deleted_by ?? null,
    deletedAt: r.deleted_at,
  }
}

export const trashRepo = {
  // scopeProjectIds 为空表示管理员可见全部
  async list(scopeProjectIds: string[] | null) {
    let sql = 'SELECT * FROM trash'
    const params: any[] = []
    if (scopeProjectIds && scopeProjectIds.length) {
      sql += ' WHERE project_id = ANY($1)'
      params.push(scopeProjectIds)
    }
    sql += ' ORDER BY deleted_at DESC'
    const res = await query<TrashRow>(sql, params)
    return res.rows.map(mapTrash)
  },

  async create(data: {
    id: string
    projectId: string
    folderId?: string | null
    name: string
    type?: string | null
    size?: number
    material: any
    deletedBy?: string | null
  }) {
    await query(
      "UPDATE materials SET status = '回收站' WHERE id = $1",
      [data.id],
    )
    const res = await query<TrashRow>(
      `INSERT INTO trash (id, project_id, folder_id, name, type, size, data, deleted_by, deleted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9)
       ON CONFLICT (id) DO UPDATE SET project_id=$2, folder_id=$3, name=$4, type=$5, size=$6, data=$7::jsonb, deleted_by=$8, deleted_at=$9
       RETURNING *`,
      [
        data.id,
        data.projectId,
        data.folderId ?? null,
        data.name,
        data.type ?? null,
        Math.round(Number(data.size) || 0),
        JSON.stringify(data.material),
        data.deletedBy ?? null,
        new Date().toISOString().slice(0, 19),
      ],
    )
    return mapTrash(res.rows[0])
  },

  async findById(id: string) {
    const res = await query<TrashRow>('SELECT * FROM trash WHERE id = $1', [id])
    return res.rows[0] ? mapTrash(res.rows[0]) : null
  },

  async remove(id: string) {
    await query(
      "UPDATE materials SET status = '正常' WHERE id = $1",
      [id],
    )
    await query('DELETE FROM trash WHERE id = $1', [id])
  },

  async removeMany(ids: string[]) {
    if (!ids.length) return
    await query('DELETE FROM trash WHERE id = ANY($1)', [ids])
  },
}
