# Requirements Document

## Introduction

本文档定义了 Rua 文档优化的需求，包括更新过时内容、添加正确的项目地址、使用 Tab 组件展示多包管理器命令、修正 Actions API 文档和代码以反映其仅在 background 模式下可用的特性，以及添加 ruactl 命令行工具的使用教程。

## Glossary

- **Rua**: 一个现代化、可扩展的 Linux 命令面板启动器
- **ruactl**: Rua 的命令行控制工具，用于切换窗口、检查健康状态、验证和打包扩展
- **Tab 组件**: Fumadocs 提供的可切换标签页组件，用于展示多种包管理器命令
- **Actions API**: 用于注册动态 actions 的 API，仅在 background 模式下可用
- **Background 模式**: 扩展在主程序上下文中运行的模式，具有完整的系统 API 访问权限
- **View 模式**: 扩展在 iframe 中运行并提供自定义 UI 的模式
- **RuaClientAPI**: View 模式下使用的 API 接口，通过 `initializeRuaAPI()` 获取
- **MainContextRuaAPI**: Background 模式下使用的 API 接口，通过 `createMainContextRuaAPI()` 获取

## Requirements

### Requirement 1

**User Story:** As a developer, I want to see the correct GitHub repository URL in the documentation, so that I can easily access the source code and contribute to the project.

#### Acceptance Criteria

1. WHEN a user views any documentation page containing repository links THEN the system SHALL display `github.com/fzdwx/rua` as the repository URL
2. WHEN a user clicks on a GitHub link THEN the system SHALL navigate to the correct repository at `https://github.com/fzdwx/rua`

### Requirement 2

**User Story:** As a developer, I want to see package manager commands in a tabbed interface, so that I can easily find the command for my preferred package manager.

#### Acceptance Criteria

1. WHEN a documentation page displays multiple package manager commands THEN the system SHALL present them using a Tab component with options for bun, npm, yarn, and pnpm
2. WHEN a user selects a package manager tab THEN the system SHALL display only the command for that specific package manager
3. WHEN a user views the installation page THEN the system SHALL show dependency installation commands in a tabbed format

### Requirement 3

**User Story:** As an extension developer, I want accurate documentation about the Actions API availability, so that I understand which extension mode supports action registration.

#### Acceptance Criteria

1. WHEN a user reads the API overview documentation THEN the system SHALL clearly state that Actions API is only available in background mode
2. WHEN a user reads about Actions API THEN the system SHALL provide code examples using `createMainContextRuaAPI()` instead of `initializeRuaAPI()`
3. WHEN a user reads extension development documentation THEN the system SHALL explain that view mode extensions cannot register dynamic actions

### Requirement 4

**User Story:** As a new user, I want up-to-date installation instructions, so that I can successfully install and run Rua on my system.

#### Acceptance Criteria

1. WHEN a user views the installation page THEN the system SHALL display current and accurate installation methods
2. WHEN a user follows the build from source instructions THEN the system SHALL provide commands that reference the correct repository URL
3. WHEN a user views dependency installation commands THEN the system SHALL present them in a tabbed format for different Linux distributions

### Requirement 5

**User Story:** As a developer, I want consistent and accurate API documentation and implementation, so that I can correctly implement extension features.

#### Acceptance Criteria

1. WHEN a user reads the API overview THEN the system SHALL accurately describe the difference between `initializeRuaAPI()` for view mode and `createMainContextRuaAPI()` for background mode
2. WHEN a user reads about extension modes THEN the system SHALL clearly explain which APIs are available in each mode
3. WHEN a user views code examples THEN the system SHALL use the correct API initialization method for the demonstrated mode
4. WHEN a view mode extension calls Actions API THEN the system SHALL remove the actions property from `RuaClientAPI` interface since it is only available in background mode
5. WHEN the rua-api package is updated THEN the system SHALL ensure `initializeRuaAPI()` does not expose actions API

### Requirement 6

**User Story:** As a user, I want documentation about ruactl command-line tool, so that I can control Rua from the terminal and integrate it with my window manager.

#### Acceptance Criteria

1. WHEN a user views the user guide THEN the system SHALL include a page about ruactl installation and usage
2. WHEN a user reads ruactl documentation THEN the system SHALL explain all available commands: toggle, health, validate, and pack
3. WHEN a user wants to integrate Rua with Hyprland THEN the system SHALL provide configuration examples for keyboard shortcuts
4. WHEN a user wants to install ruactl THEN the system SHALL provide multiple installation methods including local build and system-wide installation
