# Rua Extension Development Guide

本指南介绍如何为 Rua 命令面板开发扩展。

## 快速开始

### 使用 CLI 创建扩展

```bash
bunx create-rua-ext my-extension
```

### 测试扩展

1. **创建扩展**
   ```bash
   bunx create-rua-ext my-test-extension
   cd my-test-extension
   
   # 如果选择了 Vite 构建
   bun install
   bun run build
   ```

2. **开发模式预览（推荐）**
   
   开发模式允许你在不安装扩展的情况下实时预览：
   
   - 打开 Rua 命令面板
   - 搜索 "Manage Extensions" 或 "扩展管理"
   - 在 **Development Mode** 区域输入扩展目录的完整路径(不需要是dist目录)
   - 点击 "Start" 按钮
   - 扩展会以 `[DEV]` 前缀显示在列表中
   - 修改代码后，会自动热加载
   - 开发完成后点击 "Stop" 停止开发模式

   ```bash
   # 开发流程示例
   cd my-test-extension
   bun run dev          # 启动 Vite 开发服务器（如果使用 Vite）
   
   # 在另一个终端
   bun run build        # 构建后在 Rua 中刷新查看效果
   ```

3. **安装到 Rua**
   
   开发完成后，可以正式安装扩展：
   - 在 Extension Manager 的安装输入框中输入扩展目录路径
   - 点击 "Install" 按钮
   - 扩展会被复制到扩展目录中

4. **扩展目录位置**
   - Linux: `~/.local/share/like.rua.ai/extensions/`
   - macOS: `~/Library/Application Support/like.rua.ai/extensions/`
   - Windows: `%APPDATA%/like.rua.ai/extensions/`

### 手动创建扩展目录结构

```
my-extension/
├── manifest.json    # 必需：扩展配置文件
├── index.html       # 可选：UI 入口（view 模式需要）
├── init.js          # 可选：初始化脚本
└── assets/          # 可选：静态资源
```

### 编写 manifest.json

```json
{
  "id": "author.my-extension",
  "name": "My Extension",
  "version": "1.0.0",
  "description": "A description of my extension",
  "author": "Your Name",
  "rua": {
    "engineVersion": "^0.1.0",
    "ui": {
      "entry": "index.html"
    },
    "init": "init.js",
    "actions": [
      {
        "name": "my-action",
        "title": "My Action",
        "mode": "view",
        "keywords": ["search", "keywords"],
        "icon": "tabler:star",
        "subtitle": "Action description",
        "query": true
      }
    ]
  },
  "permissions": ["storage", "notification"]
}
```

## Manifest 字段说明

### 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识符，格式：`author.extension-name` |
| `name` | string | 显示名称 |
| `version` | string | 语义化版本号 |
| `rua.engineVersion` | string | 最低引擎版本要求 |
| `rua.actions` | array | 扩展定义的 Actions |

### 可选字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `description` | string | 扩展描述 |
| `author` | string | 作者信息 |
| `homepage` | string | 主页 URL |
| `rua.ui.entry` | string | UI 入口文件（view 模式需要） |
| `permissions` | array | 权限声明 |

## Action 定义

每个 Action 可以是以下两种模式之一：

### View 模式

打开自定义 UI 视图：

```json
{
  "name": "my-view",
  "title": "Open My View",
  "mode": "view",
  "keywords": ["view", "ui"],
  "icon": "tabler:layout",
  "query": true
}
```

当用户选择此 Action 时，会加载 `ui.entry` 指定的 HTML 文件，并通过 URL 参数传递 action 名称：

```
extension://author.my-extension/index.html?action=my-view
```

在 UI 中获取当前 action：

```javascript
const params = new URLSearchParams(window.location.search);
const action = params.get('action'); // "my-view"
```

### Query 支持

设置 `"query": true` 可以在命令面板中显示查询输入框。用户可以在进入扩展视图之前输入查询内容：

```json
{
  "name": "search",
  "title": "Search Something",
  "mode": "view",
  "query": true
}
```

用户操作流程：
1. 在命令面板中选择该 Action
2. 按 Tab 键切换到查询输入框
3. 输入查询内容
4. 按 Enter 进入扩展视图

在扩展中接收查询内容：

