/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: [
    require('postcss-import'), // Process @import
    require('postcss-nesting'), // For CSS Nesting Specification https://www.w3.org/TR/css-nesting-1/
    require('autoprefixer')
    //  require('postcss-nested'), // For sass syntax nesting
  ]
};

module.exports = config;
