import { ReactElement } from "react";
import ReactMarkdown from "react-markdown";
import { ListItemDetailMetadata } from "./ListItemDetailMetadata";

/**
 * Props for List.Item.Detail component
 */
export interface ListItemDetailProps {
  /** Markdown content to render */
  markdown?: string;
  /** Metadata component to display */
  metadata?: ReactElement;
  /** Loading state */
  isLoading?: boolean;
}

/**
 * List.Item.Detail component for displaying detailed information in split view
 */
export function ListItemDetail({ markdown, metadata, isLoading = false }: ListItemDetailProps) {
  return (
    <div className="list-item-detail">
      {isLoading ? (
        <div className="list-item-detail-loading">
          <div className="loading-spinner" />
        </div>
      ) : (
        <>
          {markdown && (
            <div className="list-item-detail-content">
              <div className="list-item-detail-markdown">
                <ReactMarkdown>{markdown}</ReactMarkdown>
              </div>
            </div>
          )}
          {metadata && <div className="list-item-detail-metadata-container">{metadata}</div>}
        </>
      )}
    </div>
  );
}

ListItemDetail.displayName = "List.Item.Detail";

// Attach Metadata sub-component
(ListItemDetail as any).Metadata = ListItemDetailMetadata;
