# Design Document: Rua Documentation Optimization

## Overview

本设计文档描述了 Rua 文档优化的技术实现方案，包括更新 GitHub 仓库地址、添加 Tab 组件支持、修正 Actions API 文档和代码、以及添加 ruactl 教程。

## Architecture

### 文档系统架构

```
apps/docs/
├── content/docs/           # MDX 文档内容
│   ├── getting-started/    # 入门指南
│   ├── user-guide/         # 用户指南 (新增 ruactl.mdx)
│   ├── api/                # API 文档
│   └── extensions/         # 扩展开发文档
├── mdx-components.tsx      # MDX 组件注册 (添加 Tab 组件)
└── package.json            # 依赖配置

packages/rua-api/
├── src/
│   ├── types/
│   │   └── rua.ts          # 类型定义 (移除 RuaClientAPI.actions)
│   └── browser/
│       └── rua-api.ts      # API 实现 (移除 actions)
```

### 变更范围

1. **文档内容更新**: 修改 MDX 文件中的 GitHub URL
2. **组件增强**: 添加 Tab 组件到 mdx-components.tsx
3. **API 代码修改**: 从 RuaClientAPI 移除 actions 属性
4. **新增文档**: 创建 ruactl.mdx 用户指南

## Components and Interfaces

### Tab 组件集成

从 fumadocs-ui 导入 Tab 组件并注册到 MDX：

```typescript
// apps/docs/mdx-components.tsx
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Tab,
    Tabs,
    // ... other components
  };
}
```

### Tab 组件使用示例

```mdx
<Tabs items={['bun', 'npm', 'yarn', 'pnpm']}>
  <Tab value="bun">
    ```bash
    bun install
    ```
  </Tab>
  <Tab value="npm">
    ```bash
    npm install
    ```
  </Tab>
  <Tab value="yarn">
    ```bash
    yarn install
    ```
  </Tab>
  <Tab value="pnpm">
    ```bash
    pnpm install
    ```
  </Tab>
</Tabs>
```

### RuaClientAPI 接口修改

移除 actions 属性，因为它只在 background 模式下可用：

```typescript
// packages/rua-api/src/types/rua.ts
export interface RuaClientAPI {
    extension: ExtensionMeta;
    clipboard: { ... };
    notification: { ... };
    storage: { ... };
    fs: { ... };
    shell: { ... };
    ui: { ... };
    // actions: { ... };  // 移除 - 仅在 MainContextRuaAPI 中可用
    os: { ... };
    on(event: string, handler: EventHandler): void;
    off(event: string, handler: EventHandler): void;
}
```

## Data Models

### 文档文件变更清单

| 文件路径 | 变更类型 | 描述 |
|---------|---------|------|
| `apps/docs/content/docs/index.mdx` | 修改 | 更新 GitHub URL |
| `apps/docs/content/docs/getting-started/installation.mdx` | 修改 | 更新 URL，添加 Tab 组件 |
| `apps/docs/content/docs/api/overview.mdx` | 修改 | 更新 Actions API 文档 |
| `apps/docs/content/docs/extensions/create-rua-ext.mdx` | 修改 | 添加 Tab 组件，更新 API 说明 |
| `apps/docs/content/docs/user-guide/ruactl.mdx` | 新增 | ruactl 使用教程 |
| `apps/docs/content/docs/user-guide/meta.json` | 修改 | 添加 ruactl 导航 |
| `apps/docs/mdx-components.tsx` | 修改 | 添加 Tab 组件 |
| `packages/rua-api/src/types/rua.ts` | 修改 | 移除 RuaClientAPI.actions |
| `packages/rua-api/src/browser/rua-api.ts` | 修改 | 移除 actions 实现 |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

经过分析，大部分需求是关于文档内容的正确性，属于示例测试而非属性测试。唯一可以作为属性测试的是 TypeScript 类型正确性：

- 5.4 关于 RuaClientAPI 不应包含 actions 属性 - 这可以通过 TypeScript 编译器验证

由于文档优化主要是内容更新，不涉及复杂的业务逻辑，因此不需要属性测试。类型正确性将通过 TypeScript 编译检查来验证。

## Error Handling

### 文档构建错误

- Tab 组件未正确导入时，MDX 编译会失败
- 解决方案：确保在 mdx-components.tsx 中正确注册组件

### TypeScript 类型错误

- 移除 actions 后，使用该 API 的代码会产生编译错误
- 解决方案：更新所有使用 actions API 的代码示例

## Testing Strategy

### 类型检查

使用 TypeScript 编译器验证类型正确性：

```bash
cd packages/rua-api && bun run types:check
cd apps/docs && bun run types:check
```

### 文档构建测试

验证文档能够正确构建：

```bash
cd apps/docs && bun run build
```

### 手动验证清单

1. 验证所有 GitHub 链接指向 `github.com/fzdwx/rua`
2. 验证 Tab 组件在各页面正常显示
3. 验证 API 文档准确描述了 view 和 background 模式的区别
4. 验证 ruactl 文档包含所有命令说明
