import { query } from '../db.js'

export interface ApprovalRow {
  id: string
  material_id: string
  user_id: string
  result: string
  tag_change: string
  changed_names: string[]
  created_at: string
}

function mapApproval(r: ApprovalRow): any {
  return {
    id: r.id,
    materialId: r.material_id,
    userId: r.user_id,
    result: r.result,
    tagChange: r.tag_change,
    changedNames: r.changed_names || [],
    createdAt: r.created_at,
  }
}

export const approvalsRepo = {
  async listByMaterial(materialId: string) {
    const res = await query<ApprovalRow>(
      'SELECT * FROM approvals WHERE material_id = $1 ORDER BY created_at DESC',
      [materialId],
    )
    return res.rows.map(mapApproval)
  },

  async listByProject(projectId: string) {
    const res = await query<ApprovalRow>(
      `SELECT a.* FROM approvals a
       JOIN materials m ON a.material_id = m.id
       WHERE m.project_id = $1
       ORDER BY a.created_at DESC`,
      [projectId],
    )
    return res.rows.map(mapApproval)
  },

  async create(data: { id: string; materialId: string; userId: string; result: string; tagChange?: string; changedNames?: string[]; createdAt: string }) {
    const res = await query<ApprovalRow>(
      'INSERT INTO approvals (id, material_id, user_id, result, tag_change, changed_names, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [data.id, data.materialId, data.userId, data.result, data.tagChange || '无变化', data.changedNames || [], data.createdAt],
    )
    return mapApproval(res.rows[0])
  },

  async remove(id: string) {
    await query('DELETE FROM approvals WHERE id = $1', [id])
  },
}
