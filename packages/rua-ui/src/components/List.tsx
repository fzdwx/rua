import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ListProps, ListItem as ListItemType, ListSection } from '../types';
import { SearchInput } from './SearchInput';
import { ListItem } from './ListItem';
import { useSearch } from '../hooks/useSearch';
import { useKeyboard } from '../hooks/useKeyboard';

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
}: ListProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const parentRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);

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

  // Empty state
  if (!isLoading && displayItems.length === 0) {
    return (
      <div className="list-container">
        <SearchInput
          value={query}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          loading={isLoading}
        />
        <div className="list-empty">
          {emptyView || <p>No results found</p>}
        </div>
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
    </div>
  );
}
