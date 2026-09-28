import bcrypt from 'bcryptjs'
import { initDatabase, query } from './db.js'

async function count(table: string): Promise<number> {
  const res = await query(`SELECT COUNT(*)::int AS n FROM ${table}`)
  return res.rows[0].n
}

export async function seed() {
  await initDatabase()

  if ((await count('roles')) === 0) {
    await query(`INSERT INTO roles (id, name, is_builtin, perms, scope) VALUES
      ($1,$2,$3,$4,$5),($6,$7,$8,$9,$10),($11,$12,$13,$14,$15),($16,$17,$18,$19,$20),($21,$22,$23,$24,$25)`,
      [
        'admin', '管理员', true, ['project.view','project.manage','folder.manage','material.upload','material.edit','material.delete','material.download','material.tag','material.exif','material.move','material.rename','material.preview','share.send','share.view','member.manage','log.view'], 'all',
        'leader', '项目负责人', true, ['project.view','folder.manage','material.upload','material.edit','material.delete','material.download','material.tag','material.exif','material.move','material.rename','material.preview','share.send','share.view','member.manage','log.view'], 'project',
        'clerk', '资料员', true, ['project.view','folder.manage','material.upload','material.edit','material.delete','material.download','material.tag','material.exif','material.move','material.rename','material.preview'], 'project',
        'field', '外业采集', true, ['project.view','material.upload','material.download','material.tag','material.exif','material.preview'], 'project',
        'guest', '协作方/业主', true, ['project.view','material.preview','material.download','share.view'], 'project',
      ])
  }

  if ((await count('units')) === 0) {
    await query(`INSERT INTO units (id, name, unit_type, is_enabled, config) VALUES
      ($1,$2,$3,$4,$5),($6,$7,$8,$9,$10),($11,$12,$13,$14,$15)`,
      [
        'u1', '本公司', '内部', true, JSON.stringify({ showDetailMeta: true, showApproval: true, showFailed: true }),
        'u2', '某勘察院', '外包', true, JSON.stringify({ showDetailMeta: true, showApproval: false, showFailed: false }),
        'u3', '监理单位', '监理', true, JSON.stringify({ showDetailMeta: true, showApproval: true, showFailed: true }),
      ])
  }

  if ((await count('users')) === 0) {
    const pwd = await bcrypt.hash('123456', 10)
    await query(`INSERT INTO users (id, name, phone, unit_id, role_id, project_ids, status, password) VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        'u_admin', '系统管理员', '13800000001', 'u1', 'admin', '{}', '启用', pwd,
      ])
  }

  if ((await count('projects')) === 0) {
    await query(`INSERT INTO projects (id, name, code, owner_id, status, created_at) VALUES
      ($1,$2,$3,$4,$5,$6),($7,$8,$9,$10,$11,$12),($13,$14,$15,$16,$17,$18)`,
      [
        'p1', '滨江大道改造工程', 'BJ-2024-01', 'u_wang', '在建', new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 19),
        'p2', '地铁三号线站点项目', 'DT-2024-05', 'u_admin', '在建', new Date(Date.now() - 80 * 86400000).toISOString().slice(0, 19),
        'p3', '东湖生态修复工程', 'DH-2023-12', 'u_admin', '归档', new Date(Date.now() - 320 * 86400000).toISOString().slice(0, 19),
      ])
  }

  if ((await count('points')) === 0) {
    await query(`INSERT INTO points (id, project_id, name, code, lat, lng, status, remark) VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8),($9,$10,$11,$12,$13,$14,$15,$16),($17,$18,$19,$20,$21,$22,$23,$24),($25,$26,$27,$28,$29,$30,$31,$32)`,
      [
        'pt1', 'p1', 'K0+120 桩位', 'P-001', 30.5101, 114.3012, '启用', '起点段',
        'pt2', 'p1', 'K0+500 桥墩', 'P-002', 30.5152, 114.3123, '启用', '',
        'pt3', 'p1', 'K1+020 挡墙', 'P-003', 30.5210, 114.3205, '启用', '',
        'pt4', 'p2', '站点A出入口', 'S-A1', 30.5601, 114.3912, '启用', '',
      ])
  }

  if ((await count('tags')) === 0) {
    await query(`INSERT INTO tags (id, parent_id, name) VALUES
      ($1, NULLIF($2::text,''), $3),
      ($4, NULLIF($5::text,''), $6),
      ($7, NULLIF($8::text,''), $9),
      ($10, NULLIF($11::text,''), $12),
      ($13, NULLIF($14::text,''), $15),
      ($16, NULLIF($17::text,''), $18),
      ($19, NULLIF($20::text,''), $21),
      ($22, NULLIF($23::text,''), $24),
      ($25, NULLIF($26::text,''), $27),
      ($28, NULLIF($29::text,''), $30)`,
      [
        't1', null, '阶段', 't2', 't1', '施工阶段', 't3', 't1', '勘察阶段',
        't4', null, '部位', 't5', 't4', '桩基', 't6', 't4', '路基', 't7', 't4', '挡墙',
        't8', null, '通用', 't9', 't8', '图纸', 't10', 't8', '现场照片',
      ])
  }

  const d = (offsetDays: number) => new Date(Date.now() - offsetDays * 86400000).toISOString().slice(0, 19)
  const mockExif = (seed: number) => JSON.stringify({
    cameraBrand: 'SONY', cameraModel: 'ILCE-7M4', aperture: 'f/2.8',
    shutter: '1/250s', isoSpeed: 'ISO 400', focalLength: '24mm',
    whiteBalance: '自动', colorSpace: 'sRGB',
    gpsLat: `30.51${seed}1° N`, gpsLng: `114.30${seed}2° E`, gpsAltitude: `${32 + seed} m`,
  })

  if ((await count('folders')) === 0) {
    await query(`INSERT INTO folders (id, project_id, parent_id, name, remark) VALUES
      ($1,$2,$3,$4,$5),($6,$7,$8,$9,$10),($11,$12,$13,$14,$15),($16,$17,$18,$19,$20),($21,$22,$23,$24,$25),($26,$27,$28,$29,$30),($31,$32,$33,$34,$35)`,
      [
        'f1', 'p1', null, '勘察照片', '现场勘察照片归档',
        'f2', 'p1', 'f1', '桩基施工', '桩基阶段施工记录',
        'f3', 'p1', 'f1', '路基施工', '',
        'f4', 'p1', null, '设计图纸', '施工图及CAD',
        'f5', 'p1', null, '施工日志', '',
        'f6', 'p2', null, '站点现场照片', '',
        'f7', 'p2', null, '勘测资料', '',
      ])
  }

  if ((await count('materials')) === 0) {
    const mats: any[] = [
      ['m1', 'p1', 'f2', '桩基施工_001.jpg', 'image', 2.4*1024*1024, 'u_zhao', d(20), 'pt1', '桩头清理完成', true, mockExif(1), '{t2,t5,t8}', '合格'],
      ['m2', 'p1', 'f2', '桩基施工_002.jpg', 'image', 3.1*1024*1024, 'u_zhao', d(20), 'pt1', '', true, mockExif(2), '{t2,t5,t8}', '不合格'],
      ['m3', 'p1', 'f3', '路基碾压_现场视频.mp4', 'video', 42*1024*1024, 'u_zhao', d(15), 'pt2', '碾压过程记录', false, null, '{t2,t6}', '合格'],
      ['m4', 'p1', 'f4', '施工总平面图.dwg', 'cad', 8.6*1024*1024, 'u_wang', d(60), null, '', false, null, '{t9}', null],
      ['m5', 'p1', 'f4', '结构设计说明.pdf', 'pdf', 5.2*1024*1024, 'u_wang', d(60), null, '', false, null, '{t9}', null],
      ['m6', 'p1', 'f5', '施工日志_0715.docx', 'office', 120*1024, 'u_li', d(10), null, '', false, null, '{}', null],
      ['m7', 'p1', 'f1', '现场航拍_总体.jpg', 'image', 6.2*1024*1024, 'u_zhao', d(8), 'pt3', '航拍总览', true, mockExif(7), '{t8}', null],
      ['m8', 'p1', null, '现场照片打包.zip', 'zip', 120*1024*1024, 'u_li', d(5), null, '', false, null, '{}', null],
      ['m9', 'p2', 'f6', '站点A_出入口.jpg', 'image', 2.8*1024*1024, 'u_zhao', d(18), 'pt4', '', true, mockExif(9), '{t8}', '不合格'],
      ['m10', 'p2', 'f6', '站点A_内景.jpg', 'image', 2.2*1024*1024, 'u_zhao', d(18), 'pt4', '', true, mockExif(10), '{t8}', null],
      ['m11', 'p2', 'f7', '岩土勘察报告.pdf', 'pdf', 12.4*1024*1024, 'u_wang', d(40), null, '', false, null, '{}', null],
      ['m12', 'p1', 'f3', '重复测试文件.jpg', 'image', 1.2*1024*1024, 'u_li', d(3), null, '', false, null, '{}', null],
    ]
    for (const m of mats) {
      await query(
        `INSERT INTO materials (id, project_id, folder_id, name, type, size, uploader_id, upload_time, point_id, remark, has_exif, exif, tags, approval, versions, comment_count, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15::jsonb,0,'正常')`,
        [m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], m[9], m[10], m[11], m[12], m[13],
         JSON.stringify([{ version: 1, storageKey: `key/${m[0]}`, fileHash: `hash${m[0]}`, size: m[5], createBy: m[6], createTime: m[7], note: '首次上传' }])],
      )
    }
  }

  if ((await count('approvals')) === 0) {
    await query(`INSERT INTO approvals (id, material_id, user_id, result, tag_change, changed_names, created_at) VALUES
      ($1,$2,$3,$4,$5,$6,$7),($8,$9,$10,$11,$12,$13,$14),($15,$16,$17,$18,$19,$20,$21)`,
      [
        'a1', 'm1', 'u_wang', '合格', '新增', '{施工阶段,桩基,现场照片}', d(18),
        'a2', 'm2', 'u_wang', '不合格', '无变化', '{}', d(17),
        'a3', 'm1', 'u_sun', '合格', '无变化', '{}', d(1),
      ])
  }

  if ((await count('comments')) === 0) {
    await query(`INSERT INTO comments (id, material_id, author_id, content, created_at, mentions) VALUES
      ($1,$2,$3,$4,$5,$6),($7,$8,$9,$10,$11,$12)`,
      [
        'c1', 'm1', 'u_sun', '@赵工 桩头清渣不够干净，请复拍。', d(19), '{u_zhao}',
        'c2', 'm3', 'u_wang', '碾压遍数需补充记录。', d(14), '{}',
      ])
    await query('UPDATE materials SET comment_count = 1 WHERE id = $1', ['m1'])
    await query('UPDATE materials SET comment_count = 1 WHERE id = $1', ['m3'])
  }

  if ((await count('material_tags')) === 0) {
    const mtags = [
      ['m1', 't2', 'u_li', d(19)], ['m1', 't5', 'u_li', d(18)], ['m1', 't8', 'u_li', d(17)],
      ['m2', 't2', 'u_li', d(19)], ['m2', 't5', 'u_li', d(18)], ['m2', 't8', 'u_li', d(17)],
      ['m3', 't2', 'u_li', d(15)], ['m3', 't6', 'u_li', d(14)],
      ['m4', 't9', 'u_wang', d(60)],
      ['m5', 't9', 'u_wang', d(60)],
      ['m7', 't8', 'u_zhao', d(8)],
      ['m9', 't8', 'u_zhao', d(18)],
      ['m10', 't8', 'u_zhao', d(18)],
    ]
    for (const mt of mtags) {
      await query('INSERT INTO material_tags (material_id, tag_id, user_id, time) VALUES ($1,$2,$3,$4)', mt)
    }
  }

  console.log('种子数据已写入')
}

// 允许单独执行：npm run db:init
if (process.argv[1] && process.argv[1].includes('seed')) {
  seed()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
