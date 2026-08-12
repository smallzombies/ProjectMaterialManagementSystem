import { useState } from 'react'
import { Card, Table, Button, Space, Tag, Select, Modal, Form, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SendOutlined } from '@ant-design/icons'
import { useApp } from '../../store/AppContext'
import type { User } from '../../types'

function Transfer() {
  const { db, refresh, update } = useApp()
  const [target, setTarget] = useState<User | null>(null)
  const [form] = Form.useForm()

  const submit = () => {
    form.validateFields().then((v) => {
      const next = { ...db }
      const now = new Date().toISOString().slice(0, 19)
      // 将停用用户名下素材转交给接收人
      next.materials = next.materials.map((m) =>
        v.projectIds.some((p: string) => m.projectId === p) && m.uploaderId === target?.id
          ? { ...m, uploaderId: v.receiver }
          : m,
      )
      next.logs.unshift({
        id: 'l_transfer',
        projectId: '',
        userId: 'u_admin',
        actionType: '离职转交',
        detail: `停用账号 ${target?.name} 的素材转交给 ${db.users.find((u) => u.id === v.receiver)?.name}`,
        ip: '10.0.0.1',
        createdAt: now,
      })
      update(next)
      refresh()
      setTarget(null)
      message.success('素材归属已转交，账号保持停用')
    })
  }

  const columns: ColumnsType<User> = [
    { title: '姓名', dataIndex: 'name', render: (t: string, r) => <Space><span>{t}</span>{r.id === db.currentUserId && <Tag color="blue">当前登录</Tag>}</Space> },
    { title: '手机号', dataIndex: 'phone' },
    { title: '角色', dataIndex: 'roleId', render: (v: string) => db.roles.find((r) => r.id === v)?.name },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === '启用' ? 'green' : 'default'}>{s}</Tag> },
    {
      title: '名下素材数',
      render: (_, r) => db.materials.filter((m) => m.uploaderId === r.id).length,
    },
    {
      title: '操作',
      width: 160,
      render: (_, r) =>
        r.status === '停用' ? (
          <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => { setTarget(r); form.resetFields() }}>
            转交素材
          </Button>
        ) : (
          <span className="muted">账号停用后执行转交</span>
        ),
    },
  ]

  return (
    <Card title="离职转交与素材归属">
      <div className="muted" style={{ marginBottom: 12 }}>
        将停用账号名下上传的素材归集转交给其他在职用户，支持按项目筛选范围；账号保持停用。
      </div>
      <Table rowKey="id" columns={columns} dataSource={db.users} pagination={false} />

      <Modal title={`转交 ${target?.name || ''} 的素材`} open={!!target} onOk={submit} onCancel={() => setTarget(null)} width={520} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="receiver" label="接收人" rules={[{ required: true, message: '请选择接收人' }]}>
            <Select
              options={db.users
                .filter((u) => u.id !== target?.id && u.status === '启用')
                .map((u) => ({ value: u.id, label: u.name }))}
            />
          </Form.Item>
          <Form.Item name="projectIds" label="转交范围" rules={[{ required: true, message: '请选择项目范围' }]}>
            <Select mode="multiple" placeholder="选择哪些项目的素材要转交" options={db.projects.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
          <div className="muted">
            将把 {target?.name} 在所选项目内上传的素材转交到接收人名下，操作写入日志。
          </div>
        </Form>
      </Modal>
    </Card>
  )
}

export default Transfer