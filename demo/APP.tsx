import React, { Suspense } from 'react'
import routes from './routes'
import { ThemeProvider } from '@mui/system'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { createBrowserRouter, createHashRouter, RouterProvider } from 'react-router-dom'
const router = createBrowserRouter(
  routes,
  process.env.NODE_ENV == 'production' ? { basename: '/blog/markdown-editor/' } : undefined
)
//const router = createBrowserRouter(routes, { basename: "/blog/example/" })

export default () => (
  <ConfigProvider locale={zhCN}>
    <RouterProvider router={router}></RouterProvider>
  </ConfigProvider>
)
