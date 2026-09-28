import { Router } from 'express'
import { createRequire } from 'module'
import { authMiddleware, requirePerm } from '../auth.js'
import { materialsRepo } from '../repositories/materials.js'
import { foldersRepo } from '../repositories/folders.js'

const require = createRequire(import.meta.url)

export const downloadRouter = Router()

downloadRouter.use(authMiddleware)

downloadRouter.post('/', requirePerm('material.download'), async (req, res) => {
  try {
    const ids: string[] = req.body?.ids || []
    if (!ids.length) return res.status(400).json({ message: '未选择文件' })

    const materials = await Promise.all(ids.map((id) => materialsRepo.findById(id)))
    const validMaterials = materials.filter(Boolean)

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ZipArchive } = require('archiver') as any

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="files_${Date.now()}.zip"`)

    const archive = new ZipArchive('zip', { zlib: { level: 5 } })
    archive.on('error', (err: Error) => { if (!res.headersSent) res.status(500).json({ message: err.message }) })
    archive.pipe(res)

    const folderIds = new Set<string>()
    validMaterials.forEach((m) => { if (m!.folderId) folderIds.add(m!.folderId) })

    const folderPathMap = new Map<string, string>()
    const resolvePath = async (folderId: string): Promise<string> => {
      if (folderPathMap.has(folderId)) return folderPathMap.get(folderId)!
      const folder = await foldersRepo.findById(folderId)
      if (!folder) { folderPathMap.set(folderId, ''); return '' }
      if (!folder.parentId) { folderPathMap.set(folderId, folder.name); return folder.name }
      const parentPath = await resolvePath(folder.parentId)
      const p = parentPath ? `${parentPath}/${folder.name}` : folder.name
      folderPathMap.set(folderId, p)
      return p
    }

    for (const fid of folderIds) await resolvePath(fid)

    for (const m of validMaterials) {
      const mat = m!
      const prefix = mat.folderId ? folderPathMap.get(mat.folderId) || '' : ''
      const filePath = prefix ? `${prefix}/${mat.name}` : mat.name
      const content = JSON.stringify({
        id: mat.id, name: mat.name, type: mat.type, size: mat.size,
        uploadTime: mat.uploadTime, remark: mat.remark || '',
      }, null, 2)
      archive.append(content, { name: filePath })
    }

    await archive.finalize()
  } catch (e: any) {
    if (!res.headersSent) res.status(500).json({ message: e.message })
  }
})
