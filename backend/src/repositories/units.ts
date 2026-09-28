import { query } from '../db.js'
import { defaultUnitConfig } from '../auth.js'

export interface UnitRow {
  id: string
  name: string
  unit_type: string
  is_enabled: boolean
  config: any
}

export function mapUnit(r: UnitRow): any {
  return {
    id: r.id,
    name: r.name,
    unitType: (r.unit_type as '内部' | '外包' | '监理') || '内部',
    isEnabled: r.is_enabled,
    config: r.config || defaultUnitConfig(),
  }
}

export const unitsRepo = {
  async list() {
    const res = await query<UnitRow>('SELECT * FROM units ORDER BY name')
    return res.rows.map(mapUnit)
  },
  async findById(id: string) {
    const res = await query<UnitRow>('SELECT * FROM units WHERE id = $1', [id])
    return res.rows[0] || null
  },
  async create(data: { id: string; name: string; unitType: string; isEnabled: boolean; config?: any }) {
    const res = await query<UnitRow>(
      `INSERT INTO units (id, name, unit_type, is_enabled, config) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [data.id, data.name, data.unitType, data.isEnabled, data.config ?? defaultUnitConfig()],
    )
    return mapUnit(res.rows[0])
  },
  async update(id: string, patch: Partial<UnitRow>) {
    const fields: string[] = []
    const vals: any[] = []
    let i = 1
    for (const [k, v] of Object.entries(patch)) {
      fields.push(`${k} = $${i}`)
      vals.push(v)
      i++
    }
    if (!fields.length) return null
    const res = await query<UnitRow>(`UPDATE units SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, [...vals, id])
    return res.rows[0] ? mapUnit(res.rows[0]) : null
  },
  async remove(id: string) {
    await query('DELETE FROM units WHERE id = $1', [id])
  },
}
