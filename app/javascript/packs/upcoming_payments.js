import Vue from 'vue/dist/vue.esm'
import UpcomingPayments from '../upcoming_payments.vue';

document.addEventListener('DOMContentLoaded', () => {
  const upcoming_payments = new Vue({
    el: '#upcoming-payments',
    data: {},
    components: { UpcomingPayments }
  })
})