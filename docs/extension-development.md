# Rua Extension Development Guide

本指南介绍如何为 Rua 命令面板开发扩展。

## 快速开始

### 使用 CLI 创建扩展

```bash
bunx create-rua-ext my-extension
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

## Extension API

### 初始化脚本

```javascript
// init.js
export function activate(api) {
  console.log(`Extension ${api.pluginId} activated`);
  
  // 注册额外的 actions
  api.registerActions([
    {
      id: 'dynamic-action',
      name: 'Dynamic Action',
      perform: () => console.log('Hello!'),
    }
  ]);
}

export function deactivate() {
  console.log('Extension deactivated');
}
```

### Storage API

```javascript
// 存储数据
await api.storage.set('key', { foo: 'bar' });

// 读取数据
const data = await api.storage.get('key');

// 删除数据
await api.storage.remove('key');

// 列出所有键
const keys = await api.storage.keys();

// 清空所有数据
await api.storage.clear();
```

### Notification API

```javascript
await api.notification.show({
  title: 'Hello',
  body: 'This is a notification',
  icon: '/path/to/icon.png'
});
```

### Clipboard API

```javascript
// 读取剪贴板
const text = await api.clipboard.read();

// 写入剪贴板
await api.clipboard.write('Hello, World!');
```

### Event API

```javascript
// 监听事件
api.on('some-event', (data) => {
  console.log('Event received:', data);
});

// 发送事件
api.emit('some-event', { foo: 'bar' });

// 取消监听
api.off('some-event', handler);
```

## 示例扩展

查看 `examples/hello-ext` 目录获取完整的示例扩展。

## 最佳实践

1. **使用有意义的 ID**: 格式为 `author.extension-name`
2. **声明最小权限**: 只请求必要的权限
3. **处理错误**: 使用 try-catch 处理 API 调用
4. **提供清晰的 UI**: 保持界面简洁一致
5. **支持深色模式**: 使用 CSS 媒体查询适配主题
