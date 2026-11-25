/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accessible: {
          dark: '#121212',
          card: '#1E1E1E',
          surface: '#F8FAFC',
          primary: '#0D9488',
          'primary-dark': '#0F766E',
          warning: '#D97706',
          danger: '#DC2626',
          success: '#16A34A',
        }
      },
      fontSize: {
        'lg-accessible': '1.25rem',
        'xl-accessible': '1.5rem',
        '2xl-accessible': '1.875rem',
      }
    },
  },
  plugins: [],
}
