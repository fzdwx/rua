import {useState, useRef, useEffect, useMemo, useCallback} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ListProps, ListItem as ListItemType, ListSection } from '../types';
import { SearchInput } from './SearchInput';
import { ListItem } from './ListItem';
import { ActionPanel } from './ActionPanel';
import { useSearch } from '../hooks/useSearch';
import { useKeyboard } from '../hooks/useKeyboard';

/**
 * Focus retry options for exponential backoff
 */
export interface FocusRetryOptions {
  maxRetries?: number;        // Default: 3
  initialDelay?: number;      // Default: 50ms
  backoffMultiplier?: number; // Default: 2
}

/**
 * Calculate delay for a given attempt using exponential backoff
 * Formula: initialDelay * (backoffMultiplier ^ attempt)
 * For attempt 0: 50ms, attempt 1: 100ms, attempt 2: 200ms
 */
export function calculateBackoffDelay(
  attempt: number,
  initialDelay: number = 50,
  backoffMultiplier: number = 2
): number {
  return initialDelay * Math.pow(backoffMultiplier, attempt);
}

/**
 * Attempt to focus an input element with exponential backoff retry
 * Returns true if focus was successful, false otherwise
 */
export async function attemptFocusWithRetry(
  inputRef: React.RefObject<HTMLInputElement | null>,
  options: FocusRetryOptions = {}
): Promise<boolean> {
  const {
    maxRetries = 3,
    initialDelay = 50,
    backoffMultiplier = 2,
  } = options;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const delay = calculateBackoffDelay(attempt, initialDelay, backoffMultiplier);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    if (inputRef.current) {
      inputRef.current.focus();
      
      // Check if focus was successful
      if (document.activeElement === inputRef.current) {
        return true;
      }
    }
  }
  
  // All retries exhausted
  console.warn('Focus retry: All attempts exhausted, focus may not have succeeded');
  return false;
}

/**
 * Main list component with integrated search and virtualized results
 */
