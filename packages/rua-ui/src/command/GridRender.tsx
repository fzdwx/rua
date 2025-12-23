import { ActionId, ActionImpl } from "./index.tsx";
import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePointerMovedSinceMount } from "./utils.ts";

interface RenderParams<T = ActionImpl | string> {
  item: T;
  active: boolean;
}

interface GridRenderProps {
  items: any[];
  onRender: (params: RenderParams) => React.ReactElement;
  columns: number; // Number of columns
  itemHeight: number; // Height of each grid item
  gap: number; // Gap between items
  maxHeight?: number;
  className?: string;

  setSearch(value: string): void;
  search: string;
  activeIndex: number;
  handleKeyEvent: boolean;

  setActiveIndex: (cb: number | ((currIndex: number) => number)) => void;
  setRootActionId: (rootActionId: ActionId) => void;
  currentRootActionId: ActionId | null;
  onQueryActionEnter?: () => void;
}

export const GridRender: React.FC<GridRenderProps> = (props) => {
  const { columns, itemHeight, gap } = props;

  const activeRef = React.useRef<HTMLDivElement | null>(null);
  const parentRef = React.useRef(null);

  // Track if we recently used keyboard navigation
  const keyboardNavigatedRef = React.useRef(false);
  const lastPointerPositionRef = React.useRef({ x: 0, y: 0 });

  // Filter out string items (section headers) and chunk into rows
  const rows = React.useMemo(() => {
    const filteredItems = props.items.filter((item) => typeof item !== "string");
    const result: ActionImpl[][] = [];

    for (let i = 0; i < filteredItems.length; i += columns) {
      result.push(filteredItems.slice(i, i + columns));
    }

    return result;
  }, [props.items, columns]);

  // Track rows in ref for event handlers
  const rowsRef = React.useRef(rows);
  rowsRef.current = rows;

  // Helper: Convert linear index to grid position
  const getGridPosition = React.useCallback(
    (index: number) => ({
      row: Math.floor(index / columns),
      col: index % columns,
    }),
    [columns]
  );

  // Helper: Convert grid position to linear index
  const getLinearIndex = React.useCallback(
    (row: number, col: number) => row * columns + col,
    [columns]
  );

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight + gap,
    measureElement: (element) => element.clientHeight,
  });

  // Listen for actual mouse movement to clear keyboard navigation flag
  React.useEffect(() => {
    const initMousePosition = (event: MouseEvent) => {
      lastPointerPositionRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseMove = (event: MouseEvent) => {
      const { x, y } = lastPointerPositionRef.current;
      if (Math.abs(event.clientX - x) > 5 || Math.abs(event.clientY - y) > 5) {
        keyboardNavigatedRef.current = false;
        lastPointerPositionRef.current = { x: event.clientX, y: event.clientY };
      }
    };

    window.addEventListener("mousemove", initMousePosition, { once: true });
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", initMousePosition);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Keyboard navigation (4 directions)
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!props.handleKeyEvent) return;
      if (event.isComposing) return;

      const { row, col } = getGridPosition(props.activeIndex);
      const currentRows = rowsRef.current;

      // Arrow Up
      if (event.key === "ArrowUp" || (event.ctrlKey && event.key === "p")) {
        event.preventDefault();
        event.stopPropagation();
        keyboardNavigatedRef.current = true;

        if (row > 0) {
          const newRow = row - 1;
          props.setActiveIndex(getLinearIndex(newRow, col));
        }
      }
      // Arrow Down
      else if (event.key === "ArrowDown" || (event.ctrlKey && event.key === "n")) {
        event.preventDefault();
        event.stopPropagation();
        keyboardNavigatedRef.current = true;

        if (row < currentRows.length - 1) {
          const newRow = row + 1;
          // Handle incomplete last row
          const newCol = Math.min(col, currentRows[newRow].length - 1);
          props.setActiveIndex(getLinearIndex(newRow, newCol));
        }
      }
      // Arrow Left
      else if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();
        keyboardNavigatedRef.current = true;

        if (col > 0) {
          props.setActiveIndex(props.activeIndex - 1);
        }
      }
      // Arrow Right
      else if (event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        keyboardNavigatedRef.current = true;

        if (currentRows[row] && col < currentRows[row].length - 1) {
          props.setActiveIndex(props.activeIndex + 1);
        }
      }
      // Enter
      else if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        activeRef.current?.click();
      }
    };

    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [props.activeIndex, props.handleKeyEvent, getGridPosition, getLinearIndex, props.setActiveIndex]);

  // Scroll to active item
  const { scrollToIndex } = rowVirtualizer;
  React.useEffect(() => {
    if (rows.length < 1) return;
    const { row } = getGridPosition(props.activeIndex);
    scrollToIndex(row, { align: "auto" });
  }, [props.activeIndex, scrollToIndex, rows.length, getGridPosition]);

  // Reset active index when search or root action changes
  React.useEffect(() => {
    props.setActiveIndex(0);
  }, [props.search, props.currentRootActionId]);

  // Execute action
  const execute = React.useCallback(
    (item: ActionImpl) => {
      if (typeof item === "string") return;

      // For actions with query flag
      if (item.query) {
        return;
      }

      // For built-in view actions
      if (item.kind === "built-in" && !item.parent && item.children.length === 0) {
        if (item.command) {
          item.command.perform(item);
        }
        props.setSearch("");
        props.setRootActionId(item.id);
        return;
      }

      if (item.command) {
        item.command.perform(item);
      } else {
        props.setSearch("");
        props.setRootActionId(item.id);
      }
    },
    [props.setSearch, props.setRootActionId]
  );

  const pointerMoved = usePointerMovedSinceMount();

  return (
    <div
      ref={parentRef}
      style={{
        height: "100%",
        overflow: "auto",
        position: "relative",
        minHeight: 0,
      }}
      className={["command-grid-container", props.className ?? ""].join(" ")}
    >
      <div
        role="grid"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowItems = rows[virtualRow.index];
          if (!rowItems) return null;

          return (
            <div
              key={virtualRow.index}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              role="row"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
                padding: `0 ${gap}px ${gap}px ${gap}px`,
              }}
            >
              {rowItems.map((item, colIndex) => {
                const linearIndex = getLinearIndex(virtualRow.index, colIndex);
                const active = linearIndex === props.activeIndex;

                const handlers =
                  typeof item !== "string"
                    ? {
                        onPointerMove: () => {
                          if (
                            pointerMoved &&
                            !keyboardNavigatedRef.current &&
                            props.activeIndex !== linearIndex
                          ) {
                            props.setActiveIndex(linearIndex);
                          }
                        },
                        onPointerDown: () => {
                          keyboardNavigatedRef.current = false;
                        },
                        onClick: () => execute(item),
                      }
                    : {};

                return (
                  <div
                    key={`${virtualRow.index}-${colIndex}`}
                    ref={(elem) => {
                      if (active && elem) activeRef.current = elem;
                    }}
                    role="gridcell"
                    aria-selected={active}
                    {...handlers}
                  >
                    {props.onRender({ item, active })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
