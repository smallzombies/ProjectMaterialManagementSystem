import { useState } from 'react'
import { Card, Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { authApi } from '../api/services'

function Login() {
  const { login } = useApp()
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)

  const onFinish = async (v: { account: string; password: string }) => {
    setLoading(true)
    try {
      const res = await authApi.login(v.account, v.password)
      login(res.token, res.user)
      message.success(`欢迎回来，${res.user.name}`)
      nav('/home')
    } catch (e: any) {
      message.error(e?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-bg">
      <Card className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <FolderOpenOutlined style={{ fontSize: 36, color: '#1677ff' }} />
        </div>
        <div className="login-title">船舶健康管理平台</div>
        <div className="login-sub">工程建设素材采集、归档与交付平台</div>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="account" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名或手机号" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            登 录
          </Button>
        </Form>
        <div className="muted" style={{ textAlign: 'center', marginTop: 12 }}>
          演示账号：u_admin（系统管理员）；初始密码：123456
        </div>
      </Card>
    </div>
  )
}

export default Login
