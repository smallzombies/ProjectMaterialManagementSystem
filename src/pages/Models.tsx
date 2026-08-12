import { useState } from 'react'
import { Card, Table, Tag, Space, Button, message, Modal, Form, Select, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons'
import { useApp } from '../store/AppContext'
import { fmtSize, fmtDate } from '../utils/format'
import { uid } from '../mock/db'
import type { Model } from '../types'

function Models() {
  const { db, refresh, update, currentUser } = useApp()
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const submit = () => {
    form.validateFields().then((v) => {
      const next = { ...db }
      next.models.push({
        id: uid('mo'),
        modelType: v.modelType,
        name: v.name,
        format: v.format,
        size: v.size ? v.size : 4 * 1024 * 1024 * 1024,
        projectId: v.projectId,
        storagePath: `/models/${uid('mo')}`,
        crs: v.crs,
        createBy: currentUser?.id || '',
        createTime: new Date().toISOString().slice(0, 19),
      })
      update(next)
      refresh()
      setOpen(false)
      message.success('模型登记完成，正在分片上传…')
    })
  }

  const columns: ColumnsType<Model> = [
    { title: '模型名称', dataIndex: 'name' },
    {
      title: '类型',
      dataIndex: 'modelType',
      render: (t: string) => <Tag color={t === '倾斜摄影' ? 'geekblue' : 'green'}>{t}</Tag>,
    },
    { title: '格式', dataIndex: 'format' },
    { title: '大小', dataIndex: 'size', render: (s: number) => fmtSize(s) },
    {
      title: '所属项目',
      dataIndex: 'projectId',
      render: (v: string) => db.projects.find((p) => p.id === v)?.name || '-',
    },
    { title: '坐标系', dataIndex: 'crs', render: (v?: string) => v || '-' },
    { title: '上传时间', dataIndex: 'createTime', render: (v: string) => fmtDate(v) },
    {
      title: '操作',
      width: 120,
      render: (_: unknown) => (
        <Space>
          <Button size="small" type="link" onClick={() => message.info('打开三维/点云浏览器（LOD 分级加载，PC 端查看）')}>
            查看
          </Button>
          <Button size="small" type="link" icon={<DownloadOutlined />} onClick={() => message.info('模型下载演示')} />
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="模型管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setOpen(true) }}>
          添加模型
        </Button>
      }
    >
      <div className="muted" style={{ marginBottom: 12 }}>
        支持倾斜摄影（osgb/3Dtiles 等）与激光点云（las/laz 等），模型自带坐标系自动定位；浏览器 LOD 分级加载，仅 PC 端查看。
      </div>
      <Table rowKey="id" columns={columns} dataSource={db.models} pagination={false} />

      <Modal title="添加模型" open={open} onOk={submit} onCancel={() => setOpen(false)} width={560} destroyOnClose>
        <Form form={form} layout="vertical" initialValues={{ modelType: '倾斜摄影', format: 'osgb' }}>
          <Form.Item name="projectId" label="所属项目" rules={[{ required: true }]}>
            <Select options={db.projects.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
          <Form.Item name="modelType" label="模型类型">
            <Select options={[{ value: '倾斜摄影', label: '倾斜摄影' }, { value: '点云', label: '激光点云' }]} />
          </Form.Item>
          <Form.Item name="name" label="模型名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：滨江大道倾斜摄影模型" />
          </Form.Item>
          <Form.Item name="format" label="数据格式">
            <Input placeholder="osgb / obj / gltf / 3dtiles / las / laz / ply" />
          </Form.Item>
          <Form.Item name="crs" label="坐标系（可选）">
            <Input placeholder="如 EPSG:4490，默认读取模型自带坐标" />
          </Form.Item>
          <div className="muted">大文件使用分片上传 + 断点续传；同一位置可并存倾斜摄影与点云多套模型。</div>
        </Form>
      </Modal>
    </Card>
  )
}

export default Models