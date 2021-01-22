<template>
  <div class="card">
    <div class="card-header d-flex justify-content-between">
      <h5>Schedule</h5>
      <a :href="`/admin/payment_schedules/${scheduleId}`">
        <i class="fas fa-edit icon-btn icon-btn-orange dark-text"></i>
      </a>
    </div>
    <ul class="list-group list-group-flush">
      <li
        v-for="entry in schedule"
        :key="entry.pay_date"
        class="list-group-item d-flex justify-content-between"
      >
        <span :class="dateInThePast(entry.pay_date)">
          {{ formatMoney(entry.amount) }}
        </span>
        <small class="text-muted">{{ formatDate(entry.pay_date) }}</small>
      </li>
    </ul>
  </div>
</template>

<script>
import Utilities from '../../packs/utilities'
import moment from 'moment/moment'

export default {
  props: {
    schedule: {
      type: Array,
      required: true
    },
    scheduleId: {
      type: Number,
      required: true,
    },
  },
  data: () => ({}),
  methods: {
    formatMoney(amount) {
      return Utilities.formatMoney(amount)
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
