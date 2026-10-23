/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jarvis: {
          darkest: '#030712',
          darker: '#060b18',
          dark: '#0a1226',
          panel: 'rgba(10, 18, 38, 0.75)',
          panelBorder: 'rgba(0, 243, 255, 0.25)',
          cyan: '#00f3ff',
          cyanGlow: 'rgba(0, 243, 255, 0.4)',
          cyanDim: 'rgba(0, 243, 255, 0.1)',
          blue: '#0284c7',
          amber: '#f59e0b',
          emerald: '#10b981',
          rose: '#f43f5e',
          textMuted: '#94a3b8',
          textLight: '#e2e8f0',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
        sans: ['Rajdhani', 'Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'hud-glow': '0 0 15px rgba(0, 243, 255, 0.25)',
        'hud-glow-lg': '0 0 25px rgba(0, 243, 255, 0.4)',
        'hud-panel': 'inset 0 0 15px rgba(0, 243, 255, 0.05), 0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'reverse-spin': 'reverseSpin 18s linear infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        reverseSpin: {
          'from': { transform: 'rotate(360deg)' },
          'to': { transform: 'rotate(0deg)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
}
