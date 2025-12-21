# Requirements Document

## Introduction

为 CommandPalette 组件添加详情面板功能，允许在列表右侧显示当前选中 action 的详细信息。类似 Raycast 的设计，当启用详情面板时，界面分为左侧列表区域和右侧详情区域，用户选中不同的 action 时，右侧会显示对应的详情内容。

## Glossary

- **Details Panel**: 详情面板，显示在列表右侧的区域，用于展示当前选中 action 的详细信息
- **CommandPalette**: 命令面板组件，包含输入框、结果列表和 Footer
- **Action**: 命令面板中的可执行项，包含名称、图标、执行方法等属性
- **Split Ratio**: 分栏比例，控制列表和详情面板的宽度占比

## Requirements

### Requirement 1

**User Story:** As a developer, I want to enable a details panel in CommandPalette, so that users can see more information about the selected action.

#### Acceptance Criteria

1. WHEN the `isShowDetails` prop is set to true THEN the system SHALL display a split layout with list on the left and details panel on the right
2. WHEN the `isShowDetails` prop is false or undefined THEN the system SHALL display only the list without the details panel
3. WHEN the details panel is enabled THEN the system SHALL use the default split ratio of 1:2 (list:details)

### Requirement 2

**User Story:** As a developer, I want to customize the split ratio between list and details, so that I can adjust the layout based on my content needs.

#### Acceptance Criteria

1. WHEN a `detailsRatio` prop is provided THEN the system SHALL use the specified ratio for the split layout
2. WHEN `detailsRatio` is set to "1:1" THEN the system SHALL display list and details with equal width
3. WHEN `detailsRatio` is set to "1:2" THEN the system SHALL display list at 1/3 width and details at 2/3 width
4. WHEN `detailsRatio` is set to "1:3" THEN the system SHALL display list at 1/4 width and details at 3/4 width

### Requirement 3

**User Story:** As a developer, I want to define details content for each action, so that different actions can show different detail views.

#### Acceptance Criteria

1. WHEN an action has a `details` property THEN the system SHALL render the returned component in the details panel when that action is selected
2. WHEN an action does not have a `details` property THEN the system SHALL display an empty state or placeholder in the details panel
3. WHEN the selected action changes THEN the system SHALL update the details panel to show the new action's details

### Requirement 4

**User Story:** As a user, I want the details panel to have smooth transitions, so that the interface feels polished.

#### Acceptance Criteria

1. WHEN switching between actions THEN the system SHALL animate the details content transition smoothly
2. WHEN the details panel first appears THEN the system SHALL animate it sliding in from the right
3. WHEN toggling `isShowDetails` THEN the system SHALL animate the layout change smoothly

