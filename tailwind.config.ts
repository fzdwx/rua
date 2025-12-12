/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6ee7b7',
          '2': '#30ab7a',
        },
        empty: 'transparent',
        hover: '#0000000C',
        hover2: '#00000019',
        // Gray scale matching command.css - using CSS variables for dark mode support
        gray: {
          1: 'var(--gray1)',
          2: 'var(--gray2)',
          3: 'var(--gray3)',
          4: 'var(--gray4)',
          5: 'var(--gray5)',
          6: 'var(--gray6)',
          7: 'var(--gray7)',
          8: 'var(--gray8)',
          9: 'var(--gray9)',
          10: 'var(--gray10)',
          11: 'var(--gray11)',
          12: 'var(--gray12)',
        },
        // Gray alpha scale
        grayA: {
          1: 'var(--grayA1)',
          2: 'var(--grayA2)',
          3: 'var(--grayA3)',
          4: 'var(--grayA4)',
          5: 'var(--grayA5)',
          6: 'var(--grayA6)',
          7: 'var(--grayA7)',
          8: 'var(--grayA8)',
          9: 'var(--grayA9)',
          10: 'var(--grayA10)',
          11: 'var(--grayA11)',
          12: 'var(--grayA12)',
        },
        // Blue scale matching command.css
        blue: {
          1: 'var(--blue1)',
          2: 'var(--blue2)',
          3: 'var(--blue3)',
          4: 'var(--blue4)',
          5: 'var(--blue5)',
          6: 'var(--blue6)',
          7: 'var(--blue7)',
          8: 'var(--blue8)',
          9: 'var(--blue9)',
          10: 'var(--blue10)',
          11: 'var(--blue11)',
          12: 'var(--blue12)',
        },
      },
      backgroundColor: {
        'app-bg': 'var(--app-bg)',
      },
      textColor: {
        'text': 'var(--text)',
      },
      // Raycast-style shadows - subtle and layered
      boxShadow: {
        'raycast-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'raycast': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        'raycast-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1), 0 10px 15px -3px rgba(0, 0, 0, 0.05)',
        'raycast-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.05)',
        'raycast-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1), 0 10px 15px -3px rgba(0, 0, 0, 0.08)',
      },
      // Unified border radius
      borderRadius: {
        'raycast': '0.5rem',
        'raycast-sm': '0.375rem',
        'raycast-md': '0.625rem',
        'raycast-lg': '0.75rem',
      },
      // Transition timing - Raycast style (smooth and fast)
      transitionTimingFunction: {
        'raycast': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'raycast-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'raycast-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
      // Animation durations
      transitionDuration: {
        'raycast-fast': '150ms',
        'raycast': '200ms',
        'raycast-slow': '300ms',
      },
      // Backdrop blur
      backdropBlur: {
        'raycast': '12px',
        'raycast-sm': '8px',
        'raycast-lg': '16px',
      },
    },
  },
  plugins: [],
  darkMode: ['class'],
}
