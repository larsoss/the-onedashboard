import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'ios-bg':        '#1C1C1E',
        'ios-card':      '#2C2C2E',
        'ios-card-2':    '#3A3A3C',
        'ios-separator': '#38383A',
        'ios-label':     '#EBEBF5',
        'ios-secondary': '#8E8E93',
        'ios-amber':     '#FF9F0A',
        'ios-blue':      '#0A84FF',
        'ios-green':     '#30D158',
        'ios-red':       '#FF453A',
        'ios-purple':    '#BF5AF2',
        'ios-teal':      '#5AC8FA',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}

export default config
