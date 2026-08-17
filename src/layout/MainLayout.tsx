import { Layout, Menu, Avatar, Dropdown, Space, Tag, Grid, Drawer, Button } from 'antd'
import {
  HomeOutlined,
  FolderOpenOutlined,
  TagsOutlined,
  AimOutlined,
  LinkOutlined,
  DeleteOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  SendOutlined,
  LogoutOutlined,
  DatabaseOutlined,
  ProjectOutlined,
  ToolOutlined,
  MenuOutlined,
  BankOutlined,
} from '@ant-design/icons'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import Watermark from '../components/Watermark'

const { Sider, Header, Content } = Layout

function MainLayout() {
  const { currentUser, db, logout, isAdmin } = useApp()
  const nav = useNavigate()
  const loc = useLocation()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [drawerOpen, setDrawerOpen] = useState(false)

  const role = db.roles.find((r) => r.id === currentUser?.roleId)

  const menuItems = [
    { key: '/home', icon: <HomeOutlined />, label: '首页' },
    {
      key: 'project-info',
      icon: <ProjectOutlined />,
      label: '项目信息',
      children: [
        { key: '/projects', icon: <FolderOpenOutlined />, label: '项目管理' },
        { key: '/points', icon: <AimOutlined />, label: '船舱管理' },
        { key: '/models', icon: <DatabaseOutlined />, label: '模型管理' },
      ],
    },
    {
      key: 'file-process',
      icon: <ToolOutlined />,
      label: '文件处理',
      children: [
        { key: '/recycle', icon: <DeleteOutlined />, label: '回收站' },
        { key: '/duplicates', icon: <FileSearchOutlined />, label: '重复文件' },
        { key: '/shares', icon: <LinkOutlined />, label: '外链分享' },
      ],
    },
    {
      key: 'admin',
      icon: <TeamOutlined />,
      label: '系统管理',
      children: [
        { key: '/tags', icon: <TagsOutlined />, label: '标签管理' },
        { key: '/logs', icon: <FileTextOutlined />, label: '操作日志' },
        ...(isAdmin
          ? [
              { key: '/admin/units', icon: <BankOutlined />, label: '单位管理' },
              { key: '/admin/users', icon: <UserOutlined />, label: '用户管理' },
              { key: '/admin/roles', icon: <SafetyOutlined />, label: '角色权限' },
              { key: '/admin/transfer', icon: <SendOutlined />, label: '离职转交' },
            ]
          : []),
      ],
    },
  ]

  const allLabelMap = new Map<string, string>()
  const flatten = (items: typeof menuItems) => {
    for (const m of items) {
      if ((m as any).children) {
        flatten((m as any).children)
      } else {
        allLabelMap.set(m.key as string, m.label as string)
      }
    }
  }
  flatten(menuItems)

  const selectedKey =
    [...allLabelMap.keys()].find((k) => loc.pathname.startsWith(k)) || '/home'

  return (
    <Layout className="layout-shell">
      {isMobile ? (
        <Drawer
          title={<span style={{ color: '#1677ff', fontWeight: 600 }}>项目素材管理系统</span>}
          placement="left"
          width={220}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          styles={{ body: { padding: 0 } }}
        >
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => { setDrawerOpen(false); nav(key) }}
          />
        </Drawer>
      ) : (
        <Sider width={220} theme="dark">
          <div className="app-logo">
            <span>项目素材管理系统</span>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => nav(key)}
          />
        </Sider>
      )}
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space>
            {isMobile && (
              <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />
            )}
            <div style={{ fontSize: 15, fontWeight: 500 }}>
              {allLabelMap.get(selectedKey) || '项目素材管理系统'}
            </div>
          </Space>
          <Dropdown
            menu={{
              items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { logout(); nav('/login') } }],
            }}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} size="small" style={{ background: '#1677ff' }} />
              <span>{currentUser?.name}</span>
              {!isMobile && (
                <Tag color={role?.isBuiltin ? 'blue' : 'green'} style={{ margin: 0 }}>
                  {role?.name}
                </Tag>
              )}
            </Space>
          </Dropdown>
        </Header>
        <Content className="content-area">
          <Outlet />
        </Content>
      </Layout>
      <Watermark />
    </Layout>
  )
}

export default MainLayout