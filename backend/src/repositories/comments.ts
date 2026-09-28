import { query } from '../db.js'

export interface CommentRow {
  id: string
  material_id: string
  author_id: string
  content: string
  parent_id: string | null
  created_at: string
  mentions: string[]
}

function mapComment(r: CommentRow): any {
  return {
    id: r.id,
    materialId: r.material_id,
    authorId: r.author_id,
    content: r.content,
    parentId: r.parent_id ?? undefined,
    createdAt: r.created_at,
    mentions: r.mentions || [],
  }
}

export const commentsRepo = {
  async listByMaterial(materialId: string) {
    const res = await query<CommentRow>(
      'SELECT * FROM comments WHERE material_id = $1 ORDER BY created_at',
      [materialId],
    )
    return res.rows.map(mapComment)
  },

  async create(data: { id: string; materialId: string; authorId: string; content: string; parentId?: string; createdAt: string; mentions?: string[] }) {
    const res = await query<CommentRow>(
      'INSERT INTO comments (id, material_id, author_id, content, parent_id, created_at, mentions) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [data.id, data.materialId, data.authorId, data.content, data.parentId ?? null, data.createdAt, data.mentions || []],
    )
    return mapComment(res.rows[0])
  },

  async remove(id: string) {
    await query('DELETE FROM comments WHERE id = $1', [id])
  },

  async countByMaterial(materialId: string) {
    const res = await query('SELECT COUNT(*)::int AS n FROM comments WHERE material_id = $1', [materialId])
    return res.rows[0].n
  },

  async listByProject(projectId: string) {
    const res = await query<CommentRow>(
      `SELECT c.* FROM comments c
       JOIN materials m ON c.material_id = m.id
       WHERE m.project_id = $1
       ORDER BY c.created_at DESC`,
      [projectId],
    )
    return res.rows.map(mapComment)
  },
}
