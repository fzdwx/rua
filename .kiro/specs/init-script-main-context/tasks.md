# Implementation Plan

- [x] 1. Update ActionMode type and manifest types
  - [x] 1.1 Add `background` to ActionMode type in `packages/rua-api/src/types/manifest.ts`
    - Add `'background'` to the ActionMode union type
    - Update JSDoc comments to describe background mode
    - _Requirements: 1.1_
  - [x] 1.2 Update ManifestAction interface documentation
    - Document that background actions require `script` field
    - Document that only one background action is allowed per extension
    - _Requirements: 1.2, 1.3_

- [x] 2. Create background script executor
  - [x] 2.1 Create `apps/rua/src/lib/background-executor.ts`
    - Define BackgroundScriptState interface
    - Create backgroundScripts Map registry
    - Implement executeBackgroundScript function with dynamic import
    - Implement 5-second timeout handling
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 2.2 Implement event notification functions
    - Implement notifyActivate to call all registered activate callbacks
    - Implement notifyDeactivate to call all registered deactivate callbacks
    - _Requirements: 4.1, 4.2_
  - [x] 2.3 Implement cleanup function
    - Implement cleanupExtension to remove callbacks and registered actions
    - _Requirements: 3.4_

- [x] 3. Create main context Rua API
  - [x] 3.1 Create `packages/rua-api/src/browser/main-context-api.ts`
    - Define MainContextRuaAPI interface
    - Implement createMainContextRuaAPI function
    - _Requirements: 6.1, 6.2_
  - [x] 3.2 Implement storage methods
    - Implement get, set, remove methods using Tauri invoke
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 3.3 Implement actions methods
    - Implement register and unregister methods
    - _Requirements: 3.2, 3.3_
  - [x] 3.4 Implement event methods
    - Implement on and off methods for activate/deactivate events
    - _Requirements: 4.3, 4.4_
  - [x] 3.5 Export from rua-api/browser
    - Update `packages/rua-api/src/browser/index.ts` to export createMainContextRuaAPI
    - _Requirements: 6.1_

- [x] 4. Add manifest validation
  - [x] 4.1 Create validation function in extension loader
    - Validate at most one background action per extension
    - Validate background actions have script field
    - Return validation errors
    - _Requirements: 1.2, 1.3_

- [x] 5. Integrate with ExtensionSystemContext
  - [x] 5.1 Update ExtensionSystemContext to use background executor
    - Import background executor functions
    - Execute background scripts when loading enabled extensions
    - Replace iframe-based init executor calls
    - _Requirements: 2.1_
  - [x] 5.2 Update extension disable/uninstall to cleanup background scripts
    - Call cleanupExtension when extension is disabled
    - Call cleanupExtension when extension is uninstalled
    - _Requirements: 3.4_
  - [x] 5.3 Wire up activate/deactivate notifications
    - Call notifyActivate from background executor
    - Call notifyDeactivate from background executor
    - _Requirements: 4.1, 4.2_

- [x] 6. Update extension template
  - [x] 6.1 Update `packages/create-rua-ext/src/templates/src/init.ts.template`
    - Update to use createMainContextRuaAPI instead of initializeRuaAPI
    - Update comments to reflect background action usage
    - _Requirements: 6.1, 6.2_
  - [x] 6.2 Update manifest template if needed
    - Update `packages/create-rua-ext/src/templates/manifest.json.template` to show background action example
    - _Requirements: 1.1_

- [x] 7. Remove or deprecate iframe-based init executor
  - [x] 7.1 Delete all of rua.init files
