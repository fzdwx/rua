import { useEffect, useState } from 'react';

/**
 * Auto-sync theme for rua extensions
 * Listens to theme-change events from rua API and applies .dark class to document
 *
 * Usage in extension:
 * ```tsx
 * import { useRuaTheme } from '@rua/ui';
 *
 * function App() {
 *   useRuaTheme(); // That's it!
 *   return <YourApp />;
 * }
 * ```
 */
export function useRuaTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check if rua API is available
    const rua = (window as any).rua;

    if (!rua) {
      console.warn('[useRuaTheme] rua API not available yet, waiting for rua-ready event');

      // Listen for rua-ready event if API loads after mount
      const handleRuaReady = () => {
        const ruaApi = (window as any).rua;
        if (ruaApi?.ui?.getTheme) {
          ruaApi.ui.getTheme().then((initialTheme: 'light' | 'dark') => {
            setTheme(initialTheme);
          }).catch(console.error);
        }
      };

      window.addEventListener('rua-ready', handleRuaReady);
      return () => window.removeEventListener('rua-ready', handleRuaReady);
    }

    // Get initial theme
    if (rua.ui?.getTheme) {
      rua.ui.getTheme().then((initialTheme: 'light' | 'dark') => {
        setTheme(initialTheme);
      }).catch(console.error);
    }

    // Listen for theme changes
    if (rua.on) {
      const handleThemeChange = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
      };

      rua.on('theme-change', handleThemeChange);

      return () => {
        if (rua.off) {
          rua.off('theme-change', handleThemeChange);
        }
      };
    }
  }, []);

  // Apply theme to document.documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return theme;
}
