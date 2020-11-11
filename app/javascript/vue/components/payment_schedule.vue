<template>
  <div class="card">
    <div class="card-header">
      <h4 class="mb-0">Payment schedule for {{ userName }}</h4>
    </div>
    <ul class="list-group list-group-flush">
      <li
        v-for="(entry, index) in schedule.entries"
        :key="entry.id"
        class="list-group-item"
      >
        <div class="form-inline d-flex justify-content-between">
          <div class="input-group">
            <input v-model="entry.date" type="text" class="flatpickr form-control" />
          </div>

          <div class="input-group">
            <div class="input-group-prepend">
              <span class="input-group-text">$</span>
            </div>
            <input v-model="entry.amount" class="form-control" type="number" />
          </div>
          <span @click="removeEntry(entry.id, index)"
            ><i class="fas fa-trash icon-btn icon-btn-red dark-text"></i
          ></span>
        </div>
      </li>
    </ul>
    <div class="card-body">
      <div class="row text-center">
        <div class="col-12">
          <h4>
            <span class="text-muted font-weight-light">Total </span>${{
              schedule.entries.reduce(function (sum, e) {
                return sum + +e.amount
              }, 0)
            }}
          </h4>
        </div>
      </div>
      <div class="row mt-2 text-center">
        <div class="col-6">
          <div class="btn btn-info" @click="addEntry()">Add Entry</div>
        </div>
        <div class="col-6">
          <div class="btn btn-success" @click="saveSchedule()">Save</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Utilities from '../../packs/utilities'
import Toast from '../../packs/toast'
import Vue from 'vue/dist/vue.esm'
import flatpickr from 'flatpickr'

export default {
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
  data: () => {
    return {
      schedule: { entries: [] },
      error: [],
    }
  },
  mounted: function () {
    const self = this
    $.getJSON('/admin/payment_schedules/' + this.scheduleId, {
      jwt: Utilities.getJWT(),
    })
      .done(function (response) {
        self.schedule.id = response.id
        let entries = response.payment_schedule_entries.map((e) => ({
            date: e.pay_date,
            amount: e.amount / 100,
            id: e.id,
          })
        )
        self.schedule.entries = entries
        self.initializeFlatpickr()
      })
      .fail(function (err) {
        self.error = err
        console.log(err)
      })
  },
  methods: {
    addEntry: function () {
      const self = this
      $.ajax({
        url: '/admin/payment_schedules/add-entry',
        type: 'POST',
        data: {
          jwt: Utilities.getJWT(),
          authenticity_token: Utilities.getAuthToken(),
          payment_schedule_id: this.scheduleId,
        },
      })
        .done(function (response) {
          self.schedule.entries.push({
            date: response.pay_date,
            amount: response.amount / 100,
            id: response.id,
          })
          self.initializeFlatpickr()
        })
        .fail(function (err) {
          self.errors = err
          Toast.failToast("Couldn't add entry to payment schedule")
          console.log(err)
        })
    },
    removeEntry: function (id, index) {
      const self = this
      $.ajax({
        url: '/admin/payment_schedules/remove-entry',
        type: 'DELETE',
        data: {
          jwt: Utilities.getJWT(),
          authenticity_token: Utilities.getAuthToken(),
          id: id,
        },
      })
        .done(function () {
          self.schedule.entries.splice(index, 1)
        })
        .fail(function (err) {
          self.error = err
          Toast.failToast("Couldn't remove entry from payment schedule")
          console.log(err)
        })
    },
    saveSchedule: function () {
      const self = this
      let schedule = { id: this.scheduleId }
      schedule.payment_schedule_entries_attributes = this.schedule.entries.map(
        (e) => ({
          id: e.id,
          pay_date: e.date,
          amount: e.amount * 100,
        })
      )

      $.ajax({
        url: '/admin/payment_schedules/' + this.scheduleId,
        type: 'PUT',
        data: {
          jwt: Utilities.getJWT(),
          authenticity_token: Utilities.getAuthToken(),
          payment_schedule: schedule,
        },
      })
        .done(function () {
          Toast.successToast('Payment schedule saved')
        })
        .fail(function (err) {
          self.error = err
          Toast.failToast('Unable to save payment schedule')
          console.log(err)
        })
    },
    initializeFlatpickr: function () {
      Vue.nextTick().then(() => {
        flatpickr('.flatpickr', {
          altInput: true,
          altFormat: 'F j, Y',
          dateFormat: 'Y-m-d',
        })
      })
    },
  },
}
</script>
