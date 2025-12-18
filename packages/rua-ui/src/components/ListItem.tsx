import { forwardRef } from "react";
import { motion } from "motion/react";
import { ListItem as ListItemType } from "../types";
import type { Accessory as AccessoryType } from "../types";
import { formatRelativeDate } from "../utils/formatDate";

export interface ListItemProps {
  item: ListItemType;
  active: boolean;
  onClick?: () => void;
  onPointerMove?: () => void;
  onPointerDown?: () => void;
}

/**
 * Individual list item component with icon, title, subtitle, and accessories
 */
export const ListItem = forwardRef<HTMLDivElement, ListItemProps>(
  ({ item, active, onClick, onPointerMove, onPointerDown }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={active ? "command-item-active" : "command-item"}
        onClick={onClick}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="command-item-content">
          {item.icon && <div className="command-item-icon">{item.icon}</div>}
          <div className="command-item-text">
            <div className="command-item-title">{item.title}</div>
            {item.subtitle && <div className="command-item-subtitle">{item.subtitle}</div>}
          </div>
        </div>
        {item.accessories && item.accessories.length > 0 && (
          <div className="command-item-accessories">
            {item.accessories.map((accessory, index) => (
              <Accessory key={index} accessory={accessory} />
            ))}
          </div>
        )}
      </motion.div>
    );
  }
);

ListItem.displayName = "ListItem";

/**
 * Accessory component for displaying additional info on the right side
 */
function Accessory({ accessory }: { accessory: AccessoryType }) {
  // Handle tag accessory (pill-style with color)
  if (accessory.tag !== undefined) {
    const tagValue = accessory.tag instanceof Date
      ? formatRelativeDate(accessory.tag)
      : typeof accessory.tag === "object"
      ? accessory.tag.value instanceof Date
        ? formatRelativeDate(accessory.tag.value)
        : accessory.tag.value
      : accessory.tag;

    const tagColor = typeof accessory.tag === "object" && !(accessory.tag instanceof Date)
      ? accessory.tag.color
      : undefined;

    return (
      <div className="command-item-accessory" title={accessory.tooltip}>
        <span
          className="accessory-tag"
          style={
            tagColor
              ? {
                  backgroundColor: `${tagColor}20`,
                  color: tagColor,
                  borderColor: `${tagColor}40`,
                  border: "1px solid",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }
              : {
                  backgroundColor: "var(--gray4)",
                  color: "var(--gray11)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }
          }
        >
          {tagValue}
        </span>
      </div>
    );
  }

  // Handle date accessory (relative time formatting)
  if (accessory.date !== undefined) {
    const dateValue = accessory.date instanceof Date
      ? formatRelativeDate(accessory.date)
      : typeof accessory.date === "object" && accessory.date.value instanceof Date
      ? formatRelativeDate(accessory.date.value)
      : "";

    const dateColor = typeof accessory.date === "object" && !(accessory.date instanceof Date)
      ? accessory.date.color
      : undefined;

    return (
      <div className="command-item-accessory" title={accessory.tooltip}>
        <span
          className="accessory-text"
          style={dateColor ? { color: dateColor } : undefined}
        >
          {dateValue}
        </span>
      </div>
    );
  }

  // Handle text accessory with optional color
  const textValue = typeof accessory.text === "string"
    ? accessory.text
    : accessory.text?.value;
  const textColor = typeof accessory.text === "object" ? accessory.text.color : undefined;

  return (
    <div className="command-item-accessory" title={accessory.tooltip}>
      {accessory.icon && <span className="accessory-icon">{accessory.icon}</span>}
      {textValue && (
        <span
          className="accessory-text"
          style={textColor ? { color: textColor } : undefined}
        >
          {textValue}
        </span>
      )}
    </div>
  );
}
