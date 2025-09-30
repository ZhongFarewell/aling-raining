import { type RouteObject } from 'react-router-dom'
import { Suspense } from 'react'
import { lazy } from 'react'
import Index from '@@/pages'
export default [
  {
    path: '/',
    index: true,
    Component: Index
  },
  { path: '/rain', Component: () => 1 }
] as RouteObject[]
