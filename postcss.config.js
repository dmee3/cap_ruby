/* eslint-disable no-undef */
module.exports = {
  plugins: [
    // Must run first so @import "./buttons" etc. in application.css are inlined
    // before Tailwind processes @layer / @apply.
    require('postcss-import'),
    require('tailwindcss'),
    require('autoprefixer'),
  ],
}
