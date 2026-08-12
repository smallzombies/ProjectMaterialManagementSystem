import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useApp } from './store/AppContext'
import { publicRoutes, protectedRoutes } from './config/routes'

function App() {
  const { currentUser } = useApp()
  const location = useLocation()

  if (!currentUser) {
    return (
      <Routes location={location} key={location.pathname}>
        {publicRoutes.map((route) => (
          <Route key={route.path} {...route} />
        ))}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes location={location} key={location.pathname}>
      {protectedRoutes.map((route) => (
        <Route key={route.path} {...route}>
          {route.children?.map((child) => (
            <Route key={child.path || 'index'} {...child} />
          ))}
        </Route>
      ))}
    </Routes>
  )
}

export default App
