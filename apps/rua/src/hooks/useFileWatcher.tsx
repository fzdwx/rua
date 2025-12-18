/**
 * Hook for watching file system changes in dev mode
 *
 * Provides file watching capabilities for hot reload during extension development.
 * Uses Tauri's file watcher backend with debouncing.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export interface FileChangeEvent {
  path: string;
  kind: string;
}

export interface UseFileWatcherOptions {
  /** Callback when files change */
  onFileChange?: (event: FileChangeEvent) => void;
  /** Whether to automatically start watching when path is set */
  autoStart?: boolean;
}

export interface UseFileWatcherReturn {
  /** Whether the watcher is currently active */
  isWatching: boolean;
  /** The path currently being watched */
  watchedPath: string | null;
  /** Start watching a directory */
  startWatching: (path: string) => Promise<void>;
  /** Stop watching the current directory */
  stopWatching: () => Promise<void>;
  /** Any error that occurred */
  error: string | null;
}

/**
 * Hook to watch a directory for file changes
 *
 * @param options - Configuration options
 * @returns File watcher state and controls
 */
export function useFileWatcher(options: UseFileWatcherOptions = {}): UseFileWatcherReturn {
  const { onFileChange } = options;

  const [isWatching, setIsWatching] = useState(false);
  const [watchedPath, setWatchedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Store the callback in a ref to avoid re-subscribing on every render
  const onFileChangeRef = useRef(onFileChange);
  onFileChangeRef.current = onFileChange;

  // Store unlisten function
  const unlistenRef = useRef<UnlistenFn | null>(null);

  // Set up event listener for file changes
  useEffect(() => {
    let mounted = true;

    const setupListener = async () => {
      // Clean up any existing listener
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }

      // Listen for file-change events from Tauri backend
      const unlisten = await listen<FileChangeEvent>("file-change", (event) => {
        if (mounted && onFileChangeRef.current) {
          onFileChangeRef.current(event.payload);
        }
      });

      if (mounted) {
        unlistenRef.current = unlisten;
      } else {
        unlisten();
      }
    };

    setupListener();

    return () => {
      mounted = false;
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, []);

  // Start watching a directory
  const startWatching = useCallback(async (path: string) => {
    try {
      setError(null);
      await invoke("watch_directory", { path });
      setIsWatching(true);
      setWatchedPath(path);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setIsWatching(false);
      setWatchedPath(null);
      throw err;
    }
  }, []);

  // Stop watching the current directory
  const stopWatching = useCallback(async () => {
    try {
      setError(null);
      await invoke("stop_watching");
      setIsWatching(false);
      setWatchedPath(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Clean up watcher on unmount
  useEffect(() => {
    return () => {
      // Stop watching when component unmounts
      invoke("stop_watching").catch(() => {
        // Ignore errors during cleanup
      });
    };
  }, []);

  return {
    isWatching,
    watchedPath,
    startWatching,
    stopWatching,
    error,
  };
}
