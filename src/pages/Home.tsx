import { Card, Row, Col, Statistic, List, Tag, Empty, Button, Space, Grid } from 'antd'
import {
  FolderOpenOutlined,
  PictureOutlined,
  DatabaseOutlined,
  AimOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'

function Home() {
  const { db, currentUser } = useApp()
  const nav = useNavigate()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  const myProjects = db.projects.filter(
    (p) => currentUser?.projectIds.includes(p.id) || currentUser?.roleId === 'admin',
  )
  const myMaterials = db.materials.filter(
    (m) => (currentUser?.projectIds.includes(m.projectId) || currentUser?.roleId === 'admin') && m.status === '正常',
  )
  const recentLogs = [...db.logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, isMobile ? 5 : 8)

  const stats = [
    { title: '我的项目', value: myProjects.length, icon: <FolderOpenOutlined />, color: '#1677ff', link: '/projects' },
    { title: '素材总数', value: myMaterials.length, icon: <PictureOutlined />, color: '#52c41a', link: '/projects' },
    { title: '船舱数量', value: db.points.filter((p) => myProjects.some((pr) => pr.id === p.projectId)).length, icon: <AimOutlined />, color: '#fa8c16', link: '/points' },
    { title: '三维模型', value: db.models.length, icon: <DatabaseOutlined />, color: '#722ed1', link: '/models' },
  ]

  return (
    <div>
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
        {stats.map((s) => (
          <Col xs={12} md={6} key={s.title}>
            <Card onClick={() => nav(s.link)} className="pointer" hoverable size={isMobile ? 'small' : 'default'}>
              <Statistic
                title={s.title}
                value={s.value}
                prefix={
                  <span style={{ color: s.color, marginRight: isMobile ? 4 : 8, fontSize: isMobile ? 18 : 22 }}>
                    {s.icon}
                  </span>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginTop: isMobile ? 8 : 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title="最近操作日志"
            size={isMobile ? 'small' : 'default'}
            extra={
              <Button type="link" size="small" onClick={() => nav('/logs')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            }
          >
            <List
              size="small"
              dataSource={recentLogs}
              renderItem={(l) => {
                const u = db.users.find((x) => x.id === l.userId)
                return (
                  <List.Item style={isMobile ? { padding: '8px 0' } : undefined}>
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Space style={{ width: '100%' }} wrap>
                        <b>{u?.name}</b>
                        <Tag color="blue" style={{ margin: 0 }}>{l.actionType}</Tag>
                      </Space>
                      <div className="ellipsis" style={{ color: '#666', fontSize: 13 }}>
                        {l.materialName || l.detail}
                      </div>
                      <span className="muted">{l.createdAt}</span>
                    </Space>
                  </List.Item>
                )
              }}
              locale={{ emptyText: <Empty description="暂无日志" /> }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="快捷入口" size={isMobile ? 'small' : 'default'}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {myProjects.map((p) => (
                <Button
                  key={p.id}
                  block
                  icon={<FolderOpenOutlined />}
                  onClick={() => nav(`/projects/${p.id}`)}
                  style={{ textAlign: 'left', height: 'auto', padding: '10px 16px', whiteSpace: 'normal' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span>{p.name}</span>
                    <Tag color={p.status === '在建' ? 'processing' : 'default'} style={{ flexShrink: 0 }}>{p.status}</Tag>
                  </div>
                </Button>
              ))}
              {myProjects.length === 0 && <Empty description="暂无可用项目" />}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Home