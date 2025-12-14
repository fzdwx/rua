# Requirements Document

## Introduction

This feature introduces a `background` action mode for extensions. A background action is a script that runs automatically when the rua application starts, executing in the main program context (not in an iframe). Each extension can have at most one background action. This replaces the current iframe-based init script approach with a simpler, more integrated solution.

## Glossary

- **Background Action**: An action with `mode: "background"` that runs automatically when rua starts
- **Rua Main Program**: The main Tauri/React application that hosts extensions
- **Extension**: A plugin package with a manifest.json defining actions
- **Dynamic Action**: An action registered at runtime by background scripts via the rua API
- **Action Mode**: The type of action - `view` (shows UI), `command` (runs script on demand), or `background` (runs on startup)

## Requirements

### Requirement 1

**User Story:** As an extension developer, I want to define a background action in my manifest, so that my script runs automatically when rua starts.

#### Acceptance Criteria

1. WHEN an extension manifest defines an action with `mode: "background"` THEN the system SHALL recognize it as a background action
2. WHEN an extension defines more than one background action THEN the system SHALL report a validation error and reject the extension
3. WHEN a background action is defined THEN the manifest SHALL require a `script` field pointing to the JavaScript file

### Requirement 2

**User Story:** As a user, I want background scripts to execute when rua starts, so that extensions are ready to use immediately.

#### Acceptance Criteria

1. WHEN rua application starts THEN the Background_Script_Executor SHALL execute all enabled extension background scripts in the main program context
2. WHEN executing background scripts THEN the Background_Script_Executor SHALL load scripts in parallel where possible
3. WHEN a background script fails to load THEN the system SHALL log the error and continue loading other extensions
4. WHEN a background script takes longer than 5 seconds to initialize THEN the system SHALL log a warning and continue without blocking

### Requirement 3

**User Story:** As an extension developer, I want my background script to access the rua API, so that I can register dynamic actions and respond to events.

#### Acceptance Criteria

1. WHEN a background script is executed THEN the executor SHALL provide access to a rua API object
2. WHEN a background script calls `rua.actions.register(actions)` THEN the system SHALL add those actions to the available action list
3. WHEN a background script calls `rua.actions.unregister(actionIds)` THEN the system SHALL remove those actions from the available action list
4. WHEN an extension is disabled or uninstalled THEN the system SHALL automatically unregister all dynamic actions for that extension

### Requirement 4

**User Story:** As an extension developer, I want to respond to application lifecycle events from my background script, so that I can perform actions when the main window is shown or hidden.

#### Acceptance Criteria

1. WHEN the main window is activated THEN the system SHALL call the `onActivate` callback for all registered extensions
2. WHEN the main window is deactivated THEN the system SHALL call the `onDeactivate` callback for all registered extensions
3. WHEN a background script calls `rua.on('activate', callback)` THEN the system SHALL register that callback for activation events
4. WHEN a background script calls `rua.on('deactivate', callback)` THEN the system SHALL register that callback for deactivation events

### Requirement 5

**User Story:** As an extension developer, I want to use extension storage from my background script, so that I can persist data across sessions.

#### Acceptance Criteria

1. WHEN a background script calls `rua.storage.get(key)` THEN the system SHALL return the stored value for that extension
2. WHEN a background script calls `rua.storage.set(key, value)` THEN the system SHALL persist the value for that extension
3. WHEN a background script calls `rua.storage.remove(key)` THEN the system SHALL delete the stored value for that extension

### Requirement 6

**User Story:** As an extension developer, I want a simple API to initialize my background script, so that I can write clean code.

#### Acceptance Criteria

1. WHEN a background script imports from 'rua-api/browser' THEN the module SHALL export a `createRuaAPI` function for main context usage
2. WHEN `createRuaAPI(extensionId)` is called THEN the function SHALL return a rua API object with storage, actions, and event methods
3. WHEN the background script is executed THEN the executor SHALL inject the extension ID as a global variable `__RUA_EXTENSION_ID__`
