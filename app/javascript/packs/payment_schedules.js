import Vue from 'vue/dist/vue.esm'
import PaymentSchedules from '../vue/payment_schedules.vue'

document.addEventListener('DOMContentLoaded', () => {
  new Vue({
    el: '#payment-schedule',
    components: { PaymentSchedules },
    props: {
      scheduleId: {
        type: Number,
        required: true
      },
      userName: {
        type: String,
        required: true
      },
    },
    data: {},
  })
})
