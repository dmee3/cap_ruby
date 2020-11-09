<template>
  <div class="card">
    <div
      class="card-header d-flex w-100 justify-content-between align-items-center"
    >
      <h4 class="mb-0">{{ header }}</h4>
    </div>
    <ul class="list-group list-group-flush">
      <li
        v-for="user in users"
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
                class="btn btn-outline-secondary btn-xs"
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
                <a class="dropdown-item" :href="`/admin/users/${user.id}`"
                  >View Details</a
                >
                <a
                  class="dropdown-item"
                  :href="`/admin/users/${user.id}/edit`"
                  >Edit Info</a
                >
                <a
                  class="dropdown-item"
                  :href="`/admin/payment_schedules/${user.payment_schedule_id}`"
                  >Edit Payment Schedule</a
                >
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
        <h5 v-else>{{ user.first_name + ' ' + user.last_name }}</h5>
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
  },
  methods: {
    showDeleteModal(user, event) {
      event.preventDefault()
      this.$emit('delete-user', user)
    },
  },
}
</script>
