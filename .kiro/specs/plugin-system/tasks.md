# Implementation Plan

## Phase 1: 项目结构重构为 Monorepo

- [x] 1. 重构项目为 monorepo 结构
  - [x] 1.1 创建根目录 workspace 配置
    - 更新根 `package.json` 添加 workspaces 配置
    - 配置 bun workspace
    - _Requirements: 9.1, 9.4_
  - [x] 1.2 迁移主应用到 apps/rua 目录
    - 创建 `apps/rua` 目录
    - 移动 `src/` 到 `apps/rua/src/`
    - 移动 `src-tauri/` 到 `apps/rua/src-tauri/`
    - 移动前端配置文件 (vite.config.ts, tsconfig.json, tailwind.config.ts 等)
    - 更新 `apps/rua/package.json`
    - 更新 Tauri 配置中的路径引用
    - _Requirements: 9.1_
  - [x] 1.3 创建 rua-api 包基础结构
    - 创建 `packages/rua-api/` 目录
    - 创建 `packages/rua-api/package.json`
    - 创建 `packages/rua-api/tsconfig.json`
    - 创建 `packages/rua-api/src/index.ts` 入口文件
    - _Requirements: 9.2, 9.3_
  - [x] 1.4 验证 monorepo 构建配置
    - 确保 `bun install` 正确链接 workspace 依赖
    - 确保 `apps/rua` 可以正常构建和运行
    - _Requirements: 9.4_

## Phase 2: rua-api 核心类型定义

- [x] 2. 定义插件系统核心类型
  - [x] 2.1 创建 Plugin Manifest 类型定义
    - 定义 `PluginManifest` 接口
    - 定义 `PluginPermission` 类型
    - 创建 `packages/rua-api/src/types/manifest.ts`
    - _Requirements: 3.1, 3.2_
  - [x] 2.2 创建 Plugin Action 类型定义
    - 定义 `PluginAction` 接口
    - 定义 `ActionContext` 接口
    - 定义 `ViewProps` 接口
    - 创建 `packages/rua-api/src/types/action.ts`
    - _Requirements: 4.1_
  - [x] 2.3 创建 Plugin API 类型定义
    - 定义 `PluginAPI` 接口
    - 定义各子 API 接口 (clipboard, notification, storage)
    - 创建 `packages/rua-api/src/types/api.ts`
    - _Requirements: 5.1, 5.3_
  - [x] 2.4 创建 Plugin Registry 类型定义
    - 定义 `PluginInfo` 接口
    - 定义 `PluginState` 接口
    - 定义 `RegistryState` 接口
    - 定义 `PluginRegistryEvent` 类型
    - 创建 `packages/rua-api/src/types/registry.ts`
    - _Requirements: 6.1, 6.3_
  - [x] 2.5 导出所有类型
    - 创建 `packages/rua-api/src/types/index.ts`
    - 从主入口 `src/index.ts` 导出类型
    - _Requirements: 9.2_

## Phase 3: Manifest 验证器

- [x] 3. 实现 Manifest 验证器
  - [x] 3.1 实现 manifest 解析和验证逻辑
    - 创建 `validateManifest()` 函数
    - 验证必填字段 (id, name, version, main)
    - 验证权限字段格式
    - 创建 `packages/rua-api/src/manifest/validator.ts`
    - _Requirements: 1.2, 3.1, 3.2_
  - [x] 3.2 实现 manifest 序列化
    - 创建 `serializeManifest()` 函数
    - 创建 `deserializeManifest()` 函数
    - _Requirements: 3.3_
  - [x] 3.3 实现 manifest 格式化输出
    - 创建 `formatManifest()` 函数用于显示插件信息
    - _Requirements: 3.4_

## Phase 4: Plugin Registry 实现

- [x] 4. 实现 Plugin Registry
  - [x] 4.1 实现 Registry 状态管理
    - 创建 `PluginRegistry` 类
    - 实现状态加载和保存 (registry.json)
    - 实现事件发射机制
    - 创建 `packages/rua-api/src/registry/plugin-registry.ts`
    - _Requirements: 2.3, 8.3_
  - [x] 4.2 实现插件安装功能
    - 实现 `install()` 方法
    - 验证 manifest
    - 复制插件文件到 Plugin Store
    - 处理重复插件 ID
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 4.3 实现插件卸载功能
    - 实现 `uninstall()` 方法
    - 移除插件文件
    - 清理注册的 Actions
    - _Requirements: 6.2_
  - [x] 4.4 实现插件启用/禁用功能
    - 实现 `enable()` 方法
    - 实现 `disable()` 方法
    - 持久化启用状态
    - _Requirements: 2.1, 2.2_
  - [x] 4.5 实现插件查询功能
    - 实现 `getPlugin()` 方法
    - 实现 `getAllPlugins()` 方法
    - 实现 `getEnabledPlugins()` 方法
    - _Requirements: 6.1, 6.3_

## Phase 5: Plugin Loader 实现

