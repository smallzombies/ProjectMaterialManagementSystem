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
  InputNumber,
  Select,
  message,
  Popconfirm,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, ImportOutlined, ExportOutlined, EditOutlined, DeleteOutlined, StopOutlined, AimOutlined } from '@ant-design/icons'
import { useApp } from '../store/AppContext'
import { uid } from '../mock/db'
import type { Point } from '../types'

function Points() {
  const { db, refresh, update } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Point | null>(null)
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [form] = Form.useForm()

  const visible = db.points.filter((p) => (projectFilter === 'all' ? true : p.projectId === projectFilter))

  const submit = () => {
    form.validateFields().then((v) => {
      const next = { ...db }
      if (editing) {
        const i = next.points.findIndex((p) => p.id === editing.id)
        next.points[i] = { ...editing, ...v }
        message.success('点位已更新')
      } else {
        next.points.push({ id: uid('pt'), ...v, status: '启用' })
        message.success('点位已创建')
      }
      update(next)
      refresh()
      setModalOpen(false)
    })
  }

  const toggle = (p: Point) => {
    const next = { ...db }
    const i = next.points.findIndex((x) => x.id === p.id)
    next.points[i] = { ...p, status: p.status === '启用' ? '停用' : '启用' }
    update(next)
    refresh()
    message.success(p.status === '启用' ? '点位已停用（不影响历史素材关联）' : '点位已启用')
  }

  const columns: ColumnsType<Point> = [
    { title: '点位名称', dataIndex: 'name', render: (t: string) => <Space><AimOutlined style={{ color: '#fa8c16' }} />{t}</Space> },
    { title: '编号', dataIndex: 'code' },
    { title: '经度', dataIndex: 'lng', width: 100, render: (v?: number) => v ?? '-' },
    { title: '纬度', dataIndex: 'lat', width: 100, render: (v?: number) => v ?? '-' },
    {
      title: '所属项目',
      dataIndex: 'projectId',
      render: (v: string) => db.projects.find((p) => p.id === v)?.name || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => <Tag color={s === '启用' ? 'green' : 'default'}>{s}</Tag>,
    },
    { title: '备注', dataIndex: 'remark', render: (v?: string) => v || '-' },
    {
      title: '操作',
      width: 180,
      render: (_, r) => (
        <Space>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setModalOpen(true) }}>编辑</Button>
          <Button size="small" type="link" icon={<StopOutlined />} iconPosition="end" onClick={() => toggle(r)}>{r.status === '启用' ? '停用' : '启用'}</Button>
          <Popconfirm title="确定删除该点位？已关联素材不删除" onConfirm={() => {
            const next = { ...db }
            next.points = next.points.filter((x) => x.id !== r.id)
            update(next)
            refresh()
            message.success('点位已删除')
          }}>
            <Button size="small" type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="拍摄点位管理"
      extra={
        <Space>
          <Button icon={<ImportOutlined />} onClick={() => message.info('Excel 导入：支持点位库批量维护')}>Excel导入</Button>
          <Button icon={<ExportOutlined />} onClick={() => message.info('导出点位清单')}>导出</Button>
        </Space>
      }
    >
      <div className="toolbar">
        <Space>
          <Select
            style={{ width: 220 }}
            value={projectFilter}
            onChange={setProjectFilter}
            options={[{ value: 'all', label: '全部项目' }, ...db.projects.map((p) => ({ value: p.id, label: p.name }))]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true) }}>
            新建点位
          </Button>
          <span className="muted">点位按项目隔离，共 {visible.length} 个</span>
        </Space>
      </div>
      <Table rowKey="id" columns={columns} dataSource={visible} pagination={{ pageSize: 10 }} />

      <Modal title={editing ? '编辑点位' : '新建点位'} open={modalOpen} onOk={submit} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" label="所属项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select options={db.projects.map((p) => ({ value: p.id, label: p.name }))} disabled={!!editing} />
          </Form.Item>
          <Form.Item name="name" label="点位名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：K0+120 桩位" />
          </Form.Item>
          <Form.Item name="code" label="编号" rules={[{ required: true, message: '请输入编号' }]}>
            <Input placeholder="如：P-001" />
          </Form.Item>
          <Space style={{ display: 'flex' }}>
            <Form.Item name="lng" label="经度">
              <InputNumber style={{ width: 160 }} placeholder="如 114.30" />
            </Form.Item>
            <Form.Item name="lat" label="纬度">
              <InputNumber style={{ width: 160 }} placeholder="如 30.51" />
            </Form.Item>
          </Space>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <div className="muted">提示：还可在上传时通过地图打点 / 手机 GPS 自动定位添加点位</div>
        </Form>
      </Modal>
    </Card>
  )
}

export default Points