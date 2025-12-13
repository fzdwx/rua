/**
 * Extract domain from a URL
 */
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Get favicon URL for a given website URL
 * Uses DuckDuckGo's favicon API which is free and doesn't require authentication
 *
 * @param url - The website URL
 * @returns The favicon URL or null if domain cannot be extracted
 */
export function getFaviconUrl(url: string): string | null {
  const domain = extractDomain(url);
  if (!domain) {
    return null;
  }

  // Use DuckDuckGo's favicon API
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

/**
 * Check if a favicon URL is accessible
 *
 * @param faviconUrl - The favicon URL to check
 * @returns Promise that resolves to true if the favicon is accessible
 */
export async function isFaviconAccessible(faviconUrl: string): Promise<boolean> {
  try {
    await fetch(faviconUrl, {
      method: 'HEAD',
      mode: 'no-cors', // Bypass CORS for checking
    });
    // With no-cors, we can't check the status, but if it doesn't throw, it likely exists
    return true;
  } catch {
    return false;
  }
}