- [x] 5. 实现 Plugin Loader
  - [x] 5.1 实现插件加载逻辑
    - 创建 `PluginLoader` 类
    - 实现动态导入插件模块
    - 实现加载超时处理 (5秒)
    - 创建 `packages/rua-api/src/loader/plugin-loader.ts`
    - _Requirements: 8.1, 8.2_
  - [x] 5.2 实现插件卸载逻辑
    - 实现 `unload()` 方法
    - 调用插件的 `deactivate()` 钩子
    - 清理插件资源
    - _Requirements: 4.3_
  - [x] 5.3 实现异步批量加载
    - 实现并行加载多个插件
    - 单个插件失败不影响其他插件
    - 发射 ready 事件
    - _Requirements: 8.1, 8.3_

## Phase 6: Plugin API 实现

- [x] 6. 实现 Plugin API
  - [x] 6.1 实现 Action 注册 API
    - 创建 `createPluginAPI()` 工厂函数
    - 实现 `registerActions()` 方法，添加命名空间前缀
    - 实现 `unregisterActions()` 方法
    - 实现父 Action 验证
    - 创建 `packages/rua-api/src/api/plugin-api.ts`
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 6.2 实现权限检查机制
    - 创建权限检查装饰器/包装器
    - 实现权限违规日志记录
    - 创建 `packages/rua-api/src/api/permissions.ts`
    - _Requirements: 5.1, 5.2_
  - [x] 6.3 实现 Clipboard API
    - 实现 `clipboard.read()` 方法
    - 实现 `clipboard.write()` 方法
    - 添加权限检查
    - _Requirements: 5.1_
  - [x] 6.4 实现 Notification API
    - 实现 `notification.show()` 方法
    - _Requirements: 5.3_
  - [x] 6.5 实现 Storage API
    - 实现 `storage.get()` 方法
    - 实现 `storage.set()` 方法
    - 实现 `storage.remove()` 方法
    - 使用插件 ID 作为存储命名空间
    - _Requirements: 5.1_
  - [x] 6.6 实现事件系统
    - 实现 `on()`, `off()`, `emit()` 方法
    - _Requirements: 1.4, 8.3_

## Phase 7: 插件视图支持

- [x] 7. 实现插件自定义视图支持
  - [x] 7.1 实现视图注册机制
    - 实现 `registerView()` 方法
    - 创建视图组件映射
    - _Requirements: 7.1_
  - [x] 7.2 实现 Plugin Error Boundary
    - 创建 `PluginErrorBoundary` 组件
    - 创建 `PluginErrorFallback` 组件
    - 捕获插件视图错误，显示友好错误界面
    - 创建 `packages/rua-api/src/components/PluginErrorBoundary.tsx`
    - _Requirements: 7.3_
  - [x] 7.3 实现作用域上下文
    - 创建 `PluginContext` 
    - 根据权限过滤可用 API
    - _Requirements: 7.2_

## Phase 8: 共享 UI 组件

- [x] 8. 导出共享 UI 组件
  - [x] 8.1 迁移可复用组件到 rua-api
    - 迁移 Button, Input, Card 等基础组件
    - 创建 `packages/rua-api/src/components/ui/`
    - _Requirements: 10.1, 10.2_
  - [x] 8.2 导出组件和类型
    - 从 `packages/rua-api/src/index.ts` 导出组件
    - 确保 TypeScript 类型定义完整
    - _Requirements: 10.3_

## Phase 9: 主应用集成

- [x] 9. 在主应用中集成插件系统
  - [x] 9.1 创建 PluginProvider
    - 创建 React Context 提供插件系统访问
    - 初始化 Plugin Registry
    - 创建 `apps/rua/src/contexts/PluginContext.tsx`
    - _Requirements: 8.1_
  - [x] 9.2 集成插件 Actions 到 Action Store
    - 修改 `useBuiltInActions` 或创建 `usePluginActions`
    - 合并插件 Actions 到主 Action 列表
    - _Requirements: 4.1_
  - [x] 9.3 创建插件管理界面
    - 创建插件列表视图
    - 实现启用/禁用切换
    - 实现插件详情显示
    - 实现插件卸载功能
    - 创建 `apps/rua/src/components/plugin-manager/`
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 9.4 添加插件管理入口 Action
    - 在内置 Actions 中添加 "Manage Plugins" 命令
    - _Requirements: 6.1_

## Phase 10: 最终验证

- [x] 10. 最终验证和清理
  - [x] 10.1 验证完整构建流程
    - 确保 `bun install` 和 `bun run build` 正常工作
    - 确保 Tauri 应用可以正常打包
    - _Requirements: 9.1, 9.4_
  - [x] 10.2 创建示例插件
    - 创建一个简单的示例插件展示 API 用法
    - 包含 manifest.json 和基本功能
    - _Requirements: 1.1, 4.1_
  - [x] 10.3 更新文档
    - 更新 README 说明新的项目结构
    - 添加插件开发指南
