<template>
  <div>
    <div class="card-body">
      <h4 class="card-title">
        Recent Payments<small
          v-if="this.payments.length > 0"
          class="text-muted"
        >
          (${{ this.totalPaid }})</small
        >
      </h4>
      <div class="form row">
        <div class="input-group col-12">
          <div class="input-group-prepend">
            <span class="input-group-text">Start</span>
          </div>
          <input
            v-model="start_date"
            type="date"
            class="form-control"
            name="start_date"
          />
          <div class="input-group-prepend">
            <span class="input-group-text">End</span>
          </div>
          <input
            v-model="end_date"
            type="date"
            class="form-control"
            name="end_date"
          />
          <div class="input-group-append">
            <a v-on:click="filter" class="btn btn-info white-text">Filter</a>
          </div>
        </div>
      </div>
    </div>
    <ul class="list-group list-group-flush">
      <li
        v-for="payment in payments"
        v-bind:key="payment.id"
        class="list-group-item"
      >
        <span class="text-success">${{ payment.amount }}</span>
        {{ payment.name }}
        <small class="text-muted"> ({{ payment.payment_type }})</small>
        <small class="text-muted float-right">{{ payment.date_paid }}</small>
      </li>
    </ul>
  </div>
</template>

<script>
import Utilities from '../packs/utilities'
import moment from 'moment/moment'
import Toast from '../packs/toast'

export default {
  data: () => ({
    payments: [],
    error: [],
    start_date: moment().subtract(1, 'week').format('YYYY-MM-DD'),
    end_date: moment().format('YYYY-MM-DD'),
  }),
  computed: {
    totalPaid: function () {
      return this.payments.reduce((sum, payment) => {
        return sum + payment.amount
      }, 0)
    },
  },
  mounted: function () {
    this.filter()
  },
  methods: {
    filter: function (event) {
      const self = this
      $.getJSON('/admin/payments/recent', {
        jwt: Utilities.getJWT(),
        start_date: self.start_date,
        end_date: self.end_date,
      })
        .done((response) => {
          self.payments = response.payments
        })
        .fail((err) => {
          self.error = err
          Toast.showToast(
            'Whoops!',
            `Unable to get details about recent payments.`,
            'danger'
          )
          console.log(err)
        })
    },
  },
}
</script>