```javascript
import { initializeRuaAPI } from 'rua-api/browser'

const rua = await initializeRuaAPI()

// 监听搜索输入变化
rua.on('search-change', (query) => {
  console.log('Search query:', query)
  // 处理查询内容
  performSearch(query as string)
})
```

## 权限系统

扩展需要在 manifest 中声明所需权限：

| 权限 | 说明 |
|------|------|
| `clipboard` | 读写剪贴板 |
| `notification` | 显示系统通知 |
| `storage` | 本地存储 |
| `http` | HTTP 请求 |
| `shell` | Shell 命令执行 |

## Extension API

推荐使用 `rua-api` 包来访问 Rua API，它提供了类型安全的接口。

### 安装

```bash
bun add rua-api
```

### 初始化

```typescript
import { initializeRuaAPI } from 'rua-api/browser'

const rua = await initializeRuaAPI()
console.log('Extension:', rua.extension.id)
```

### 等待 API 就绪

```javascript
window.addEventListener('rua-ready', (event) => {
  console.log('Rua API ready!', event.detail);
  // 现在可以使用 window.rua
});
```

### 扩展信息

```javascript
// 获取当前扩展信息
console.log(rua.extension.id);      // "author.my-extension"
console.log(rua.extension.name);    // "My Extension"
console.log(rua.extension.version); // "1.0.0"
```

### Storage API

```javascript
// 存储数据（需要 storage 权限）
await rua.storage.set('key', { foo: 'bar' });

// 读取数据
const data = await rua.storage.get('key');

// 删除数据
await rua.storage.remove('key');
```

### Notification API

```javascript
// 显示系统通知（需要 notification 权限）
await rua.notification.show({
  title: 'Hello',
  body: 'This is a notification'
});
```

### Clipboard API

```javascript
// 读取剪贴板（需要 clipboard 权限）
const text = await rua.clipboard.readText();

// 写入剪贴板
await rua.clipboard.writeText('Hello, World!');
```

### UI Control API

```javascript
// 隐藏主界面搜索框
await rua.ui.hideInput();

// 显示主界面搜索框
await rua.ui.showInput();

// 关闭扩展视图，返回主界面
await rua.ui.close();

// 设置扩展标题
await rua.ui.setTitle('New Title');
```

### Dynamic Actions API

```javascript
// 动态注册 Actions（会出现在命令面板中）
await rua.actions.register([
  {
    id: 'dynamic-action',
    name: 'Dynamic Action',
    keywords: ['dynamic', 'action'],
    icon: 'tabler:sparkles',
    subtitle: 'A dynamically registered action',
    mode: 'view'
  }
]);

// 取消注册 Actions
await rua.actions.unregister(['dynamic-action']);
```

### Event API

```javascript
// 监听搜索输入变化
rua.on('search-change', (query) => {
  console.log('Search changed:', query);
});

// 监听 Action 触发
rua.on('action-triggered', (data) => {
  console.log('Action triggered:', data);
});

// 取消监听
rua.off('search-change', handler);
```

## 初始化脚本 (init.js)

初始化脚本在扩展 UI 加载时执行，可用于注册动态 Actions：

```javascript
// init.js
import { initializeRuaAPI } from 'rua-api/browser'

async function init() {
  const rua = await initializeRuaAPI()
  
  // 注册动态 Actions
  await rua.actions.register([
    {
      id: 'my-dynamic-action',
      name: 'My Dynamic Action',
      mode: 'view'
    }
  ]);
}

init()
```

## 开发模式热重载

在开发模式下，修改扩展文件会自动刷新扩展视图：

1. 在 Extension Manager 中启动开发模式
2. 修改扩展文件（HTML、JS、CSS 等）
3. 扩展视图会自动刷新，无需手动操作

## 示例扩展

查看 `examples/hello-word` 目录获取完整的示例扩展。

## 最佳实践

1. **使用有意义的 ID**: 格式为 `author.extension-name`
2. **声明最小权限**: 只请求必要的权限
3. **处理错误**: 使用 try-catch 处理 API 调用
4. **提供清晰的 UI**: 保持界面简洁一致
5. **支持深色模式**: 使用 CSS 媒体查询适配主题
6. **使用 TypeScript**: 推荐使用 TypeScript 获得更好的类型提示
7. **监听 search-change**: 如果启用了 query，记得监听搜索变化事件
