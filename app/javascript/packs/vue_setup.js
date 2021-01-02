/* eslint-disable no-undef */
import Vue from 'vue/dist/vue.esm'

document.addEventListener('DOMContentLoaded', () => {

  /*
   * Pages
   */
  if (document.querySelector('#rhythm-converter')) {
    new Vue({
      el: '#rhythm-converter',
      components: {
        RhythmConverter: require('../vue/pages/rhythm_converter.vue').default,
      },
    })
  }

  if (document.querySelector('#admin-conflicts-index')) {
    new Vue({
      el: '#admin-conflicts-index',
      components: {
        AdminConflictsIndex: require('../vue/pages/admin/conflicts_index.vue').default,
      },
    })
  }

  if (document.querySelector('#admin-payments-index')) {
    new Vue({
      el: '#admin-payments-index',
      components: {
        AdminPaymentsIndex: require('../vue/pages/admin/payments_index.vue').default,
      },
    })
  }

  if (document.querySelector('#admin-users-index')) {
    new Vue({
      el: '#admin-users-index',
      components: {
        AdminUsersIndex: require('../vue/pages/admin/users_index.vue').default,
      },
    })
  }

  /*
   * Components
   */
  if (document.querySelector('#omni-bar')) {
    new Vue({
      el: '#omni-bar',
      components: {
        OmniBar: require('../vue/components/omni_bar.vue').default
      },
    })
  }

  if (document.querySelector('#payment-schedule')) {
    new Vue({
      el: '#payment-schedule',
      components: {
        PaymentSchedule: require('../vue/components/payment_schedule.vue').default
      },
    })
  }
})