import * as React from "react";
import type { ActionImpl } from "./action";
import { Priority, useThrottledValue } from "./utils.ts";
import Fuse, { IFuseOptions } from "fuse.js";
import { ActionId, ActionTree } from "./types.ts";
import pinyinMatch from "pinyin-match";

export const NO_GROUP = {
  name: "none",
  priority: Priority.NORMAL,
};

const fuseOptions: IFuseOptions<ActionImpl> = {
  keys: [
    {
      name: "name",
      weight: 0.3,
    },
    {
      name: "keywords",
      getFn: (item) => (item.keywords ?? "").split(","),
      weight: 0.5,
    },
  ],
  includeScore: true,
  includeMatches: true,
  threshold: 0.2,
  minMatchCharLength: 1,
  ignoreLocation: false,
};

// Weight factor for usage count in sorting
// Higher value means usage count has more impact on sorting
const USAGE_COUNT_WEIGHT = 5;

//@ts-ignore
function order(a, b) {
  /**
   * Larger the priority = higher up the list
   * Now also considering usage count in the sorting
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
  options?: IFuseOptions<ActionImpl>
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

  const fuse = React.useMemo(() => new Fuse(filtered, options ? options : fuseOptions), [filtered]);

  const matches = useInternalMatches(filtered, search, fuse);

  const results = React.useMemo(() => {
    /**
     * Store a reference to a section and it's list of actions.
     * Alongside these actions, we'll keep a temporary record of the
     * final priority calculated by taking the commandScore + the
     * explicitly set `action.priority` value.
     */
    let map: Record<SectionName, { priority: number; action: ActionImpl }[]> = {};
    /**
     * Store another reference to a list of sections alongside
     * the section's final priority, calculated the same as above.
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
      // Add usage count to priority for sorting
      const usagePriority = (action.usageCount || 0) * USAGE_COUNT_WEIGHT;

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

      map[section.name].push({
        priority: action.priority + score + usagePriority,
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
   * Represents the commandScore matchiness value which we use
   * in addition to the explicitly set `action.priority` to
   * calculate a more fine tuned fuzzy search.
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
 * Match action using pinyin
 * Returns a score if matched, undefined if not matched
 */
function matchPinyin(action: ActionImpl, search: string): number | undefined {
  // Check name
  if (action.name && containsChinese(action.name)) {
    const matched = pinyinMatch.match(action.name, search);
    if (matched) {
      // Calculate score based on match quality
      // Full match gets higher score, partial match gets lower score
      return 0.3; // Lower score than exact Fuse match
    }
  }

  // Check keywords
  if (action.keywords && containsChinese(action.keywords)) {
    const keywords = action.keywords.split(",");
    for (const keyword of keywords) {
      const matched = pinyinMatch.match(keyword.trim(), search);
      if (matched) {
        return 0.4; // Medium score for keyword match
      }
    }
  }

  return undefined;
}

function useInternalMatches(filtered: ActionImpl[], search: string, fuse: Fuse<ActionImpl>) {
  const value = React.useMemo(
    () => ({
      filtered,
      search,
    }),
    [filtered, search]
  );

  const { filtered: throttledFiltered, search: throttledSearch } = useThrottledValue(value);

  return React.useMemo(() => {
    if (throttledSearch.trim() === "") {
      return throttledFiltered.map((action) => ({ score: 0, action }));
    }

    // Split search into tokens and search for each token
    const tokens = throttledSearch
      .trim()
      .split(/\s+/)
      .filter((t) => t.length > 0);

    if (tokens.length === 0) {
      return throttledFiltered.map((action) => ({ score: 0, action }));
    }

    // Use a Map to store unique matches by action ID
    const matchMap = new Map<string, Match>();

    if (tokens.length === 1) {
      const token = tokens[0];

      // 1. Fuse.js search
      const searchResults = fuse.search(token);
      for (const { item: action, score } of searchResults) {
        matchMap.set(action.id, {
          score: 1 / ((score ?? 0) + 1),
          action,
        });
      }

      // 2. Pinyin match - add results not already in Fuse results
      for (const action of throttledFiltered) {
        if (!matchMap.has(action.id)) {
          const pinyinScore = matchPinyin(action, token);
          if (pinyinScore !== undefined) {
            matchMap.set(action.id, {
              score: pinyinScore,
              action,
            });
          }
        }
      }

      return Array.from(matchMap.values());
    }

    // Multiple tokens: search for each token and intersect results
    // All tokens must match for an action to be included
    const tokenResults = tokens.map((token) => {
      const results = fuse.search(token);
      return new Map(results.map((r) => [r.item.id, r.score ?? 0]));
    });

    const pinyinTokenResults = tokens.map((token) => {
      const results = new Map<string, number>();
      for (const action of throttledFiltered) {
        const score = matchPinyin(action, token);
        if (score !== undefined) {
          results.set(action.id, score);
        }
      }
      return results;
    });

    // Find actions that match all tokens (either via Fuse or pinyin)
    const matches: Match[] = [];
    for (const action of throttledFiltered) {
      let totalScore = 0;
      let matchesAll = true;

      for (let i = 0; i < tokens.length; i++) {
        // Check if this token matches via Fuse or pinyin
        const fuseScore = tokenResults[i].get(action.id);
        const pinyinScore = pinyinTokenResults[i].get(action.id);

        if (fuseScore !== undefined) {
          totalScore += fuseScore;
        } else if (pinyinScore !== undefined) {
          totalScore += pinyinScore;
        } else {
          matchesAll = false;
          break;
        }
      }

      if (matchesAll) {
        // Average score across all tokens
        const avgScore = totalScore / tokens.length;
        matches.push({
          score: 1 / (avgScore + 1),
          action,
        });
      }
    }

    return matches;
  }, [throttledFiltered, throttledSearch, fuse]) as Match[];
}

/**
 * @deprecated use useMatches
 */
export const useDeepMatches = useMatches;
