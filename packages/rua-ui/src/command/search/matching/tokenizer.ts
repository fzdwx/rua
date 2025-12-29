/**
 * Query tokenization utilities
 *
 * Splits multi-word search queries into individual tokens for AND-logic matching.
 * For example: "vsc 项目名" -> ["vsc", "项目名"]
 */

export interface QueryTokens {
  original: string;      // Original query string
  tokens: string[];      // Individual search tokens
  isMultiWord: boolean;  // Whether the query contains multiple words
}

/**
 * Tokenize a search query into individual words
 *
 * Splits by whitespace and filters out empty strings.
 *
 * @param query - The search query to tokenize
 * @returns Tokenized query information
 *
 * @example
 * tokenizeQuery("vsc 项目名")
 * // Returns: { original: "vsc 项目名", tokens: ["vsc", "项目名"], isMultiWord: true }
 *
 * @example
 * tokenizeQuery("vscode")
 * // Returns: { original: "vscode", tokens: ["vscode"], isMultiWord: false }
 *
 * @example
 * tokenizeQuery("  multiple   spaces  ")
 * // Returns: { original: "  multiple   spaces  ", tokens: ["multiple", "spaces"], isMultiWord: true }
 */
export function tokenizeQuery(query: string): QueryTokens {
  const tokens = query.trim().toLowerCase()
    .split(/\s+/)
    .filter(token => token.length > 0);

  return {
    original: query,
    tokens,
    isMultiWord: tokens.length > 1
  };
}
