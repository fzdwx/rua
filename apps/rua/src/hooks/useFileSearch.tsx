import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Action } from "@fzdwx/ruaui";
import { Icon } from "@iconify/react";
import { useDebounce } from "ahooks";

export interface FileSearchResult {
  path: string;
  name: string;
  isDirectory: boolean;
}

interface UseFileSearchOptions {
  enabled: boolean; // Enable file search when results are less than threshold
  query: string;
  currentResultsCount: number;
  threshold?: number; // Trigger file search if results < threshold
  maxResults?: number;
  onFileOpen?: () => void; // Callback after file is opened
}

/**
 * Custom hook for searching files on the filesystem
 * Automatically triggers when search results are below threshold
 */
export function useFileSearch({
  enabled,
  query,
  currentResultsCount,
  threshold = 5,
  maxResults = 20,
  onFileOpen,
}: UseFileSearchOptions) {
  const [fileActions, setFileActions] = useState<Action[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use ref to store currentResultsCount to avoid triggering re-search
  const currentResultsCountRef = useRef(currentResultsCount);
  currentResultsCountRef.current = currentResultsCount;

  // Debounce the query to avoid too many searches
  const debouncedQuery = useDebounce(query, { wait: 400 });

  const searchFiles = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setFileActions([]);
        return;
      }

      // Only search if current results are below threshold
      // Use ref value to avoid dependency issues
      if (currentResultsCountRef.current >= threshold) {
        setFileActions([]);
        return;
      }

      // Cancel previous search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsSearching(true);

      try {
        const searchResults = await invoke<FileSearchResult[]>("search_files", {
          query: searchQuery,
          maxResults,
          // Let backend use default search paths (HOME directory)
          searchPaths: undefined,
        });

        const actions: Action[] = searchResults.map((file) => ({
          id: `file-${file.path}`,
          name: file.name,
          icon: file.isDirectory ? (
            <Icon icon="tabler:folder" style={{ fontSize: "20px" }} />
          ) : (
            <Icon icon="tabler:file" style={{ fontSize: "20px" }} />
          ),
          subtitle: file.path,
          priority: -10, // Lower priority than apps
          perform: async () => {
            try {
              await invoke("open_file", { path: file.path });
              // Call callback to hide window
              onFileOpen?.();
            } catch (error) {
              console.error("Failed to open file:", error);
            }
          },
        }));

        setFileActions(actions);
      } catch (error) {
        console.error("File search error:", error);
        setFileActions([]);
      } finally {
        setIsSearching(false);
      }
    },
    [threshold, maxResults, onFileOpen]
  );

  useEffect(() => {
    if (!enabled) {
      setFileActions([]);
      setIsSearching(false);
      return;
    }

    searchFiles(debouncedQuery);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, debouncedQuery]);

  return {
    fileActions,
    isSearching,
  };
}
