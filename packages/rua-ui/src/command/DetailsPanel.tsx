import React, { useEffect, useState } from "react";
import type { ActionImpl } from "./action";

export interface DetailsPanelProps {
  /** The current active action */
  action: ActionImpl | null;
  /** Empty view to show when no details (reuses CommandPalette's emptyState) */
  emptyView?: React.ReactElement;
  /** CSS class for custom styling */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * DetailsPanel displays detailed information about the currently selected action.
 * Shows the action's details content or an empty view when no details are available.
 */
export function DetailsPanel({ action, emptyView, className = "", style }: DetailsPanelProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedAction, setDisplayedAction] = useState<ActionImpl | null>(action);

  // Handle action change with animation
  useEffect(() => {
    if (action?.id !== displayedAction?.id) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayedAction(action);
        setIsAnimating(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [action, displayedAction?.id]);

  const hasDetails = displayedAction?.details;
  const detailsContent = hasDetails ? displayedAction.details(displayedAction.item) : null;

  return (
    <div className={`details-panel ${className}`} style={style}>
      <div className={`details-panel-content ${isAnimating ? "details-panel-animating" : ""}`}>
        {detailsContent || emptyView || (
          <div className="details-panel-empty">
            <span className="details-panel-empty-text">No details available</span>
          </div>
        )}
      </div>
    </div>
  );
}
