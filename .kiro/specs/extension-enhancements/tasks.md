# Implementation Plan

## Phase 1: File Watcher for Dev Mode Hot Reload

- [x] 1. Implement file watcher service
  - [x] 1.1 Add Tauri file watcher backend
    - Add `notify` crate to Cargo.toml for file watching
    - Create `watch_directory` Tauri command
    - Create `stop_watching` Tauri command
    - Emit events to frontend on file changes
    - _Requirements: 1.1, 1.4_
  - [x] 1.2 Create file watcher hook in frontend
    - Create `useFileWatcher` hook in `apps/rua/src/hooks/`
    - Handle watch start/stop lifecycle
    - Debounce file change events (300ms)
    - _Requirements: 1.1, 1.2_
  - [x] 1.3 Integrate watcher with PluginSystemContext
    - Add `devRefreshKey` state to context
    - Increment refresh key on file changes
    - Start watcher when dev mode is enabled
    - Stop watcher when dev mode is disabled
    - _Requirements: 1.1, 1.4_
  - [x] 1.4 Update ExtensionView to support hot reload
    - Add `refreshKey` prop to ExtensionView
    - Preserve URL parameters on refresh
    - Use key prop to force iframe remount
    - _Requirements: 1.2, 1.3_

## Phase 2: Extension API Bridge

- [x] 2. Implement API Bridge for iframe communication
  - [ ] 2.1 Create API Bridge class
    - Create `apps/rua/src/lib/api-bridge.ts`
    - Implement message listener setup
    - Implement request/response handling
    - Implement permission checking
    - _Requirements: 4.1, 4.2_
  - [x] 2.2 Create injectable API script
    - Create `apps/rua/src/lib/extension-api.ts`
    - Define window.rua API structure
    - Implement postMessage communication
    - Generate unique request IDs
    - _Requirements: 4.1_
  - [x] 2.3 Implement API injection into iframe
    - Inject API script into iframe on load
    - Pass extension metadata to API
    - Handle iframe security restrictions
    - _Requirements: 4.1_

## Phase 3: Clipboard and Notification APIs

- [x] 3. Implement clipboard and notification APIs
  - [x] 3.1 Add Tauri clipboard commands
    - Create `clipboard_read` command in Rust
    - Create `clipboard_write` command in Rust
    - Add clipboard plugin to Tauri config
    - _Requirements: 4.3, 4.4_
  - [x] 3.2 Implement clipboard API in bridge
    - Handle `clipboard.read` requests
    - Handle `clipboard.write` requests
    - Check clipboard permission
    - _Requirements: 4.3, 4.4_
  - [x] 3.3 Add Tauri notification command
    - Create `show_notification` command in Rust
    - Add notification plugin to Tauri config
    - _Requirements: 4.5_
  - [x] 3.4 Implement notification API in bridge
    - Handle `notification.show` requests
    - Check notification permission
    - _Requirements: 4.5_

## Phase 4: Storage API

- [x] 4. Implement storage API
  - [x] 4.1 Create extension storage backend
    - Store data in `~/.config/rua/extensions/{id}/storage.json`
    - Create `storage_get` Tauri command
    - Create `storage_set` Tauri command
    - Create `storage_remove` Tauri command
    - _Requirements: 4.6, 4.7_
  - [x] 4.2 Implement storage API in bridge
    - Handle `storage.get` requests
    - Handle `storage.set` requests
    - Handle `storage.remove` requests
    - Check storage permission
    - Namespace storage by extension ID
    - _Requirements: 4.6, 4.7_

## Phase 5: UI Control API

- [x] 5. Implement UI control API
  - [x] 5.1 Add input visibility state to Home
    - Add `extensionInputHidden` state
    - Pass setter to ExtensionView
    - Conditionally render Input based on state
    - Reset to visible when extension closes
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 5.2 Implement UI API in bridge
    - Handle `ui.hideInput` requests
    - Handle `ui.showInput` requests
    - Handle `ui.close` requests
    - Handle `ui.setTitle` requests
    - _Requirements: 3.1, 3.2, 4.8, 4.9, 4.10_
  - [x] 5.3 Update ExtensionView for UI control
    - Accept `onInputVisibilityChange` callback
    - Accept `onClose` callback
    - Forward UI API calls to callbacks
    - _Requirements: 3.1, 3.2, 4.8, 4.9, 4.10_

## Phase 6: Init Script Execution

- [x] 6. Implement init.js execution
  - [x] 6.1 Create init script executor
    - Create `apps/rua/src/lib/init-executor.ts`
    - Load and execute init.js via dynamic import or eval
    - Provide limited API to init script
    - Handle errors gracefully
    - _Requirements: 2.1, 2.2, 2.4_
  - [x] 6.2 Integrate init execution with extension loading
    - Execute init.js when extension is loaded
    - Pass InitAPI to the script
    - Log errors without blocking extension load
    - _Requirements: 2.1, 2.4_
  - [x] 6.3 Update PluginSystemContext for init execution
    - Call init executor after loading extension
    - Store dynamic actions from init
    - _Requirements: 2.1, 2.2_


## Phase 7: Dynamic Action Registration

- [x] 7. Implement dynamic action registration
  - [x] 7.1 Add dynamic actions state to PluginSystemContext
    - Add `dynamicActions` Map state
    - Add `registerDynamicActions` method
    - Add `unregisterDynamicActions` method
    - _Requirements: 2.3, 5.1, 5.2_
  - [x] 7.2 Implement actions API in bridge
    - Handle `actions.register` requests
    - Handle `actions.unregister` requests
    - Validate action definitions
    - _Requirements: 5.1, 5.2_
  - [x] 7.3 Merge dynamic actions into command palette
    - Update `usePluginActionsForPalette` to include dynamic actions
    - Prefix action IDs with extension ID
    - _Requirements: 2.3, 5.1_
  - [x] 7.4 Implement action cleanup on extension disable
    - Remove dynamic actions when extension is disabled
    - Remove dynamic actions when extension is unloaded
    - _Requirements: 2.5, 5.4_
  - [x] 7.5 Implement action routing to extension
    - Route dynamic action selection to originating extension
    - Pass action context to extension view
    - _Requirements: 5.3_


## Phase 8: Update Example Extension

- [x] 8. Update hello-ext example to demonstrate new features
  - [x] 8.1 Add init.js to hello-ext
    - Create `examples/hello-ext/init.js`
    - Register a dynamic action in init
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 8.2 Update hello-ext index.html to use API
    - Add buttons to test clipboard, storage, UI APIs
    - Display API call results
    - _Requirements: 4.1, 4.3, 4.4, 4.6, 4.7, 4.8, 4.9_
  - [x] 8.3 Update hello-ext manifest for new permissions
    - Add required permissions to manifest
    - _Requirements: 4.2_

## Phase 9: Final Integration and Testing

- [x] 9. Final integration
  - [x] 9.1 Ensure all APIs work together
    - Test hot reload with API calls
    - Test init.js with dynamic actions
    - Test UI control from extension
    - _Requirements: All_
  - [x] 9.2 Update extension development documentation
    - Document new API methods
    - Document init.js usage
    - Document hot reload feature
    - _Requirements: All_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

