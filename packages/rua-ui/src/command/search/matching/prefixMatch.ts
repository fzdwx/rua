/**
 * Prefix matching algorithm
 *
 * Calculates how well a query matches the beginning of a keyword,
 * or if the query is a substring of the keyword.
 */

/**
 * Calculate the shared prefix length between query and keyword
 *
 * If query is a substring of keyword, returns query.length
 * Otherwise, returns the length of the shared prefix
 *
 * Examples:
 * - sharedPrefixLength("vsc", "vscode") → 3
 * - sharedPrefixLength("vss", "vscode") → 2
 * - sharedPrefixLength("code", "vscode") → 4 (substring match)
 *
 * @param query - The search query string
 * @param keyword - The keyword to match against
 * @returns Shared prefix length or substring match length
 */
export function calculatePrefixMatch(query: string, keyword: string): number {
  if (!query || !keyword) return 0;

  // Check if query is a substring of keyword
  if (keyword.includes(query)) {
    return query.length;
  }

  // Calculate shared prefix length
  let prefixLength = 0;
  const minLength = Math.min(query.length, keyword.length);

  for (let i = 0; i < minLength; i++) {
    if (query[i] === keyword[i]) {
      prefixLength++;
    } else {
      break;
    }
  }

  return prefixLength;
}

/**
 * Calculate prefix match score for ranking
 *
 * Returns a score based on how much of the query matches the keyword's prefix
 *
 * @param query - The search query
 * @param keyword - The keyword to match
 * @returns Score value (higher is better)
 */
export function calculatePrefixScore(query: string, keyword: string): number {
  const prefixLength = calculatePrefixMatch(query, keyword);

  if (prefixLength === 0) {
    return 0;
  }

  // If the entire query matches as a prefix or substring, give full score
  if (prefixLength === query.length) {
    return query.length;
  }

  // Partial prefix match
  return prefixLength;
}
