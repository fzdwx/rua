import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
  ReactElement,
  Children,
  isValidElement,
} from "react";
import {
  GridProps,
  GridItemProps,
  GridSectionProps,
  GridEmptyViewProps,
  FilteringOptions,
  Action,
} from "../types";
import { SearchInput } from "./SearchInput";
import { ActionPanel } from "./ActionPanel";
import { useKeyboard } from "../hooks/useKeyboard";
import { attemptFocusWithRetry } from "./List";

/**
 * Internal grid item type for processing
 */
interface GridItemData {
  id: string;
  content: GridItemProps["content"];
  title?: string;
  subtitle?: string;
  keywords?: string[];
  accessory?: GridItemProps["accessory"];
  actions?: ReactElement;
}

/**
 * Internal grid section type for processing
 */
interface GridSectionData {
  title?: string;
  subtitle?: string;
  aspectRatio?: GridSectionProps["aspectRatio"];
  columns?: number;
  fit?: GridSectionProps["fit"];
  inset?: GridSectionProps["inset"];
  items: GridItemData[];
}

/**
 * Grid.Item component for use as a child of Grid
 */
export function GridItemComponent(_props: GridItemProps) {
  return null;
}

GridItemComponent.displayName = "Grid.Item";
GridItemComponent.__isGridItem = true;

/**
 * Grid.Section component for grouping Grid.Item components
 */
export function GridSectionComponent(_props: GridSectionProps) {
  return null;
}

GridSectionComponent.displayName = "Grid.Section";
GridSectionComponent.__isGridSection = true;

/**
 * Grid.EmptyView component for custom empty state
 */
export function GridEmptyView({ icon, title, description, actions }: GridEmptyViewProps) {
  return (
    <div className="grid-empty-view">
      {icon && <div className="grid-empty-icon">{icon}</div>}
      <div className="grid-empty-title">{title}</div>
      {description && <div className="grid-empty-description">{description}</div>}
      {actions && <div className="grid-empty-actions">{actions}</div>}
    </div>
  );
}

GridEmptyView.displayName = "Grid.EmptyView";
GridEmptyView.__isGridEmptyView = true;

/**
 * Type guard to check if a component is a Grid.Item
 */
export function isGridItemComponent(element: ReactElement): element is ReactElement<GridItemProps> {
  return Boolean(
    element.type &&
    typeof element.type === "function" &&
    (element.type as any).__isGridItem === true
  );
}

/**
 * Type guard to check if a component is a Grid.Section
 */
export function isGridSectionComponent(
  element: ReactElement
): element is ReactElement<GridSectionProps> {
  return Boolean(
    element.type &&
    typeof element.type === "function" &&
    (element.type as any).__isGridSection === true
  );
}

/**
 * Type guard to check if a component is a Grid.EmptyView
 */
export function isGridEmptyViewComponent(
  element: ReactElement
): element is ReactElement<GridEmptyViewProps> {
  return Boolean(
    element.type &&
    typeof element.type === "function" &&
    (element.type as any).__isGridEmptyView === true
  );
}

/**
 * Get inset padding value in pixels
 */
function getInsetPadding(inset?: "small" | "medium" | "large"): string {
  switch (inset) {
    case "small":
      return "4px";
    case "medium":
      return "8px";
    case "large":
      return "16px";
    default:
      return "8px";
  }
}

/**
 * Convert aspect ratio string to CSS value
 */
function getAspectRatioValue(aspectRatio?: string): string {
  if (!aspectRatio) return "1";
  return aspectRatio.replace("/", " / ");
}

/**
 * Filter items based on search query
 */
function filterItems(items: GridItemData[], query: string): GridItemData[] {
  if (!query.trim()) return items;

  const lowerQuery = query.toLowerCase();
  return items.filter((item) => {
    // Check title
    if (item.title?.toLowerCase().includes(lowerQuery)) return true;
    // Check subtitle
    if (item.subtitle?.toLowerCase().includes(lowerQuery)) return true;
    // Check keywords
    if (item.keywords?.some((kw) => kw.toLowerCase().includes(lowerQuery))) return true;
    return false;
  });
}

