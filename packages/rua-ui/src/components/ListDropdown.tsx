import { useState, useEffect, useMemo, Children, isValidElement, ReactElement } from "react";
import { ListDropdownProps, ListDropdownItemProps, ListDropdownSectionProps } from "../types";
import {
  ListDropdownItem,
  ListDropdownSection,
  isListDropdownItem,
  isListDropdownSection,
} from "./ListDropdownSubComponents";

/**
 * List.Dropdown component for secondary filtering in the search bar
 */
export function ListDropdown({
  tooltip,
  id,
  defaultValue,
  value: controlledValue,
  storeValue = false,
  onChange,
  onSearchTextChange,
  placeholder = "Select...",
  isLoading = false,
  filtering = true,
  throttle = false,
  children,
}: ListDropdownProps) {
  // State management
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const [searchQuery, setSearchQuery] = useState("");

  // Load stored value if storeValue is enabled
  useEffect(() => {
    if (storeValue && id && !controlledValue && !defaultValue) {
      const storedValue = localStorage.getItem(`list-dropdown-${id}`);
      if (storedValue) {
        setInternalValue(storedValue);
      }
    }
  }, [storeValue, id, controlledValue, defaultValue]);

  // Use controlled value if provided, otherwise use internal state
  const currentValue = controlledValue !== undefined ? controlledValue : internalValue;

  // Parse children to extract items and sections
  const { items, sections } = useMemo(() => {
    const result: {
      items: Array<{ title: string; value: string; icon?: ReactElement; keywords?: string[] }>;
      sections: Array<{
        title?: string;
        items: Array<{ title: string; value: string; icon?: ReactElement; keywords?: string[] }>;
      }>;
    } = {
      items: [],
      sections: [],
    };

    if (!children) return result;

    Children.forEach(children, (child) => {
      if (!isValidElement(child)) return;

      if (isListDropdownItem(child)) {
        const props = child.props as ListDropdownItemProps;
        result.items.push({
          title: props.title,
          value: props.value,
          icon: props.icon,
          keywords: props.keywords,
        });
      } else if (isListDropdownSection(child)) {
        const sectionProps = child.props as ListDropdownSectionProps;
        const sectionItems: Array<{
          title: string;
          value: string;
          icon?: ReactElement;
          keywords?: string[];
        }> = [];

        Children.forEach(sectionProps.children, (sectionChild) => {
          if (isValidElement(sectionChild) && isListDropdownItem(sectionChild)) {
            const itemProps = sectionChild.props as ListDropdownItemProps;
            sectionItems.push({
              title: itemProps.title,
              value: itemProps.value,
              icon: itemProps.icon,
              keywords: itemProps.keywords,
            });
          }
        });

        result.sections.push({
          title: sectionProps.title,
          items: sectionItems,
        });
      }
    });

    return result;
  }, [children]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!filtering || !searchQuery.trim()) {
      return items;
    }

    const query = searchQuery.toLowerCase();
    return items.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(query);
      const keywordsMatch = item.keywords?.some((keyword) =>
        keyword.toLowerCase().includes(query)
      );
      return titleMatch || keywordsMatch;
    });
  }, [items, searchQuery, filtering]);

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!filtering || !searchQuery.trim()) {
      return sections;
    }

    const query = searchQuery.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const titleMatch = item.title.toLowerCase().includes(query);
          const keywordsMatch = item.keywords?.some((keyword) =>
            keyword.toLowerCase().includes(query)
          );
          return titleMatch || keywordsMatch;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, searchQuery, filtering]);

  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);

    // Store value if enabled
    if (storeValue && id) {
      localStorage.setItem(`list-dropdown-${id}`, newValue);
    }

    onChange?.(newValue);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onSearchTextChange?.(query);
  };

  return (
    <select
      value={currentValue}
      onChange={(e) => handleValueChange(e.target.value)}
      title={tooltip}
      className="list-dropdown"
      style={{
        width: "200px",
        backgroundColor: "var(--gray3)",
        color: "var(--gray12)",
        border: "1px solid var(--gray6)",
        borderRadius: "6px",
        padding: "6px 12px",
        fontSize: "14px",
        outline: "none",
        cursor: "pointer",
      }}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {/* Render sections if available, otherwise render flat items */}
      {sections.length > 0 ? (
        <>
          {filteredSections.map((section, sectionIndex) => (
            <optgroup key={`section-${sectionIndex}`} label={section.title}>
              {section.items.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.title}
                </option>
              ))}
            </optgroup>
          ))}
        </>
      ) : (
        <>
          {filteredItems.map((item) => (
            <option key={item.value} value={item.value}>
              {item.title}
            </option>
          ))}
        </>
      )}
    </select>
  );
}

// Attach sub-components
ListDropdown.Item = ListDropdownItem;
ListDropdown.Section = ListDropdownSection;
