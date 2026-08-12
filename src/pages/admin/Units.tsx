import { useState } from 'react'
import { Card, Table, Button, Space, Input, Tag, Modal, Form, TreeSelect } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

const { Search } = Input
const { SHOW_PARENT } = TreeSelect

interface DataType {
  key: string
  name: string
  code: string
  parentUnit?: string
  level: string
  status: string
}

const mockData: DataType[] = [
  { key: '1', name: '总公司', code: 'HQ001', parentUnit: '-', level: '1', status: '启用' },
  { key: '2', name: '研发中心', code: 'RD001', parentUnit: '总公司', level: '2', status: '启用' },
  { key: '3', name: '市场部', code: 'MK001', parentUnit: '总公司', level: '2', status: '启用' },
  { key: '4', name: '前端组', code: 'FE001', parentUnit: '研发中心', level: '3', status: '启用' },
  { key: '5', name: '后端组', code: 'BE001', parentUnit: '研发中心', level: '3', status: '启用' },
]

function Units() {
  const [modalOpen, setModalOpen] = useState(false)

  const columns = [
    { title: '部门名称', dataIndex: 'name', key: 'name' },
    { title: '部门编码', dataIndex: 'code', key: 'code' },
    { title: '上级部门', dataIndex: 'parentUnit', key: 'parentUnit' },
    { title: '层级', dataIndex: 'level', key: 'level', render: (text: string) => <Tag>{text}级</Tag> },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (text: string) => <Tag color={text === '启用' ? 'green' : 'red'}>{text}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-card">
      <div className="toolbar">
        <Search placeholder="搜索部门..." style={{ width: 250 }} allowClear />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建部门</Button>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={mockData} 
        pagination={false}
      />

      <Modal
        title="新建部门"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="部门名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item label="部门编码" name="code" rules={[{ required: true }]}>
            <Input placeholder="请输入部门编码" />
          </Form.Item>
          <Form.Item label="上级部门" name="parentUnit">
            <TreeSelect
              placeholder="请选择上级部门"
              treeData={[
                { title: '总公司', value: '总公司', children: [
                  { title: '研发中心', value: '研发中心' },
                  { title: '市场部', value: '市场部' },
                ]},
              ]}
              treeCheckable
              showCheckedStrategy={SHOW_PARENT}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Units
