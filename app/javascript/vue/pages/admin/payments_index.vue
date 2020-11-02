<template>
  <div>
    <payment-user-list v-bind:users="users" v-bind:payments="payments" v-bind:schedules="schedules"></payment-user-list>
  </div>
</template>

<script>
import Utilities from '../../../packs/utilities'
import Toast from '../../../packs/toast'
import PaymentUserList from '../../components/payment_user_list.vue'

export default {
  data: () => ({
    users: [],
    payments: [],
    schedules: [],
  }),
  components: {
    PaymentUserList,
  },
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
          Toast.showToast(
            'Whoops!',
            'An error occurred getting user info',
            'danger'
          )
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
          Toast.showToast(
            'Whoops!',
            'An error occurred getting payment info',
            'danger'
          )
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
          Toast.showToast(
            'Whoops!',
            'An error occurred getting payment info',
            'danger'
          )
          console.log(err)
        })
    },
  },
}
</script>