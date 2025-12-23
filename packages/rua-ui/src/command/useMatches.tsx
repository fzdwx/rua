import * as React from "react";
import type { ActionImpl } from "./action";
import { Priority, useThrottledValue } from "./utils.ts";
import { ActionId, ActionTree } from "./types.ts";
import pinyinMatch from "pinyin-match";
import { calculateBestScore, calculateFinalScore, MIN_SCORE_THRESHOLD } from "./search";
import type { SearchConfig } from "./search";

export const NO_GROUP = {
  name: "none",
  priority: Priority.NORMAL,
};

//@ts-ignore
function order(a, b) {
  /**
   * Larger the priority = higher up the list
   */
  return b.priority - a.priority;
}

type SectionName = string;

/**
 * returns deep matches only when a search query is present
 */
export function useMatches(
  search: string,
  actions: ActionTree,
  rootActionId: ActionId | null,
  searchConfig?: SearchConfig,
) {
  const rootResults = React.useMemo(() => {
    return Object.keys(actions)
      .reduce((acc, actionId) => {
        const action = actions[actionId];
        if (!action.parent && !rootActionId) {
          acc.push(action);
        }
        if (action.id === rootActionId) {
          for (let i = 0; i < action.children.length; i++) {
            acc.push(action.children[i]);
          }
        }
        return acc;
      }, [] as ActionImpl[])
      .sort(order);
  }, [actions, rootActionId]);

  const getDeepResults = React.useCallback((actions: ActionImpl[]) => {
    let actionsClone: ActionImpl[] = [];
    for (let i = 0; i < actions.length; i++) {
      actionsClone.push(actions[i]);
    }
    return (function collectChildren(actions: ActionImpl[], all = actionsClone) {
      for (let i = 0; i < actions.length; i++) {
        if (actions[i].children.length > 0) {
          let childsChildren = actions[i].children;
          for (let i = 0; i < childsChildren.length; i++) {
            all.push(childsChildren[i]);
          }
          collectChildren(actions[i].children, all);
        }
      }
      return all;
    })(actions);
  }, []);

  const emptySearch = !search;

  const filtered = React.useMemo(() => {
    if (emptySearch) return rootResults;
    return getDeepResults(rootResults);
  }, [getDeepResults, rootResults, emptySearch]);

  const matches = useInternalMatches(filtered, search, searchConfig);

  const results = React.useMemo(() => {
    /**
     * Store a reference to a section and it's list of actions.
     * The actions store the final ranking score which includes
     * base matching score + history weights + query affinity.
     */
    let map: Record<SectionName, { priority: number; action: ActionImpl }[]> = {};
    /**
     * Store another reference to a list of sections alongside
     * the section's final priority, calculated from action scores.
     */
    let list: { priority: number; name: SectionName }[] = [];
    /**
     * We'll take the list above and sort by its priority. Then we'll
     * collect all actions from the map above for this specific name and
     * sort by its priority as well.
     */
    let ordered: { name: SectionName; actions: ActionImpl[] }[] = [];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const action = match.action;
      const score = match.score || Priority.NORMAL;

      const section = {
        name:
          typeof action.section === "string"
            ? action.section
            : action.section?.name || NO_GROUP.name,
        priority:
          typeof action.section === "string" ? score : action.section?.priority || 0 + score,
      };

      if (!map[section.name]) {
        map[section.name] = [];
        list.push(section);
      }

      // Use the final ranking score (which includes history and affinity)
      map[section.name].push({
        priority: action.priority + score,
        action,
      });
    }

    ordered = list.sort(order).map((group) => ({
      name: group.name,
      actions: map[group.name].sort(order).map((item) => item.action),
    }));

    /**
     * Our final result is simply flattening the ordered list into
     * our familiar (ActionImpl | string)[] shape.
     */
    let results: (string | ActionImpl)[] = [];
    for (let i = 0; i < ordered.length; i++) {
      let group = ordered[i];
      if (group.name !== NO_GROUP.name) results.push(group.name);
      for (let i = 0; i < group.actions.length; i++) {
        results.push(group.actions[i]);
      }
    }
    return results;
  }, [matches]);

  // ensure that users have an accurate `currentRootActionId`
  // that syncs with the throttled return value.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoRootActionId = React.useMemo(() => rootActionId, [results]);

  return React.useMemo(
    () => ({
      results,
      rootActionId: memoRootActionId,
    }),
    [memoRootActionId, results]
  );
}

type Match = {
  action: ActionImpl;
  /**
   * Represents the final ranking score which includes:
   * - Standard matching score (edit distance + prefix + charset)
   * - Historical usage weights
   * - Query affinity
   * Higher score = better match and higher priority
   */
  score: number;
};

