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
   - 在 **Development Mode** 区域输入扩展目录的完整路径
   - 点击 "Start" 按钮
   - 扩展会以 `[DEV]` 前缀显示在列表中
   - 修改代码后，点击刷新按钮 🔄 重新加载
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
   - Linux: `~/.local/share/rua/extensions/`
   - macOS: `~/Library/Application Support/rua/extensions/`
   - Windows: `%APPDATA%/rua/extensions/`

5. **快捷命令**
   ```bash
   # 安装示例扩展
   just install-example-ext
   
   # 运行 Rua 开发模式
   just dev
   ```

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
        "subtitle": "Action description"
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
| `rua.init` | string | 初始化脚本路径 |
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
  "icon": "tabler:layout"
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

### Command 模式

执行脚本命令：

```json
{
  "name": "my-command",
  "title": "Run My Command",
  "mode": "command",
  "script": "commands/my-command.js"
}
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

## Extension API (window.rua)

扩展 UI 中可以通过 `window.rua` 访问 Rua API。API 会在 iframe 加载后自动注入。

API 使用 [kkrpc](https://github.com/kunkunsh/kkrpc) 库实现类型安全的 RPC 通信，支持双向调用。

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
console.log(window.rua.extension.id);      // "author.my-extension"
console.log(window.rua.extension.name);    // "My Extension"
console.log(window.rua.extension.version); // "1.0.0"
```

### Storage API

```javascript
// 存储数据（需要 storage 权限）
await window.rua.storage.set('key', { foo: 'bar' });

// 读取数据
const data = await window.rua.storage.get('key');

// 删除数据
await window.rua.storage.remove('key');
```

### Notification API

```javascript
// 显示系统通知（需要 notification 权限）
await window.rua.notification.show({
  title: 'Hello',
  body: 'This is a notification'
});
```

### Clipboard API

```javascript
// 读取剪贴板（需要 clipboard 权限）
const text = await window.rua.clipboard.read();

// 写入剪贴板
await window.rua.clipboard.write('Hello, World!');
```

### UI Control API

```javascript
// 隐藏主界面搜索框
await window.rua.ui.hideInput();

// 显示主界面搜索框
await window.rua.ui.showInput();

// 关闭扩展视图，返回主界面
await window.rua.ui.close();

// 设置扩展标题
await window.rua.ui.setTitle('New Title');
```

### Dynamic Actions API

```javascript
// 动态注册 Actions（会出现在命令面板中）
await window.rua.actions.register([
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
await window.rua.actions.unregister(['dynamic-action']);
```

### Event API

```javascript
// 监听事件
window.rua.on('some-event', (data) => {
  console.log('Event received:', data);
});

// 取消监听
window.rua.off('some-event', handler);
```

## 初始化脚本 (init.js)

初始化脚本在扩展 UI 加载时执行，可用于注册动态 Actions：

```javascript
// init.js
window.addEventListener('rua-ready', async (event) => {
  console.log('Extension loaded:', event.detail);
  
  // 注册动态 Actions
  await window.rua.actions.register([
    {
      id: 'my-dynamic-action',
      name: 'My Dynamic Action',
      mode: 'view'
    }
  ]);
});
```

## 开发模式热重载

在开发模式下，修改扩展文件会自动刷新扩展视图：

1. 在 Extension Manager 中启动开发模式
2. 修改扩展文件（HTML、JS、CSS 等）
3. 扩展视图会自动刷新，无需手动操作

## 示例扩展

查看 `examples/hello-ext` 目录获取完整的示例扩展。

## 最佳实践

1. **使用有意义的 ID**: 格式为 `author.extension-name`
2. **声明最小权限**: 只请求必要的权限
3. **处理错误**: 使用 try-catch 处理 API 调用
4. **提供清晰的 UI**: 保持界面简洁一致
5. **支持深色模式**: 使用 CSS 媒体查询适配主题
