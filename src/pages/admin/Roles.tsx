import { useState } from 'react'
import { Card, Table, Button, Space, Input, Tag, Modal, Form, Checkbox, Tree } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons'

const { Search } = Input

interface DataType {
  key: string
  name: string
  code: string
  description: string
  userCount: number
  status: string
}

const mockData: DataType[] = [
  { key: '1', name: '超级管理员', code: 'SUPER_ADMIN', description: '拥有所有权限', userCount: 3, status: '启用' },
  { key: '2', name: '系统管理员', code: 'ADMIN', description: '系统管理权限', userCount: 8, status: '启用' },
  { key: '3', name: '编辑', code: 'EDITOR', description: '内容编辑权限', userCount: 15, status: '启用' },
  { key: '4', name: '查看者', code: 'VIEWER', description: '只读权限', userCount: 50, status: '启用' },
]

function Roles() {
  const [modalOpen, setModalOpen] = useState(false)
  const [permissionModalOpen, setPermissionModalOpen] = useState(false)

  const columns = [
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '角色编码', dataIndex: 'code', key: 'code', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '用户数', dataIndex: 'userCount', key: 'userCount' },
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
          <Button type="link" size="small" icon={<SettingOutlined />}>权限</Button>
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      ),
    },
  ]

  const treeData = [
    {
      title: '系统管理',
      key: 'system',
      children: [
        { title: '用户管理', key: 'users' },
        { title: '角色管理', key: 'roles' },
        { title: '部门管理', key: 'units' },
      ],
    },
    {
      title: '素材管理',
      key: 'material',
      children: [
        { title: '项目管理', key: 'projects' },
        { title: '文件管理', key: 'files' },
        { title: '标签管理', key: 'tags' },
      ],
    },
  ]

  return (
    <div className="page-card">
      <div className="toolbar">
        <Search placeholder="搜索角色..." style={{ width: 250 }} allowClear />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建角色</Button>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={mockData} 
        pagination={false}
      />

      <Modal
        title="新建角色"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="角色名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item label="角色编码" name="code" rules={[{ required: true }]}>
            <Input placeholder="请输入角色编码" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="请输入角色描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="权限配置"
        open={permissionModalOpen}
        onCancel={() => setPermissionModalOpen(false)}
        onOk={() => setPermissionModalOpen(false)}
      >
        <Tree checkable defaultExpandAll treeData={treeData} />
      </Modal>
    </div>
  )
}

export default Roles
