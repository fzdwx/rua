/**
 * File Search Configuration Types
 */

/**
 * File search configuration stored in system preferences
 */
export interface FileSearchConfig {
  /** Enable/disable file system search */
  enabled: boolean;
  /** Maximum number of search results to display */
  maxResults: number;
  /** Minimum number of app/extension results before showing file search */
  threshold: number;
  /** Method to open files: "xdg-open" or "system" */
  openMethod: "xdg-open" | "system";
  /** Custom search paths (array of directory paths) */
  customPaths: string[];
}

/**
 * Default file search configuration
 */
export const DEFAULT_FILE_SEARCH_CONFIG: FileSearchConfig = {
  enabled: true,
  maxResults: 20,
  threshold: 5,
  openMethod: "xdg-open",
  customPaths: [],
};
