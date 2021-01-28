/* eslint-disable no-undef */
import Vue from 'vue/dist/vue.esm'

import '../stylesheets/calendar'

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('#form-container')) {
    new Vue({
      el: '#form-container',
      components: {
        CalendarDonationForm: require('../vue/components/calendar_donation_form.vue').default,
      },
    })
  }
})