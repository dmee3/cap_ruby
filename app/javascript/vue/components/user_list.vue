<template>
  <div class="card">
    <div
      class="card-header d-flex w-100 justify-content-between align-items-center"
    >
      <h4 class="mb-0">{{ header }}</h4>
      <div v-if="userType == 'member'" class="form-inline">
        <div class="input-group mt-1">
          <div class="input-group-prepend">
            <span class="input-group-text"><i class="fas fa-sort"></i></span>
          </div>
          <select id="order" v-model="selectedSort" class="custom-select custom-select-sm form-control secondary">
            <option v-for="field in sortOptions" :key="field" :value="field">{{ field }}</option>
          </select>
        </div>
      </div>
    </div>
    <ul class="list-group list-group-flush">
      <li
        v-for="user in sortedUsers"
        :key="user.id"
        class="list-group-item list-group-item-action"
      >
        <a
          v-if="userType == 'member'"
          :href="`/admin/users/${user.id}`"
          class="d-flex w-100 justify-content-between"
        >
          <span class="text-body"
            >{{ user.first_name + ' ' + user.last_name }}
            <small class="text-muted">{{ user.section }}</small></span
          >
          <span class="float-right">
            <div class="dropdown">
              <button
                :id="`dropdown-${user.id}`"
                class="btn btn-outline-secondary btn-sm"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <i class="fas fa-ellipsis-h"></i>
              </button>
              <div
                class="dropdown-menu dropdown-menu-right"
                :aria-labelledby="`dropdown-${user.id}`"
              >
                <a class="dropdown-item" :href="`/admin/users/${user.id}`">
                  View Details
                </a>
                <a
                  class="dropdown-item"
                  :href="`/admin/users/${user.id}/edit`"
                >
                  Edit Info
                </a>
                <a
                  class="dropdown-item"
                  :href="`/admin/payment_schedules/${user.payment_schedule_id}`"
                >
                  Edit Payment Schedule
                </a>
                <div
                  class="text-danger dropdown-item"
                  @click="showDeleteModal(user, $event)"
                >
                  Delete User
                </div>
              </div>
            </div>
          </span>
        </a>
        <template v-else>{{ user.first_name + ' ' + user.last_name }}</template>
      </li>
    </ul>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import modal from 'bootstrap/js/dist/modal'

export default {
  props: {
    users: {
      type: Array,
      required: true,
    },
    userType: {
      type: String,
      required: true,
    },
    ensemble: {
      type: String,
      required: false,
      default: '',
    },
  },
  data: function () {
    return {
      userToDelete: {},
      error: [],
      sortOptions: ['First', 'Last', 'Section'],
      selectedSort: 'First',
    }
  },
  computed: {
    header: function () {
      if (this.ensemble !== '') {
        return this.ensemble
      }
      if (this.userType == 'admin') {
        return 'Admins'
      } else {
        return 'Members'
      }
    },
    sortedUsers: function () {
      const self = this
      function compare(a, b) {
        switch (self.selectedSort) {
          case 'First':
            if (a.first_name < b.first_name) return -1
            if (a.first_name > b.first_name) return 1
            return 0
          case 'Last':
            if (a.last_name < b.last_name) return -1
            if (a.last_name > b.last_name) return 1
            return 0
          default:
            if (a.section < b.section) return -1
            if (a.section > b.section) return 1
            return 0
        }
      }

      return this.users.slice().sort(compare)
    },
  },
  methods: {
    showDeleteModal(user, event) {
      event.preventDefault()
      this.$emit('show-delete', user)
    },
  },
}
</script>
