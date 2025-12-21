import { ActionId, ActionImpl, getListboxItemId, KBAR_LISTBOX } from "./index.tsx";
import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePointerMovedSinceMount } from "./utils.ts";

const START_INDEX = 0;

interface RenderParams<T = ActionImpl | string> {
  item: T;
  active: boolean;
}

interface ResultsRenderProps {
  items: any[];
  onRender: (params: RenderParams) => React.ReactElement;
  maxHeight?: number;
  height?: number | "auto";
  width?: string | "auto" | "100%";
  className?: string;
  detailsClassName?: string;

  details?: React.ReactElement;

  setSearch(value: string): void;

  search: string;
  activeIndex: number;
  handleKeyEvent: boolean;

  setActiveIndex: (cb: number | ((currIndex: number) => number)) => void;
  setRootActionId: (rootActionId: ActionId) => void;
  currentRootActionId: ActionId | null;
  onQueryActionEnter?: () => void; // Called when Enter is pressed on a query action
}

export const ResultsRender: React.FC<ResultsRenderProps> = (props) => {
  const activeRef = React.useRef<HTMLDivElement | null>(null);
  const parentRef = React.useRef(null);

  // Track if we recently used keyboard navigation
  const keyboardNavigatedRef = React.useRef(false);
  const lastPointerPositionRef = React.useRef({ x: 0, y: 0 });

  // store a ref to all items so we do not have to pass
  // them as a dependency when setting up event listeners.
  const itemsRef = React.useRef(props.items);
  itemsRef.current = props.items;

  const rowVirtualizer = useVirtualizer({
    count: itemsRef.current.length,
    estimateSize: () => 66,
    measureElement: (element) => element.clientHeight,
    getScrollElement: () => parentRef.current,
  });

  // Listen for actual mouse movement to clear keyboard navigation flag
  React.useEffect(() => {
    // Initialize mouse position
    const initMousePosition = (event: MouseEvent) => {
      lastPointerPositionRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseMove = (event: MouseEvent) => {
      const { x, y } = lastPointerPositionRef.current;
      // Only clear the flag if mouse actually moved
      if (Math.abs(event.clientX - x) > 5 || Math.abs(event.clientY - y) > 5) {
        keyboardNavigatedRef.current = false;
        lastPointerPositionRef.current = { x: event.clientX, y: event.clientY };
      }
    };

    // Initialize on mount
    window.addEventListener("mousemove", initMousePosition, { once: true });
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", initMousePosition);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  React.useEffect(() => {
    // @ts-ignore
    const handler = (event) => {
      if (!props.handleKeyEvent) {
        return;
      }

      if (event.isComposing) {
        return;
      }

      if (event.key === "ArrowUp" || (event.ctrlKey && event.key === "p")) {
        event.preventDefault();
        event.stopPropagation();
        keyboardNavigatedRef.current = true; // Mark that we used keyboard
        props.setActiveIndex((index) => {
          // If already at the start, stay there (no wrap)
          if (index === 0) return index;

          let nextIndex = index - 1;

          // Skip string items (section headers)
          while (nextIndex >= 0 && typeof itemsRef.current[nextIndex] === "string") {
            nextIndex--;
          }

          // If we've gone below 0, stay at current position
          if (nextIndex < 0) {
            return index;
          }

          return nextIndex;
        });
      } else if (event.key === "ArrowDown" || (event.ctrlKey && event.key === "n")) {
        event.preventDefault();
        event.stopPropagation();
        keyboardNavigatedRef.current = true; // Mark that we used keyboard
        props.setActiveIndex((index) => {
          // If already at the end, stay there (no wrap)
          if (index === props.items.length - 1) return index;

          let nextIndex = index + 1;

          // Skip string items (section headers)
          while (
            nextIndex < props.items.length &&
            typeof itemsRef.current[nextIndex] === "string"
          ) {
            nextIndex++;
          }

          // If we've gone beyond the array, stay at current position
          if (nextIndex >= props.items.length) {
            return index;
          }

          return nextIndex;
        });
      } else if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();

        // Check if the current active item is a query action
        const activeItem = itemsRef.current[props.activeIndex];
        if (activeItem && typeof activeItem !== "string" && activeItem.query) {
          // For query actions, trigger the callback to focus query input
          props.onQueryActionEnter?.();
        } else {
          // For non-query actions, execute normally
          activeRef.current?.click();
        }
      }
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [props.setActiveIndex, props.handleKeyEvent]);

  // destructuring here to prevent linter warning to pass
  // entire rowVirtualizer in the dependencies array.
  const { scrollToIndex } = rowVirtualizer;
  React.useEffect(() => {
    if (itemsRef.current.length < 1) return;
    scrollToIndex(props.activeIndex, {
      // ensure that if the first item in the list is a group
      // name and we are focused on the second item, to not
      // scroll past that group, hiding it.
      align: props.activeIndex <= 1 ? "end" : "auto",
    });
  }, [props.activeIndex, scrollToIndex]);

  React.useEffect(() => {
    // TODO(tim): fix scenario where async actions load in
    // and active index is reset to the first item. i.e. when
    // users register actions and bust the `useRegisterActions`
    // cache, we won't want to reset their active index as they
    // are navigating the list.
    props.setActiveIndex(
      // avoid setting active index on a group
      typeof props.items[START_INDEX] === "string" ? START_INDEX + 1 : START_INDEX
    );
  }, [props.search, props.currentRootActionId, props.items]);

  const execute = React.useCallback(
    (item: RenderParams["item"]) => {
      if (typeof item === "string") return;

      // For actions with query flag:
      // - Don't enter the view immediately
      // - Let the action stay selected so Input component shows query input
      // - User will submit via the query input, which calls onQuerySubmit
      if (item.query) {
        // Do nothing - just keep the action selected
        // Input component will show query input box automatically
        return;
      }

      // For built-in view actions (like weather, translate when accessed directly)
      // They may have perform for tracking, but should also navigate
      if (item.kind === "built-in" && !item.parent && item.children.length === 0) {
        // Call perform if exists (for usage tracking)
        if (item.command) {
          item.command.perform(item);
        }
        // Navigate to the view
        props.setSearch("");
        props.setRootActionId(item.id);
        return;
      }

      if (item.command) {
        // Regular actions with command - just perform
        item.command.perform(item);
      } else {
        // Actions without command or query - just navigate
        props.setSearch("");
        props.setRootActionId(item.id);
      }
    },
    [props.setSearch, props.setRootActionId]
  );

  const pointerMoved = usePointerMovedSinceMount();

  return (
    <div
      className="flex"
      style={{ flex: 1, overflow: "hidden", minHeight: 0 }}
    >
      <div
        ref={parentRef}
        style={{
          maxHeight: props.maxHeight || "100%",
          height: "100%",
          position: "relative",
          overflow: "auto",
          width: props.width || "100%",
          minHeight: 0,
        }}
        className={["command-listbox-container", props.className ?? ""].join(" ")}
      >
        <div
          role="listbox"
          id={KBAR_LISTBOX}
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
          }}
          className="command-listbox"
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = itemsRef.current[virtualRow.index];
            const handlers = typeof item !== "string" && {
              onPointerMove: () => {
                // Don't change active index if we recently used keyboard navigation
                if (keyboardNavigatedRef.current) return;

                if (pointerMoved && props.activeIndex !== virtualRow.index) {
                  props.setActiveIndex(virtualRow.index);
                }
              },
              onPointerDown: () => {
                keyboardNavigatedRef.current = false; // Clear flag on click
                props.setActiveIndex(virtualRow.index);
              },
              onClick: () => execute(item),
            };
            const active = virtualRow.index === props.activeIndex;

            return (
              <div
                ref={(elem) => {
                  rowVirtualizer.measureElement(elem);
                  if (active) activeRef.current = elem;
                }}
                data-index={virtualRow.index}
                id={getListboxItemId(virtualRow.index)}
                role="option"
                aria-selected={active}
                key={virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                {...handlers}
              >
                {props.onRender({
                  item,
                  active,
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className={props.detailsClassName}>{props.details}</div>
    </div>
  );
};
