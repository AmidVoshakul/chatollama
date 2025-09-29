module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          'CascadiaCode',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
      animation: {
        dot: 'dotMove 1s infinite ease-in-out',
        'dot-trail': 'dotTrailSmooth 5s ease-in-out infinite',
        'color-pulse': 'colorPulse 4s ease-in-out infinite',
        'thinking-pulse': 'thinkingPulse 3s ease-in-out infinite', // ⏳ обновлено
      },
      keyframes: {
        dotMove: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(10px)' },
        },
        dotTrailSmooth: {
          '0%':   { transform: 'translateX(0)',     opacity: '0' },
          '15%':  { transform: 'translateX(0)',     opacity: '1' },
          '80%':  { transform: 'translateX(100vw)', opacity: '1' },
          '100%': { transform: 'translateX(100vw)', opacity: '0' },
        },
        colorPulse: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        thinkingPulse: { // ⏳ обновлено
          '0%, 100%': { opacity: 0.1 },
          '50%': { opacity: 0.6 },
        },
      },
    },
  },
  plugins: [],
}