/**
 * Grid item renderer component
 */
function GridItemRenderer({
  item,
  isSelected,
  onClick,
  onPointerMove,
  aspectRatio,
  fit,
  inset,
}: {
  item: GridItemData;
  isSelected: boolean;
  onClick: () => void;
  onPointerMove: () => void;
  aspectRatio?: string;
  fit?: "contain" | "fill";
  inset?: "small" | "medium" | "large";
}) {
  const padding = getInsetPadding(inset);
  const objectFit = fit === "fill" ? "cover" : "contain";

  return (
    <div
      className={`grid-item ${isSelected ? "grid-item-selected" : ""}`}
      onClick={onClick}
      onPointerMove={onPointerMove}
      role="option"
      aria-selected={isSelected}
      data-grid-item-id={item.id}
    >
      <div
        className="grid-item-content"
        style={{
          aspectRatio: getAspectRatioValue(aspectRatio),
          padding,
        }}
      >
        {item.content.source && (
          <img
            src={item.content.source}
            alt={item.title || ""}
            className="grid-item-image"
            style={{
              objectFit,
              ...(item.content.tintColor
                ? { filter: `drop-shadow(0 0 0 ${item.content.tintColor})` }
                : {}),
            }}
            title={item.content.tooltip}
          />
        )}
        {item.accessory?.icon && (
          <div className="grid-item-accessory" title={item.accessory.tooltip}>
            {item.accessory.icon}
          </div>
        )}
      </div>
      {(item.title || item.subtitle) && (
        <div className="grid-item-text">
          {item.title && <div className="grid-item-title">{item.title}</div>}
          {item.subtitle && <div className="grid-item-subtitle">{item.subtitle}</div>}
        </div>
      )}
    </div>
  );
}

/**
 * Main Grid component with integrated search and grid layout
 */
