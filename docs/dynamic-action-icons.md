# Dynamic Action Icons

DynamicAction 的 `icon` 字段支持多种格式，让你可以灵活地为动作设置图标。

## 支持的图标格式

### 1. Iconify 图标名称

使用 [Iconify](https://iconify.design/) 图标库中的任何图标。格式为 `collection:icon-name`。

```typescript
const action: DynamicAction = {
  id: 'my-action',
  name: 'My Action',
  mode: 'command',
  icon: 'tabler:puzzle'  // Iconify 图标
};
```

常用图标集：
- `tabler:*` - Tabler Icons
- `mdi:*` - Material Design Icons
- `lucide:*` - Lucide Icons
- `heroicons:*` - Heroicons

在 [Iconify Icon Sets](https://icon-sets.iconify.design/) 浏览所有可用图标。

### 2. Data URI

使用 Data URI 格式嵌入图标数据，适合小型 SVG 或图片。

```typescript
// SVG Data URI
const action: DynamicAction = {
  id: 'my-action',
  name: 'My Action',
  mode: 'command',
  icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTIgMkw0IDdWMTdMMTIgMjJMMjAgMTdWN0wxMiAyWiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg=='
};

// PNG Data URI
const action2: DynamicAction = {
  id: 'my-action-2',
  name: 'My Action 2',
  mode: 'command',
  icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
};
```

### 3. SVG 字符串

直接使用 SVG 标记字符串。

```typescript
const action: DynamicAction = {
  id: 'my-action',
  name: 'My Action',
  mode: 'command',
  icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
};
```

**注意**：SVG 字符串会使用 `dangerouslySetInnerHTML` 渲染，确保 SVG 内容是可信的。

### 4. 插件资源路径

引用插件打包目录中的图片文件。

```typescript
// 相对路径（相对于插件根目录）
const action: DynamicAction = {
  id: 'my-action',
  name: 'My Action',
  mode: 'command',
  icon: './icon.png'  // 或 './assets/icon.svg'
};
```

支持的图片格式：
- `.png`
- `.jpg` / `.jpeg`
- `.svg`
- `.gif`
- `.webp`

**目录结构示例**：
```
my-extension/
├── manifest.json
├── index.html
├── icon.png          ← 可以直接引用 './icon.png'
└── assets/
    └── icon.svg      ← 可以引用 './assets/icon.svg'
```

## 完整示例

```typescript
import { createMainContextRuaAPI, DynamicAction } from 'rua-api/browser';

const rua = createMainContextRuaAPI();

// 注册多个使用不同图标格式的动作
const actions: DynamicAction[] = [
  {
    id: 'action-iconify',
    name: 'Iconify Icon',
    mode: 'command',
    icon: 'tabler:star'
  },
  {
    id: 'action-datauri',
    name: 'Data URI Icon',
    mode: 'command',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+PHBhdGggZD0iTTEyIDJMNCAxN0gxMkwyMCAxN0wxMiAyWiIgZmlsbD0iY3VycmVudENvbG9yIi8+PC9zdmc+'
  },
  {
    id: 'action-svg',
    name: 'SVG String Icon',
    mode: 'command',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/></svg>'
  },
  {
    id: 'action-asset',
    name: 'Asset Icon',
    mode: 'command',
    icon: './assets/custom-icon.png'
  }
];

await rua.actions.register(actions);
```

## 最佳实践

1. **优先使用 Iconify**：对于常见图标，使用 Iconify 图标名称最简单高效
2. **小图标用 Data URI**：对于自定义的小型 SVG 图标，Data URI 可以避免额外的网络请求
3. **大图标用资源文件**：对于较大的图片或需要复用的图标，使用插件资源路径
4. **保持一致性**：在同一个插件中尽量使用统一的图标风格和格式

## 图标尺寸

所有图标会被渲染为 20x20 像素。建议：
- SVG 图标使用 24x24 的 viewBox（会自动缩放）
- 位图图标使用 40x40 或更高分辨率（支持高 DPI 显示）

## 颜色

- Iconify 图标和 SVG 图标可以使用 `currentColor` 来适配主题颜色
- 位图图标会保持原始颜色