export function List({
  searchPlaceholder = 'Search...',
  items = [],
  sections,
  onSearch,
  onSelect,
  enablePinyin = false,
  isLoading = false,
  emptyView,
  showBackButton = true,
  onBack,
  actions,
  initialSearch,
}: ListProps) {
  const [query, setQuery] = useState(initialSearch || '');
  const [activeIndex, setActiveIndex] = useState(0);
  const [initialSearchLoaded, setInitialSearchLoaded] = useState(!!initialSearch);
  const parentRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Default back handler - close extension and return to main app
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined' && (window as any).rua) {
      (window as any).rua.ui.close();
    }
  }, [onBack]);

  // Combine items and sections into a flat list
  const allItems = useMemo(() => {
    if (sections) {
      const result: Array<ListItemType | string> = [];
      for (const section of sections) {
        if (section.title) {
          result.push(section.title);
        }
        result.push(...section.items);
      }
      return result;
    }
    return items;
  }, [items, sections]);

  // Search logic
  const searchResults = useSearch({
    items: allItems.filter((item): item is ListItemType => typeof item !== 'string'),
    query,
    enablePinyin,
  });

  // Display items: if searching, show results; otherwise show all items
  const displayItems = useMemo(() => {
    if (!query.trim()) {
      return allItems;
    }
    return searchResults.map((result) => result.item);
  }, [query, allItems, searchResults]);

  // Virtualization
  const rowVirtualizer = useVirtualizer({
    count: displayItems.length,
    estimateSize: () => 66,
    getScrollElement: () => parentRef.current,
  });

  // Keyboard navigation
  const incrementIndex = () => {
    setActiveIndex((prev) => {
      if (prev >= displayItems.length - 1) return prev;
      let nextIndex = prev + 1;
      // Skip section headers
      while (nextIndex < displayItems.length && typeof displayItems[nextIndex] === 'string') {
        nextIndex++;
      }
      return nextIndex >= displayItems.length ? prev : nextIndex;
    });
  };

  const decrementIndex = () => {
    setActiveIndex((prev) => {
      if (prev <= 0) return prev;
      let nextIndex = prev - 1;
      // Skip section headers
      while (nextIndex >= 0 && typeof displayItems[nextIndex] === 'string') {
        nextIndex--;
      }
      return nextIndex < 0 ? prev : nextIndex;
    });
  };

  const handleEnter = () => {
    const item = displayItems[activeIndex];
    if (item && typeof item !== 'string') {
      onSelect?.(item);
    }
  };

  useKeyboard({
    onArrowUp: decrementIndex,
    onArrowDown: incrementIndex,
    onEnter: handleEnter,
    enabled: true,
  });

  // Handle search change
  const handleSearchChange = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
    onSearch?.(value);
  };

  // Execute item action
  const executeItem = (item: ListItemType) => {
    onSelect?.(item);
  };

  // Auto-scroll to active item
  useEffect(() => {
    if (displayItems.length > 0) {
      rowVirtualizer.scrollToIndex(activeIndex, {
        align: activeIndex <= 1 ? 'end' : 'auto',
      });
    }
  }, [activeIndex, rowVirtualizer, displayItems.length]);

  // Reset active index when search changes
  useEffect(() => {
    const firstItemIndex = typeof displayItems[0] === 'string' ? 1 : 0;
    setActiveIndex(firstItemIndex);
  }, [query, displayItems]);

  const handleActivate = useCallback(() => {
    // Focus input when extension view is activated using retry mechanism
    attemptFocusWithRetry(inputRef, {
      maxRetries: 3,
      initialDelay: 50,
      backoffMultiplier: 2,
    });
  }, []);

  // Listen for activate event from rua API and focus input
  useEffect(() => {
    // Check if rua API is available
    if (typeof window !== 'undefined' && (window as any).rua) {
      const rua = (window as any).rua;
      // Use retry mechanism for initial focus
      attemptFocusWithRetry(inputRef, {
        maxRetries: 3,
        initialDelay: 50,
        backoffMultiplier: 2,
      });
      rua.on?.('activate', handleActivate);

      return () => {
        rua.off?.('activate', handleActivate);
      };
    }

    // Also listen for rua-ready event in case API loads after component mount
    const handleRuaReady = () => {
      const rua = (window as any).rua;
      rua.on?.('activate', handleActivate);
    };

    window.addEventListener('rua-ready', handleRuaReady);

    return () => {
      window.removeEventListener('rua-ready', handleRuaReady);
      if (typeof window !== 'undefined' && (window as any).rua) {
        const rua = (window as any).rua;
        rua.off?.('activate', handleActivate);
      }
    };
  }, [handleActivate]);

  // Initial focus on mount for extensions using retry mechanism
  useEffect(() => {
    // Focus input after component is fully mounted and rendered
    // Using exponential backoff: 50ms, 100ms, 200ms
    attemptFocusWithRetry(inputRef, {
      maxRetries: 3,
      initialDelay: 50,
      backoffMultiplier: 2,
    });
  }, []); // Empty dependency array = run once on mount

  // Load initial search value from rua API if not provided via props
  useEffect(() => {
    if (initialSearchLoaded) return;
    
    const loadInitialSearch = async () => {
      if (typeof window !== 'undefined' && (window as any).rua) {
        try {
          const rua = (window as any).rua;
          const initialValue = await rua.ui.getInitialSearch();
          if (initialValue) {
            setQuery(initialValue);
            onSearch?.(initialValue);
          }
        } catch (err) {
          console.warn('[List] Failed to get initial search:', err);
        }
      }
      setInitialSearchLoaded(true);
    };

    loadInitialSearch();
  }, [initialSearchLoaded, onSearch]);

  // Empty state
  if (!isLoading && displayItems.length === 0) {
    return (
      <div className="list-container">
        <SearchInput
          value={query}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          loading={isLoading}
          showBackButton={showBackButton}
          onBack={handleBack}
          inputRef={inputRef}
        />
        <div className="list-empty">
          {emptyView || <p>No results found</p>}
        </div>
        {actions && actions.length > 0 && (
          <ActionPanel actions={actions} position="footer" />
        )}
      </div>
    );
  }

  return (
    <div className="list-container">
      <SearchInput
        value={query}
        onChange={handleSearchChange}
        placeholder={searchPlaceholder}
        loading={isLoading}
        showBackButton={showBackButton}
        onBack={handleBack}
        inputRef={inputRef}
      />
      <div ref={parentRef} className="list-scroll-container">
        <div
          role="listbox"
          className="list-virtual-container"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = displayItems[virtualRow.index];
            const active = virtualRow.index === activeIndex;

            // Section header
            if (typeof item === 'string') {
              return (
                <div
                  key={virtualRow.index}
                  data-index={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="list-section-header"
                >
                  {item}
                </div>
              );
            }

            // List item
            return (
              <div
                key={virtualRow.index}
                data-index={virtualRow.index}
                role="option"
                aria-selected={active}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <ListItem
                  ref={(elem) => {
                    rowVirtualizer.measureElement(elem);
                    if (active) activeRef.current = elem;
                  }}
                  item={item}
                  active={active}
                  onClick={() => executeItem(item)}
                  onPointerMove={() => {
                    if (activeIndex !== virtualRow.index) {
                      setActiveIndex(virtualRow.index);
                    }
                  }}
                  onPointerDown={() => setActiveIndex(virtualRow.index)}
                />
              </div>
            );
          })}
        </div>
      </div>
      {actions && actions.length > 0 && (
        <ActionPanel actions={actions} position="footer" />
      )}
    </div>
  );
}
