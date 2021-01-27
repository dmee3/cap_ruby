/* eslint-disable no-undef */
import Vue from 'vue/dist/vue.esm'

import '../stylesheets/calendar'

document.addEventListener('DOMContentLoaded', () => {
  new Vue({
    el: '#form-container',
    components: {
      CalendarPicker: require('../vue/components/calendar_picker.vue').default,
    },
  })
})