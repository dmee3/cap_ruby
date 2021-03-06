const { environment } = require('@rails/webpacker')
const { VueLoaderPlugin } = require('vue-loader')
const css = require('./loaders/css')
const vue = require('./loaders/vue')
const webpack = require('webpack')

environment.loaders.prepend('css', css)
environment.plugins.prepend('VueLoaderPlugin', new VueLoaderPlugin())
environment.loaders.prepend('vue', vue)

environment.plugins.prepend(
  'Provide',
  new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery: 'jquery',
    Popper: ['popper.js', 'default']
  })
)

environment.config.merge({
  resolve: {
    alias: {
      jquery: 'jquery'
    }
  }
});

module.exports = environment
