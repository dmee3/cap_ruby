<template>
  <div>
    <payment-user-list :users="users" :payments="payments" :schedules="schedules"></payment-user-list>
  </div>
</template>

<script>
import Utilities from '../../../utilities/utilities'
import PaymentUserList from '../../components/payment_user_list.vue'

export default {
  components: {
    PaymentUserList,
  },
  data: () => ({
    users: [],
    payments: [],
    schedules: [],
  }),
  mounted: function () {
    this.getUsers()
    this.getPayments()
    this.getPaymentSchedules()
  },
  methods: {
    getUsers() {
      const self = this
      $.getJSON('/admin/users?user_type=member', {
        jwt: Utilities.getJWT(),
      })
        .done(function (response) {
          self.users = response.users
        })
        .fail(function (err) {
          self.error = err
          // Toast.failToast('An error occurred getting user info')
          console.log(err)
        })
    },
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
          // Toast.failToast('An error occurred getting payment info')
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
          // Toast.failToast('An error occurred getting payment info')
          console.log(err)
        })
    },
  },
}
</script>