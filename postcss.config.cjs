/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: [
    require('postcss-import'), // Process @import

    // Choose one:
    // require('tailwindcss/nesting'), // Use 'postcss-nested' by default for sass syntax nesting
    require('tailwindcss/nesting')('postcss-nesting'), // 'postcss-nesting' for CSS Nesting Specification https://www.w3.org/TR/css-nesting-1/

    require('tailwindcss'), // order is important!
    require('autoprefixer')
  ]
};

module.exports = config;
