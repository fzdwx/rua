import { useState, useCallback, useEffect } from "react";

const QUICK_LINKS_STORAGE_KEY = "rua_quick_links";

export type QuickLinkOpenType = "url" | "shell";

export interface QuickLink {
  id: string;
  name: string;
  url: string; // For openType="url", this is the URL; for openType="shell", this is the command
  openType?: QuickLinkOpenType; // Default is "url"
  waitForCompletion?: boolean; // For shell commands: true = wait for completion (default), false = run in background
  icon?: string; // Emoji or icon name or URL
  iconUrl?: string; // Auto-fetched favicon URL
  keywords?: string;
  subtitle?: string;
}

/**
 * Load quick links from localStorage
 */
function loadQuickLinks(): QuickLink[] {
  try {
    const data = localStorage.getItem(QUICK_LINKS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to load quick links:", error);
  }
  return [];
}

/**
 * Save quick links to localStorage
 */
function saveQuickLinks(links: QuickLink[]): void {
  try {
    localStorage.setItem(QUICK_LINKS_STORAGE_KEY, JSON.stringify(links));
  } catch (error) {
    console.error("Failed to save quick links:", error);
  }
}

/**
 * Custom hook to manage quick links
 */
export function useQuickLinks() {
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>(() => loadQuickLinks());

  // Save to localStorage whenever quickLinks change
  useEffect(() => {
    saveQuickLinks(quickLinks);
  }, [quickLinks]);

  // Add a new quick link
  const addQuickLink = useCallback((link: Omit<QuickLink, "id">) => {
    const newLink: QuickLink = {
      ...link,
      id: `quick-link-${Date.now()}`,
    };
    setQuickLinks((prev) => [...prev, newLink]);
    return newLink.id;
  }, []);

  // Update an existing quick link
  const updateQuickLink = useCallback((id: string, updates: Partial<Omit<QuickLink, "id">>) => {
    setQuickLinks((prev) => prev.map((link) => (link.id === id ? { ...link, ...updates } : link)));
  }, []);

  // Delete a quick link
  const deleteQuickLink = useCallback((id: string) => {
    setQuickLinks((prev) => prev.filter((link) => link.id !== id));
  }, []);

  // Get a quick link by id
  const getQuickLink = useCallback(
    (id: string) => {
      return quickLinks.find((link) => link.id === id);
    },
    [quickLinks]
  );

  // Refresh quick links from localStorage
  const refreshQuickLinks = useCallback(() => {
    const freshLinks = loadQuickLinks();
    setQuickLinks(freshLinks);
  }, []);

  return {
    quickLinks,
    addQuickLink,
    updateQuickLink,
    deleteQuickLink,
    getQuickLink,
    refreshQuickLinks,
  };
}
