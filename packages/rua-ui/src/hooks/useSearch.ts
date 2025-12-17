import { useMemo, useCallback } from 'react';
import Fuse, { IFuseOptions } from 'fuse.js';
import pinyinMatch from 'pinyin-match';
import { ListItem } from '../types';

export interface UseSearchOptions {
  items: ListItem[];
  query: string;
  enablePinyin?: boolean;
  fuseOptions?: IFuseOptions<ListItem>;
}

const defaultFuseOptions: IFuseOptions<ListItem> = {
  keys: [
    {
      name: 'title',
      weight: 0.5,
    },
    {
      name: 'keywords',
      getFn: (item) => item.keywords || [],
      weight: 0.5,
    },
    {
      name: 'subtitle',
      weight: 0.3,
    },
  ],
  includeScore: true,
  threshold: 0.3,
  minMatchCharLength: 1,
  ignoreLocation: true,
};

/**
 * Check if a string contains Chinese characters
 */
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Match item using pinyin
 * Returns a score if matched, undefined if not matched
 */
function matchPinyin(item: ListItem, search: string): number | undefined {
  // Check title
  if (item.title && containsChinese(item.title)) {
    const matched = pinyinMatch.match(item.title, search);
    if (matched) {
      return 0.3; // Lower score than exact Fuse match
    }
  }

  // Check subtitle
  if (item.subtitle && containsChinese(item.subtitle)) {
    const matched = pinyinMatch.match(item.subtitle, search);
    if (matched) {
      return 0.5; // Even lower score for subtitle match
    }
  }

  // Check keywords
  if (item.keywords) {
    for (const keyword of item.keywords) {
      if (containsChinese(keyword)) {
        const matched = pinyinMatch.match(keyword.trim(), search);
        if (matched) {
          return 0.4; // Medium score for keyword match
        }
      }
    }
  }

  return undefined;
}

export interface SearchResult {
  item: ListItem;
  score: number;
}

/**
 * Hook for searching items with fuzzy search and optional pinyin support
 */
export function useSearch({
  items,
  query,
  enablePinyin = false,
  fuseOptions,
}: UseSearchOptions): SearchResult[] {
  const fuse = useMemo(
    () => new Fuse(items, fuseOptions || defaultFuseOptions),
    [items, fuseOptions]
  );

  const results = useMemo(() => {
    const trimmedQuery = query.trim();

    // If no query, return all items with score 0
    if (!trimmedQuery) {
      return items.map((item) => ({ item, score: 0 }));
    }

    // Use a Map to store unique matches by item ID
    const matchMap = new Map<string, SearchResult>();

    // 1. Fuse.js fuzzy search
    const fuseResults = fuse.search(trimmedQuery);
    for (const { item, score } of fuseResults) {
      matchMap.set(item.id, {
        item,
        score: 1 / ((score ?? 0) + 1),
      });
    }

    // 2. Pinyin match - add results not already in Fuse results
    if (enablePinyin) {
      for (const item of items) {
        if (!matchMap.has(item.id)) {
          const pinyinScore = matchPinyin(item, trimmedQuery);
          if (pinyinScore !== undefined) {
            matchMap.set(item.id, {
              item,
              score: pinyinScore,
            });
          }
        }
      }
    }

    return Array.from(matchMap.values()).sort((a, b) => b.score - a.score);
  }, [items, query, fuse, enablePinyin]);

  return results;
}
