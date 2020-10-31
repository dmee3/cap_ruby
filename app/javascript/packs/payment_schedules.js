import Vue from 'vue/dist/vue.esm'
import PaymentSchedules from '../vue/payment_schedules.vue'

document.addEventListener('DOMContentLoaded', () => {
  const payment_schedules = new Vue({
    el: '#payment-schedule',
    data: {},
    props: {
      scheduleId: Number,
      userName: String,
    },
    components: { PaymentSchedules },
  })
})
