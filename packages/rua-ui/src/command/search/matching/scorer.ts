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

import { calculateEditDistanceScore } from "./editDistance";
import { calculatePrefixScore } from "./prefixMatch";
import { calculateCharsetScore } from "./charsetMatch";
import { tokenizeQuery } from "./tokenizer";

const DEFAULT_PREFIX_BOOST = 2.0;
const KEYWORD_MATCH_BOOST = 15.0;  // Boost score for matching user-defined keywords

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
  prefixBoost: number = DEFAULT_PREFIX_BOOST
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
 * Calculate multi-word matching score with AND logic
 *
 * For multi-word queries like "vsc 项目名", this function:
 * 1. Matches each token against all keywords
 * 2. Requires ALL tokens to match (AND logic)
 * 3. Tracks which tokens matched user-defined keywords (for boosting)
 * 4. Returns weighted average score with higher weight for earlier tokens
 *
 * @param tokens - Array of search tokens (e.g., ["vsc", "项目名"])
 * @param keywords - All keywords to match against
 * @param userKeywords - Set of user-defined keywords (for boost tracking)
 * @param prefixBoost - Multiplier for prefix match score
 * @returns Object with score and count of user-keyword matches
 */
function calculateMultiWordScore(
  tokens: string[],
  keywords: string[],
  userKeywords: Set<string>,
  prefixBoost: number = DEFAULT_PREFIX_BOOST
): { score: number; keywordMatchCount: number } {

  if (tokens.length === 0 || keywords.length === 0) {
    return { score: -Infinity, keywordMatchCount: 0 };
  }

  // Single token: find best matching keyword
  if (tokens.length === 1) {
    let bestScore = -Infinity;
    let isKeywordMatch = false;

    for (const keyword of keywords) {
      const score = calculateStandardScore(tokens[0], keyword, prefixBoost);
      if (score > bestScore) {
        bestScore = score;
        isKeywordMatch = userKeywords.has(keyword);
      }
    }

    return {
      score: bestScore,
      keywordMatchCount: isKeywordMatch ? 1 : 0
    };
  }

  // Multi-word matching: each token must find a match (AND logic)
  const tokenScores: number[] = [];
  let keywordMatchCount = 0;

  for (const token of tokens) {
    let bestScore = -Infinity;
    let isKeywordMatch = false;

    // Find best matching keyword for this token
    for (const keyword of keywords) {
      const score = calculateStandardScore(token, keyword, prefixBoost);

      if (score > bestScore) {
        bestScore = score;
        isKeywordMatch = userKeywords.has(keyword);
      }
    }

    // AND logic: if any token has no match, entire query fails
    if (bestScore === -Infinity) {
      return { score: -Infinity, keywordMatchCount: 0 };
    }

    if (isKeywordMatch) {
      keywordMatchCount++;
    }

    tokenScores.push(bestScore);
  }

  // Calculate weighted average: earlier tokens weighted higher
  // Weights: 1.0, 0.8, 0.6, 0.4, ..., min 0.2
  let totalScore = 0;
  let totalWeight = 0;

  for (let i = 0; i < tokenScores.length; i++) {
    const weight = Math.max(0.2, 1.0 - i * 0.2);
    totalScore += tokenScores[i] * weight;
    totalWeight += weight;
  }

  const averageScore = totalScore / totalWeight;

  return {
    score: averageScore,
    keywordMatchCount
  };
}

/**
 * Calculate the best matching score across multiple keywords
 *
 * For actions with multiple search keywords, this finds the highest
 * scoring keyword and returns that score.
 *
 * This function now supports multi-word queries with AND logic.
 * User-defined keywords receive a boost to improve relevance ranking.
 *
 * @param query - The search query (should be lowercase)
 * @param keywords - Array of keywords to match against (should be lowercase)
 * @param prefixBoost - Multiplier for prefix match score (default: 2.0)
 * @param userKeywords - Set of user-defined keywords (for boost calculation)
 * @returns Best match score across all keywords, or -Infinity if no valid match
 */
export function calculateBestScore(
  query: string,
  keywords: string[],
  prefixBoost: number = DEFAULT_PREFIX_BOOST,
  userKeywords?: Set<string>
): number {
  if (!query || keywords.length === 0) {
    return -Infinity;
  }

  // Tokenize the query
  const queryTokens = tokenizeQuery(query);
  const userKeywordSet = userKeywords || new Set<string>();

  // Calculate multi-word score with AND logic
  const { score: baseScore, keywordMatchCount } = calculateMultiWordScore(
    queryTokens.tokens,
    keywords,
    userKeywordSet,
    prefixBoost
  );

  // Apply user-keyword match boost
  const keywordBoost = keywordMatchCount * KEYWORD_MATCH_BOOST;

  return baseScore + keywordBoost;
}
