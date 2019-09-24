import Vue from 'vue/dist/vue.esm';
import PaymentUserList from '../payment_user_list.vue';
import RecentPayments from '../recent_payments.vue';
import DifferentialChart from '../differential_chart.vue';
import UpcomingPayments from '../upcoming_payments.vue';
import BurndownChart from '../burndown_chart.vue';
import Utilities from './utilities';
import Toast from './toast';

document.addEventListener('DOMContentLoaded', () => {
  const vue = new Vue({
    el: '#main-content',
    data: {
      users: [],
      payments: [],
      schedules: []
    },
    components: {
      PaymentUserList,
      RecentPayments,
      DifferentialChart,
      UpcomingPayments,
      BurndownChart
    },
    mounted: function() {
      this.getUsers();
      this.getPayments();
      this.getPaymentSchedules();
    },
    methods: {
      getUsers() {
        const self = this;
        $.getJSON('/admin/users?user_type=member', {
          jwt: Utilities.getJWT()
        })
          .done(function(response) {
            self.users = response.users;
          })
          .fail(function(err) {
            self.error = err;
            Toast.showToast('Whoops!', 'An error occurred getting user info', 'danger');
            console.log(err);
          });
      },
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
