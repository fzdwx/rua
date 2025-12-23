/**
 * Ranking algorithm with multi-dimensional weights
 *
 * Calculates final ranking score by combining:
 * 1. Base matching score (from standard matcher + stable bias)
 * 2. Historical usage score (ln(1 + usageCount))
 * 3. Recent habit score (7-day weighted sum with decay)
 * 4. Temporal heat score (time since last use)
 * 5. Query affinity score (query-specific launch history)
 *
 * Formula:
 * finalScore = baseScore + (dynamicWeights × suppressionFactor) + (queryAffinity × weight)
 */

import type { ActionImpl } from '../../action';
import type { SearchConfig } from '../types';
import { getEffectiveAffinityCount } from '../storage/historyUpdater';
import {
  WEIGHT_HISTORY,
  WEIGHT_RECENT_HABIT,
  WEIGHT_TEMPORAL,
  WEIGHT_QUERY_AFFINITY,
  SUPPRESSION_THRESHOLD,
  RECENT_HABIT_DECAY_FACTOR,
  TEMPORAL_DECAY_TIME_S,
  TEMPORAL_HEAT_BASE,
  RECENT_USAGE_DAYS,
} from './weights';

/**
 * Calculate historical launch count score
 *
 * Formula: ln(1 + usageCount)
 *
 * @param usageCount - Total number of times the action has been launched
 * @returns History score
 */
function calculateHistoryScore(usageCount: number = 0): number {
  return Math.log(1 + usageCount);
}

/**
 * Calculate recent usage habit score (last 7 days with decay)
 *
 * Formula: Σ(count[i] × (1.3)^(-i))
 * where i is the number of days ago (0 = today)
 *
 * @param recentUsage - Array of recent usage records
 * @returns Recent habit score
 */
function calculateRecentHabitScore(recentUsage: Array<{ date: string; count: number }> = []): number {
  if (recentUsage.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let score = 0;

  for (const record of recentUsage) {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);

    const daysAgo = Math.floor((today.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));

    // Only consider last RECENT_USAGE_DAYS days
    if (daysAgo >= 0 && daysAgo < RECENT_USAGE_DAYS) {
      const weight = Math.pow(RECENT_HABIT_DECAY_FACTOR, -daysAgo);
      score += record.count * weight;
    }
  }

  return score;
}

/**
 * Calculate temporal heat score (how recently was the action used)
 *
 * Formula: K / (1 + timeSinceLast / T)
 * where K = 6, T = 10800 seconds (3 hours)
 *
 * @param lastUsedTime - Timestamp of last usage in milliseconds
 * @returns Temporal heat score
 */
function calculateTemporalScore(lastUsedTime: number = 0): number {
  if (lastUsedTime === 0) return 0;

  const now = Date.now();
  const timeSinceLastMs = now - lastUsedTime;
  const timeSinceLastS = timeSinceLastMs / 1000;

  return TEMPORAL_HEAT_BASE / (1 + timeSinceLastS / TEMPORAL_DECAY_TIME_S);
}

/**
 * Calculate query affinity score for a specific search query
 *
 * Formula: ln(1 + effectiveCount) × 10
 * where effectiveCount = storedCount × e^(-Δt / τ)
 * τ = 259200 seconds (3 days)
 *
 * @param action - The action with query affinity data
 * @param query - The current search query
 * @returns Query affinity score
 */
function calculateQueryAffinityScore(
  action: ActionImpl,
  query: string
): number {
  if (!action.queryAffinity || !query) return 0;

  const normalizedQuery = query.trim().toLowerCase();
  const affinityRecord = action.queryAffinity[normalizedQuery];

  if (!affinityRecord) return 0;

  const now = Date.now();
  const effectiveCount = getEffectiveAffinityCount(affinityRecord, now);

  return Math.log(1 + effectiveCount) * 10;
}

/**
 * Calculate suppression factor based on base score
 *
 * Formula: Clamp(baseScore / threshold, 0.0, 1.0)
 *
 * This prevents high-frequency irrelevant actions from dominating
 * low-frequency but highly relevant actions.
 *
 * @param baseScore - The base matching score
 * @param threshold - Suppression threshold (default from config)
 * @returns Suppression factor between 0 and 1
 */
function calculateSuppressionFactor(baseScore: number, threshold: number = SUPPRESSION_THRESHOLD): number {
  return Math.max(0, Math.min(1, baseScore / threshold));
}

/**
 * Calculate final ranking score for an action
 *
 * @param action - The action to rank
 * @param query - The current search query
 * @param standardMatchScore - The base matching score from the standard matcher
 * @param config - Optional search configuration to override default weights
 * @returns Final ranking score
 */
export function calculateFinalScore(
  action: ActionImpl,
  query: string,
  standardMatchScore: number,
  config?: SearchConfig,
): number {
  // Get weights from config or use defaults
  const weightHistory = config?.weights?.history ?? WEIGHT_HISTORY;
  const weightRecentHabit = config?.weights?.recentHabit ?? WEIGHT_RECENT_HABIT;
  const weightTemporal = config?.weights?.temporal ?? WEIGHT_TEMPORAL;
  const weightQueryAffinity = config?.weights?.queryAffinity ?? WEIGHT_QUERY_AFFINITY;
  const suppressionThreshold = config?.suppressionThreshold ?? SUPPRESSION_THRESHOLD;

  // Base score = standard match score + stable bias
  const stableBias = action.stableBias || 0;
  const baseScore = standardMatchScore + stableBias;

  // Calculate individual dimension scores
  const historyScore = calculateHistoryScore(action.usageCount);
  const recentHabitScore = calculateRecentHabitScore(action.recentUsage);
  const temporalScore = calculateTemporalScore(action.lastUsedTime);
  const queryAffinityScore = calculateQueryAffinityScore(action, query);

  // Calculate dynamic weights sum
  const dynamicWeights =
    historyScore * weightHistory +
    recentHabitScore * weightRecentHabit +
    temporalScore * weightTemporal;

  // Calculate suppression factor
  const suppressionFactor = calculateSuppressionFactor(baseScore, suppressionThreshold);

  // Final score formula
  const finalScore =
    baseScore +
    dynamicWeights * suppressionFactor +
    queryAffinityScore * weightQueryAffinity;

  return finalScore;
}

// Export individual score calculators for testing
export {
  calculateHistoryScore,
  calculateRecentHabitScore,
  calculateTemporalScore,
  calculateQueryAffinityScore,
  calculateSuppressionFactor,
};
