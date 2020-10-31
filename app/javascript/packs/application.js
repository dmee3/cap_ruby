/* eslint no-console:0 */
// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.
//
// To reference this file, add <%= javascript_pack_tag 'application' %> to the appropriate
// layout file, like app/views/layouts/application.html.erb

// Uncomment to copy all static images under ../images to the output folder and reference
// them with the image_pack_tag helper in views (e.g <%= image_pack_tag 'rails.png' %>)
// or the `imagePath` JavaScript helper below.
//
// const images = require.context('../images', true)
// const imagePath = (name) => images(name, true)

import 'core-js/stable'
import 'regenerator-runtime/runtime'
import 'bootstrap'
import { library, dom } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import 'select2'
import flatpickr from 'flatpickr'
require('flatpickr/dist/flatpickr.min.css') // Needed for now to get CSS

// Require all images
require.context('../images', true)

// Styles
import '../stylesheets/application'

library.add(fas, far, fab)

// Kicks off the process of finding <i> tags and replacing with <svg>
dom.watch()

jQuery(() => {
  $(() => {
    $('.select2-enable').select2({ width: '100%' })
  })

  // Hack to fix select2 tab order
  $('select').on('select2:select', function () {
    $(this).focus()
  })

  flatpickr('.flatpickr', {
    altInput: true,
    altFormat: 'F j, Y',
    dateFormat: 'Y-m-d',
  })

  flatpickr('.flatpickr-dt', {
    altInput: true,
    altFormat: 'F j, Y h:i K',
    dateFormat: 'Y-m-d H:i:00 \\UTC-05:00',
    enableTime: true,
  })
})
