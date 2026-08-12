import { useState } from 'react'
import { Card, Table, Button, Space, Input, Tag, Modal, Form, Select } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

const { Search } = Input
const { Option } = Select

interface DataType {
  key: string
  username: string
  email: string
  role: string
  department: string
  status: string
}

const mockData: DataType[] = Array.from({ length: 8 }, (_, i) => ({
  key: String(i + 1),
  username: `user${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: ['管理员', '编辑', '查看者'][Math.floor(Math.random() * 3)],
  department: `部门${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
  status: Math.random() > 0.2 ? '启用' : '禁用',
}))

function Users() {
  const [modalOpen, setModalOpen] = useState(false)

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '角色', dataIndex: 'role', key: 'role', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: '部门', dataIndex: 'department', key: 'department' },
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
        <Search placeholder="搜索用户..." style={{ width: 250 }} allowClear />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建用户</Button>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={mockData} 
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      <Modal
        title="新建用户"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="用户名" name="username" rules={[{ required: true }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true }]}>
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="editor">编辑</Option>
              <Option value="viewer">查看者</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Users
