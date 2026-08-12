import { Navigate, RouteObject } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import Login from '../pages/Login'
import Home from '../pages/Home'
import Projects from '../pages/Projects'
import ProjectFiles from '../pages/ProjectFiles'
import Tags from '../pages/Tags'
import Points from '../pages/Points'
import Shares from '../pages/Shares'
import RecycleBin from '../pages/RecycleBin'
import Duplicates from '../pages/Duplicates'
import Models from '../pages/Models'
import Logs from '../pages/Logs'
import Users from '../pages/admin/Users'
import Units from '../pages/admin/Units'
import Roles from '../pages/admin/Roles'
import Transfer from '../pages/admin/Transfer'

// 公共路由（无需登录）
export const publicRoutes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
  },
]

// 受保护的路由（需要登录）
export const protectedRoutes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        path: 'home',
        element: <Home />,
      },
      {
        path: 'projects',
        element: <Projects />,
      },
      {
        path: 'projects/:projectId',
        element: <ProjectFiles />,
      },
      {
        path: 'tags',
        element: <Tags />,
      },
      {
        path: 'points',
        element: <Points />,
      },
      {
        path: 'shares',
        element: <Shares />,
      },
      {
        path: 'recycle',
        element: <RecycleBin />,
      },
      {
        path: 'duplicates',
        element: <Duplicates />,
      },
      {
        path: 'models',
        element: <Models />,
      },
      {
        path: 'logs',
        element: <Logs />,
      },
      {
        path: 'admin',
        children: [
          {
            path: 'units',
            element: <Units />,
          },
          {
            path: 'users',
            element: <Users />,
          },
          {
            path: 'roles',
            element: <Roles />,
          },
          {
            path: 'transfer',
            element: <Transfer />,
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/home" replace />,
      },
    ],
  },
]
