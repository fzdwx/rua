/**
 * Init Script Executor
 * 
 * Executes extension init.js scripts when extensions are loaded.
 * Provides a limited API for init scripts to register dynamic actions.
 */

import { convertFileSrc } from '@tauri-apps/api/core';
import { invoke } from '@tauri-apps/api/core';
import type { DynamicAction } from 'rua-api';

/** API provided to init scripts */
export interface InitAPI {
  /** Register dynamic actions */
  registerActions(actions: DynamicAction[]): void;
  /** Log messages */
  log(message: string): void;
  /** Extension storage */
  storage: {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
  };
}

/** Result of init script execution */
export interface InitExecutionResult {
  success: boolean;
  actions: DynamicAction[];
  error?: string;
}

/**
 * Execute an init script for an extension
 * 
 * @param extensionId - The extension ID
 * @param extensionPath - The path to the extension directory
 * @param initScript - The relative path to the init script (e.g., "init.js")
 * @returns The result of the execution including any registered actions
 */
export async function executeInitScript(
  extensionId: string,
  extensionPath: string,
  initScript: string
): Promise<InitExecutionResult> {
  const registeredActions: DynamicAction[] = [];
  
  // Build the full path to the init script
  const initScriptPath = `${extensionPath}/${initScript}`;
  const initScriptUrl = convertFileSrc(initScriptPath);
  
  console.log('[InitExecutor] Executing init script:', initScriptPath);
  
  // Create the InitAPI that will be passed to the script
  const initAPI: InitAPI = {
    registerActions: (actions: DynamicAction[]) => {
      console.log('[InitExecutor] Registering actions:', actions);
      // Prefix action IDs with extension ID to ensure uniqueness
      const prefixedActions = actions.map(action => ({
        ...action,
        id: `${extensionId}:${action.id}`,
      }));
      registeredActions.push(...prefixedActions);
    },
    log: (message: string) => {
      console.log(`[Extension:${extensionId}]`, message);
    },
    storage: {
      get: async <T>(key: string): Promise<T | null> => {
        try {
          const value = await invoke<string | null>('extension_storage_get', {
            extensionId,
            key,
          });
          if (value === null) return null;
          return JSON.parse(value) as T;
        } catch (error) {
          console.error('[InitExecutor] Storage get error:', error);
          return null;
        }
      },
      set: async <T>(key: string, value: T): Promise<void> => {
        try {
          await invoke('extension_storage_set', {
            extensionId,
            key,
            value: JSON.stringify(value),
          });
        } catch (error) {
          console.error('[InitExecutor] Storage set error:', error);
        }
      },
    },
  };
  
  try {
    // Fetch the init script content
    const response = await fetch(initScriptUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch init script: ${response.status}`);
    }
    const scriptContent = await response.text();
    
    // Execute the script in a sandboxed context
    // We wrap it in an async IIFE and pass the API
    const wrappedScript = `
      (async function(rua) {
        ${scriptContent}
      })
    `;
    
    // Create and execute the function
    const scriptFn = new Function('return ' + wrappedScript)();
    
    // Execute with timeout (3 seconds)
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Init script timeout (3s)')), 3000);
    });
    
    await Promise.race([
      scriptFn(initAPI),
      timeoutPromise,
    ]);
    
    console.log('[InitExecutor] Init script completed, registered actions:', registeredActions.length);
    
    return {
      success: true,
      actions: registeredActions,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[InitExecutor] Init script error:', errorMessage);
    
    return {
      success: false,
      actions: registeredActions, // Return any actions that were registered before the error
      error: errorMessage,
    };
  }
}
