import { query } from '../db.js'

export interface MaterialRow {
  id: string
  project_id: string
  folder_id: string | null
  name: string
  type: string
  size: number
  uploader_id: string | null
  upload_time: string
  point_id: string | null
  shooting_time: string | null
  remark: string | null
  tags: string[]
  has_exif: boolean
  exif: any
  versions: any
  comment_count: number
  status: string
  approval: string | null
  deleted_at: string | null
  deleted_by: string | null
}

function parseJson(d: any) {
  if (typeof d === 'string') { try { return JSON.parse(d) } catch { return d } }
  return d
}

function mapMaterial(r: MaterialRow): any {
  return {
    id: r.id,
    projectId: r.project_id,
    folderId: r.folder_id ?? null,
    name: r.name,
    type: r.type,
    size: r.size,
    uploaderId: r.uploader_id ?? '',
    uploadTime: r.upload_time,
    pointId: r.point_id ?? undefined,
    shootingTime: r.shooting_time ?? undefined,
    remark: r.remark ?? undefined,
    tags: r.tags || [],
    hasExif: r.has_exif ?? false,
    exif: parseJson(r.exif) || undefined,
    versions: parseJson(r.versions) || [],
    commentCount: r.comment_count ?? 0,
    status: (r.status as '正常' | '回收站') || '正常',
    approval: (r.approval as '合格' | '不合格') || undefined,
    deletedAt: r.deleted_at ?? undefined,
    deletedBy: r.deleted_by ?? undefined,
  }
}

export const materialsRepo = {
  async listByProject(projectId: string, status?: string) {
    let sql = 'SELECT * FROM materials WHERE project_id = $1'
    const params: any[] = [projectId]
    if (status) { sql += ' AND status = $2'; params.push(status) }
    sql += ' ORDER BY upload_time DESC'
    const res = await query<MaterialRow>(sql, params)
    return res.rows.map(mapMaterial)
  },

  async findById(id: string) {
    const res = await query<MaterialRow>('SELECT * FROM materials WHERE id = $1', [id])
    return res.rows[0] ? mapMaterial(res.rows[0]) : null
  },

  async listByFolder(folderId: string | null, projectId: string) {
    if (folderId) {
      const res = await query<MaterialRow>(
        'SELECT * FROM materials WHERE folder_id = $1 AND project_id = $2 AND status = $3 ORDER BY upload_time DESC',
        [folderId, projectId, '正常'],
      )
      return res.rows.map(mapMaterial)
    }
    const res = await query<MaterialRow>(
      'SELECT * FROM materials WHERE project_id = $1 AND status = $2 ORDER BY upload_time DESC',
      [projectId, '正常'],
    )
    return res.rows.map(mapMaterial)
  },

  async create(m: any) {
    const res = await query<MaterialRow>(
      `INSERT INTO materials (id, project_id, folder_id, name, type, size, uploader_id, upload_time, point_id, shooting_time, remark, tags, has_exif, exif, versions, comment_count, status, approval)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15::jsonb,$16,$17,$18) RETURNING *`,
      [
        m.id, m.projectId, m.folderId ?? null, m.name, m.type, m.size,
        m.uploaderId ?? null, m.uploadTime, m.pointId ?? null, m.shootingTime ?? null,
        m.remark ?? '', m.tags || [], m.hasExif ?? false,
        m.exif ? JSON.stringify(m.exif) : null,
        JSON.stringify(m.versions || []), m.commentCount ?? 0,
        m.status || '正常', m.approval ?? null,
      ],
    )
    return mapMaterial(res.rows[0])
  },

  async update(id: string, patch: any) {
    const fields: string[] = []
    const vals: any[] = []
    let i = 1
    const colMap: Record<string, string> = {
      projectId: 'project_id', folderId: 'folder_id', name: 'name', type: 'type',
      size: 'size', uploaderId: 'uploader_id', uploadTime: 'upload_time',
      pointId: 'point_id', shootingTime: 'shooting_time', remark: 'remark',
      tags: 'tags', hasExif: 'has_exif', commentCount: 'comment_count',
      status: 'status', approval: 'approval', deletedAt: 'deleted_at', deletedBy: 'deleted_by',
    }
    for (const [k, v] of Object.entries(patch)) {
      const col = colMap[k] || k
      if (col === 'exif' || col === 'versions') {
        fields.push(`${col} = $${i}::jsonb`)
        vals.push(v ? JSON.stringify(v) : null)
      } else if (col === 'tags') {
        fields.push(`${col} = $${i}`)
        vals.push(v)
      } else {
        fields.push(`${col} = $${i}`)
        vals.push(v)
      }
      i++
    }
    if (!fields.length) return null
    const res = await query<MaterialRow>(`UPDATE materials SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, [...vals, id])
    return res.rows[0] ? mapMaterial(res.rows[0]) : null
  },

  async remove(id: string) {
    await query('DELETE FROM materials WHERE id = $1', [id])
  },

  async removeByProject(projectId: string) {
    await query('DELETE FROM materials WHERE project_id = $1', [projectId])
  },

  async countByProject(projectId: string) {
    const res = await query('SELECT COUNT(*)::int AS n FROM materials WHERE project_id = $1 AND status = $2', [projectId, '正常'])
    return res.rows[0].n
  },

  async totalSizeByProject(projectId: string) {
    const res = await query('SELECT COALESCE(SUM(size),0)::bigint AS s FROM materials WHERE project_id = $1 AND status = $2', [projectId, '正常'])
    return Number(res.rows[0].s)
  },
}
