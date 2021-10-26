<template>
  <div>
    <div class="card-body">
      <h4 class="card-title">Upcoming Payments</h4>

      <div class="form row">
        <div class="input-group col-12">
          <div class="input-group-prepend">
            <span class="input-group-text">Start</span>
          </div>
          <input
            v-model="start_date"
            type="date"
            class="form-control flatpickr"
            name="start_date"
          />
          <div class="input-group-prepend">
            <span class="input-group-text">End</span>
          </div>
          <input
            v-model="end_date"
            type="date"
            class="form-control flatpickr"
            name="end_date"
          />
        </div>
      </div>
    </div>
    <ul class="list-group list-group-flush">
      <li
        v-for="entry in entries"
        :key="entry.id"
        class="list-group-item"
      >
        <span class="text-success">${{ entry.amount }}</span> {{ entry.name }}
        <small class="text-muted float-right">{{ entry.pay_date }}</small>
      </li>
    </ul>
  </div>
</template>

<script>
import Utilities from '../../packs/utilities'
import moment from 'moment/moment'

export default {
  data: () => ({
    entries: {},
    error: [],
    start_date: moment().format('YYYY-MM-DD'),
    end_date: moment().add(2, 'weeks').format('YYYY-MM-DD'),
  }),
  watch: {
    start_date: function() {
      this.filter()
    },
    end_date: function() {
      this.filter()
    },
  },
  mounted: function () {
    this.filter()
  },
  methods: {
    filter() {
      const self = this
      $.getJSON('/admin/payments/upcoming', {
        jwt: Utilities.getJWT(),
        start_date: self.start_date,
        end_date: self.end_date,
      })
        .done((response) => {
          self.entries = response.payments.sort((a, b) => {
            if (a.name > b.name) {
              return 1
            } else {
              return -1
            }
          })
        })
        .fail((err) => {
          self.error = err
          // Toast.failToast('Unable to get details about upcoming payments')
          console.log(err)
        })
    },
  },
}
</script>
