/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: {
            DEFAULT: '#16A34A',
            dark: '#166534',
            light: '#DCFCE7',
          },
          blue: {
            DEFAULT: '#2563EB',
            dark: '#1E3A8A',
            light: '#DBEAFE',
          },
          bg: {
            DEFAULT: '#FFFFFF',
            secondary: '#F8FAFC',
          },
          text: {
            DEFAULT: '#0F172A',
            muted: '#64748B',
          },
          border: '#E2E8F0',
          warning: '#F59E0B',
          error: '#DC2626',
        }
      }
    },
  },
  plugins: [],
}
