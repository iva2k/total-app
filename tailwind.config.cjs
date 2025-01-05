const konstaConfig = require('konsta/config');

module.exports = konstaConfig(
  /** @type {import('tailwindcss').Config} */
  {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    darkMode: 'class',
    theme: {
      extend: {}
    },
    plugins: []
  }
);
