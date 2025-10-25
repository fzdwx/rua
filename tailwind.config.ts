/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6ee7b7',
        primary2: '#30ab7a',
        empty: 'transparent',
        hover: '#0000000C',
        hover2: '#00000019',
      }
    },
  },
  plugins: [],
}
