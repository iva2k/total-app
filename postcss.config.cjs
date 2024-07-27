/** @type {import('postcss-load-config').Config} */
const config = {
<<<<<<< HEAD
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {}
  }
=======
  plugins: [
    require('postcss-import'), // Process @import
    require('postcss-nesting'), // For CSS Nesting Specification https://www.w3.org/TR/css-nesting-1/
    require('autoprefixer')
    //  require('postcss-nested'), // For sass syntax nesting
  ]
>>>>>>> main
};

module.exports = config;
