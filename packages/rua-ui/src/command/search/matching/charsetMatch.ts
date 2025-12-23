/**
 * Character set matching algorithm
 *
 * Checks if all characters in the query exist in the keyword,
 * regardless of order. This helps match cases where users
 * type characters in a different order (e.g., "staem" vs "steam").
 */

/**
 * Check if query's character set is a subset of keyword's character set
 *
 * Examples:
 * - isCharsetSubset("staem", "steam") → true (same characters, different order)
 * - isCharsetSubset("steam", "team") → false ('s' is missing in "team")
 * - isCharsetSubset("abc", "abcdef") → true
 *
 * @param query - The search query string
 * @param keyword - The keyword to match against
 * @returns True if all query characters exist in keyword
 */
export function isCharsetSubset(query: string, keyword: string): boolean {
  if (!query) return true;
  if (!keyword) return false;

  // Create a character frequency map for keyword
  const keywordChars = new Map<string, number>();

  for (const char of keyword) {
    keywordChars.set(char, (keywordChars.get(char) || 0) + 1);
  }

  // Check if all query characters exist with sufficient frequency
  const queryChars = new Map<string, number>();

  for (const char of query) {
    queryChars.set(char, (queryChars.get(char) || 0) + 1);
  }

  for (const [char, count] of queryChars) {
    const keywordCount = keywordChars.get(char) || 0;
    if (keywordCount < count) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate character set match score for ranking
 *
 * If query's character set is a subset of keyword's character set,
 * returns the query length as the score. Otherwise returns 0.
 *
 * This gives bonus points for queries where the user may have
 * typed characters in the wrong order.
 *
 * @param query - The search query
 * @param keyword - The keyword to match
 * @returns Score value (query.length if subset, 0 otherwise)
 */
export function calculateCharsetScore(query: string, keyword: string): number {
  if (isCharsetSubset(query, keyword)) {
    return query.length;
  }
  return 0;
}
