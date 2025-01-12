// const colors = require('tailwindcss/colors');
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
        // Daisy "corporate"
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
        '--btn-focus-scale': '1',

        //                                        content-info  -succes-warnin-danger
        //? https://www.realtimecolors.com/?colors=000000-29bbff-4d9369-a77a25-cf6054&fonts=Inter-Inter - dark complement
        //? https://www.realtimecolors.com/?colors=ffffff-0091D5-6BB187-DBAE59-AC3E31&fonts=Inter-Inter - dark
        //  https://www.realtimecolors.com/?colors=000000-29bbff-6BCC87-DBAE59-BC6054&fonts=Inter-Inter - final
        info: '#29bbff',
        success: '#6BCC87',
        warning: '#DBAE59',
        danger: '#BC6054',
        'info-content': '#000000',
        'success-content': '#000000',
        'warning-content': '#000000',
        'danger-content': '#000000'
      },
      dark: {
        // Daisy "business" https://www.realtimecolors.com/?colors=ffffff-23282E-1C4E80-7C909A-EA6947&fonts=Inter-Inter
        'color-scheme': 'dark',
        primary: '#1C4E80',
        secondary: '#7C909A',
        accent: '#EA6947',
        neutral: '#23282E',
        'surface-100': '#202020',
        '--rounded-box': '0.25rem',
        '--rounded-btn': '.125rem',
        '--rounded-badge': '.125rem',
        //                                        content-info  -succes-warnin-danger
        //? https://www.realtimecolors.com/?colors=ffffff-0091D5-6BB187-DBAE59-AC3E31&fonts=Inter-Inter - dark original
        //  https://www.realtimecolors.com/?colors=ffffff-0091D5-6BB187-C9922C-AC3E31&fonts=Inter-Inter - final
        info: '#0091D5',
        success: '#6BB187',
        warning: '#C9922C',
        danger: '#AC3E31',
        'info-content': '#ffffff',
        'success-content': '#ffffff',
        'warning-content': '#ffffff',
        'danger-content': '#ffffff'
      },
      cupcake: {
        // Daisy "cupcake"
        'color-scheme': 'light',
        primary: '#65c3c8',
        secondary: '#ef9fbc',
        accent: '#eeaf3a',
        neutral: '#291334',
        'surface-100': '#faf7f5',
        'surface-200': '#efeae6',
        'surface-300': '#e7e2df',
        'surface-content': '#291334',
        '--rounded-btn': '1.9rem',
        '--tab-border': '2px',
        '--tab-radius': '0.7rem',
        info: '#0091D5',
        success: '#6BB187',
        warning: '#DBAE59',
        danger: '#AC3E31',
        'info-content': '#00ffff',
        'success-content': '#00ffff',
        'warning-content': '#000000',
        'danger-content': '#00ffff'
      },
      'dark-daisy': {
        // Daisy "dark"
        'color-scheme': 'dark',
        primary: 'oklch(65.69% 0.196 275.75)',
        secondary: 'oklch(74.8% 0.26 342.55)',
        accent: 'oklch(74.51% 0.167 183.61)',
        neutral: '#2a323c',
        'neutral-content': '#A6ADBB',
        'surface-100': '#1d232a',
        'surface-200': '#191e24',
        'surface-300': '#15191e',
        'surface-content': '#A6ADBB',
        info: '#0091D5',
        success: '#6BB187',
        warning: '#DBAE59',
        danger: '#AC3E31',
        'info-content': '#00ffff',
        'success-content': '#00ffff',
        'warning-content': '#000000',
        'danger-content': '#00ffff'
      },
      emerald: {
        // Daisy "emerald"
        'color-scheme': 'light',
        primary: 'hsl(141.1765 50% 60%)',
        secondary: 'hsl(218.8776 96.0784% 60%)',
        accent: 'hsl(10.4895 88.8199% 68.4314%)',
        neutral: 'hsl(219.2308 20.3125% 25.098%)',
        'surface-100': 'hsl(180 100% 100%)',
        info: '#0091D5',
        success: '#6BB187',
        warning: '#DBAE59',
        danger: '#AC3E31',
        'info-content': '#00ffff',
        'success-content': '#00ffff',
        'warning-content': '#000000',
        'danger-content': '#00ffff'
      },
      forest: {
        // Daisy "forest"
        // TODO: (when needed) Would be nice to have forest-light and this forest-dark themes to complement each other. Keep the AppBar color scheme, just swap the backgound/text colors?
        'color-scheme': 'dark',
        primary: 'hsl(141.039 71.9626% 41.9608%)',
        secondary: 'hsl(163.7419 72.77% 41.7647%)',
        accent: 'hsl(174.9677 72.77% 41.7647%)',
        neutral: 'hsl(161.3793 36.7089% 15.4902%)',
        'surface-100': 'hsl(0 12.1951% 8.0392%)',
        info: '#0091D5',
        success: '#6BB187',
        warning: '#DBAE59',
        danger: '#AC3E31',
        'info-content': '#00ffff',
        'success-content': '#00ffff',
        'warning-content': '#000000',
        'danger-content': '#00ffff'
      },

      'hamlindigo-light': {
        // Skeleton "hamlindigo"
        'color-scheme': 'light',
        primary: 'hsl(221.9178 72.2772% 80.1961%)',
        secondary: 'hsl(41.9178 28.6275% 50%)',
        accent: 'hsl(190.9091 26.4% 50.9804%)',
        'surface-100': 'hsl(226.6667 24.3243% 92.7451%)',
        'surface-200': 'hsl(221.5385 26.5306% 90.3922%)',
        'surface-300': 'hsl(221.25 25.8065% 87.8431%)',
        info: '#0091D5',
        success: '#6BB187',
        warning: '#DBAE59',
        danger: '#AC3E31',
        'info-content': '#00ffff',
        'success-content': '#00ffff',
        'warning-content': '#000000',
        'danger-content': '#00ffff'
      },
      'hamlindigo-dark': {
        // Skeleton "hamlindigo-dark"
        'color-scheme': 'dark',
        primary: 'hsl(221.9178 72.2772% 80.1961%)',
        secondary: 'hsl(41.9178 28.6275% 50%)',
        accent: 'hsl(190.9091 26.4% 50.9804%)',
        'surface-100': 'hsl(221.25 24.4898% 38.4314%)',
        'surface-200': 'hsl(221.5385 24.8408% 30.7843%)',
        'surface-300': 'hsl(222.5806 24.031% 25.2941%)',
        info: '#0091D5',
        success: '#6BB187',
        warning: '#DBAE59',
        danger: '#AC3E31',
        'info-content': '#00ffff',
        'success-content': '#00ffff',
        'warning-content': '#000000',
        'danger-content': '#00ffff'
      }
    }
  },

  plugins: [
    svelteUx // uses hsl() color space by default. To use oklch(), use: svelteUx({ colorSpace: 'oklch' }),
  ]
};
