import { useState } from 'react'
import { Card, Table, Button, Space, Tag, message, Modal, Empty, Popconfirm, Spin, Grid, List } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FileSearchOutlined, SearchOutlined } from '@ant-design/icons'
import { useApp } from '../store/AppContext'
import { fmtSize, fmtDate } from '../utils/format'
import type { Material } from '../types'
interface DupGroup {
  hash: string
  count: number
  files: Material[]
}

function Duplicates() {
  const { db, refresh, update } = useApp()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [target, setTarget] = useState<DupGroup | null>(null)
  const [checking, setChecking] = useState(false)

  const buildGroups = () => {
    const map = new Map<string, Material[]>()
    db.materials
      .filter((m) => m.status === '正常')
      .forEach((m) => {
        const hash = m.versions[m.versions.length - 1]?.fileHash || ''
        const arr = map.get(hash) || []
        arr.push(m)
        map.set(hash, arr)
      })
    const result: DupGroup[] = []
    map.forEach((files, hash) => {
      if (files.length > 1) result.push({ hash, count: files.length, files })
    })
    return result
  }

  const groups = buildGroups()

  const runCheck = () => {
    setChecking(true)
    setTimeout(() => {
      setChecking(false)
      const n = buildGroups().length
      message.success(`重复文件检查完成，发现 ${n} 组重复文件`)
    }, 800)
  }

  const mergeTo = (group: DupGroup, keepId: string) => {
    const next = { ...db }
    const now = new Date().toISOString().slice(0, 19)
    for (const m of group.files) {
      if (m.id === keepId) continue
      // 物理文件共享，仅保留一条引用
      const i = next.materials.findIndex((x) => x.id === m.id)
      next.materials[i] = { ...m, status: '回收站', deletedAt: now, deletedBy: '系统' }
    }
    update(next)
    refresh()
    setTarget(null)
    message.success('保留主版本，其余已移入回收站')
  }

  const columns: ColumnsType<DupGroup> = [
    { title: '重复组', render: (_, r) => <Tag color="volcano">指纹 {r.hash.slice(0, 8)}</Tag> },
    { title: '文件数', dataIndex: 'count', width: 100 },
    {
      title: '文件',
      render: (_, r) => (
        <Space wrap>
          {r.files.map((f) => (
            <Tag key={f.id} color="blue">{f.name}</Tag>
          ))}
        </Space>
      ),
    },
    { title: '总占用', render: (_, r) => fmtSize(r.files.reduce((s, f) => s + f.size, 0)) },
    {
      title: '操作',
      width: 120,
      render: (_, r) => (
        <Button size="small" type="link" icon={<FileSearchOutlined />} onClick={() => setTarget(r)}>
          去重处理
        </Button>
      ),
    },
  ]

  return (
    <Card
      title={<>重复文件检查 <span className="muted" style={{ fontWeight: 400 }}>（按 MD5 指纹比对）</span></>}
      extra={
        <Button type="primary" icon={<SearchOutlined />} loading={checking} onClick={runCheck}>
          重复文件检查
        </Button>
      }
    >
      <Spin spinning={checking}>
        {groups.length === 0 ? (
          <Empty description="未发现重复文件（MD5 指纹相同）" />
        ) : isMobile ? (
          <List
            dataSource={groups}
            rowKey="hash"
            renderItem={(r) => (
              <Card size="small" style={{ marginBottom: 10 }} styles={{ body: { padding: 12 } }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Tag color="volcano" style={{ margin: 0 }}>指纹 {r.hash.slice(0, 8)}</Tag>
                  <span className="muted">{r.count} 个文件 · {fmtSize(r.files.reduce((s, f) => s + f.size, 0))}</span>
                </div>
                <div className="ellipsis" style={{ fontSize: 13, marginBottom: 8 }}>{r.files.map((f) => f.name).join('、')}</div>
                <Button size="small" type="link" icon={<FileSearchOutlined />} onClick={() => setTarget(r)} style={{ paddingLeft: 0 }}>
                  去重处理
                </Button>
              </Card>
            )}
          />
        ) : (
          <Table rowKey="hash" columns={columns} dataSource={groups} pagination={false} />
        )}
      </Spin>

      <Modal
        open={!!target}
        title="去重处理"
        footer={null}
        onCancel={() => setTarget(null)}
      >
        <p>以下文件内容相同（MD5 相同），选择一个作为保留版本：</p>
        {isMobile ? (
          <List
            dataSource={target?.files || []}
            rowKey="id"
            renderItem={(f) => (
              <Card size="small" style={{ marginBottom: 8 }} styles={{ body: { padding: 10 } }}>
                <div className="ellipsis" style={{ fontSize: 13 }}>{f.name}</div>
                <div className="muted">{fmtSize(f.size)} · {fmtDate(f.uploadTime)}</div>
                <Popconfirm title={`保留 “${f.name}” 并移走其他副本到回收站？`} onConfirm={() => mergeTo(target!, f.id)}>
                  <Button size="small" type="primary" style={{ marginTop: 8 }}>保留此版本</Button>
                </Popconfirm>
              </Card>
            )}
          />
        ) : (
          <Table
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={target?.files || []}
            columns={[
              { title: '文件名', dataIndex: 'name' },
              { title: '大小', dataIndex: 'size', render: (s: number) => fmtSize(s) },
              { title: '上传时间', dataIndex: 'uploadTime', render: (v: string) => fmtDate(v) },
              {
                title: '操作',
                render: (_: unknown, f: Material) => (
                  <Popconfirm title={`保留 “${f.name}” 并移走其他副本到回收站？`} onConfirm={() => mergeTo(target!, f.id)}>
                    <Button size="small" type="primary">保留此版本</Button>
                  </Popconfirm>
                ),
              },
            ]}
          />
        )}
        <div className="muted" style={{ marginTop: 8 }}>
          被移走的副本进入回收站（无限保留），可随时恢复；物理存储仅占一份。
        </div>
      </Modal>
    </Card>
  )
}

export default Duplicates