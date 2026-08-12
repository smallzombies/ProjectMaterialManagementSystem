import { useState } from 'react'
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Typography,
  Card,
  List,
  Grid,
} from 'antd'
import {
  PlusOutlined,
  FolderOpenOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { uid } from '../mock/db'
import type { Project } from '../types'

function Projects() {
  const { db, refresh, update, can, currentUser, isAdmin } = useApp()
  const nav = useNavigate()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form] = Form.useForm()

  const visibleProjects = db.projects.filter(
    (p) => isAdmin || currentUser?.projectIds.includes(p.id),
  )

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (p: Project) => {
    setEditing(p)
    form.setFieldsValue(p)
    setModalOpen(true)
  }

  const submit = () => {
    form.validateFields().then((v) => {
      const next = { ...db }
      if (editing) {
        const idx = next.projects.findIndex((p) => p.id === editing.id)
        next.projects[idx] = { ...editing, ...v }
        message.success('项目已更新')
      } else {
        next.projects.push({
          id: uid('p'),
          ...v,
          status: '在建',
          createdAt: new Date().toISOString().slice(0, 19),
        })
        message.success('项目已创建')
      }
      setDB(next)
      setModalOpen(false)
    })
  }

  // helper to keep TS simple
  const setDB = (next: typeof db) => {
    // 通过 localStorage 写入后刷新
    update(next)
    refresh()
  }

  const archive = (p: Project) => {
    const next = { ...db }
    const idx = next.projects.findIndex((x) => x.id === p.id)
    next.projects[idx] = { ...p, status: p.status === '在建' ? '归档' : '在建' }
    update(next)
    refresh()
    message.success(p.status === '在建' ? '项目已归档' : '项目已恢复在建')
  }

  const remove = (p: Project) => {
    const next = { ...db }
    next.projects = next.projects.filter((x) => x.id !== p.id)
    update(next)
    refresh()
    message.success('项目已删除')
  }

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      render: (t: string, r: Project) => (
        <Typography.Link onClick={() => nav(`/projects/${r.id}`)}>
          <FolderOpenOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          {t}
        </Typography.Link>
      ),
    },
    { title: '项目编号', dataIndex: 'code' },
    {
      title: '负责人',
      dataIndex: 'ownerId',
      render: (v: string) => db.users.find((u) => u.id === v)?.name || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => <Tag color={s === '在建' ? 'processing' : 'default'}>{s}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 160 },
    {
      title: '操作',
      width: 240,
      render: (_: unknown, r: Project) => (
        <Space>
          <Button size="small" icon={<InboxOutlined />} onClick={() => nav(`/projects/${r.id}`)}>
            文件
          </Button>
          {can('project.manage') && (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
                编辑
              </Button>
              <Button size="small" onClick={() => archive(r)}>
                {r.status === '在建' ? '归档' : '恢复'}
              </Button>
              {isAdmin && (
                <Popconfirm title="删除项目后，所有已添加的文件将同时被删除，确定吗？" onConfirm={() => remove(r)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              )}
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="page-card">
      <div className="toolbar">
        <Space>
          {can('project.manage') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新建项目
            </Button>
          )}
          <span className="muted">共 {visibleProjects.length} 个项目</span>
        </Space>
      </div>
      {isMobile ? (
        <List
          grid={{ gutter: 12, column: 1 }}
          dataSource={visibleProjects}
          renderItem={(p) => (
            <List.Item style={{ padding: 0, marginBottom: 12 }}>
              <Card
                size="small"
                styles={{ body: { padding: 12 } }}
                onClick={() => nav(`/projects/${p.id}`)}
                hoverable
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <Typography.Text strong style={{ flex: 1 }}>
                    <FolderOpenOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                    {p.name}
                  </Typography.Text>
                  <Tag color={p.status === '在建' ? 'processing' : 'default'}>{p.status}</Tag>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div className="muted">编号：{p.code}</div>
                  <div className="muted">负责人：{db.users.find((u) => u.id === p.ownerId)?.name || '-'}</div>
                  <div className="muted">创建：{p.createdAt}</div>
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <Button size="small" icon={<InboxOutlined />} onClick={(e) => { e.stopPropagation(); nav(`/projects/${p.id}`) }}>
                    文件
                  </Button>
                  {can('project.manage') && (
                    <>
                      <Button size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); openEdit(p) }}>
                        编辑
                      </Button>
                      <Button size="small" onClick={(e) => { e.stopPropagation(); archive(p) }}>
                        {p.status === '在建' ? '归档' : '恢复'}
                      </Button>
                      {isAdmin && (
                        <Popconfirm title="删除项目后，所有已添加的文件将同时被删除，确定吗？" onConfirm={() => remove(p)}>
                          <Button size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                        </Popconfirm>
                      )}
                    </>
                  )}
                </div>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Table rowKey="id" columns={columns} dataSource={visibleProjects} pagination={false} />
      )}

      <Modal
        title={editing ? '编辑项目' : '新建项目'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="如：滨江大道改造工程" />
          </Form.Item>
          <Form.Item name="code" label="项目编号" rules={[{ required: true, message: '请输入项目编号' }]}>
            <Input placeholder="如：BJ-2024-01" />
          </Form.Item>
          <Form.Item name="ownerId" label="项目负责人" rules={[{ required: true }]}>
            <Select
              options={db.users
                .filter((u) => u.status === '启用')
                .map((u) => ({ value: u.id, label: u.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Projects