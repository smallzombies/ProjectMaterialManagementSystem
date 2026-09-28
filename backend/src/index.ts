import express from 'express'
import cors from 'cors'
import { initDatabase } from './db.js'
import { seed } from './seed.js'
import { authRouter } from './routes/auth.js'
import { projectsRouter } from './routes/projects.js'
import { pointsRouter } from './routes/points.js'
import { tagsRouter } from './routes/tags.js'
import { unitsRouter } from './routes/units.js'
import { usersRouter } from './routes/users.js'
import { rolesRouter } from './routes/roles.js'
import { trashRouter } from './routes/trash.js'
import { materialsRouter } from './routes/materials.js'
import { foldersRouter } from './routes/folders.js'
import { commentsRouter } from './routes/comments.js'
import { approvalsRouter } from './routes/approvals.js'
import { logsRouter } from './routes/logs.js'
import { statsRouter } from './routes/stats.js'
import { adminRouter } from './routes/admin.js'
import { downloadRouter } from './routes/download.js'

async function main() {
  await initDatabase()
  await seed()

  const app = express()
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
  app.use(express.json())

  app.get('/api/health', (_req, res) => res.json({ ok: true }))
  app.use('/api/auth', authRouter)
  app.use('/api/projects', projectsRouter)
  app.use('/api/points', pointsRouter)
  app.use('/api/tags', tagsRouter)
  app.use('/api/units', unitsRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/roles', rolesRouter)
  app.use('/api/trash', trashRouter)
  app.use('/api/materials', materialsRouter)
  app.use('/api/folders', foldersRouter)
  app.use('/api/comments', commentsRouter)
  app.use('/api/approvals', approvalsRouter)
  app.use('/api/logs', logsRouter)
  app.use('/api/stats', statsRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/download', downloadRouter)

  const port = Number(process.env.PORT) || 4000
  app.listen(port, '0.0.0.0', () => {
    console.log(`后端已启动: http://0.0.0.0:${port}`)
  })
}

main().catch((err) => {
  console.error('启动失败', err)
  process.exit(1)
})
