/**
 * Edit distance (Levenshtein distance) algorithm
 *
 * Calculates the minimum number of single-character edits (insertions,
 * deletions, or substitutions) required to change one string into another.
 *
 * Implementation uses rolling array optimization for O(n) space complexity.
 */

/**
 * Calculate the minimum edit distance from query to any substring of keyword
 *
 * This algorithm finds the best matching substring in keyword that can be
 * transformed from query with the minimum number of edits.
 *
 * Constraint: If query.length > keyword.length, returns Infinity
 *
 * Time complexity: O(n * m) where n = keyword.length, m = query.length
 * Space complexity: O(n) using rolling array optimization
 *
 * @param query - The search query string
 * @param keyword - The keyword to match against
 * @returns Minimum edit distance, or Infinity if query is longer than keyword
 */
export function calculateEditDistance(query: string, keyword: string): number {
  const m = query.length;
  const n = keyword.length;

  // Constraint: query cannot be longer than keyword
  if (m > n) {
    return Infinity;
  }

  if (m === 0) return 0;
  if (n === 0) return m;

  // Use rolling array for space optimization
  // We only need to keep track of two rows: previous and current
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);

  // Initialize first row
  // For matching to any substring, we can start matching from any position
  // So the cost of starting is 0 for all positions
  for (let j = 0; j <= n; j++) {
    prev[j] = 0;
  }

  // For each character in query
  for (let i = 1; i <= m; i++) {
    // First column: cost of inserting all characters from query
    curr[0] = i;

    // For each character in keyword
    for (let j = 1; j <= n; j++) {
      const cost = query[i - 1] === keyword[j - 1] ? 0 : 1;

      curr[j] = Math.min(
        prev[j] + 1, // Delete from query
        curr[j - 1] + 1, // Insert into query
        prev[j - 1] + cost // Replace (or match if cost = 0)
      );
    }

    // Swap arrays for next iteration
    [prev, curr] = [curr, prev];
  }

  // The answer is the minimum value in the last row
  // which represents the best match to any substring
  return Math.min(...prev);
}

/**
 * Calculate edit distance score for ranking
 *
 * Converts raw edit distance into a score where:
 * - Perfect match (distance = 0) gets highest score
 * - Higher distance gets lower score
 *
 * @param query - The search query
 * @param keyword - The keyword to match
 * @returns Score value (higher is better), or -Infinity if no valid match
 */
export function calculateEditDistanceScore(query: string, keyword: string): number {
  const distance = calculateEditDistance(query, keyword);

  if (distance === Infinity) {
    return -Infinity;
  }

  const queryLength = query.length;

  if (queryLength === 0) {
    return 0;
  }

  // Score formula: higher score for lower distance
  // Perfect match (distance = 0) gives score of 1.0
  // Complete mismatch (distance = queryLength) gives score approaching 0
  const normalizedScore = 1 - distance / queryLength;

  return normalizedScore;
}
