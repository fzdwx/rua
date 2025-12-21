/**
 * ActionIcon Component
 *
 * Renders icons for actions with support for multiple formats:
 * - Iconify icon names (e.g., "tabler:puzzle")
 * - Data URIs (e.g., "data:image/svg+xml;base64,...")
 * - SVG strings (e.g., "<svg>...</svg>")
 * - Extension asset paths (e.g., "./icon.png")
 */

import {Icon} from "@iconify/react";
import {useMemo} from "react";
import {toExtURL} from "rua-api";

interface ActionIconProps {
  icon: string;
  extensionPath?: string;
  size?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function ActionIcon({
                             icon,
                             extensionPath,
                             size = "20px",
                             className = "",
                             style = {},
                           }: ActionIconProps) {
  const iconContent = useMemo(() => {
    // Check if it's a data URI
    if (icon.startsWith("data:")) {
      return (
        <img
          src={icon}
          alt="action icon"
          className={className}
          style={{
            width: size,
            height: size,
            objectFit: "contain",
            ...style,
          }}
        />
      );
    }

    // Check if it's an SVG string
    if (icon.trim().startsWith("<svg")) {
      return (
        <div
          className={className}
          style={{
            width: size,
            height: size,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            ...style,
          }}
          dangerouslySetInnerHTML={{__html: icon}}
        />
      );
    }

    // Check if it's a relative path (extension asset)
    if (icon.startsWith("./") || icon.startsWith("../") || icon.startsWith("/")) {
      // Build full URL using extension path
      let fullUrl = icon;
      if (extensionPath) {
        fullUrl = toExtURL(icon, extensionPath)
      }
      return (
        <img
          src={fullUrl}
          alt="action icon"
          className={className}
          style={{
            width: size,
            height: size,
            objectFit: "contain",
            ...style,
          }}
        />
      );
    }

    // Default: treat as iconify icon name
    return <Icon icon={icon} className={className} style={{fontSize: size, ...style}}/>;
  }, [icon, extensionPath, size, className, style]);

  return iconContent;
}
