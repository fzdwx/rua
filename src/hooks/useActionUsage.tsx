import { useCallback, useMemo } from "react";
import { ActionId } from "@/command";

const USAGE_STORAGE_KEY = "rua_action_usage";

interface UsageData {
  [actionId: string]: number;
}

/**
 * Load usage data from localStorage
 */
function loadUsageData(): UsageData {
  try {
    const data = localStorage.getItem(USAGE_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to load usage data:", error);
  }
  return {};
}

/**
 * Save usage data to localStorage
 */
function saveUsageData(data: UsageData): void {
  try {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save usage data:", error);
  }
}

/**
 * Custom hook to track action usage
 */
export function useActionUsage() {
  // Get usage count for a specific action
  const getUsageCount = useCallback((actionId: ActionId): number => {
    const data = loadUsageData();
    return data[actionId] || 0;
  }, []);

  // Increment usage count for an action
  const incrementUsage = useCallback((actionId: ActionId): void => {
    const data = loadUsageData();
    data[actionId] = (data[actionId] || 0) + 1;
    saveUsageData(data);
  }, []);

  // Get all usage data
  const getAllUsageData = useCallback((): UsageData => {
    return loadUsageData();
  }, []);

  // Track action execution and increment usage
  const trackAction = useCallback((actionId: ActionId, perform?: () => any) => {
    return () => {
      incrementUsage(actionId);
      if (perform) {
        return perform();
      }
    };
  }, [incrementUsage]);

  return useMemo(
    () => ({
      getUsageCount,
      incrementUsage,
      getAllUsageData,
      trackAction,
    }),
    [getUsageCount, incrementUsage, getAllUsageData, trackAction]
  );
}
