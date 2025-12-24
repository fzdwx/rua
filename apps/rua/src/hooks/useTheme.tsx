import { useState, useEffect } from "react";

type Theme = "light" | "dark" | "system";

// 获取系统主题偏好
const getSystemTheme = (): "light" | "dark" => {
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

// 获取实际应用的主题（将 "system" 解析为实际的 light/dark）
const getEffectiveTheme = (theme: Theme): "light" | "dark" => {
  return theme === "system" ? getSystemTheme() : theme;
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Get from localStorage or system preference
    const stored = localStorage.getItem("theme") as Theme;
    if (stored) {
      return stored;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }

    return "light";
  });

  useEffect(() => {
    // Apply theme to document
    const effectiveTheme = getEffectiveTheme(theme);
    const root = document.documentElement;
    if (effectiveTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen for system theme changes when theme is "system"
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const effectiveTheme = getEffectiveTheme("system");
      const root = document.documentElement;
      if (effectiveTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return { theme, setTheme, toggleTheme };
}
