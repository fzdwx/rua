/**
 * Search algorithm type definitions
 *
 * This module defines types used by the search and ranking system.
 */

/**
 * Recent usage record for a specific date
 */
export interface RecentUsageRecord {
  date: string;       // Format: YYYY-MM-DD
  count: number;      // Launch count for that day
}

/**
 * Query affinity record tracking how often an action is launched
 * in response to a specific search query
 */
export interface QueryAffinityRecord {
  count: number;      // Effective launch count (with decay accumulation)
  lastTime: number;   // Last launch timestamp in milliseconds
}

/**
 * History data stored in localStorage for each action
 */
export interface ActionHistoryData {
  usageCount: number;
  lastUsedTime: number;
  recentUsage: RecentUsageRecord[];
  queryAffinity: Record<string, QueryAffinityRecord>;
  stableBias?: number;
}

/**
 * Complete history storage structure in localStorage
 * Key: 'rua-action-history'
 */
export interface HistoryStorage {
  version: number;                              // Data structure version (current: 1)
  actions: Record<string, ActionHistoryData>;   // Indexed by actionId
}
