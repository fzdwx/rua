# Requirements Document

## Introduction

本文档定义了 Rua 扩展系统的增强功能需求。这些增强功能旨在改善扩展开发体验，包括开发模式下的热重载、初始化脚本执行、动态 Action 生成、主界面控制 API，以及扩展 iframe 中的 API 注入。

## Glossary

- **Extension**: 可独立分发的功能扩展包，包含 manifest.json、UI 入口和可选的初始化脚本
- **Dev Mode**: 开发模式，允许从本地路径加载扩展并支持热重载
- **init.js**: 扩展的初始化脚本，在扩展加载时执行，可用于动态注册 Actions
- **Extension API**: 注入到扩展 iframe 中的 API 接口，允许扩展与主应用交互
- **Hot Reload**: 热重载，当扩展文件变化时自动刷新扩展视图
- **Main Input**: 主界面的搜索输入框，扩展可通过 API 控制其显示/隐藏

## Requirements

### Requirement 1

**User Story:** As an extension developer, I want the extension view to automatically refresh when I modify extension files in dev mode, so that I can see changes immediately without manual refresh.

#### Acceptance Criteria

1. WHEN a developer loads an extension in dev mode THEN the Extension System SHALL watch the extension directory for file changes
2. WHEN any file in the dev extension directory changes THEN the Extension System SHALL trigger a refresh of the extension iframe
3. WHEN the extension iframe refreshes THEN the Extension System SHALL preserve the current action context (URL parameters)
4. WHEN the developer stops dev mode THEN the Extension System SHALL stop watching the extension directory

### Requirement 2

**User Story:** As an extension developer, I want my init.js script to execute when the extension loads, so that I can perform initialization tasks and dynamically register actions.

#### Acceptance Criteria

1. WHEN an extension with an init field in manifest is loaded THEN the Extension System SHALL execute the init.js script
2. WHEN init.js executes THEN the Extension System SHALL provide access to the Extension API for registering dynamic actions
3. WHEN init.js registers new actions THEN the Extension System SHALL add those actions to the command palette immediately
4. WHEN init.js throws an error THEN the Extension System SHALL log the error and continue loading the extension without the dynamic actions
5. WHEN the extension is disabled THEN the Extension System SHALL remove all dynamically registered actions

### Requirement 3

**User Story:** As an extension developer, I want to control the main interface input visibility from my extension, so that I can create full-screen or immersive experiences.

#### Acceptance Criteria

1. WHEN an extension calls the hideMainInput API THEN the Main Application SHALL hide the search input box
2. WHEN an extension calls the showMainInput API THEN the Main Application SHALL show the search input box
3. WHEN an extension view is closed THEN the Main Application SHALL restore the search input box to its default visible state
4. WHEN multiple extensions request different input states THEN the Main Application SHALL use the most recent request

### Requirement 4

**User Story:** As an extension developer, I want to access the Extension API from within my extension iframe, so that I can interact with the main application.

#### Acceptance Criteria

1. WHEN an extension iframe loads THEN the Extension System SHALL inject the Extension API into the iframe's window object
2. WHEN an extension calls an API method THEN the Extension System SHALL validate the extension has the required permission
3. WHEN an extension calls clipboard.read THEN the Extension API SHALL return the current clipboard content if permitted
4. WHEN an extension calls clipboard.write THEN the Extension API SHALL write the provided text to the clipboard if permitted
5. WHEN an extension calls notification.show THEN the Extension API SHALL display a system notification with the provided options
6. WHEN an extension calls storage.get THEN the Extension API SHALL return the stored value for the given key
7. WHEN an extension calls storage.set THEN the Extension API SHALL persist the value for the given key
8. WHEN an extension calls ui.hideInput THEN the Extension API SHALL hide the main search input
9. WHEN an extension calls ui.showInput THEN the Extension API SHALL show the main search input
10. WHEN an extension calls ui.close THEN the Extension API SHALL close the extension view and return to the main view

### Requirement 5

**User Story:** As an extension developer, I want to register actions dynamically at runtime, so that I can create context-aware or data-driven action lists.

#### Acceptance Criteria

1. WHEN an extension calls actions.register with valid action definitions THEN the Extension API SHALL add those actions to the command palette
2. WHEN an extension calls actions.unregister with action IDs THEN the Extension API SHALL remove those actions from the command palette
3. WHEN dynamically registered actions are selected THEN the Extension System SHALL route the action to the originating extension
4. WHEN the extension is unloaded THEN the Extension System SHALL automatically remove all dynamically registered actions