/**
 * Check if a string contains Chinese characters
 */
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Match action using pinyin (fallback method)
 * Returns a score if matched, undefined if not matched
 */
function matchPinyin(action: ActionImpl, search: string): number | undefined {
  // Check name
  if (action.name && containsChinese(action.name)) {
    const matched = pinyinMatch.match(action.name, search);
    if (matched) {
      return 30; // Give it a reasonable base score
    }
  }

  // Check keywords
  if (action.keywords && Array.isArray(action.keywords)) {
    for (const keyword of action.keywords) {
      if (containsChinese(keyword)) {
        const matched = pinyinMatch.match(keyword, search);
        if (matched) {
          return 40; // Medium score for keyword match
        }
      }
    }
  }

  return undefined;
}

function useInternalMatches(filtered: ActionImpl[], search: string, searchConfig?: SearchConfig) {
  const value = React.useMemo(
    () => ({
      filtered,
      search,
    }),
    [filtered, search]
  );

  const { filtered: throttledFiltered, search: throttledSearch } = useThrottledValue(value);

  // Extract config values to avoid dependency on the config object itself
  const minScoreThreshold = searchConfig?.minScoreThreshold ?? MIN_SCORE_THRESHOLD;
  const maxResults = searchConfig?.maxResults;
  const prefixBoost = searchConfig?.prefixMatchBoost ?? 2.0;
  const debug = searchConfig?.debug ?? false;
  const weightHistory = searchConfig?.weights?.history;
  const weightRecentHabit = searchConfig?.weights?.recentHabit;
  const weightTemporal = searchConfig?.weights?.temporal;
  const weightQueryAffinity = searchConfig?.weights?.queryAffinity;
  const suppressionThreshold = searchConfig?.suppressionThreshold;

  return React.useMemo(() => {
    if (throttledSearch.trim() === "") {
      // Empty search: return all actions with their base priority
      return throttledFiltered.map((action) => ({
        score: action.priority || Priority.NORMAL,
        action,
      }));
    }

    const query = throttledSearch.trim().toLowerCase();
    const matches: Match[] = [];

    // Reconstruct config object from extracted values
    const config: SearchConfig | undefined =
      weightHistory !== undefined ||
      weightRecentHabit !== undefined ||
      weightTemporal !== undefined ||
      weightQueryAffinity !== undefined ||
      suppressionThreshold !== undefined
        ? {
            weights: {
              history: weightHistory,
              recentHabit: weightRecentHabit,
              temporal: weightTemporal,
              queryAffinity: weightQueryAffinity,
            },
            suppressionThreshold,
          }
        : undefined;

    for (const action of throttledFiltered) {
      // 1. Standard matching algorithm (primary method)
      const keywords = action.keywords || [];
      let standardScore = calculateBestScore(query, keywords, prefixBoost);

      // 2. Pinyin matching (fallback for Chinese text)
      const pinyinScore = matchPinyin(action, query);

      // Choose the best score between standard and pinyin
      let baseScore: number;

      if (standardScore > -Infinity && pinyinScore !== undefined) {
        baseScore = Math.max(standardScore, pinyinScore);
      } else if (standardScore > -Infinity) {
        baseScore = standardScore;
      } else if (pinyinScore !== undefined) {
        baseScore = pinyinScore;
      } else {
        // No match at all, skip this action
        continue;
      }

      // 3. Calculate final ranking score (includes history and query affinity)
      const finalScore = calculateFinalScore(action, query, baseScore, config);

      // 4. Apply minimum score threshold filter
      if (finalScore < minScoreThreshold) {
        if (debug) {
          console.log(`[Search] Filtered out "${action.name}" - score: ${finalScore.toFixed(2)} < threshold: ${minScoreThreshold}`);
        }
        continue;
      }

      if (debug) {
        console.log(`[Search] "${action.name}" - base: ${baseScore.toFixed(2)}, final: ${finalScore.toFixed(2)}`);
      }

      matches.push({
        action,
        score: finalScore,
      });
    }

    // Sort by final score (descending)
    const sortedMatches = matches.sort((a, b) => b.score - a.score);

    // Apply max results limit if specified
    if (maxResults !== undefined && maxResults > 0) {
      return sortedMatches.slice(0, maxResults);
    }

    return sortedMatches;
  }, [
    throttledFiltered,
    throttledSearch,
    minScoreThreshold,
    maxResults,
    prefixBoost,
    debug,
    weightHistory,
    weightRecentHabit,
    weightTemporal,
    weightQueryAffinity,
    suppressionThreshold,
  ]) as Match[];
}
