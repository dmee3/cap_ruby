<template>
  <div class="card">
    <div class="card-header d-flex justify-content-between">
      <h5>Payment Schedule</h5>
      <a v-bind:href="`/admin/payment_schedules/${scheduleId}`">
        <i class="fas fa-edit icon-btn icon-btn-orange dark-text"></i>
      </a>
    </div>
    <ul class="list-group list-group-flush">
      <li
        v-for="entry in schedule"
        v-bind:key="entry.pay_date"
        class="list-group-item d-flex justify-content-between"
      >
        <span v-bind:class="dateInThePast(entry.pay_date)">{{
          formatMoney(entry.amount)
        }}</span>
        <small class="text-muted">{{ formatDate(entry.pay_date) }}</small>
      </li>
    </ul>
  </div>
</template>

<script>
import moment from 'moment/moment'

export default {
  data: () => ({}),
  props: ['schedule', 'scheduleId'],
  methods: {
    formatMoney(number) {
      return (number / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })
    },
    formatDate(date) {
      return moment(date).format('MMM Do, YYYY')
    },
    dateInThePast(date) {
      if (moment(date).isBefore(moment())) {
        return 'text-muted'
      } else {
        return ''
      }
    },
  },
}
</script>
