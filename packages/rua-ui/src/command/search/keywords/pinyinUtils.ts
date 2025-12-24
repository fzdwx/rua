/**
 * Pinyin conversion utilities
 *
 * Provides functions for converting Chinese characters to pinyin
 * for improved search matching.
 */

import { pinyin } from "pinyin-pro";

/**
 * Check if a string contains Chinese characters
 */
export function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Convert Chinese characters to pinyin
 *
 * Examples:
 * - toPinyin("光·遇") → "guang·yu"
 * - toPinyin("PowerPoint") → "PowerPoint" (no change for non-Chinese)
 *
 * @param text - The text to convert
 * @returns Pinyin representation (lowercase)
 */
export function toPinyin(text: string): string {
  if (!containsChinese(text)) {
    return text.toLowerCase();
  }

  try {
    const result = pinyin(text, {
      toneType: "none", // No tone marks
      type: "array", // Returns array
    });

    return result.join("").toLowerCase();
  } catch (error) {
    console.error("[PinyinUtils] Failed to convert to pinyin:", error);
    return text.toLowerCase();
  }
}

/**
 * Get the first letter of each pinyin syllable (acronym)
 *
 * Examples:
 * - toPinyinAcronym("光·遇") → "gy"
 * - toPinyinAcronym("PowerPoint") → "pp"
 *
 * @param text - The text to convert
 * @returns Pinyin acronym (lowercase)
 */
export function toPinyinAcronym(text: string): string {
  if (!containsChinese(text)) {
    // For English text, extract capital letters or first letter of each word
    const capitals = text.match(/[A-Z]/g);
    if (capitals && capitals.length > 0) {
      return capitals.join("").toLowerCase();
    }

    // Extract first letter of each word
    const words = text.split(/[\s\-_]+/).filter((w) => w.length > 0);
    return words
      .map((w) => w[0])
      .join("")
      .toLowerCase();
  }

  try {
    const result = pinyin(text, {
      pattern: "first", // First letter only
      toneType: "none",
      type: "array",
    });

    return result.join("").toLowerCase();
  } catch (error) {
    console.error("[PinyinUtils] Failed to get pinyin acronym:", error);
    return text[0]?.toLowerCase() || "";
  }
}

/**
 * Remove all non-alphanumeric characters from text
 *
 * Examples:
 * - removeSymbols("光·遇") → "光遇"
 * - removeSymbols("C++ Builder") → "C Builder"
 *
 * @param text - The text to process
 * @returns Text with symbols removed
 */
export function removeSymbols(text: string): string {
  // Keep Chinese characters, English letters, and numbers
  return text
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}
