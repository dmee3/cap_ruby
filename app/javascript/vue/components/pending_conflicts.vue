<template>
  <div v-if="conflicts.length > 0" class="card mb-4">
    <h4 class="card-header">Pending Conflicts</h4>
    <ul class="list-group list-group-flush">
      <li
        v-for="conflict in pendingConflicts"
        :key="conflict.id"
        class="list-group-item list-group-item-action"
      >
        <div class="row">
          <div class="col-md-3">
            {{ conflict.name }}
          </div>
          <div class="col-md-3 col-lg-5">
            <span class="font-weight-light">
              {{ displayDateTime(conflict.start_date) }} -
              {{ displayDateTime(conflict.end_date) }}
            </span>
          </div>
          <div class="col-md-1">
            <a
              data-toggle="collapse"
              :href="`#conflict-reason-${conflict.id}`"
            >
              <i class="far fa-comment dark-text icon-btn icon-btn-blue"></i>
            </a>
          </div>
          <div class="col-md-5 col-lg-3">
            <div
              class="form-inline d-flex justify-content-between"
              method="post"
            >
              <select v-model="conflict.status.id" class="form-control w-50">
                <option
                  v-for="status in statuses"
                  :key="status.name"
                  :value="status.id"
                >
                  {{ status.name }}
                </option>
              </select>
              <button class="btn btn-success w-40" @click="update(conflict)">
                Update
              </button>
            </div>
          </div>
        </div>
        <div
          :id="`conflict-reason-${conflict.id}`"
          class="px-3 collapse py-1"
        >
          <small class="text-muted">
            {{ conflict.reason }}
            <span class="dark-text"
              >(Submitted: {{ displayDateTime(conflict.created_at) }})</span
            >
          </small>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import Utilities from '../../packs/utilities'
import Toast from '../../packs/toast'

export default {
  props: {
    conflicts: {
      type: Array,
      required: true,
    },
  },
  data: function () {
    return {
      statuses: [],
      error: [],
    }
  },
  computed: {
    pendingConflicts: function () {
      return this.conflicts.filter((c) => {
        return c.status.name === 'Pending'
      })
    },
  },
  mounted: function () {
    this.getConflictStatuses()
  },
  methods: {
    displayDateTime: function (date) {
      return Utilities.displayDateTime(date)
    },
    getConflictStatuses: function () {
      const self = this
      $.getJSON('/admin/conflicts/statuses', { jwt: Utilities.getJWT() })
        .done((response) => {
          self.statuses = response.statuses
        })
        .fail((err) => {
          self.error = err
          Toast.showToast(
            'Whoops!',
            'An error occurred getting conflict statuses',
            'danger'
          )
          console.log(err)
        })
    },
    update: function (conflict) {
      const newStatus = this.statuses.find((status) => {
        return status.id == conflict.status.id
      })
      const self = this
      $.ajax({
        url: `/admin/conflicts/${conflict.id}`,
        type: 'PUT',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
          conflict: { id: conflict.id, status_id: conflict.status.id },
          jwt: Utilities.getJWT(),
          authenticity_token: Utilities.getAuthToken(),
        }),
      })
        .done(() => {
          Toast.showToast(
            'Success!',
            `Conflict for ${conflict.name} marked as ${newStatus.name}.`,
            'success'
          )
          self.$emit('conflict-changed')
        })
        .fail((err) => {
          Toast.showToast(
            'Whoops!',
            `Unable to update conflict for ${conflict.name}.`,
            'danger'
          )
          console.log(err)
        })
    },
  },
}
</script>
