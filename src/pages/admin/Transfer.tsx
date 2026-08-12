import { useState } from 'react'
import { Card, Table, Button, Space, Input, Tag, Modal, Form, Select, DatePicker, Transfer as AntTransfer } from 'antd'
import { PlusOutlined, SwapOutlined } from '@ant-design/icons'

const { Search } = Input
const { Option } = Select

interface DataType {
  key: string
  title: string
  sourceUser: string
  targetUser: string
  materialType: string
  count: number
  date: string
  status: string
}

const mockData: DataType[] = [
  { key: '1', title: '项目A素材移交', sourceUser: '张三', targetUser: '李四', materialType: '项目', count: 25, date: '2024-01-15', status: '已完成' },
  { key: '2', title: '设计文件移交', sourceUser: '王五', targetUser: '赵六', materialType: '文件', count: 12, date: '2024-01-18', status: '待确认' },
  { key: '3', title: '视频素材移交', sourceUser: '钱七', targetUser: '孙八', materialType: '视频', count: 8, date: '2024-01-20', status: '进行中' },
]

function Transfer() {
  const [modalOpen, setModalOpen] = useState(false)

  const columns = [
    { title: '移交标题', dataIndex: 'title', key: 'title' },
    { title: '移交人', dataIndex: 'sourceUser', key: 'sourceUser' },
    { title: '接收人', dataIndex: 'targetUser', key: 'targetUser' },
    { title: '素材类型', dataIndex: 'materialType', key: 'materialType', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: '数量', dataIndex: 'count', key: 'count' },
    { title: '日期', dataIndex: 'date', key: 'date' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (text: string) => {
        const colorMap: Record<string, string> = {
          '已完成': 'green',
          '待确认': 'orange',
          '进行中': 'blue',
        }
        return <Tag color={colorMap[text] || 'default'}>{text}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="small">
          <Button type="link" size="small">查看</Button>
          <Button type="link" size="small">确认</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-card">
      <div className="toolbar">
        <Search placeholder="搜索移交记录..." style={{ width: 250 }} allowClear />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建移交</Button>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={mockData} 
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新建移交"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={700}
      >
        <Form layout="vertical">
          <Form.Item label="移交标题" name="title" rules={[{ required: true }]}>
            <Input placeholder="请输入移交标题" />
          </Form.Item>
          <Form.Item label="移交人" name="sourceUser" rules={[{ required: true }]}>
            <Select placeholder="请选择移交人">
              <Option value="user1">张三</Option>
              <Option value="user2">李四</Option>
              <Option value="user3">王五</Option>
            </Select>
          </Form.Item>
          <Form.Item label="接收人" name="targetUser" rules={[{ required: true }]}>
            <Select placeholder="请选择接收人">
              <Option value="user1">张三</Option>
              <Option value="user2">李四</Option>
              <Option value="user3">王五</Option>
            </Select>
          </Form.Item>
          <Form.Item label="移交素材" name="materials">
            <AntTransfer
              dataSource={Array.from({ length: 10 }, (_, i) => ({
                key: String(i),
                title: `素材${i + 1}`,
              }))}
              titles={['待移交', '已选']}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Transfer
