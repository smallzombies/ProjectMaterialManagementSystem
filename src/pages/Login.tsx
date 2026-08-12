import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useApp } from '../store/AppContext'
import '../styles/index.css'

interface LoginFormValues {
  username: string
  password: string
}

function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useApp()

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true)
    try {
      // 模拟登录，实际项目中应替换为 API 调用
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const user = {
        id: '1',
        username: values.username,
        email: `${values.username}@example.com`,
        role: 'admin',
      }
      
      login(user)
      message.success('登录成功')
      navigate('/home')
    } catch (error) {
      message.error('登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-bg">
      <Card className="login-card" bordered={false}>
        <h1 className="login-title">素材管理系统</h1>
        <p className="login-sub">欢迎登录，请输入您的账号信息</p>
        
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Login
