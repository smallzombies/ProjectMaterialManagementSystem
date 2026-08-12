import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { BrowserRouter } from 'react-router-dom'
import './styles/index.css'
import { AppProvider } from './store/AppContext'
import AppRoutes from './routes/AppRoutes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff' } }}>
      <BrowserRouter>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>,
)