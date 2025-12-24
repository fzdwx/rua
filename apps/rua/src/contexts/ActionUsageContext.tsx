import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { ActionId } from "@fzdwx/ruaui";

const USAGE_STORAGE_KEY = "rua_action_usage";

interface UsageData {
  [actionId: string]: number;
}

interface ActionUsageContextValue {
  getUsageCount: (actionId: ActionId) => number;
  incrementUsage: (actionId: ActionId) => void;
  getAllUsageData: () => UsageData;
}

const ActionUsageContext = createContext<ActionUsageContextValue | undefined>(undefined);

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
 * Provider component that manages action usage state globally
 */
export function ActionUsageProvider({ children }: { children: React.ReactNode }) {
  // Global state for usage data
  const [usageData, setUsageData] = useState<UsageData>(() => loadUsageData());

  // Get usage count for a specific action
  const getUsageCount = useCallback(
    (actionId: ActionId): number => {
      return usageData[actionId] || 0;
    },
    [usageData]
  );

  // Increment usage count for an action
  const incrementUsage = useCallback((actionId: ActionId): void => {
    setUsageData((prevData) => {
      const newData = { ...prevData };
      newData[actionId] = (newData[actionId] || 0) + 1;
      saveUsageData(newData);
      return newData;
    });
  }, []);

  // Get all usage data
  const getAllUsageData = useCallback((): UsageData => {
    return usageData;
  }, [usageData]);

  const value = useMemo(
    () => ({
      getUsageCount,
      incrementUsage,
      getAllUsageData,
    }),
    [getUsageCount, incrementUsage, getAllUsageData]
  );

  return <ActionUsageContext.Provider value={value}>{children}</ActionUsageContext.Provider>;
}

/**
 * Custom hook to access action usage context
 * Must be used within ActionUsageProvider
 */
export function useActionUsage(): ActionUsageContextValue {
  const context = useContext(ActionUsageContext);
  if (context === undefined) {
    throw new Error("useActionUsage must be used within ActionUsageProvider");
  }
  return context;
}
