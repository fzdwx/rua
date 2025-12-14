# Implementation Plan

- [x] 1. 添加 Tab 组件支持
  - [x] 1.1 在 mdx-components.tsx 中导入并注册 Tab 和 Tabs 组件
    - 从 fumadocs-ui/components/tabs 导入组件
    - 添加到 getMDXComponents 返回对象中
    - _Requirements: 2.1_

- [x] 2. 更新 GitHub 仓库地址
  - [x] 2.1 更新 index.mdx 中的 GitHub 链接
    - 将 `your-org/rua` 替换为 `fzdwx/rua`
    - _Requirements: 1.1, 1.2_
  - [x] 2.2 更新 installation.mdx 中的 GitHub 链接
    - 更新下载链接和克隆命令
    - _Requirements: 1.1, 4.2_

- [x] 3. 使用 Tab 组件重构安装文档
  - [x] 3.1 重构 installation.mdx 中的依赖安装命令
    - 使用 Tabs 组件展示 Ubuntu/Fedora/Arch 的安装命令
    - _Requirements: 2.3, 4.3_
  - [x] 3.2 重构 installation.mdx 中的包管理器命令
    - 使用 Tabs 组件展示 bun/npm/yarn/pnpm 命令
    - _Requirements: 2.1, 2.2_

- [x] 4. 修改 rua-api 代码移除 view 模式的 actions API
  - [x] 4.1 更新 RuaClientAPI 接口移除 actions 属性
    - 修改 packages/rua-api/src/types/rua.ts
    - 从 RuaClientAPI 接口中删除 actions 属性定义
    - _Requirements: 5.4_
  - [x] 4.2 更新 rua-api.ts 移除 actions 实现
    - 修改 packages/rua-api/src/browser/rua-api.ts
    - 从 initializeRuaAPI 返回的对象中移除 actions
    - _Requirements: 5.5_

- [x] 5. Checkpoint - 确保类型检查通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. 更新 API 文档
  - [x] 6.1 更新 api/overview.mdx 说明 Actions API 仅在 background 模式可用
    - 明确区分 view 模式和 background 模式的 API
    - 更新代码示例使用正确的 API 初始化方法
    - _Requirements: 3.1, 3.2, 5.1, 5.2, 5.3_
  - [x] 6.2 更新 extensions/create-rua-ext.mdx
    - 添加 Tab 组件展示包管理器命令
    - 更新 background 模式的 API 使用说明
    - _Requirements: 2.1, 3.3_

- [x] 7. 创建 ruactl 文档
  - [x] 7.1 创建 user-guide/ruactl.mdx
    - 包含安装方法（本地安装、系统安装）
    - 包含所有命令说明（toggle, health, validate, pack）
    - 包含 Hyprland 集成配置示例
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 7.2 更新 user-guide/meta.json 添加 ruactl 导航
    - 在导航中添加 ruactl 页面链接
    - _Requirements: 6.1_

- [ ] 8. Final Checkpoint - 确保文档构建成功
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. API refrence 中关于插件权限的部分描述有问题

- [x] 10. 其他修改
    - [x] rua 项目的 readme 可以修改的更简单一点，详细的可以 docs 的网站去看




