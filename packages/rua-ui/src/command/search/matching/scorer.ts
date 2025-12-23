/**
 * Standard matching scorer
 *
 * Integrates edit distance, prefix matching, and character set matching
 * to produce a comprehensive match score for search ranking.
 *
 * Formula:
 * standardScore = editDistanceScore + prefixScore + charsetScore
 *
 * Where:
 * - editDistanceScore = 100 × (1 - minEditDist / queryLength) - log₂(keywordLength + 1)
 * - prefixScore = prefixMatchLength × prefixBoost (default boost: 2)
 * - charsetScore = query.length if charset match, else 0
 */

import { calculateEditDistanceScore } from './editDistance';
import { calculatePrefixScore } from './prefixMatch';
import { calculateCharsetScore } from './charsetMatch';

const DEFAULT_PREFIX_BOOST = 2.0;

/**
 * Calculate standard matching score for a single keyword
 *
 * @param query - The search query (should be lowercase)
 * @param keyword - The keyword to match against (should be lowercase)
 * @param prefixBoost - Multiplier for prefix match score (default: 2.0)
 * @returns Match score (higher is better), or -Infinity if no valid match
 */
export function calculateStandardScore(
  query: string,
  keyword: string,
  prefixBoost: number = DEFAULT_PREFIX_BOOST,
): number {
  if (!query || !keyword) {
    return -Infinity;
  }

  const queryLength = query.length;
  const keywordLength = keyword.length;

  // Constraint: query cannot be longer than keyword
  if (queryLength > keywordLength) {
    return -Infinity;
  }

  // 1. Edit distance score component
  const editDistanceNormalized = calculateEditDistanceScore(query, keyword);

  if (editDistanceNormalized === -Infinity) {
    return -Infinity;
  }

  // Scale by 100 and subtract keyword length penalty (using log₂)
  const keywordLengthPenalty = Math.log2(keywordLength + 1);
  const editDistanceScore = 100 * editDistanceNormalized - keywordLengthPenalty;

  // 2. Prefix match score component (with configurable boost)
  const prefixScore = calculatePrefixScore(query, keyword) * prefixBoost;

  // 3. Character set match score component
  const charsetScore = calculateCharsetScore(query, keyword);

  // Combine all components
  const standardScore = editDistanceScore + prefixScore + charsetScore;

  return standardScore;
}

/**
 * Calculate the best matching score across multiple keywords
 *
 * For actions with multiple search keywords, this finds the highest
 * scoring keyword and returns that score.
 *
 * @param query - The search query (should be lowercase)
 * @param keywords - Array of keywords to match against (should be lowercase)
 * @param prefixBoost - Multiplier for prefix match score (default: 2.0)
 * @returns Best match score across all keywords, or -Infinity if no valid match
 */
export function calculateBestScore(
  query: string,
  keywords: string[],
  prefixBoost: number = DEFAULT_PREFIX_BOOST,
): number {
  if (!query || keywords.length === 0) {
    return -Infinity;
  }

  let bestScore = -Infinity;

  for (const keyword of keywords) {
    const score = calculateStandardScore(query, keyword, prefixBoost);
    if (score > bestScore) {
      bestScore = score;
    }
  }

  return bestScore;
}
