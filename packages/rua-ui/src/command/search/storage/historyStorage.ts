/**
 * LocalStorage persistence for action usage history
 *
 * This module handles reading and writing action history data to localStorage.
 * Data is cleaned up automatically to remove stale records (> 7 days old).
 */

import type { ActionHistoryData, HistoryStorage, RecentUsageRecord } from '../types';

const STORAGE_KEY = 'rua-action-history';
const STORAGE_VERSION = 1;
const RECENT_USAGE_DAYS = 7;

/**
 * Get the current date in YYYY-MM-DD format
 */
function getCurrentDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Check if a date is within the recent usage period (7 days)
 */
function isRecentDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= RECENT_USAGE_DAYS;
}

/**
 * Clean up old recent usage records
 */
function cleanupRecentUsage(recentUsage: RecentUsageRecord[]): RecentUsageRecord[] {
  return recentUsage.filter((record) => isRecentDate(record.date));
}

/**
 * Load the complete history storage from localStorage
 */
export function loadHistoryStorage(): HistoryStorage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        version: STORAGE_VERSION,
        actions: {},
      };
    }

    const parsed: HistoryStorage = JSON.parse(stored);

    // Version check - if version mismatch, reset storage
    if (parsed.version !== STORAGE_VERSION) {
      console.warn('[HistoryStorage] Version mismatch, resetting storage');
      return {
        version: STORAGE_VERSION,
        actions: {},
      };
    }

    // Clean up old records for all actions
    for (const actionId in parsed.actions) {
      const history = parsed.actions[actionId];
      if (history.recentUsage) {
        history.recentUsage = cleanupRecentUsage(history.recentUsage);
      }
    }

    return parsed;
  } catch (error) {
    console.error('[HistoryStorage] Failed to load history:', error);
    return {
      version: STORAGE_VERSION,
      actions: {},
    };
  }
}

/**
 * Save the complete history storage to localStorage
 */
export function saveHistoryStorage(storage: HistoryStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error('[HistoryStorage] Failed to save history:', error);
  }
}

/**
 * Get history data for a specific action
 */
export function getActionHistory(actionId: string): ActionHistoryData | null {
  const storage = loadHistoryStorage();
  return storage.actions[actionId] || null;
}

/**
 * Save history data for a specific action
 */
export function saveActionHistory(actionId: string, history: ActionHistoryData): void {
  const storage = loadHistoryStorage();
  storage.actions[actionId] = history;
  saveHistoryStorage(storage);
}

/**
 * Clear all history data
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[HistoryStorage] Failed to clear history:', error);
  }
}

/**
 * Export for testing or debugging
 */
export function exportHistory(): string {
  return localStorage.getItem(STORAGE_KEY) || '{}';
}

/**
 * Import history data (for testing or migration)
 */
export function importHistory(data: string): void {
  try {
    const parsed = JSON.parse(data);
    if (parsed.version === STORAGE_VERSION) {
      localStorage.setItem(STORAGE_KEY, data);
    } else {
      console.error('[HistoryStorage] Cannot import - version mismatch');
    }
  } catch (error) {
    console.error('[HistoryStorage] Failed to import history:', error);
  }
}

export { getCurrentDate, RECENT_USAGE_DAYS };
