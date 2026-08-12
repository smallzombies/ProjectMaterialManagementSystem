import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { Layout, Menu, theme } from 'antd'
import {
  HomeOutlined,
  FolderOutlined,
  TagOutlined,
  EnvironmentOutlined,
  ShareAltOutlined,
  DeleteOutlined,
  CopyOutlined,
  CubeOutlined,
  FileTextOutlined,
  TeamOutlined,
  AppstoreOutlined,
  UsergroupAddOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useApp } from '../store/AppContext'

const { Header, Content, Sider } = Layout

const MainLayout: React.FC = () => {
  const { currentUser, logout } = useApp()
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  const menuItems: MenuProps['items'] = [
    {
      key: '/home',
      icon: <HomeOutlined />,
      label: <Link to="/home">首页</Link>,
    },
    {
      key: '/projects',
      icon: <FolderOutlined />,
      label: <Link to="/projects">项目管理</Link>,
    },
    {
      key: '/tags',
      icon: <TagOutlined />,
      label: <Link to="/tags">标签管理</Link>,
    },
    {
      key: '/points',
      icon: <EnvironmentOutlined />,
      label: <Link to="/points">点位管理</Link>,
    },
    {
      key: '/shares',
      icon: <ShareAltOutlined />,
      label: <Link to="/shares">分享管理</Link>,
    },
    {
      key: '/recycle',
      icon: <DeleteOutlined />,
      label: <Link to="/recycle">回收站</Link>,
    },
    {
      key: '/duplicates',
      icon: <CopyOutlined />,
      label: <Link to="/duplicates">重复项</Link>,
    },
    {
      key: '/models',
      icon: <CubeOutlined />,
      label: <Link to="/models">模型管理</Link>,
    },
    {
      key: '/logs',
      icon: <FileTextOutlined />,
      label: <Link to="/logs">日志管理</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: 'admin',
      icon: <TeamOutlined />,
      label: '系统管理',
      children: [
        {
          key: '/admin/units',
          icon: <AppstoreOutlined />,
          label: <Link to="/admin/units">单位管理</Link>,
        },
        {
          key: '/admin/users',
          icon: <UsergroupAddOutlined />,
          label: <Link to="/admin/users">用户管理</Link>,
        },
        {
          key: '/admin/roles',
          icon: <TeamOutlined />,
          label: <Link to="/admin/roles">角色管理</Link>,
        },
        {
          key: '/admin/transfer',
          icon: <SwapOutlined />,
          label: <Link to="/admin/transfer">权限转移</Link>,
        },
      ],
    },
  ]

  const selectedKey = location.pathname.startsWith('/admin')
    ? location.pathname
    : location.pathname

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6 }} />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>项目素材管理系统</h2>
          <div>
            <span style={{ marginRight: 16 }}>{currentUser.name}</span>
            <a onClick={logout}>退出登录</a>
          </div>
        </Header>
        <Content style={{ margin: 16 }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
