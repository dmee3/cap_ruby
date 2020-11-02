<template>
  <div class="card">
    <div
      class="card-header d-flex w-100 justify-content-between align-items-center"
    >
      <h4 class="mb-0">{{ header }}</h4>
      <div class="form-inline">
        <div class="input-group mt-1">
          <div class="input-group-prepend">
            <span class="input-group-text"><i class="fas fa-sort"></i></span>
          </div>
          <select
            id="order"
            v-model="selectedSort"
            class="custom-select custom-select-sm form-control secondary"
            @change="sort"
          >
            <option
              v-for="field in sortOptions"
              :key="field"
              :value="field"
            >
              {{ field }}
            </option>
          </select>
        </div>
      </div>
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

    <div
      v-if="userType == 'member'"
      id="delete-modal"
      class="modal"
      tabindex="-1"
      role="dialog"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Delete
              {{ userToDelete.first_name + ' ' + userToDelete.last_name }}
            </h5>
            <button
              type="button"
              class="close"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p class="lead text-center">Are you sure?</p>
          </div>
          <div id="delete-form" class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-dismiss="modal"
            >
              Cancel
            </button>
            <input
              type="submit"
              value="Delete"
              class="btn btn-danger"
              data-dismiss="modal"
              @click="deleteUser()"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Utilities from '../../packs/utilities'
import Toast from '../../packs/toast'
// eslint-disable-next-line no-unused-vars
import modal from 'bootstrap/js/dist/modal'

export default {
  props: {
    userType: {
      type: String,
      required: true,
    },
  },
  data: function () {
    return {
      userToDelete: '',
      users: [],
      sortOptions: ['First', 'Last', 'Section'],
      selectedSort: 'First',
      error: [],
    }
  },
  computed: {
    header: function () {
      if (this.userType == 'admin') {
        return 'Admins'
      } else {
        return 'Members'
      }
    },
  },
  mounted: function () {
    this.getUserList()
  },
  methods: {
    deleteUser() {
      const self = this
      $.ajax({
        url: `/admin/users/${self.userToDelete.id}`,
        type: 'DELETE',
        data: {
          jwt: Utilities.getJWT(),
          authenticity_token: Utilities.getAuthToken(),
        },
      })
        .done(function () {
          Toast.showToast(
            'Success!',
            `${self.userToDelete.first_name} was deleted.`,
            'success'
          )
          self.getUserList()
        })
        .fail(function () {
          Toast.showToast(
            'Whoops!',
            `Unable to delete ${self.userToDelete.first_name}.`,
            'danger'
          )
        })
    },
    getUserList() {
      const self = this
      $.getJSON(`/admin/users?user_type=${this.userType}`, {
        jwt: Utilities.getJWT(),
      })
        .done(function (response) {
          self.users = response.users
          self.sort()
        })
        .fail(function (err) {
          self.error = err
          Toast.showToast(
            'Whoops!',
            `An error occurred getting user info`,
            'danger'
          )
          console.log(err)
        })
    },
    showDeleteModal(user, event) {
      event.preventDefault()
      this.userToDelete = user
      $('#delete-modal').modal('show')
    },
    sort: function () {
      switch (this.selectedSort) {
        case 'First':
          this.users.sort((a, b) => {
            if (a.first_name < b.first_name) return -1
            if (a.first_name > b.first_name) return 1
            return 0
          })
          break

        case 'Last':
          this.users.sort((a, b) => {
            if (a.last_name < b.last_name) return -1
            if (a.last_name > b.last_name) return 1
            return 0
          })
          break

        default:
          this.users.sort((a, b) => {
            if (a.section < b.section) return -1
            if (a.section > b.section) return 1
            return 0
          })
          break
      }
    },
  },
}
</script>
