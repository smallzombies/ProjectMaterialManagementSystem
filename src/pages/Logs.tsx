import { useState } from 'react'
import { Card, Table, Tag, Select, Button, Input, message, Form } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ExportOutlined, SearchOutlined } from '@ant-design/icons'
import { useApp } from '../store/AppContext'
import { fmtDate } from '../utils/format'
import type { LogEntry } from '../types'

function Logs() {
  const { db, currentUser, canScope, isAdmin } = useApp()
  const [userId, setUserId] = useState('all')
  const [actionType, setActionType] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [form] = Form.useForm()

  const canViewAll = isAdmin || canScope('log.view') === 'all'
  const myProjects = currentUser?.projectIds || []

  let list = [...db.logs]
  if (!isAdmin && !canViewAll) {
    list = list.filter((l) => (l.projectId ? myProjects.includes(l.projectId) : false))
  }
  if (userId !== 'all') list = list.filter((l) => l.userId === userId)
  if (actionType !== 'all') list = list.filter((l) => l.actionType === actionType)
  if (keyword) list = list.filter((l) => (l.materialName || l.detail).includes(keyword))
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const columns: ColumnsType<LogEntry> = [
    { title: '操作人', dataIndex: 'userId', width: 100, render: (v: string) => db.users.find((u) => u.id === v)?.name || '-' },
    { title: '操作类型', dataIndex: 'actionType', width: 110, render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '文件', dataIndex: 'materialName', render: (v?: string) => v || '-' },
    { title: '明细', dataIndex: 'detail' },
    { title: '项目', dataIndex: 'projectId', width: 160, render: (v?: string) => (v ? db.projects.find((p) => p.id === v)?.name : '-') },
    { title: 'IP', dataIndex: 'ip', width: 120 },
    { title: '时间', dataIndex: 'createdAt', width: 150, render: (v: string) => fmtDate(v) },
  ]

  const actionTypes = Array.from(new Set(db.logs.map((l) => l.actionType)))

  return (
    <Card
      title="操作日志"
      extra={
        <Button icon={<ExportOutlined />} onClick={() => message.success('日志清单已导出（Excel）')}>
          导出
        </Button>
      }
    >
      <Form form={form} layout="inline" style={{ marginBottom: 12 }}>
        <Form.Item>
          <Select
            style={{ width: 160 }}
            value={userId}
            onChange={setUserId}
            options={[{ value: 'all', label: '全部操作人' }, ...db.users.map((u) => ({ value: u.id, label: u.name }))]}
          />
        </Form.Item>
        <Form.Item>
          <Select
            style={{ width: 140 }}
            value={actionType}
            onChange={setActionType}
            options={[{ value: 'all', label: '全部类型' }, ...actionTypes.map((t) => ({ value: t, label: t }))]}
          />
        </Form.Item>
        <Form.Item>
          <Input prefix={<SearchOutlined />} placeholder="搜索文件/明细" value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear />
        </Form.Item>
      </Form>
      <Table rowKey="id" columns={columns} dataSource={list} pagination={{ pageSize: 12 }} size="small" />
    </Card>
  )
}

export default Logs