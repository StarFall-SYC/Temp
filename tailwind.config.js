/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          cyan: '#20B2AA',
          blue: '#4169E1',
          purple: '#8A2BE2',
          gold: '#FFD700',
        },
        neutral: {
          light: '#F8F9FA',
          dark: '#212529',
        },
      },
      boxShadow: {
        glow: '0 10px 25px rgba(32, 178, 170, 0.3)',
      },
      borderRadius: {
        xl: '1rem',
      },
    },
  },
  plugins: [],
};
