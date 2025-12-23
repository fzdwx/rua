/**
 * Search module exports
 *
 * Central export point for all search-related functionality
 */

// Types
export type {
  RecentUsageRecord,
  QueryAffinityRecord,
  ActionHistoryData,
  HistoryStorage,
} from './types';

// Storage
export {
  loadHistoryStorage,
  saveHistoryStorage,
  getActionHistory,
  saveActionHistory,
  clearHistory,
  exportHistory,
  importHistory,
  getCurrentDate,
  RECENT_USAGE_DAYS,
} from './storage/historyStorage';

export {
  recordActionUsage,
  getEffectiveAffinityCount,
  AFFINITY_COOLDOWN_MS,
  AFFINITY_DECAY_TAU_MS,
} from './storage/historyUpdater';

// Matching algorithms
export {
  calculateEditDistance,
  calculateEditDistanceScore,
} from './matching/editDistance';

export {
  calculatePrefixMatch,
  calculatePrefixScore,
} from './matching/prefixMatch';

export {
  isCharsetSubset,
  calculateCharsetScore,
} from './matching/charsetMatch';

export {
  calculateStandardScore,
  calculateBestScore,
} from './matching/scorer';

// Ranking
export {
  WEIGHT_HISTORY,
  WEIGHT_RECENT_HABIT,
  WEIGHT_TEMPORAL,
  WEIGHT_QUERY_AFFINITY,
  SUPPRESSION_THRESHOLD,
  RECENT_HABIT_DECAY_FACTOR,
  TEMPORAL_DECAY_TIME_S,
  TEMPORAL_HEAT_BASE,
} from './ranking/weights';

export {
  calculateFinalScore,
  calculateHistoryScore,
  calculateRecentHabitScore,
  calculateTemporalScore,
  calculateQueryAffinityScore,
  calculateSuppressionFactor,
} from './ranking/ranker';

// Keywords
export {
  containsChinese,
  toPinyin,
  toPinyinAcronym,
  removeSymbols,
} from './keywords/pinyinUtils';

export {
  generateKeywords,
  generateKeywordVariations,
} from './keywords/keywordGenerator';

export type { KeywordGenerationInput } from './keywords/keywordGenerator';
