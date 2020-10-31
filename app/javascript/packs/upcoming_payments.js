import Vue from 'vue/dist/vue.esm'
import UpcomingPayments from '../vue/upcoming_payments.vue'

document.addEventListener('DOMContentLoaded', () => {
  new Vue({
    el: '#upcoming-payments',
    components: { UpcomingPayments },
    data: {},
  })
})
