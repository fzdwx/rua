import { ReactElement } from "react";
import { ListItemComponentProps, ListSectionComponentProps, ListEmptyViewProps } from "../types";
import { ListItemDetail } from "./ListItemDetail";

/**
 * List.Item component for use as a child of List
 * This is a declarative component that provides item data to the parent List
 */
export function ListItemComponent(_props: ListItemComponentProps) {
  // This component doesn't render anything directly
  // It's used by the parent List to extract item data
  return null;
}

// Mark this component for identification
ListItemComponent.displayName = "List.Item";
ListItemComponent.__isListItem = true;

// Attach Detail sub-component to List.Item
(ListItemComponent as any).Detail = ListItemDetail;

/**
 * List.Section component for grouping List.Item components
 */
export function ListSectionComponent(_props: ListSectionComponentProps) {
  // This component doesn't render anything directly
  // It's used by the parent List to extract section data
  return null;
}

// Mark this component for identification
ListSectionComponent.displayName = "List.Section";
ListSectionComponent.__isListSection = true;

/**
 * List.EmptyView component for custom empty state
 */
export function ListEmptyView({ icon, title, description, actions }: ListEmptyViewProps) {
  return (
    <div className="list-empty-view">
      {icon && <div className="list-empty-icon">{icon}</div>}
      <div className="list-empty-title">{title}</div>
      {description && <div className="list-empty-description">{description}</div>}
      {actions && <div className="list-empty-actions">{actions}</div>}
    </div>
  );
}

ListEmptyView.displayName = "List.EmptyView";
ListEmptyView.__isListEmptyView = true;

/**
 * Type guard to check if a component is a List.Item
 */
export function isListItemComponent(
  element: ReactElement
): element is ReactElement<ListItemComponentProps> {
  return Boolean(
    element.type &&
    typeof element.type === "function" &&
    (element.type as any).__isListItem === true
  );
}

/**
 * Type guard to check if a component is a List.Section
 */
export function isListSectionComponent(
  element: ReactElement
): element is ReactElement<ListSectionComponentProps> {
  return Boolean(
    element.type &&
    typeof element.type === "function" &&
    (element.type as any).__isListSection === true
  );
}

/**
 * Type guard to check if a component is a List.EmptyView
 */
export function isListEmptyViewComponent(
  element: ReactElement
): element is ReactElement<ListEmptyViewProps> {
  return Boolean(
    element.type &&
    typeof element.type === "function" &&
    (element.type as any).__isListEmptyView === true
  );
}
