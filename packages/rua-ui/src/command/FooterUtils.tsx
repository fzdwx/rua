import { ActionImpl } from "./index.tsx";
import React, { useMemo } from "react";
import { Icon } from "@iconify/react";
import type { Toast } from "./types";

/**
 * Render footer icon with support for multiple formats:
 * - React elements (passed through)
 * - Emoji strings (rendered as text)
 * - ext:// URLs (rendered as img)
 * - data: URIs (rendered as img)
 * - SVG strings (rendered with dangerouslySetInnerHTML)
 * - Iconify icon names (rendered with Icon component)
 */
function FooterIconRenderer({ icon }: { icon: string | React.ReactElement }) {
  const iconContent = useMemo(() => {
    // If it's already a React element, return it directly
    if (React.isValidElement(icon)) {
      return icon;
    }

    // Must be a string at this point
    const iconStr = icon as string;

    // Check if it's an ext:// URL or data URI - render as image
    if (
      iconStr.startsWith("ext://") ||
      iconStr.startsWith("data:") ||
      iconStr.startsWith("http://") ||
      iconStr.startsWith("https://")
    ) {
      return (
        <img
          src={iconStr}
          alt="icon"
          style={{
            width: "16px",
            height: "16px",
            objectFit: "contain",
          }}
        />
      );
    }

    // Check if it's an SVG string
    if (iconStr.trim().startsWith("<svg")) {
      return (
        <div
          style={{
            width: "16px",
            height: "16px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          dangerouslySetInnerHTML={{ __html: iconStr }}
        />
      );
    }

    // Check if it looks like an iconify icon name (contains ":")
    if (iconStr.includes(":")) {
      return <Icon icon={iconStr} style={{ fontSize: "16px" }} />;
    }

    // Default: treat as emoji or text
    return iconStr;
  }, [icon]);

  return <>{iconContent}</>;
}

/**
 * FooterToast component - displays toast overlay in footer's left side (Raycast style)
 */
const FooterToast: React.FC<{
  toast?: Toast;
}> = ({ toast }) => {
  return (
    <div className={`footer-toast-container type-${toast.type}`} key={toast.id}>
      <div className="footer-toast-glow" aria-hidden="true" />
      <div className="footer-toast-content">
        <div className="footer-toast-indicator">
          {toast.type === "animated" ? (
            <div className="footer-toast-spinner" />
          ) : (
            <div className="footer-toast-dot" />
          )}
        </div>

        <div className="footer-toast-message">{toast.message}</div>
      </div>
    </div>
  );
};

interface FooterMetaProps {
  icon?: string | React.ReactElement;
  content?: (current?: string | ActionImpl | null) => string | React.ReactElement;
  current?: string | ActionImpl;
}

const FooterMeta = ({ icon, content, current }: FooterMetaProps) => {
  return (
    <div className="footer-toast-content">
      <div className="footer-toast-indicator">
        <FooterIconRenderer icon={icon} />
      </div>
      <div className="footer-toast-message">{content(current)}</div>
    </div>
  );
};

export { FooterIconRenderer, FooterToast, FooterMeta };
