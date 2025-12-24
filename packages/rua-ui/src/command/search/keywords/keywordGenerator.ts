/**
 * Multi-keyword generator
 *
 * Generates multiple search keywords from action name and user-provided keywords
 * to support various search patterns:
 * 1. Original name (lowercase)
 * 2. Pinyin conversion
 * 3. Pinyin acronym
 * 4. Capital letter acronym (for English)
 * 5. Name without symbols
 * 6. Acronym without symbols
 * 7. Pinyin without symbols
 * 8. User-provided custom keywords
 */

import { toPinyin, toPinyinAcronym, removeSymbols, containsChinese } from "./pinyinUtils";

export interface KeywordGenerationInput {
  name: string;
  keywords?: string | string[];
}

/**
 * Generate multiple search keywords from action name and custom keywords
 *
 * @param input - Object containing name and optional keywords
 * @returns Array of unique keywords (all lowercase)
 */
export function generateKeywords(input: KeywordGenerationInput): string[] {
  const { name, keywords } = input;
  const keywordSet = new Set<string>();

  // 1. Original name (lowercase)
  if (name) {
    keywordSet.add(name.toLowerCase());
  }

  // 2. Pinyin conversion (if contains Chinese)
  if (name && containsChinese(name)) {
    const pinyinName = toPinyin(name);
    if (pinyinName) {
      keywordSet.add(pinyinName);
    }

    // 3. Pinyin acronym
    const pinyinAcronym = toPinyinAcronym(name);
    if (pinyinAcronym) {
      keywordSet.add(pinyinAcronym);
    }

    // 5. Original name without symbols
    const nameWithoutSymbols = removeSymbols(name);
    if (nameWithoutSymbols && nameWithoutSymbols !== name.toLowerCase()) {
      keywordSet.add(nameWithoutSymbols);
    }

    // 6. Pinyin acronym without symbols
    const acronymWithoutSymbols = removeSymbols(pinyinAcronym);
    if (acronymWithoutSymbols && acronymWithoutSymbols !== pinyinAcronym) {
      keywordSet.add(acronymWithoutSymbols);
    }

    // 7. Pinyin without symbols
    const pinyinWithoutSymbols = removeSymbols(pinyinName);
    if (pinyinWithoutSymbols && pinyinWithoutSymbols !== pinyinName) {
      keywordSet.add(pinyinWithoutSymbols);
    }
  } else if (name) {
    // 4. Capital letter acronym (for English text)
    const acronym = toPinyinAcronym(name);
    if (acronym && acronym !== name.toLowerCase()) {
      keywordSet.add(acronym);
    }

    // 5. Name without symbols
    const nameWithoutSymbols = removeSymbols(name);
    if (nameWithoutSymbols && nameWithoutSymbols !== name.toLowerCase()) {
      keywordSet.add(nameWithoutSymbols);
    }
  }

  // 8. User-provided custom keywords
  if (keywords) {
    if (typeof keywords === "string") {
      // Legacy format: comma-separated string
      const keywordArray = keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k.length > 0);
      keywordArray.forEach((k) => keywordSet.add(k));
    } else if (Array.isArray(keywords)) {
      // New format: array of strings
      keywords.forEach((k) => {
        const trimmed = k.trim().toLowerCase();
        if (trimmed) keywordSet.add(trimmed);
      });
    }
  }

  // Convert set to array and filter out empty strings
  return Array.from(keywordSet).filter((k) => k.length > 0);
}

/**
 * Helper function to extend keywords with additional variations
 *
 * This can be used by ActionImpl to add action-specific keywords
 * like subtitle, kind, etc.
 *
 * @param text - The text to generate keywords from
 * @returns Array of keyword variations
 */
export function generateKeywordVariations(text: string): string[] {
  if (!text) return [];

  const variations = new Set<string>();
  const lowercased = text.toLowerCase();

  variations.add(lowercased);

  if (containsChinese(text)) {
    const pinyinText = toPinyin(text);
    if (pinyinText) variations.add(pinyinText);

    const acronym = toPinyinAcronym(text);
    if (acronym) variations.add(acronym);

    const withoutSymbols = removeSymbols(text);
    if (withoutSymbols) variations.add(withoutSymbols);
  } else {
    const acronym = toPinyinAcronym(text);
    if (acronym && acronym !== lowercased) variations.add(acronym);

    const withoutSymbols = removeSymbols(text);
    if (withoutSymbols && withoutSymbols !== lowercased) variations.add(withoutSymbols);
  }

  return Array.from(variations).filter((v) => v.length > 0);
}
