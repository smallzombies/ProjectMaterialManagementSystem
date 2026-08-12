import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, theme } from 'antd'
import {
  HomeOutlined,
  FolderOutlined,
  TagOutlined,
  EnvironmentOutlined,
  ShareAltOutlined,
  DeleteOutlined,
  CopyOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
  SafetyOutlined,
  SwapOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useApp } from '../store/AppContext'
import './MainLayout.css'

const { Header, Sider, Content } = Layout

function MainLayout() {
  const { currentUser, logout } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken()

  const menuItems: MenuProps['items'] = [
    { key: '/home', icon: <HomeOutlined />, label: '首页' },
    { key: '/projects', icon: <FolderOutlined />, label: '项目' },
    { key: '/tags', icon: <TagOutlined />, label: '标签' },
    { key: '/points', icon: <EnvironmentOutlined />, label: '点位' },
    { key: '/shares', icon: <ShareAltOutlined />, label: '分享' },
    { key: '/recycle', icon: <DeleteOutlined />, label: '回收站' },
    { key: '/duplicates', icon: <CopyOutlined />, label: '重复文件' },
    { key: '/models', icon: <AppstoreOutlined />, label: '模型' },
    { key: '/logs', icon: <FileTextOutlined />, label: '日志' },
    {
      key: 'admin',
      icon: <TeamOutlined />,
      label: '管理',
      children: [
        { key: '/admin/units', icon: <UserOutlined />, label: '部门管理' },
        { key: '/admin/users', icon: <UserOutlined />, label: '用户管理' },
        { key: '/admin/roles', icon: <SafetyOutlined />, label: '角色管理' },
        { key: '/admin/transfer', icon: <SwapOutlined />, label: '移交管理' },
      ],
    },
  ]

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  return (
    <Layout className="layout-shell">
      <Sider collapsible breakpoint="lg" collapsedWidth="80">
        <div className="app-logo">
          <FolderOutlined />
          <span>素材管理系统</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{currentUser?.username || '用户'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '16px',
            padding: 16,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
