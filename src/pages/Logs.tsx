import { useEffect, useState } from 'react'
import { Card, Table, Tag, Select, Button, Input, Space, Empty, Grid, message, Form, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ExportOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons'
import { useApp } from '../store/AppContext'
import { logsApi } from '../api/services'
import { fmtDate } from '../utils/format'
import type { LogEntry } from '../types'

function Logs() {
  const { db, currentUser, canScope, isAdmin } = useApp()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [userId, setUserId] = useState('all')
  const [actionType, setActionType] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [form] = Form.useForm()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    logsApi.list()
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const canViewAll = isAdmin || canScope('log.view') === 'all'
  const myProjects = currentUser?.projectIds || []

  let list = [...logs]
  if (!isAdmin && !canViewAll) {
    list = list.filter((l) => (l.projectId ? myProjects.includes(l.projectId) : false))
  }
  if (userId !== 'all') list = list.filter((l) => l.userId === userId)
  if (actionType !== 'all') list = list.filter((l) => l.actionType === actionType)
  if (keyword) list = list.filter((l) => (l.materialName || l.detail).includes(keyword))
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const columns: ColumnsType<LogEntry> = [
    { title: '操作人', dataIndex: 'userId', width: 100, render: (v: string) => db.users.find((u) => u.id === v)?.name || v },
    { title: '操作类型', dataIndex: 'actionType', width: 110, render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '文件', dataIndex: 'materialName', render: (v?: string) => v || '-' },
    { title: '明细', dataIndex: 'detail' },
    { title: '项目', dataIndex: 'projectId', width: 160, render: (v?: string) => (v ? db.projects.find((p) => p.id === v)?.name || v : '-') },
    { title: 'IP', dataIndex: 'ip', width: 120 },
    { title: '时间', dataIndex: 'createdAt', width: 150, render: (v: string) => fmtDate(v) },
  ]

  const actionTypes = Array.from(new Set(logs.map((l) => l.actionType)))

  if (loading) return <Card title="操作日志"><div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div></Card>

  return (
    <Card
      title="操作日志"
      extra={
        <Button size={isMobile ? 'small' : 'middle'} icon={<ExportOutlined />} onClick={() => message.success('日志清单已导出（Excel）')}>
          导出
        </Button>
      }
    >
      <Form form={form} layout={isMobile ? 'vertical' : 'inline'} style={{ marginBottom: 12 }}>
        <Space wrap>
          <Form.Item style={isMobile ? { marginBottom: 4 } : undefined}>
            <Select
              style={{ width: isMobile ? '100%' : 160 }}
              value={userId}
              onChange={setUserId}
              options={[{ value: 'all', label: '全部操作人' }, ...db.users.map((u) => ({ value: u.id, label: u.name }))]}
            />
          </Form.Item>
          <Form.Item style={isMobile ? { marginBottom: 4 } : undefined}>
            <Select
              style={{ width: isMobile ? '100%' : 140 }}
              value={actionType}
              onChange={setActionType}
              options={[{ value: 'all', label: '全部类型' }, ...actionTypes.map((t) => ({ value: t, label: t }))]}
            />
          </Form.Item>
          <Form.Item style={isMobile ? { marginBottom: 0 } : undefined}>
            <Input prefix={<SearchOutlined />} placeholder="搜索文件/明细" value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear />
          </Form.Item>
        </Space>
      </Form>
      {isMobile ? (
        list.length ? (
          <div>
            {list.map((l) => {
              const user = db.users.find((u) => u.id === l.userId)
              const project = l.projectId ? db.projects.find((p) => p.id === l.projectId) : undefined
              return (
                <div key={l.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Space size={8} style={{ marginBottom: 4 }}>
                    <UserOutlined style={{ color: '#1677ff' }} />
                    <b>{user?.name || l.userId}</b>
                    <Tag color="blue" style={{ marginInlineEnd: 0 }}>{l.actionType}</Tag>
                  </Space>
                  <div style={{ fontWeight: 500 }}>{l.materialName || '-'}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{l.detail}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {project?.name || l.projectId || '-'} · {l.ip} · {fmtDate(l.createdAt)}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <Empty description="暂无日志" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )
      ) : (
        <Table rowKey="id" columns={columns} dataSource={list} pagination={{ pageSize: 12 }} size="small" />
      )}
    </Card>
  )
}

export default Logs
