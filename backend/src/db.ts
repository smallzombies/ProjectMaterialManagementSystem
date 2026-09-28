import { Pool } from 'pg'
import { PGlite } from '@electric-sql/pglite'
import { loadEnv } from './env.js'
import { mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

loadEnv()

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, '../data')

const DATABASE_URL = process.env.DATABASE_URL || ''
// 未配置 DATABASE_URL 时，使用内嵌 WASM PostgreSQL（pglite），无需安装数据库即可本地运行
const usePglite = !DATABASE_URL || DATABASE_URL.startsWith('pglite')

let pool: Pool | null = null
let pglite: PGlite | null = null

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_builtin BOOLEAN NOT NULL DEFAULT false,
    perms TEXT[] NOT NULL DEFAULT '{}',
    scope TEXT NOT NULL DEFAULT 'project'
  );
  CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit_type TEXT NOT NULL DEFAULT '内部',
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    config JSONB
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    unit_id TEXT,
    role_id TEXT NOT NULL,
    project_ids TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT '启用',
    password TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    owner_id TEXT,
    status TEXT NOT NULL DEFAULT '在建',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS points (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    status TEXT NOT NULL DEFAULT '启用',
    remark TEXT
  );
  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    parent_id TEXT,
    name TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS trash (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    folder_id TEXT,
    name TEXT NOT NULL,
    type TEXT,
    size DOUBLE PRECISION NOT NULL DEFAULT 0,
    data JSONB NOT NULL,
    deleted_by TEXT,
    deleted_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    parent_id TEXT,
    name TEXT NOT NULL,
    remark TEXT DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    folder_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'other',
    size DOUBLE PRECISION NOT NULL DEFAULT 0,
    uploader_id TEXT,
    upload_time TEXT NOT NULL,
    point_id TEXT,
    shooting_time TEXT,
    remark TEXT DEFAULT '',
    tags TEXT[] NOT NULL DEFAULT '{}',
    has_exif BOOLEAN DEFAULT false,
    exif JSONB,
    versions JSONB NOT NULL DEFAULT '[]',
    comment_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT '正常',
    approval TEXT,
    deleted_at TEXT,
    deleted_by TEXT
  );
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    material_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    parent_id TEXT,
    created_at TEXT NOT NULL,
    mentions TEXT[] NOT NULL DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS approvals (
    id TEXT PRIMARY KEY,
    material_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    result TEXT NOT NULL,
    tag_change TEXT NOT NULL DEFAULT '无变化',
    changed_names TEXT[] NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS material_tags (
    material_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    time TEXT NOT NULL,
    PRIMARY KEY (material_id, tag_id)
  );
  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    material_id TEXT,
    material_name TEXT,
    project_id TEXT,
    user_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    ip TEXT DEFAULT '',
    created_at TEXT NOT NULL
  );
`

export async function initDatabase() {
  if (usePglite) {
    if (!pglite) {
      mkdirSync(DATA_DIR, { recursive: true })
      pglite = new PGlite(DATA_DIR + '/db')
      await pglite.exec(SCHEMA)
    }
    return
  }
  if (!pool) {
    pool = new Pool({ connectionString: DATABASE_URL })
    await pool.query(SCHEMA)
  }
}

export async function query<T = any>(text: string, params: any[] = []): Promise<{ rows: T[] }> {
  if (usePglite) {
    const res = await pglite!.query(text, params)
    return { rows: res.rows as T[] }
  }
  const res = await pool!.query(text, params)
  return res as { rows: T[] }
}
