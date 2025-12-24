/**
 * Search algorithm type definitions
 *
 * This module defines types used by the search and ranking system.
 */

/**
 * Recent usage record for a specific date
 */
export interface RecentUsageRecord {
  date: string; // Format: YYYY-MM-DD
  count: number; // Launch count for that day
}

/**
 * Query affinity record tracking how often an action is launched
 * in response to a specific search query
 */
export interface QueryAffinityRecord {
  count: number; // Effective launch count (with decay accumulation)
  lastTime: number; // Last launch timestamp in milliseconds
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
  version: number; // Data structure version (current: 1)
  actions: Record<string, ActionHistoryData>; // Indexed by actionId
}

/**
 * Search configuration options
 *
 * Allows customization of search behavior and ranking algorithm
 */
export interface SearchConfig {
  /**
   * Minimum score threshold
   * Actions with final score below this value will be filtered out
   *
   * Recommended values:
   * - -Infinity: Show all matches (no filtering)
   * - 0 (default): Filter out negative scores (balanced)
   * - 10: Only show reasonably relevant results
   * - 20: Only show highly relevant results
   * - 50: Only show near-exact matches
   */
  minScoreThreshold?: number;

  /**
   * Enable debug logging for search scoring
   * Logs each action's base score and final score to console
   * Default: false
   */
  debug?: boolean;

  /**
   * Maximum number of results to return
   * Useful for performance optimization with large datasets
   * Default: undefined (no limit)
   */
  maxResults?: number;

  /**
   * Ranking weight configuration
   * Override default weights for different ranking factors
   */
  weights?: {
    /**
     * Weight for historical launch count: ln(1 + count)
     * Default: 0.8
     */
    history?: number;

    /**
     * Weight for recent usage habit (last 7 days with decay)
     * Default: 1.5
     */
    recentHabit?: number;

    /**
     * Weight for temporal heat (how recently used)
     * Default: 0.5
     */
    temporal?: number;

    /**
     * Weight for query affinity (query-specific history)
     * Default: 3.0
     */
    queryAffinity?: number;
  };

  /**
   * Suppression threshold for dynamic weights
   * Actions with baseScore < threshold will have history weights suppressed
   * This prevents high-frequency irrelevant items from dominating results
   * Default: 15.0
   */
  suppressionThreshold?: number;

  /**
   * Boost multiplier for prefix matches
   * Prefix match score is multiplied by this value
   * Default: 2.0
   */
  prefixMatchBoost?: number;
}
