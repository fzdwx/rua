import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Action } from "@fzdwx/ruaui";
import { Icon } from "@iconify/react";
import { useDebounce } from "ahooks";
import { useSystemConfig } from "../hooks/useSystemConfig";
import { DEFAULT_FILE_SEARCH_CONFIG } from "rua-api";

export interface FileSearchResult {
  path: string;
  name: string;
  isDirectory: boolean;
}

interface UseFileSearchOptions {
  query: string;
  currentResultsCount: number;
  onFileOpen?: () => void;
}

/**
 * Custom hook for searching files on filesystem
 * Automatically triggers when search results are below threshold
 */
export function useFileSearch({ query, currentResultsCount, onFileOpen }: UseFileSearchOptions) {
  const [fileActions, setFileActions] = useState<Action[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [fileSearchConfig] = useSystemConfig("fileSearch", DEFAULT_FILE_SEARCH_CONFIG);
  const config = fileSearchConfig ?? DEFAULT_FILE_SEARCH_CONFIG;

  const currentResultsCountRef = useRef(currentResultsCount);
  currentResultsCountRef.current = currentResultsCount;

  const debouncedQuery = useDebounce(query, { wait: 400 });

  const searchFiles = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setFileActions([]);
        return;
      }

      if (currentResultsCountRef.current >= config.threshold) {
        setFileActions([]);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsSearching(true);

      try {
        const effectiveMaxResults = config.maxResults;
        const effectiveSearchPaths =
          config.customPaths && config.customPaths.length > 0 ? config.customPaths : undefined;
        const effectiveOpenMethod = config.openMethod ?? "xdg-open";

        const searchResults = await invoke<FileSearchResult[]>("search_files", {
          query: searchQuery,
          maxResults: effectiveMaxResults,
          searchPaths: effectiveSearchPaths,
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
          priority: -10,
          perform: async () => {
            try {
              await invoke("open_file", {
                path: file.path,
                method: effectiveOpenMethod,
              });
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
    [config, onFileOpen]
  );

  useEffect(() => {
    if (!config.enabled) {
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
  }, [config.enabled, debouncedQuery, searchFiles]);

  return {
    fileActions,
    isSearching,
  };
}
