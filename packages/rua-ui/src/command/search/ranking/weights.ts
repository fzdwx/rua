/**
 * Ranking weight configuration
 *
 * These constants define the relative importance of different
 * factors in the final ranking score calculation.
 */

/**
 * Weight for historical launch count
 * Uses ln(1 + count) to prevent unbounded growth
 * Default: 0.8 (relatively low to avoid over-reliance on history)
 */
export const WEIGHT_HISTORY = 0.8;

/**
 * Weight for recent usage habit (last 7 days with decay)
 * Higher weight because recent usage is more indicative of current needs
 * Default: 1.5
 */
export const WEIGHT_RECENT_HABIT = 1.5;

/**
 * Weight for temporal heat (how recently the action was used)
 * Lower weight as it's mainly for temporary boost
 * Default: 0.5
 */
export const WEIGHT_TEMPORAL = 0.5;

/**
 * Weight for query affinity (how often this action is launched for this specific query)
 * Highest weight because query-specific history is the strongest signal
 * Default: 3.0
 */
export const WEIGHT_QUERY_AFFINITY = 3.0;

/**
 * Suppression threshold for base score
 * Actions with baseScore < threshold will have dynamic weights suppressed
 * This prevents high-frequency irrelevant actions from dominating
 * Default: 15.0
 */
export const SUPPRESSION_THRESHOLD = 15.0;

/**
 * Decay factor for recent usage habit
 * Each day back is weighted by (1/DECAY_FACTOR)^dayIndex
 * Default: 1.3
 */
export const RECENT_HABIT_DECAY_FACTOR = 1.3;

/**
 * Temporal heat decay time constant in seconds
 * Used in formula: K / (1 + timeSinceLast / T)
 * Default: 10800 seconds (3 hours)
 */
export const TEMPORAL_DECAY_TIME_S = 10800;

/**
 * Temporal heat base multiplier
 * Used in formula: K / (1 + timeSinceLast / T)
 * Default: 6
 */
export const TEMPORAL_HEAT_BASE = 6;

/**
 * Maximum days to consider for recent usage
 * Default: 7 days
 */
export const RECENT_USAGE_DAYS = 7;
