import * as React from "react";

interface LeftButtonProps {
  onClick?: () => void;
}

export function Container({ children }: { children: React.ReactNode }) {
  return <div className="command-container">{children}</div>;
}

export function Background({ children }: { children: React.ReactNode }) {
  return <div className="command-background">{children}</div>;
}

export function LeftButton({ onClick }: LeftButtonProps) {
  return (
    <button
      title="Back"
      type="button"
      onClick={onClick}
      style={{
        marginLeft: "12px",
        marginRight: "12px",
        padding: "6px",
        cursor: "pointer",
        color: "var(--gray11)",
        fontSize: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        borderRadius: "6px",
        background: "var(--gray3)",
        border: "1px solid var(--gray6)",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--gray12)";
        e.currentTarget.style.background = "var(--gray4)";
        e.currentTarget.style.borderColor = "var(--gray7)";
        e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--gray11)";
        e.currentTarget.style.background = "var(--gray3)";
        e.currentTarget.style.borderColor = "var(--gray6)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
      }}
    >
      <svg
        className="search-input-back-icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
  );
}

interface InputLoadingProps {
  loading?: boolean;
}

export function InputLoading({ loading }: InputLoadingProps) {
  if (loading) {
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "1px",
          background: "var(--gray6)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "50%",
            height: "100%",
            background: "var(--primary)",
            animation: "loading 1.5s ease-in-out infinite",
          }}
        />
      </div>
    );
  }
  return <></>;
}
