# Aling

#### 介绍
个人在开发中整出的一些“奇怪”的组件和react hooks，例如微信朋友圈风格的按钮及上传功能，又或者是预置了一些功能的表单组件AForm。

#### 软件架构
组件基于antd和antd-mobile封装，完全兼容antd原组件的props并新增了一些props，样式方案为Cij使用的库为Mui。

#### hooks
* useCachedSource 缓存远程资源，支持返回string, blob和ArrayBuffer。
* useInfiniteScroll 基于antd-mobile的无限滚动，内置分页状态管理，只需配置一个约定式异步函数。
