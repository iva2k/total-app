const colors = require('tailwindcss/colors');
const svelteUx = require('svelte-ux/plugins/tailwind.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}', './node_modules/svelte-ux/**/*.{svelte,js}'],
  theme: {
    extend: {}
  },

  // See customization docs: https://svelte-ux.techniq.dev/customization
  ux: {
    themes: {
      light: {
        'color-scheme': 'light',
        primary: 'oklch(60.39% 0.228 269.1)',
        secondary: '#7b92b2',
        accent: '#67cba0',
        neutral: '#181a2a',
        'neutral-content': '#edf2f7',
        'surface-100': 'oklch(100% 0 0)',
        'surface-content': '#181a2a',
        '--rounded-box': '0.25rem',
        '--rounded-btn': '.125rem',
        '--rounded-badge': '.125rem',
        '--tab-radius': '0.25rem',
        '--animation-btn': '0',
        '--animation-input': '0',
        '--btn-focus-scale': '1'
      },
      dark: {
        'color-scheme': 'dark',
        primary: '#1C4E80',
        secondary: '#7C909A',
        accent: '#EA6947',
        neutral: '#23282E',
        'surface-100': '#202020',
        info: '#0091D5',
        success: '#6BB187',
        warning: '#DBAE59',
        danger: '#AC3E31',
        '--rounded-box': '0.25rem',
        '--rounded-btn': '.125rem',
        '--rounded-badge': '.125rem'
      }
    }
  },

  plugins: [
    svelteUx // uses hsl() color space by default. To use oklch(), use: svelteUx({ colorSpace: 'oklch' }),
  ]
};
