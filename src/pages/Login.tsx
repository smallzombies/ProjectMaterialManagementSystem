import { useState } from 'react'
import { Card, Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'

function Login() {
  const { db, login } = useApp()
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)

  const onFinish = (v: { account: string; password: string }) => {
    setLoading(true)
    setTimeout(() => {
      const matched =
        db.users.find((u) => u.name === v.account || u.phone === v.account) ??
        db.users.find((u) => u.id === 'u_admin')
      login(matched?.id || 'u_admin')
      message.success(`欢迎回来，${matched?.name || '系统管理员'}`)
      nav('/home')
    }, 400)
  }

  return (
    <div className="login-bg">
      <Card className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <FolderOpenOutlined style={{ fontSize: 36, color: '#1677ff' }} />
        </div>
        <div className="login-title">项目素材管理系统</div>
        <div className="login-sub">工程建设素材采集、归档与交付平台</div>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="account" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
            <Input prefix={<UserOutlined />} placeholder="请输入账号" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            登 录
          </Button>
        </Form>
        <div className="muted" style={{ textAlign: 'center', marginTop: 12 }}>
          演示环境：任意账号点击登录即可进入系统
        </div>
      </Card>
    </div>
  )
}

export default Login