<template>
  <div class="card">
    <div class="card-body">
      <h4 class="card-title">Upcoming Conflicts</h4>

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
        v-for="conflict in displayedConflicts"
        :key="conflict.id"
        class="list-group-item"
      >
        <i
          v-if="conflict.status.name == 'Approved'"
          class="far fa-check-circle text-success"
        ></i>
        <i
          v-if="conflict.status.name == 'Pending'"
          class="far fa-clock text-warning"
        ></i>
        <i
          v-if="conflict.status.name == 'Denied'"
          class="far fa-times-circle text-danger"
        ></i>
        <i
          v-if="conflict.status.name == 'Resolved'"
          class="far fa-dot-circle text-secondary"
        ></i>
        {{ conflict.name }}
        <span class="float-right text-muted">
          <small
            >{{ conflict.start_date.format('M/D h:mm a') }} -
            {{ conflict.end_date.format('M/D h:mm a') }}</small
          >
        </span>
      </li>
    </ul>
  </div>
</template>

<script>
import Utilities from '../../packs/utilities'
import moment from 'moment/moment'

export default {
  data: () => ({
    conflicts: [],
    displayedConflicts: [],
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
    this.getConflicts()
  },
  methods: {
    getConflicts: function () {
      const self = this
      $.getJSON('/admin/conflicts?time_range=future', {
        jwt: Utilities.getJWT(),
      })
        .done((response) => {
          self.conflicts = response.conflicts
            .map((c) => ({
              id: c.id,
              name: c.name,
              reason: c.reason,
              status: c.status,
              created_at: moment(c.created_at),
              start_date: moment(c.start_date),
              end_date: moment(c.end_date),
            }))
            .sort((a, b) => {
              if (a.start_date.isBefore(b.start_date)) {
                return -1
              } else if (a.start_date.isSame(b.start_date)) {
                return 0
              } else {
                return 1
              }
            })
          self.filter()
        })
        .fail((err) => {
          self.error = err
          // Toast.failToast('Unable to get details about upcoming conflicts')
          console.log(err)
        })
    },
    filter: function () {
      this.displayedConflicts = this.conflicts.filter((c) => {
        return (
          c.start_date.isSameOrAfter(this.start_date) &&
          c.start_date.isSameOrBefore(this.end_date)
        )
      })
    },
  },
}
</script>
