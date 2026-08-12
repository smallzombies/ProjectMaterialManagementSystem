import { Card, Table, Button, Space, Input, Tag } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'

const { Search } = Input

interface DataType {
  key: string
  name: string
  type: string
  size: string
  date: string
  status: string
}

// 模拟数据
const mockData: DataType[] = Array.from({ length: 10 }, (_, i) => ({
  key: String(i + 1),
  name: `素材文件_${i + 1}`,
  type: ['图片', '视频', '文档', '音频'][Math.floor(Math.random() * 4)],
  size: `${(Math.random() * 10).toFixed(1)} MB`,
  date: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
  status: Math.random() > 0.3 ? '正常' : '归档',
}))

function PageComponent() {
  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: '大小', dataIndex: 'size', key: 'size' },
    { title: '日期', dataIndex: 'date', key: 'date' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (text: string) => <Tag color={text === '正常' ? 'green' : 'orange'}>{text}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="small">
          <Button type="link" size="small">查看</Button>
          <Button type="link" size="small">编辑</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-card">
      <div className="toolbar">
        <Search placeholder="搜索..." style={{ width: 250 }} allowClear />
        <Button type="primary" icon={<PlusOutlined />}>新建</Button>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={mockData} 
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />
    </div>
  )
}

export default PageComponent
