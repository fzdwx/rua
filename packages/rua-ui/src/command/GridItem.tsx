import React from "react";
import { ActionImpl } from "./action";
import { ActionId } from "./types.ts";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

/**
 * Grid item component - displays an action as a card in grid layout
 */
const GridItem = React.forwardRef(
  (
    {
      action,
      active,
      currentRootActionId: _,
      style,
    }: {
      action: ActionImpl;
      active: boolean;
      currentRootActionId: ActionId;
      style?: React.CSSProperties;
    },
    ref: React.Ref<HTMLDivElement>
  ) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          // Base card styles
          "relative flex flex-col items-center justify-center",
          "rounded-lg p-4 min-h-[140px]",
          "cursor-pointer",
          "transition-all duration-150",
          // Background & border
          "bg-[var(--gray2)] border border-[var(--gray6)]",
          // Hover effects
          "hover:bg-[var(--gray3)] hover:shadow-md hover:scale-[1.02]",
          // Active state
          active && [
            "bg-[var(--gray3)]",
            "border-[var(--primary)]",
            "shadow-md",
            "ring-2 ring-[var(--primary)] ring-opacity-20",
          ]
        )}
        style={style}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Badge - positioned at top-right */}
        {action.badge && (
          <div className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-[var(--gray5)] text-[var(--gray11)]">
            {action.badge}
          </div>
        )}

        {/* Icon - larger and centered */}
        {action.icon && (
          <div className="text-4xl mb-3 text-[var(--gray12)] flex items-center justify-center">
            {action.icon}
          </div>
        )}

        {/* Name */}
        <div className="text-sm font-medium text-center text-[var(--gray12)] mb-1 px-2 line-clamp-1">
          {action.name}
        </div>

        {/* Subtitle - smaller and muted */}
        {action.subtitle && (
          <div className="text-xs text-center text-[var(--gray11)] px-2 line-clamp-2">
            {action.subtitle}
          </div>
        )}
      </motion.div>
    );
  }
);

GridItem.displayName = "GridItem";

export { GridItem };
