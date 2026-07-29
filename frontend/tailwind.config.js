/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#080B11',
          surface: '#111625',
          card: '#182033',
          border: '#232E48',
          cyan: '#00F0FF',
          purple: '#8A2BE2',
          pink: '#FF007F',
          gold: '#FFD700',
          green: '#00E676'
        }
      },
      boxShadow: {
        neonCyan: '0 0 20px rgba(0, 240, 255, 0.4)',
        neonPurple: '0 0 20px rgba(138, 43, 226, 0.4)',
        neonGold: '0 0 20px rgba(255, 215, 0, 0.4)'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
