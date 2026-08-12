import { Card, Row, Col, Statistic } from 'antd'
import { FolderOutlined, FileTextOutlined, ShareAltOutlined, UserOutlined } from '@ant-design/icons'

function Home() {
  return (
    <div className="page-card">
      <h2 style={{ marginBottom: 24 }}>工作台</h2>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="项目总数"
              value={128}
              prefix={<FolderOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="文件总数"
              value={2048}
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="分享链接"
              value={64}
              prefix={<ShareAltOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="用户数"
              value={32}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Home
