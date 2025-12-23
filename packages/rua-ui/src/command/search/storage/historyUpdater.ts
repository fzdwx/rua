/**
 * History updater logic
 *
 * This module handles updating action history when actions are executed.
 * It implements:
 * - Usage count increment
 * - Recent usage tracking (7-day window)
 * - Query affinity with exponential decay and cooldown
 */

import type { ActionHistoryData, RecentUsageRecord, QueryAffinityRecord } from '../types';
import { getActionHistory, saveActionHistory, getCurrentDate } from './historyStorage';

// Constants for query affinity
const AFFINITY_COOLDOWN_MS = 60 * 1000; // 60 seconds cooldown
const AFFINITY_DECAY_TAU_MS = 259200 * 1000; // 3 days in milliseconds

/**
 * Update recent usage records for the current day
 */
function updateRecentUsage(recentUsage: RecentUsageRecord[] = []): RecentUsageRecord[] {
  const today = getCurrentDate();

  // Find if today's record exists
  const todayIndex = recentUsage.findIndex((record) => record.date === today);

  if (todayIndex >= 0) {
    // Increment today's count
    const updated = [...recentUsage];
    updated[todayIndex] = {
      ...updated[todayIndex],
      count: updated[todayIndex].count + 1,
    };
    return updated;
  } else {
    // Add new record for today
    return [...recentUsage, { date: today, count: 1 }];
  }
}

/**
 * Calculate decayed count based on time elapsed
 */
function calculateDecayedCount(oldCount: number, timeDeltaMs: number, tauMs: number): number {
  return oldCount * Math.exp(-timeDeltaMs / tauMs);
}

/**
 * Update query affinity for a specific search query
 * Implements cooldown mechanism and exponential decay accumulation
 */
function updateQueryAffinity(
  queryAffinity: Record<string, QueryAffinityRecord> = {},
  query: string,
  now: number
): Record<string, QueryAffinityRecord> {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    // Don't record empty queries
    return queryAffinity;
  }

  const existing = queryAffinity[normalizedQuery];

  if (!existing) {
    // First time this query is used with this action
    return {
      ...queryAffinity,
      [normalizedQuery]: {
        count: 1,
        lastTime: now,
      },
    };
  }

  const timeDelta = now - existing.lastTime;

  // Cooldown check: only update if enough time has passed
  if (timeDelta < AFFINITY_COOLDOWN_MS) {
    return queryAffinity;
  }

  // Apply exponential decay to old count and add 1 for this launch
  const decayedCount = calculateDecayedCount(existing.count, timeDelta, AFFINITY_DECAY_TAU_MS);
  const newCount = decayedCount + 1;

  return {
    ...queryAffinity,
    [normalizedQuery]: {
      count: newCount,
      lastTime: now,
    },
  };
}

/**
 * Record action usage and update all history metrics
 *
 * @param actionId - The ID of the action being executed
 * @param query - The search query used when the action was selected
 */
export function recordActionUsage(actionId: string, query: string = ''): void {
  const now = Date.now();

  // Load existing history or create new
  const existingHistory = getActionHistory(actionId);

  const updatedHistory: ActionHistoryData = {
    usageCount: (existingHistory?.usageCount || 0) + 1,
    lastUsedTime: now,
    recentUsage: updateRecentUsage(existingHistory?.recentUsage || []),
    queryAffinity: updateQueryAffinity(existingHistory?.queryAffinity || {}, query, now),
    stableBias: existingHistory?.stableBias,
  };

  // Save back to storage
  saveActionHistory(actionId, updatedHistory);
}

/**
 * Get current effective count for query affinity (with decay applied)
 * Used during ranking to calculate current affinity score
 */
export function getEffectiveAffinityCount(
  record: QueryAffinityRecord,
  currentTime: number
): number {
  const timeDelta = currentTime - record.lastTime;
  return calculateDecayedCount(record.count, timeDelta, AFFINITY_DECAY_TAU_MS);
}

export { AFFINITY_COOLDOWN_MS, AFFINITY_DECAY_TAU_MS };
