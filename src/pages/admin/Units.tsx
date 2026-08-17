import { useState } from 'react'
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Divider, Switch, message, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined, StopOutlined, CheckOutlined } from '@ant-design/icons'
import { useApp } from '../../store/AppContext'
import { uid } from '../../mock/db'
import type { Unit, UnitConfig } from '../../types'

const DEFAULT_CONFIG: UnitConfig = { showDetailMeta: true, showApproval: true, showFailed: true }

function Units() {
  const { db, refresh, update } = useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Unit | null>(null)
  const [form] = Form.useForm()

  const submit = () => {
    form.validateFields().then((v) => {
      const next = { ...db }
      if (editing) {
        const i = next.units.findIndex((u) => u.id === editing.id)
        next.units[i] = { ...editing, ...v, unitType: editing.unitType }
        message.success('单位已更新')
      } else {
        next.units.push({ id: uid('unit'), ...v, unitType: '内部', isEnabled: true, config: DEFAULT_CONFIG })
        message.success('单位已创建')
      }
      update(next)
      refresh()
      setOpen(false)
    })
  }

  const openEdit = (u: Unit) => {
    setEditing(u)
    form.setFieldsValue(u)
    form.setFieldsValue({ config: u.config || DEFAULT_CONFIG })
    setOpen(true)
  }

  const toggleStatus = (u: Unit) => {
    const next = { ...db }
    const i = next.units.findIndex((x) => x.id === u.id)
    next.units[i] = { ...u, isEnabled: !u.isEnabled }
    update(next)
    refresh()
    message.success(u.isEnabled ? '单位已停用' : '单位已启用')
  }

  const remove = (u: Unit) => {
    const next = { ...db }
    next.units = next.units.filter((x) => x.id !== u.id)
    next.users = next.users.map((x) => (x.unitId === u.id ? { ...x, unitId: undefined } : x))
    update(next)
    refresh()
    message.success('单位已删除')
  }

  const columns: ColumnsType<Unit> = [
    {
      title: '单位名称',
      dataIndex: 'name',
    },
    {
      title: '状态',
      dataIndex: 'isEnabled',
      width: 100,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '启用' : '停用'}</Tag>,
    },
    {
      title: '在册用户',
      width: 120,
      render: (_, r) => {
        const n = db.users.filter((u) => u.unitId === r.id).length
        return n ? <span>{n} 人</span> : <span className="muted">0 人</span>
      },
    },
    {
      title: '操作',
      width: 200,
      render: (_, r) => (
        <Space>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEdit(r)}>
            编辑
          </Button>
          <Button size="small" type="link" icon={r.isEnabled ? <StopOutlined /> : <CheckOutlined />} onClick={() => toggleStatus(r)}>
            {r.isEnabled ? '停用' : '启用'}
          </Button>
          <Popconfirm title="删除该单位？其下用户所属单位将清空" onConfirm={() => remove(r)}>
            <Button size="small" type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="单位管理"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true) }}>新增单位</Button>}
    >
      <div className="muted" style={{ marginBottom: 12 }}>
        维护项目参与单位（内部 / 外包 / 监理），与「用户管理」中的所属单位下拉联动。
      </div>
      <Table rowKey="id" columns={columns} dataSource={db.units} pagination={false} />

      <Modal title={editing ? '编辑单位' : '新增单位'} open={open} onOk={submit} onCancel={() => setOpen(false)} width={560} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="单位名称" rules={[{ required: true, message: '请输入单位名称' }]}>
            <Input placeholder="如：某设计院" />
          </Form.Item>
          {editing && (
            <>
              <Divider plain style={{ margin: '4px 0 16px' }}>参数配置</Divider>
              <Form.Item name={['config', 'showDetailMeta']} label="文件详情" valuePropName="checked" extra="是否显示图片 EXIF 信息、上传时间和拍摄时间">
                <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
              </Form.Item>
              <Form.Item name={['config', 'showApproval']} label="审批记录" valuePropName="checked" extra="文件详情中是否显示审批记录">
                <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
              </Form.Item>
              <Form.Item name={['config', 'showFailed']} label="不合格文件" valuePropName="checked" extra="文件管理器中是否展示审批意见为「不合格」的文件">
                <Switch checkedChildren="展示" unCheckedChildren="隐藏" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Card>
  )
}

export default Units