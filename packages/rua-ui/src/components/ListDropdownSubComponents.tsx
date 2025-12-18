import { ReactElement } from "react";
import { ListDropdownItemProps, ListDropdownSectionProps } from "../types";

/**
 * List.Dropdown.Item component for use as a child of List.Dropdown
 */
export function ListDropdownItem(_props: ListDropdownItemProps) {
  // This component doesn't render anything directly
  // It's used by the parent List.Dropdown to extract item data
  return null;
}

ListDropdownItem.displayName = "List.Dropdown.Item";
ListDropdownItem.__isListDropdownItem = true;

/**
 * List.Dropdown.Section component for grouping List.Dropdown.Item components
 */
export function ListDropdownSection(_props: ListDropdownSectionProps) {
  // This component doesn't render anything directly
  // It's used by the parent List.Dropdown to extract section data
  return null;
}

ListDropdownSection.displayName = "List.Dropdown.Section";
ListDropdownSection.__isListDropdownSection = true;

/**
 * Type guard to check if a component is a List.Dropdown.Item
 */
export function isListDropdownItem(
  element: ReactElement
): element is ReactElement<ListDropdownItemProps> {
  return Boolean(
    element.type &&
      typeof element.type === "function" &&
      (element.type as any).__isListDropdownItem === true
  );
}

/**
 * Type guard to check if a component is a List.Dropdown.Section
 */
export function isListDropdownSection(
  element: ReactElement
): element is ReactElement<ListDropdownSectionProps> {
  return Boolean(
    element.type &&
      typeof element.type === "function" &&
      (element.type as any).__isListDropdownSection === true
  );
}
