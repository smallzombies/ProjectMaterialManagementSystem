import { useState } from 'react'
import {
  Card,
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
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined, StopOutlined, CheckOutlined, SearchOutlined } from '@ant-design/icons'
import { useApp } from '../../store/AppContext'
import { uid } from '../../mock/db'
import type { User } from '../../types'

function Users() {
  const { db, refresh, update } = useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form] = Form.useForm()
  const [keyword, setKeyword] = useState('')

  const filtered = db.users.filter(
    (u) =>
      !keyword ||
      u.name.includes(keyword) ||
      u.phone.includes(keyword),
  )

  const submit = () => {
    form.validateFields().then((v) => {
      const next = { ...db }
      const password = v.password || (editing ? editing.password : undefined) || '123456'
      if (editing) {
        const i = next.users.findIndex((u) => u.id === editing.id)
        next.users[i] = { ...editing, ...v, password }
        message.success('用户已更新')
      } else {
        next.users.push({ id: uid('u'), ...v, password, status: '启用' })
        message.success('用户已创建')
      }
      update(next)
      refresh()
      setOpen(false)
    })
  }

  const toggleStatus = (u: User) => {
    const next = { ...db }
    const i = next.users.findIndex((x) => x.id === u.id)
    next.users[i] = { ...u, status: u.status === '启用' ? '停用' : '启用' }
    update(next)
    refresh()
    message.success(u.status === '启用' ? '账号已停用' : '账号已启用')
  }

  const remove = (u: User) => {
    const next = { ...db }
    next.users = next.users.filter((x) => x.id !== u.id)
    update(next)
    refresh()
    message.success('用户已删除')
  }

  const columns: ColumnsType<User> = [
    { title: '姓名', dataIndex: 'name' },
    { title: '手机号', dataIndex: 'phone' },
    {
      title: '所属单位',
      dataIndex: 'unitId',
      render: (v?: string) => {
        const unit = db.units.find((u) => u.id === v)
        return unit ? <Tag>{unit.name}</Tag> : <span className="muted">-</span>
      },
    },
    {
      title: '角色',
      dataIndex: 'roleId',
      render: (v: string) => {
        const r = db.roles.find((x) => x.id === v)
        return r ? <Tag color={r.isBuiltin ? 'blue' : 'green'}>{r.name}</Tag> : '-'
      },
    },
    {
      title: '所属项目',
      dataIndex: 'projectIds',
      render: (v: string[]) =>
        v.length ? (
          <Space wrap size={0}>
            {v.map((p) => (
              <Tag key={p} style={{ margin: 0 }}>{db.projects.find((x) => x.id === p)?.name || p}</Tag>
            ))}
          </Space>
        ) : (
          <span className="muted">全部</span>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => <Tag color={s === '启用' ? 'green' : 'default'}>{s}</Tag>,
    },
    {
      title: '操作',
      width: 200,
      render: (_, r) => (
        <Space>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue({ ...r }); setOpen(true) }}>
            编辑
          </Button>
          <Button size="small" type="link" icon={r.status === '启用' ? <StopOutlined /> : <CheckOutlined />} onClick={() => toggleStatus(r)}>
            {r.status === '启用' ? '停用' : '启用'}
          </Button>
          {r.id !== db.currentUserId && (
            <Popconfirm title="删除用户？" onConfirm={() => remove(r)}>
              <Button size="small" type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="用户管理"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true) }}>新增用户</Button>}
    >
      <div className="toolbar">
        <Input.Search
          prefix={<SearchOutlined />}
          placeholder="搜索姓名 / 手机号"
          allowClear
          style={{ width: 240 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>
      <div className="muted" style={{ marginBottom: 12 }}>
        账号由管理员/项目负责人后台创建，不开放自助注册；「所属单位」字段已预留（内部/外包/监理），本期不参与权限判断。
      </div>
      <Table rowKey="id" columns={columns} dataSource={filtered} pagination={false} />

      <Modal title={editing ? '编辑用户' : '新增用户'} open={open} onOk={submit} onCancel={() => setOpen(false)} width={560} destroyOnClose>
        <Form form={form} layout="vertical">
          <Space style={{ display: 'flex' }}>
            <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="unitId" label="所属单位">
            <Select
              allowClear
              placeholder="选择单位"
              showSearch
              optionFilterProp="label"
              style={{ width: '100%' }}
              options={db.units.map((u) => ({ value: u.id, label: u.name }))}
            />
          </Form.Item>
          <Form.Item name="roleId" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              style={{ width: '100%' }}
              options={db.roles.map((r) => ({ value: r.id, label: r.name }))}
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="登录密码"
            extra="不填写则默认为 123456"
          >
            <Input.Password placeholder="留空则使用默认密码 123456" />
          </Form.Item>
          <Form.Item name="projectIds" label="所属项目（留空=全部授权项目）">
            <Select mode="multiple" allowClear style={{ width: '100%' }} options={db.projects.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default Users