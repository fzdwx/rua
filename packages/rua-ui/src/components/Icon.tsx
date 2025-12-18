import React from "react";

/**
 * Image mask types for icons
 */
export const Image = {
  Mask: {
    Circle: "circle" as const,
    RoundedRectangle: "roundedRectangle" as const,
  },
};

export type ImageMask = typeof Image.Mask.Circle | typeof Image.Mask.RoundedRectangle;

/**
 * Built-in icon identifier type
 */
export type BuiltInIcon = {
  __type: "builtin";
  name: string;
};

/**
 * Props for the Icon component
 */
export interface IconProps {
  /** Icon source - can be a built-in icon, URL, file path, or base64 encoded image */
  source: string | BuiltInIcon;
  /** Tint color to apply to the icon */
  tintColor?: string;
  /** Mask to apply to the icon */
  mask?: ImageMask;
  /** Additional CSS class name */
  className?: string;
  /** Icon size in pixels */
  size?: number;
}

/**
 * Creates a built-in icon identifier
 */
export function createIcon(name: string): BuiltInIcon {
  return { __type: "builtin", name };
}

/**
 * Check if a source is a built-in icon
 */
export function isBuiltInIcon(source: string | BuiltInIcon): source is BuiltInIcon {
  return typeof source === "object" && source !== null && source.__type === "builtin";
}

/**
 * Check if a string is a URL or data URI
 */
export function isExternalSource(source: string): boolean {
  return (
    source.startsWith("http://") ||
    source.startsWith("https://") ||
    source.startsWith("data:") ||
    source.startsWith("file://")
  );
}

/**
 * SVG paths for built-in icons
 * Using simple, clean SVG paths for common icons
 */
const ICON_PATHS: Record<string, string> = {
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  "star-filled":
    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  trash:
    "M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  checkmark: "M20 6L9 17l-5-5",
  xmark: "M18 6L6 18M6 6l12 12",
  "chevron-right": "M9 18l6-6-6-6",
  "chevron-left": "M15 18l-6-6 6-6",
  "chevron-up": "M18 15l-6-6-6 6",
  "chevron-down": "M6 9l6 6 6-6",
  "arrow-right": "M5 12h14M12 5l7 7-7 7",
  "arrow-left": "M19 12H5M12 19l-7-7 7-7",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z",
  document:
    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  folder: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z",
  globe:
    "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  link: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  clipboard:
    "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 2h6a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z",
  calendar:
    "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18",
  clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
  person: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z",
  "eye-off":
    "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22",
  heart:
    "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  info: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01",
  warning:
    "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  error:
    "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM15 9l-6 6M9 9l6 6",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  upload: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  terminal: "M4 17l6-6-6-6M12 19h8",
  code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  copy: "M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  "external-link": "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  unlock:
    "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 019.9-1",
  key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  sort: "M3 6h18M6 12h12M9 18h6",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  "grid-icon": "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  menu: "M3 12h18M3 6h18M3 18h18",
  "more-horizontal":
    "M12 13a1 1 0 100-2 1 1 0 000 2zM19 13a1 1 0 100-2 1 1 0 000 2zM5 13a1 1 0 100-2 1 1 0 000 2z",
  "more-vertical":
    "M12 13a1 1 0 100-2 1 1 0 000 2zM12 6a1 1 0 100-2 1 1 0 000 2zM12 20a1 1 0 100-2 1 1 0 000 2z",
};

/**
 * Get mask styles based on mask type
 */
function getMaskStyles(mask?: ImageMask): React.CSSProperties {
  if (!mask) return {};

  switch (mask) {
    case "circle":
      return { borderRadius: "50%", overflow: "hidden" };
    case "roundedRectangle":
      return { borderRadius: "4px", overflow: "hidden" };
    default:
      return {};
  }
}

/**
 * Icon component that renders built-in icons, URLs, or custom sources
 */
