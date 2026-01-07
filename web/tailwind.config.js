/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#1a1a2e',
        primary: {
          DEFAULT: '#e91e63',
          light: '#f48fb1',
          dark: '#c2185b',
        },
        success: '#10b981',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
}
