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
  Timeline,
  Empty,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, ImportOutlined, ExportOutlined, EditOutlined, DeleteOutlined, StopOutlined, AimOutlined, HistoryOutlined } from '@ant-design/icons'
import { useApp } from '../store/AppContext'
import { pointsApi } from '../api/services'
import { thumbUrl, TYPE_LABEL } from '../utils/format'
import type { Material, Point } from '../types'
import FilePreview from '../components/FilePreview'

function Points() {
  const { db, reloadFromApi } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Point | null>(null)
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [historyPoint, setHistoryPoint] = useState<Point | null>(null)
  const [form] = Form.useForm()

  const visible = db.points.filter((p) => (projectFilter === 'all' ? true : p.projectId === projectFilter))

  const submit = async () => {
    const v = await form.validateFields()
    try {
      const body = { projectId: v.projectId, name: v.name, code: v.code, lat: v.lat, lng: v.lng, remark: v.remark, status: v.status || '启用' }
      if (editing) {
        await pointsApi.update(editing.id, body)
        message.success('船舱已更新')
      } else {
        await pointsApi.create(body)
        message.success('船舱已创建')
      }
      await reloadFromApi()
      setModalOpen(false)
    } catch (e: any) {
      message.error(e?.message || '操作失败')
    }
  }

  const toggle = async (p: Point) => {
    try {
      await pointsApi.update(p.id, { status: p.status === '启用' ? '停用' : '启用' })
      await reloadFromApi()
      message.success(p.status === '启用' ? '船舱已停用（不影响历史素材关联）' : '船舱已启用')
    } catch (e: any) {
      message.error(e?.message || '操作失败')
    }
  }

  const columns: ColumnsType<Point> = [
    { title: '船舱名称', dataIndex: 'name', render: (t: string) => <Space><AimOutlined style={{ color: '#fa8c16' }} />{t}</Space> },
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
          <Button size="small" type="link" icon={<HistoryOutlined />} onClick={() => setHistoryPoint(r)}>历史记录</Button>
          <Popconfirm title="确定删除该船舱？已关联素材不删除" onConfirm={async () => {
            try {
              await pointsApi.remove(r.id)
              await reloadFromApi()
              message.success('船舱已删除')
            } catch (e: any) {
              message.error(e?.message || '删除失败')
            }
          }}>
            <Button size="small" type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="拍摄船舱管理"
      extra={
        <Space>
          <Button icon={<ImportOutlined />} onClick={() => message.info('Excel 导入：支持船舱库批量维护')}>Excel导入</Button>
          <Button icon={<ExportOutlined />} onClick={() => message.info('导出船舱清单')}>导出</Button>
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
            新建船舱
          </Button>
          <span className="muted">船舱按项目隔离，共 {visible.length} 个</span>
        </Space>
      </div>
      <Table rowKey="id" columns={columns} dataSource={visible} pagination={{ pageSize: 10 }} />

      {historyPoint && (
        <Modal
          title={`船舱历史记录 — ${historyPoint.name}（${historyPoint.code}）`}
          open
          onCancel={() => setHistoryPoint(null)}
          footer={null}
          width={680}
        >
          <CabinHistory pointId={historyPoint.id} />
        </Modal>
      )}

      <Modal title={editing ? '编辑船舱' : '新建船舱'} open={modalOpen} onOk={submit} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" label="所属项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select options={db.projects.map((p) => ({ value: p.id, label: p.name }))} disabled={!!editing} />
          </Form.Item>
          <Form.Item name="name" label="船舱名称" rules={[{ required: true, message: '请输入名称' }]}>
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
          <div className="muted">提示：还可在上传时通过地图打点 / 手机 GPS 自动定位添加船舱</div>
        </Form>
      </Modal>
    </Card>
  )
}

function CabinHistory({ pointId }: { pointId: string }) {
  const { db } = useApp()
  const [preview, setPreview] = useState<Material | null>(null)
  const photos = db.materials
    .filter((m) => m.pointId === pointId && m.status === '正常')
    .sort((a, b) => {
      const ta = a.shootingTime || a.uploadTime
      const tb = b.shootingTime || b.uploadTime
      const d = tb.slice(0, 10).localeCompare(ta.slice(0, 10))
      if (d !== 0) return d
      return tb.slice(11).localeCompare(ta.slice(11))
    })

  if (!photos.length) {
    return <Empty description="暂无关联照片" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }

  return (
    <div style={{ maxHeight: 520, overflow: 'auto', padding: '4px 8px' }}>
      <Timeline
        items={photos.map((m) => {
          const uploader = db.users.find((u) => u.id === m.uploaderId)
          const time = m.shootingTime || m.uploadTime
          const timeLabel = `${time.slice(0, 10)} ${time.slice(11, 19)}`
          return {
            dot: <AimOutlined style={{ color: '#fa8c16' }} />,
            children: (
              <div style={{ paddingBottom: 12 }}>
                <div style={{ fontWeight: 600, color: '#1677ff', marginBottom: 8 }}>{timeLabel}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {thumbUrl(m.name, m.id) && (
                    <img
                      src={thumbUrl(m.name, m.id)}
                      alt={m.name}
                      style={{ width: 96, height: 54, objectFit: 'cover', borderRadius: 6, flexShrink: 0, cursor: 'pointer' }}
                      onClick={() => setPreview(m)}
                    />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                    <div className="muted" style={{ marginTop: 2 }}>
                      上传人：{uploader?.name || '-'} · {TYPE_LABEL[m.type]}
                    </div>
                    <Button type="link" size="small" style={{ paddingLeft: 0 }} onClick={() => setPreview(m)}>
                      查看详情
                    </Button>
                  </div>
                </div>
              </div>
            ),
          }
        })}
      />
      <FilePreview material={preview} open={!!preview} onClose={() => setPreview(null)} />
    </div>
  )
}

export default Points