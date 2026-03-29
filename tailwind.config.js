/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/momentum/**/*.{js,ts,jsx,tsx}",
    "./src/components/momentum/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        momentum: {
          bg: '#111111',
          surface: '#1A1A1A',
          border: '#333333',
          text: '#FFFFFF',
          textMuted: '#A3A3A3'
        }
      }
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