export const IconComponent: React.FC<IconProps> = ({
  source,
  tintColor,
  mask,
  className = "",
  size = 16,
}) => {
  const maskStyles = getMaskStyles(mask);

  // Handle built-in icons
  if (isBuiltInIcon(source)) {
    const path = ICON_PATHS[source.name];
    if (!path) {
      console.warn(`Unknown built-in icon: ${source.name}`);
      return null;
    }

    // Determine if the icon uses fill or stroke based on the icon name
    const isFilled = source.name.includes("filled");

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={isFilled ? tintColor || "currentColor" : "none"}
        stroke={isFilled ? "none" : tintColor || "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={maskStyles}
        data-icon-name={source.name}
      >
        <path d={path} />
      </svg>
    );
  }

  // Handle external sources (URLs, data URIs, file paths)
  if (isExternalSource(source)) {
    return (
      <img
        src={source}
        alt=""
        width={size}
        height={size}
        className={className}
        style={{
          ...maskStyles,
          ...(tintColor ? { filter: `drop-shadow(0 0 0 ${tintColor})` } : {}),
        }}
      />
    );
  }

  // Handle string source as icon name (for convenience)
  const path = ICON_PATHS[source];
  if (path) {
    const isFilled = source.includes("filled");
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={isFilled ? tintColor || "currentColor" : "none"}
        stroke={isFilled ? "none" : tintColor || "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={maskStyles}
        data-icon-name={source}
      >
        <path d={path} />
      </svg>
    );
  }

  // Fallback: treat as image source
  return (
    <img
      src={source}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{
        ...maskStyles,
        ...(tintColor ? { filter: `drop-shadow(0 0 0 ${tintColor})` } : {}),
      }}
    />
  );
};

/**
 * Icon namespace with built-in icons and the Icon component
 * Usage:
 * - <Icon source={Icon.Star} /> - Built-in icon
 * - <Icon source="https://example.com/icon.png" /> - URL
 * - <Icon source="star" /> - Icon name as string
 */
export const Icon = Object.assign(IconComponent, {
  // Common icons
  Star: createIcon("star"),
  StarFilled: createIcon("star-filled"),
  Trash: createIcon("trash"),
  Plus: createIcon("plus"),
  Minus: createIcon("minus"),
  Checkmark: createIcon("checkmark"),
  XMark: createIcon("xmark"),

  // Navigation icons
  ChevronRight: createIcon("chevron-right"),
  ChevronLeft: createIcon("chevron-left"),
  ChevronUp: createIcon("chevron-up"),
  ChevronDown: createIcon("chevron-down"),
  ArrowRight: createIcon("arrow-right"),
  ArrowLeft: createIcon("arrow-left"),

  // Action icons
  Search: createIcon("search"),
  Gear: createIcon("gear"),
  Document: createIcon("document"),
  Folder: createIcon("folder"),
  Globe: createIcon("globe"),
  Link: createIcon("link"),
  Clipboard: createIcon("clipboard"),
  Calendar: createIcon("calendar"),
  Clock: createIcon("clock"),
  Person: createIcon("person"),

  // View icons
  Eye: createIcon("eye"),
  EyeOff: createIcon("eye-off"),
  Heart: createIcon("heart"),
  Home: createIcon("home"),

  // Status icons
  Info: createIcon("info"),
  Warning: createIcon("warning"),
  Error: createIcon("error"),

  // File icons
  Download: createIcon("download"),
  Upload: createIcon("upload"),
  Refresh: createIcon("refresh"),

  // Development icons
  Terminal: createIcon("terminal"),
  Code: createIcon("code"),
  Copy: createIcon("copy"),
  Edit: createIcon("edit"),
  ExternalLink: createIcon("external-link"),

  // Communication icons
  Mail: createIcon("mail"),
  Message: createIcon("message"),
  Bell: createIcon("bell"),

  // Security icons
  Lock: createIcon("lock"),
  Unlock: createIcon("unlock"),
  Key: createIcon("key"),

  // UI icons
  Filter: createIcon("filter"),
  Sort: createIcon("sort"),
  List: createIcon("list"),
  Grid: createIcon("grid-icon"),
  Menu: createIcon("menu"),
  MoreHorizontal: createIcon("more-horizontal"),
  MoreVertical: createIcon("more-vertical"),
});
