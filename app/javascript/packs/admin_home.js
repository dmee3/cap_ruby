import Vue from 'vue/dist/vue.esm'
import BehindMembers from '../vue/components/behind_members.vue'
import DifferentialChart from '../vue/components/differential_chart.vue'
import UpcomingConflicts from '../vue/components/upcoming_conflicts.vue'
import UpcomingPayments from '../vue/components/upcoming_payments.vue'
import Utilities from './utilities'
import Toast from './toast'

document.addEventListener('DOMContentLoaded', () => {
  new Vue({
    el: '#main-content',
    components: {
      BehindMembers,
      DifferentialChart,
      UpcomingConflicts,
      UpcomingPayments,
    },
    data: {
      payments: [],
      schedules: [],
    },
    mounted: function () {
      this.getPayments()
      this.getPaymentSchedules()
    },
    methods: {
      getPayments() {
        const self = this
        $.getJSON('/admin/payments', {
          jwt: Utilities.getJWT(),
        })
          .done(function (response) {
            self.payments = response.payments
          })
          .fail(function (err) {
            self.error = err
            Toast.failToast('An error occurred getting payment info')
            console.log(err)
          })
      },
      getPaymentSchedules() {
        const self = this
        $.getJSON('/admin/payment_schedules', {
          jwt: Utilities.getJWT(),
        })
          .done(function (response) {
            self.schedules = response.schedules
          })
          .fail(function (err) {
            self.error = err
            Toast.failToast('An error occurred getting payment info')
            console.log(err)
          })
      },
    },
  })
})
