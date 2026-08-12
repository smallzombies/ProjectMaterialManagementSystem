import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './store/AppContext'
import MainLayout from './layout/MainLayout'
import Login from './pages/Login'
import Home from './pages/Home'
import Projects from './pages/Projects'
import ProjectFiles from './pages/ProjectFiles'
import Tags from './pages/Tags'
import Points from './pages/Points'
import Shares from './pages/Shares'
import RecycleBin from './pages/RecycleBin'
import Duplicates from './pages/Duplicates'
import Models from './pages/Models'
import Logs from './pages/Logs'
import Users from './pages/admin/Users'
import Units from './pages/admin/Units'
import Roles from './pages/admin/Roles'
import Transfer from './pages/admin/Transfer'

function App() {
  const { currentUser } = useApp()

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectFiles />} />
        <Route path="/tags" element={<Tags />} />
        <Route path="/points" element={<Points />} />
        <Route path="/shares" element={<Shares />} />
        <Route path="/recycle" element={<RecycleBin />} />
        <Route path="/duplicates" element={<Duplicates />} />
        <Route path="/models" element={<Models />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/admin/units" element={<Units />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/roles" element={<Roles />} />
        <Route path="/admin/transfer" element={<Transfer />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  )
}

export default App