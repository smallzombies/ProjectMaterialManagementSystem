import { useState } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, Checkbox, message, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useApp } from '../../store/AppContext'
import { rolesApi } from '../../api/services'
import type { Role, PermCode } from '../../types'

const PERM_OPTIONS: { label: string; value: PermCode; group: string }[] = [
  { label: '查看项目', value: 'project.view', group: '基础' },
  { label: '项目管理（增删改归档）', value: 'project.manage', group: '基础' },
  { label: '文件夹管理', value: 'folder.manage', group: '基础' },
  { label: '上传素材', value: 'material.upload', group: '素材' },
  { label: '编辑（移动/重命名/批注）', value: 'material.edit', group: '素材' },
  { label: '删除素材', value: 'material.delete', group: '素材' },
  { label: '下载素材', value: 'material.download', group: '素材' },
  { label: '打标签', value: 'material.tag', group: '素材' },
  { label: 'EXIF 清除', value: 'material.exif', group: '素材' },
  { label: '预览', value: 'material.preview', group: '浏览' },
  { label: '发送外链', value: 'share.send', group: '浏览' },
  { label: '查看外链', value: 'share.view', group: '浏览' },
  { label: '管理项目成员', value: 'member.manage', group: '管理' },
  { label: '查看操作日志', value: 'log.view', group: '管理' },
]

function Roles() {
  const { db, reloadFromApi } = useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [form] = Form.useForm()

  const groups = Array.from(new Set(PERM_OPTIONS.map((p) => p.group)))

  const submit = async () => {
    const v = await form.validateFields()
    try {
      const body = { name: v.name, scope: v.scope, perms: v.perms || [] }
      if (editing) {
        await rolesApi.update(editing.id, body)
        message.success('角色已更新')
      } else {
        await rolesApi.create(body)
        message.success('角色已创建')
      }
      await reloadFromApi()
      setOpen(false)
    } catch (e: any) {
      message.error(e?.message || '操作失败')
    }
  }

  const remove = async (r: Role) => {
    try {
      await rolesApi.remove(r.id)
      await reloadFromApi()
      message.success('角色已删除')
    } catch (e: any) {
      message.error(e?.message || '操作失败')
    }
  }

  const columns: ColumnsType<Role> = [
    { title: '角色名称', dataIndex: 'name', render: (t: string, r) => <Tag color={r.isBuiltin ? 'blue' : 'green'}>{t}</Tag> },
    {
      title: '范围',
      dataIndex: 'scope',
      render: (s: string) => <Tag color={s === 'all' ? 'purple' : 'default'}> {s === 'all' ? '全系统' : '按项目'} </Tag>,
    },
    { title: '备注', render: (_, r) => (r.isBuiltin ? <span className="muted">内置模板</span> : <span className="muted">自定义</span>), width: 120 },
    {
      title: '权限',
      render: (_, r) => (
        <Space wrap size={0}>
          {r.perms.map((p) => (
            <Tag key={p} style={{ margin: 1 }}>
              {PERM_OPTIONS.find((o) => o.value === p)?.label || p}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '操作',
      width: 140,
      render: (_, r) => (
        <Space>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue({ name: r.name, scope: r.scope, perms: r.perms }); setOpen(true) }}>
            编辑
          </Button>
          {!r.isBuiltin && (
            <Popconfirm title="删除角色?" onConfirm={() => remove(r)}>
              <Button size="small" type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="角色与权限"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true) }}>自定义角色</Button>}
    >
      <Table rowKey="id" columns={columns} dataSource={db.roles} pagination={false} />

      <Modal title={editing ? '编辑角色' : '自定义角色'} open={open} onOk={submit} onCancel={() => setOpen(false)} width={600} destroyOnClose>
        <Form form={form} layout="vertical">
          <Space style={{ display: 'flex' }}>
            <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]} style={{ flex: 1 }}>
              <Input placeholder="如：安全员" />
            </Form.Item>
            <Form.Item name="scope" label="权限范围" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={[{ value: 'all', label: '全系统' }, { value: 'project', label: '按项目' }]} />
            </Form.Item>
          </Space>
          <Form.Item name="perms" label="权限点" rules={[{ required: true, message: '请勾选权限' }]}>
            <Checkbox.Group style={{ width: '100%' }}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                {groups.map((g) => (
                  <div key={g}>
                    <div style={{ margin: '6px 0', fontWeight: 500, fontSize: 13 }}>{g}</div>
                    <Space wrap size={[0, 0]}>
                      {PERM_OPTIONS.filter((o) => o.group === g).map((o) => (
                        <Checkbox key={o.value} value={o.value} style={{ width: 190 }}>
                          {o.label}
                        </Checkbox>
                      ))}
                    </Space>
                  </div>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default Roles