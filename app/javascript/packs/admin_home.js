import Vue from 'vue/dist/vue.esm';
import BehindMembers from '../vue/behind_members.vue';
import DifferentialChart from '../vue/differential_chart.vue';
import UpcomingPayments from '../vue/upcoming_payments.vue';
import UpcomingConflicts from '../vue/upcoming_conflicts.vue';
import Utilities from './utilities';
import Toast from './toast';

document.addEventListener('DOMContentLoaded', () => {
  const vue = new Vue({
    el: '#main-content',
    data: {
      payments: [],
      schedules: []
    },
    components: {
      BehindMembers,
      DifferentialChart,
      UpcomingConflicts,
      UpcomingPayments
    },
    mounted: function() {
      this.getPayments();
      this.getPaymentSchedules();
    },
    methods: {
      getPayments() {
        const self = this;
        $.getJSON('/admin/payments', {
          jwt: Utilities.getJWT()
        })
          .done(function(response) {
            self.payments = response.payments;
          })
          .fail(function(err) {
            self.error = err;
            Toast.showToast('Whoops!', 'An error occurred getting payment info', 'danger');
            console.log(err);
          });
      },
      getPaymentSchedules() {
        const self = this;
        $.getJSON('/admin/payment_schedules', {
          jwt: Utilities.getJWT()
        })
          .done(function(response) {
            self.schedules = response.schedules;
          })
          .fail(function(err) {
            self.error = err;
            Toast.showToast('Whoops!', 'An error occurred getting payment info', 'danger');
            console.log(err);
          });
      }
    }
  });
});
