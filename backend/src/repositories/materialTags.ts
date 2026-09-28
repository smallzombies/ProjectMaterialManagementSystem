import { query } from '../db.js'

export interface MaterialTagRow {
  material_id: string
  tag_id: string
  user_id: string
  time: string
}

export const materialTagsRepo = {
  async listByMaterial(materialId: string) {
    const res = await query<MaterialTagRow>(
      'SELECT * FROM material_tags WHERE material_id = $1',
      [materialId],
    )
    return res.rows.map((r) => ({ materialId: r.material_id, tagId: r.tag_id, userId: r.user_id, time: r.time }))
  },

  async listByProject(projectId: string) {
    const res = await query<MaterialTagRow>(
      `SELECT mt.* FROM material_tags mt
       JOIN materials m ON mt.material_id = m.id
       WHERE m.project_id = $1`,
      [projectId],
    )
    return res.rows.map((r) => ({ materialId: r.material_id, tagId: r.tag_id, userId: r.user_id, time: r.time }))
  },

  async add(data: { materialId: string; tagId: string; userId: string; time: string }) {
    await query(
      'INSERT INTO material_tags (material_id, tag_id, user_id, time) VALUES ($1,$2,$3,$4) ON CONFLICT (material_id, tag_id) DO NOTHING',
      [data.materialId, data.tagId, data.userId, data.time],
    )
  },

  async addBatch(items: { materialId: string; tagId: string; userId: string; time: string }[]) {
    for (const item of items) {
      await this.add(item)
    }
  },

  async removeByMaterial(materialId: string) {
    await query('DELETE FROM material_tags WHERE material_id = $1', [materialId])
  },

  async removeByMaterialAndTag(materialId: string, tagId: string) {
    await query('DELETE FROM material_tags WHERE material_id = $1 AND tag_id = $2', [materialId, tagId])
  },

  async clearByProject(projectId: string) {
    await query(
      'DELETE FROM material_tags WHERE material_id IN (SELECT id FROM materials WHERE project_id = $1)',
      [projectId],
    )
  },
}