export function Grid({
  columns = 5,
  inset = "medium",
  aspectRatio = "1",
  fit = "contain",
  searchBarPlaceholder = "Search...",
  filtering = true,
  isLoading = false,
  navigationTitle,
  onSearchTextChange,
  onSelectionChange,
  selectedItemId,
  throttle = false,
  children,
  showBackButton = true,
  onBack,
  actions,
}: GridProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Determine if filtering is enabled
  const filteringEnabled = filtering !== false;
  const filteringOptions: FilteringOptions | undefined =
    typeof filtering === "object" ? filtering : undefined;

  // Default back handler
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && (window as any).rua) {
      (window as any).rua.ui.close();
    }
  }, [onBack]);

  // Process children to extract items, sections, and empty view
  const { items, sections, emptyView } = useMemo(() => {
    const result: {
      items: GridItemData[];
      sections: GridSectionData[];
      emptyView: ReactElement<GridEmptyViewProps> | null;
    } = {
      items: [],
      sections: [],
      emptyView: null,
    };

    if (!children) return result;

    Children.forEach(children, (child) => {
      if (!isValidElement(child)) return;

      if (isGridItemComponent(child)) {
        const props = child.props as GridItemProps;
        result.items.push({
          id: props.id,
          content: props.content,
          title: props.title,
          subtitle: props.subtitle,
          keywords: props.keywords,
          accessory: props.accessory,
          actions: props.actions,
        });
      } else if (isGridSectionComponent(child)) {
        const sectionProps = child.props as GridSectionProps;
        const sectionItems: GridItemData[] = [];

        Children.forEach(sectionProps.children, (sectionChild) => {
          if (isValidElement(sectionChild) && isGridItemComponent(sectionChild)) {
            const itemProps = sectionChild.props as GridItemProps;
            sectionItems.push({
              id: itemProps.id,
              content: itemProps.content,
              title: itemProps.title,
              subtitle: itemProps.subtitle,
              keywords: itemProps.keywords,
              accessory: itemProps.accessory,
              actions: itemProps.actions,
            });
          }
        });

        result.sections.push({
          title: sectionProps.title,
          subtitle: sectionProps.subtitle,
          aspectRatio: sectionProps.aspectRatio,
          columns: sectionProps.columns,
          fit: sectionProps.fit,
          inset: sectionProps.inset,
          items: sectionItems,
        });
      } else if (isGridEmptyViewComponent(child)) {
        result.emptyView = child;
      }
    });

    return result;
  }, [children]);

  // Get all items (flat list for navigation)
  const allItems = useMemo(() => {
    if (sections.length > 0) {
      return sections.flatMap((section) => section.items);
    }
    return items;
  }, [items, sections]);

  // Filter items based on search query
  const displayItems = useMemo(() => {
    if (!query.trim() || !filteringEnabled) {
      return allItems;
    }
    return filterItems(allItems, query);
  }, [query, allItems, filteringEnabled]);

  // Filter sections based on search query
  const displaySections = useMemo(() => {
    if (!query.trim() || !filteringEnabled) {
      return sections;
    }
    return sections
      .map((section) => ({
        ...section,
        items: filterItems(section.items, query),
      }))
      .filter((section) => section.items.length > 0);
  }, [query, sections, filteringEnabled]);

  // Handle search change
  const handleSearchChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
    onSearchTextChange?.(value);
  };

  // Handle item selection
  const handleItemClick = (item: GridItemData, index: number) => {
    setSelectedIndex(index);
    onSelectionChange?.(item.id);
  };

  // Keyboard navigation
  const moveSelection = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      const totalItems = displayItems.length;
      if (totalItems === 0) return;

      setSelectedIndex((prev) => {
        let newIndex = prev;
        switch (direction) {
          case "left":
            newIndex = Math.max(0, prev - 1);
            break;
          case "right":
            newIndex = Math.min(totalItems - 1, prev + 1);
            break;
          case "up":
            newIndex = Math.max(0, prev - columns);
            break;
          case "down":
            newIndex = Math.min(totalItems - 1, prev + columns);
            break;
        }
        return newIndex;
      });
    },
    [displayItems.length, columns]
  );

  const handleEnter = useCallback(() => {
    const item = displayItems[selectedIndex];
    if (item) {
      onSelectionChange?.(item.id);
    }
  }, [displayItems, selectedIndex, onSelectionChange]);

  useKeyboard({
    onArrowUp: () => moveSelection("up"),
    onArrowDown: () => moveSelection("down"),
    onArrowLeft: () => moveSelection("left"),
    onArrowRight: () => moveSelection("right"),
    onEnter: handleEnter,
    enabled: true,
  });

  // Update selected index when selectedItemId prop changes
  useEffect(() => {
    if (selectedItemId) {
      const index = displayItems.findIndex((item) => item.id === selectedItemId);
      if (index !== -1) {
        setSelectedIndex(index);
      }
    }
  }, [selectedItemId, displayItems]);

  // Notify selection change
  useEffect(() => {
    const item = displayItems[selectedIndex];
    if (item) {
      onSelectionChange?.(item.id);
    }
  }, [selectedIndex]);

  // Focus handling
  const handleActivate = useCallback(() => {
    attemptFocusWithRetry(inputRef, {
      maxRetries: 3,
      initialDelay: 50,
      backoffMultiplier: 2,
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).rua) {
      const rua = (window as any).rua;
      attemptFocusWithRetry(inputRef, {
        maxRetries: 3,
        initialDelay: 50,
        backoffMultiplier: 2,
      });
      rua.on?.("activate", handleActivate);

      return () => {
        rua.off?.("activate", handleActivate);
      };
    }

    const handleRuaReady = () => {
      const rua = (window as any).rua;
      rua.on?.("activate", handleActivate);
    };

    window.addEventListener("rua-ready", handleRuaReady);

    return () => {
      window.removeEventListener("rua-ready", handleRuaReady);
      if (typeof window !== "undefined" && (window as any).rua) {
        const rua = (window as any).rua;
        rua.off?.("activate", handleActivate);
      }
    };
  }, [handleActivate]);

  useEffect(() => {
    attemptFocusWithRetry(inputRef, {
      maxRetries: 3,
      initialDelay: 50,
      backoffMultiplier: 2,
    });
  }, []);

  // Render grid items
  const renderGridItems = (
    itemsToRender: GridItemData[],
    sectionAspectRatio?: string,
    sectionFit?: "contain" | "fill",
    sectionInset?: "small" | "medium" | "large",
    startIndex: number = 0
  ) => {
    return itemsToRender.map((item, idx) => {
      const globalIndex = startIndex + idx;
      return (
        <GridItemRenderer
          key={item.id}
          item={item}
          isSelected={globalIndex === selectedIndex}
          onClick={() => handleItemClick(item, globalIndex)}
          onPointerMove={() => setSelectedIndex(globalIndex)}
          aspectRatio={sectionAspectRatio || aspectRatio}
          fit={sectionFit || fit}
          inset={sectionInset || inset}
        />
      );
    });
  };

  // Calculate grid style
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: "8px",
    padding: "8px",
  };

  // Empty state
  const hasNoItems =
    sections.length > 0
      ? displaySections.every((s) => s.items.length === 0)
      : displayItems.length === 0;

  if (!isLoading && hasNoItems) {
    return (
      <div className="grid-container">
        <SearchInput
          value={query}
          onValueChange={handleSearchChange}
          placeholder={searchBarPlaceholder}
          loading={isLoading}
          showBackButton={showBackButton}
          onBack={handleBack}
          inputRef={inputRef}
        />
        <div className="grid-empty">{emptyView || <p>No results found</p>}</div>
        {actions && actions}
      </div>
    );
  }

  // Render with sections
  if (sections.length > 0) {
    let itemIndex = 0;
    return (
      <div className="grid-container">
        <SearchInput
          value={query}
          onValueChange={handleSearchChange}
          placeholder={searchBarPlaceholder}
          loading={isLoading}
          showBackButton={showBackButton}
          onBack={handleBack}
          inputRef={inputRef}
        />
        <div ref={gridRef} className="grid-scroll-container">
          {displaySections.map((section, sectionIdx) => {
            const sectionColumns = section.columns || columns;
            const sectionStyle = {
              display: "grid",
              gridTemplateColumns: `repeat(${sectionColumns}, 1fr)`,
              gap: "8px",
              padding: "8px",
            };
            const startIdx = itemIndex;
            itemIndex += section.items.length;

            return (
              <div key={sectionIdx} className="grid-section">
                {(section.title || section.subtitle) && (
                  <div className="grid-section-header">
                    {section.title && <div className="grid-section-title">{section.title}</div>}
                    {section.subtitle && (
                      <div className="grid-section-subtitle">{section.subtitle}</div>
                    )}
                  </div>
                )}
                <div style={sectionStyle} role="listbox">
                  {renderGridItems(
                    section.items,
                    section.aspectRatio,
                    section.fit,
                    section.inset,
                    startIdx
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {actions && actions}
      </div>
    );
  }

  // Render without sections
  return (
    <div className="grid-container">
      <SearchInput
        value={query}
        onValueChange={handleSearchChange}
        placeholder={searchBarPlaceholder}
        loading={isLoading}
        showBackButton={showBackButton}
        onBack={handleBack}
        inputRef={inputRef}
      />
      <div ref={gridRef} className="grid-scroll-container">
        <div style={gridStyle} role="listbox">
          {renderGridItems(displayItems)}
        </div>
      </div>
      {actions && actions}
    </div>
  );
}

// Attach sub-components to Grid for Raycast-style API
Grid.Item = GridItemComponent;
Grid.Section = GridSectionComponent;
Grid.EmptyView = GridEmptyView;
