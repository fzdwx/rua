import { ReactElement, ReactNode } from "react";

/**
 * Props for List.Item.Detail.Metadata component
 */
export interface ListItemDetailMetadataProps {
  /** Metadata items (Label, Link, TagList, Separator) */
  children: ReactNode;
}

/**
 * List.Item.Detail.Metadata container component
 */
export function ListItemDetailMetadata({ children }: ListItemDetailMetadataProps) {
  return <div className="list-detail-metadata">{children}</div>;
}

ListItemDetailMetadata.displayName = "List.Item.Detail.Metadata";

/**
 * Props for List.Item.Detail.Metadata.Label component
 */
export interface ListItemDetailMetadataLabelProps {
  /** Label title */
  title: string;
  /** Label text value */
  text?: string | { value: string; color?: string };
  /** Icon to display */
  icon?: ReactElement;
}

/**
 * List.Item.Detail.Metadata.Label component
 */
export function ListItemDetailMetadataLabel({ title, text, icon }: ListItemDetailMetadataLabelProps) {
  const textValue = typeof text === "string" ? text : text?.value;
  const textColor = typeof text === "object" ? text.color : undefined;

  return (
    <div className="list-detail-metadata-label">
      <div className="list-detail-metadata-label-title">{title}</div>
      <div className="list-detail-metadata-label-content">
        {icon && <span className="list-detail-metadata-label-icon">{icon}</span>}
        {textValue && (
          <span
            className="list-detail-metadata-label-text"
            style={textColor ? { color: textColor } : undefined}
          >
            {textValue}
          </span>
        )}
      </div>
    </div>
  );
}

ListItemDetailMetadataLabel.displayName = "List.Item.Detail.Metadata.Label";

/**
 * Props for List.Item.Detail.Metadata.Link component
 */
export interface ListItemDetailMetadataLinkProps {
  /** Link title */
  title: string;
  /** URL target */
  target: string;
  /** Display text for the link */
  text: string;
}

/**
 * List.Item.Detail.Metadata.Link component
 */
export function ListItemDetailMetadataLink({ title, target, text }: ListItemDetailMetadataLinkProps) {
  const handleClick = () => {
    // Try to use Tauri shell.open() if available, otherwise use window.open()
    if (typeof window !== "undefined" && (window as any).__TAURI__) {
      (window as any).__TAURI__.shell.open(target);
    } else {
      window.open(target, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="list-detail-metadata-link">
      <div className="list-detail-metadata-link-title">{title}</div>
      <button className="list-detail-metadata-link-button" onClick={handleClick}>
        {text}
      </button>
    </div>
  );
}

ListItemDetailMetadataLink.displayName = "List.Item.Detail.Metadata.Link";

/**
 * Props for List.Item.Detail.Metadata.TagList component
 */
export interface ListItemDetailMetadataTagListProps {
  /** TagList title */
  title: string;
  /** TagList.Item children */
  children: ReactNode;
}

/**
 * List.Item.Detail.Metadata.TagList component
 */
export function ListItemDetailMetadataTagList({ title, children }: ListItemDetailMetadataTagListProps) {
  return (
    <div className="list-detail-metadata-taglist">
      <div className="list-detail-metadata-taglist-title">{title}</div>
      <div className="list-detail-metadata-taglist-items">{children}</div>
    </div>
  );
}

ListItemDetailMetadataTagList.displayName = "List.Item.Detail.Metadata.TagList";

/**
 * Props for List.Item.Detail.Metadata.TagList.Item component
 */
export interface ListItemDetailMetadataTagListItemProps {
  /** Tag text */
  text?: string;
  /** Tag color */
  color?: string;
  /** Icon to display */
  icon?: ReactElement;
  /** Callback when tag is clicked */
  onAction?: () => void;
}

/**
 * List.Item.Detail.Metadata.TagList.Item component
 */
export function ListItemDetailMetadataTagListItem({
  text,
  color,
  icon,
  onAction,
}: ListItemDetailMetadataTagListItemProps) {
  const handleClick = () => {
    onAction?.();
  };

  return (
    <span
      className={`list-detail-metadata-tag ${onAction ? "list-detail-metadata-tag-clickable" : ""}`}
      style={
        color
          ? {
              backgroundColor: `${color}20`,
              color: color,
              borderColor: `${color}40`,
            }
          : undefined
      }
      onClick={handleClick}
      role={onAction ? "button" : undefined}
      tabIndex={onAction ? 0 : undefined}
    >
      {icon && <span className="list-detail-metadata-tag-icon">{icon}</span>}
      {text && <span className="list-detail-metadata-tag-text">{text}</span>}
    </span>
  );
}

ListItemDetailMetadataTagListItem.displayName = "List.Item.Detail.Metadata.TagList.Item";

/**
 * List.Item.Detail.Metadata.Separator component
 */
export function ListItemDetailMetadataSeparator() {
  return <div className="list-detail-metadata-separator" />;
}

ListItemDetailMetadataSeparator.displayName = "List.Item.Detail.Metadata.Separator";

// Attach sub-components to metadata components
(ListItemDetailMetadata as any).Label = ListItemDetailMetadataLabel;
(ListItemDetailMetadata as any).Link = ListItemDetailMetadataLink;
(ListItemDetailMetadata as any).TagList = ListItemDetailMetadataTagList;
(ListItemDetailMetadata as any).Separator = ListItemDetailMetadataSeparator;

(ListItemDetailMetadataTagList as any).Item = ListItemDetailMetadataTagListItem;
