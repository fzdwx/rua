import { ReactNode, ReactElement } from 'react';
import {
  DetailProps,
  DetailMetadataProps,
  DetailMetadataLabelProps,
  DetailMetadataLinkProps,
  DetailMetadataTagListProps,
  DetailMetadataTagListItemProps,
  DetailMetadataSeparatorProps,
} from '../types';

// Type markers for component identification
const DETAIL_METADATA_TYPE = Symbol.for('rua-ui.Detail.Metadata');
const DETAIL_METADATA_LABEL_TYPE = Symbol.for('rua-ui.Detail.Metadata.Label');
const DETAIL_METADATA_LINK_TYPE = Symbol.for('rua-ui.Detail.Metadata.Link');
const DETAIL_METADATA_TAGLIST_TYPE = Symbol.for('rua-ui.Detail.Metadata.TagList');
const DETAIL_METADATA_TAGLIST_ITEM_TYPE = Symbol.for('rua-ui.Detail.Metadata.TagList.Item');
const DETAIL_METADATA_SEPARATOR_TYPE = Symbol.for('rua-ui.Detail.Metadata.Separator');

/**
 * Detail.Metadata component - container for metadata items
 */
function DetailMetadata({ children }: DetailMetadataProps) {
  return (
    <div className="detail-metadata">
      {children}
    </div>
  );
}
DetailMetadata.displayName = 'Detail.Metadata';
(DetailMetadata as any).__ruaType = DETAIL_METADATA_TYPE;

/**
 * Detail.Metadata.Label component - displays a label-value pair
 */
function DetailMetadataLabel({ title, text, icon }: DetailMetadataLabelProps) {
  return (
    <div className="detail-metadata-label">
      <span className="detail-metadata-label-title">{title}</span>
      <span className="detail-metadata-label-value">
        {icon && <span className="detail-metadata-label-icon">{icon}</span>}
        {text}
      </span>
    </div>
  );
}
DetailMetadataLabel.displayName = 'Detail.Metadata.Label';
(DetailMetadataLabel as any).__ruaType = DETAIL_METADATA_LABEL_TYPE;

/**
 * Detail.Metadata.Link component - displays a clickable link
 */
function DetailMetadataLink({ title, target, text }: DetailMetadataLinkProps) {
  const handleClick = () => {
    // Open link in browser using rua API if available, otherwise use window.open
    if (typeof window !== 'undefined' && (window as any).rua?.shell?.openUrl) {
      (window as any).rua.shell.openUrl(target);
    } else {
      window.open(target, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="detail-metadata-link">
      <span className="detail-metadata-link-title">{title}</span>
      <a
        href={target}
        onClick={(e) => {
          e.preventDefault();
          handleClick();
        }}
        className="detail-metadata-link-value"
      >
        {text}
      </a>
    </div>
  );
}
DetailMetadataLink.displayName = 'Detail.Metadata.Link';
(DetailMetadataLink as any).__ruaType = DETAIL_METADATA_LINK_TYPE;

/**
 * Detail.Metadata.TagList.Item component - individual tag item
 */
function DetailMetadataTagListItem({ text, color }: DetailMetadataTagListItemProps) {
  return (
    <span
      className="detail-metadata-tag-item"
      style={color ? { backgroundColor: color } : undefined}
    >
      {text}
    </span>
  );
}
DetailMetadataTagListItem.displayName = 'Detail.Metadata.TagList.Item';
(DetailMetadataTagListItem as any).__ruaType = DETAIL_METADATA_TAGLIST_ITEM_TYPE;

/**
 * Detail.Metadata.TagList component - displays a list of tags
 */
function DetailMetadataTagList({ title, children }: DetailMetadataTagListProps) {
  return (
    <div className="detail-metadata-taglist">
      <span className="detail-metadata-taglist-title">{title}</span>
      <div className="detail-metadata-taglist-items">
        {children}
      </div>
    </div>
  );
}
DetailMetadataTagList.displayName = 'Detail.Metadata.TagList';
(DetailMetadataTagList as any).__ruaType = DETAIL_METADATA_TAGLIST_TYPE;
// Attach Item sub-component
DetailMetadataTagList.Item = DetailMetadataTagListItem;

/**
 * Detail.Metadata.Separator component - visual separator
 */
function DetailMetadataSeparator(_props: DetailMetadataSeparatorProps) {
  return <hr className="detail-metadata-separator" />;
}
DetailMetadataSeparator.displayName = 'Detail.Metadata.Separator';
(DetailMetadataSeparator as any).__ruaType = DETAIL_METADATA_SEPARATOR_TYPE;

// Attach sub-components to DetailMetadata
DetailMetadata.Label = DetailMetadataLabel;
DetailMetadata.Link = DetailMetadataLink;
DetailMetadata.TagList = DetailMetadataTagList;
DetailMetadata.Separator = DetailMetadataSeparator;

/**
 * Detail component for displaying content with optional metadata sidebar
 */
export function Detail({
  title,
  markdown,
  children,
  actions,
  navigationTitle,
  isLoading = false,
  metadata,
}: DetailProps) {
  return (
    <div className="detail-container">
      {/* Navigation title */}
      {navigationTitle && (
        <div className="detail-navigation-title">{navigationTitle}</div>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className="detail-loading">
          <div className="detail-loading-spinner" />
        </div>
      )}
      
      {/* Main content area with optional metadata sidebar */}
      <div className={`detail-content-wrapper ${metadata ? 'with-metadata' : ''}`}>
        {/* Main content */}
        <div className="detail-main">
          {title && <h1 className="detail-title">{title}</h1>}
          {markdown && (
            <div
              className="detail-markdown"
              dangerouslySetInnerHTML={{ __html: markdown }}
            />
          )}
          {children && <div className="detail-content">{children}</div>}
        </div>
        
        {/* Metadata sidebar */}
        {metadata && (
          <div className="detail-metadata-sidebar">
            {metadata}
          </div>
        )}
      </div>
      
      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="detail-actions">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onAction}
              className="detail-action-button"
            >
              {action.icon && <span className="action-icon">{action.icon}</span>}
              {action.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Attach sub-components to Detail for Raycast-style API
Detail.Metadata = DetailMetadata;

// Export type guards for component identification
export function isDetailMetadataComponent(element: ReactElement): boolean {
  return (element.type as any)?.__ruaType === DETAIL_METADATA_TYPE;
}

export function isDetailMetadataLabelComponent(element: ReactElement): boolean {
  return (element.type as any)?.__ruaType === DETAIL_METADATA_LABEL_TYPE;
}

export function isDetailMetadataLinkComponent(element: ReactElement): boolean {
  return (element.type as any)?.__ruaType === DETAIL_METADATA_LINK_TYPE;
}

export function isDetailMetadataTagListComponent(element: ReactElement): boolean {
  return (element.type as any)?.__ruaType === DETAIL_METADATA_TAGLIST_TYPE;
}

export function isDetailMetadataSeparatorComponent(element: ReactElement): boolean {
  return (element.type as any)?.__ruaType === DETAIL_METADATA_SEPARATOR_TYPE;
}
