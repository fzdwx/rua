# Design Document: Details Panel

## Overview

Details Panel 是 CommandPalette 的扩展功能，在列表右侧显示当前选中 action 的详细信息。启用后，界面分为左侧列表区域和右侧详情区域，支持自定义分栏比例。

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CommandPalette                          │
├─────────────────────────────────────────────────────────────┤
│  Input                                                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ │ ┌─────────────────────────────────┐  │
│  │                 │ │ │                                 │  │
│  │   List (1/3)    │ │ │      Details Panel (2/3)        │  │
│  │                 │ │ │                                 │  │
│  │  - Action 1     │ │ │   [Custom Detail Content]       │  │
│  │  - Action 2 ◄───┼─┼─┤                                 │  │
│  │  - Action 3     │ │ │                                 │  │
│  │                 │ │ │                                 │  │
│  └─────────────────┘ │ └─────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Footer                                                      │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### CommandPaletteProps 扩展

```typescript
interface CommandPaletteProps {
  // ... existing props
  
  /**
   * Whether to show the details panel on the right side
   * @default false
   */
  isShowDetails?: boolean;
  
  /**
   * Split ratio between list and details panel
   * Format: "list:details" (e.g., "1:2" means list takes 1/3, details takes 2/3)
   * @default "1:2"
   */
  detailsRatio?: "1:1" | "1:2" | "1:3" | "2:3";
  
  // 复用现有的 emptyState 属性
  // 当 action 没有 details 时，在详情面板显示 emptyState
}
```

### Action 类型扩展

```typescript
interface Action {
  // ... existing properties
  
  /**
   * Function that returns a React component to display in the details panel
   * Receives the action item as parameter for dynamic content
   */
  details?: (item?: any) => React.ReactElement;
}
```

### DetailsPanel 组件

```typescript
interface DetailsPanelProps {
  /** The current active action */
  action: ActionImpl | null;
  /** Empty view to show when no details (reuses CommandPalette's emptyState) */
  emptyView?: React.ReactElement;
  /** CSS class for custom styling */
  className?: string;
}
```

## Data Models

### Split Ratio Mapping

| Ratio | List Width | Details Width |
|-------|------------|---------------|
| 1:1   | 50%        | 50%           |
| 1:2   | 33.33%     | 66.67%        |
| 1:3   | 25%        | 75%           |
| 2:3   | 40%        | 60%           |

### CSS Variables

```css
:root {
  --details-panel-border: var(--gray6);
  --details-panel-bg: var(--gray1);
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Split ratio determines layout widths
*For any* valid detailsRatio value, the list and details panel widths SHALL match the specified ratio
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 2: Details content matches selected action
*For any* action with a details property, when that action is selected, the details panel SHALL render the component returned by that action's details function
**Validates: Requirements 3.1, 3.3**

### Property 3: isShowDetails controls panel visibility
*For any* value of isShowDetails, the details panel SHALL be visible if and only if isShowDetails is true
**Validates: Requirements 1.1, 1.2**

## Error Handling

- 如果 `details` 函数抛出错误，显示错误边界组件
- 如果 `detailsRatio` 值无效，使用默认值 "1:2"
- 如果 `action.details` 返回 null/undefined，显示 placeholder

## Testing Strategy

### Unit Tests
- 测试 ratio 解析函数返回正确的宽度百分比
- 测试 DetailsPanel 组件渲染正确内容

### Property-Based Tests
使用 `fast-check` 库进行属性测试：

1. **Property 1**: 生成随机 ratio 值，验证宽度计算正确
2. **Property 2**: 生成随机 action 列表，验证选中时 details 正确显示
3. **Property 3**: 生成随机 isShowDetails 值，验证面板可见性

测试配置：每个属性测试运行至少 100 次迭代。

测试标注格式：`**Feature: details-panel, Property {number}: {property_text}**`

