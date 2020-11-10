<template>
  <div>
    <div class="row">
      <div class="col-12 text-right mb-3">
        <a href="/admin/users/new" class="btn btn-light mt-1 ml-3">
          <span class="d-none d-sm-inline">New User</span>
          <span class="d-sm-none"><i class="fas fa-plus"></i></span>
        </a>
      </div>
    </div>
    <div class="row mt-1 mt-sm-0">
      <div v-for="(ensemble, index) in ensembles" :key="`ensemble-${index}`" class="col">
        <user-list user-type="member" :ensemble="ensemble" :users="membersIn(ensemble)" @show-delete="showDelete"></user-list>
      </div>
    </div>
    <div class="row mt-3">
      <div class="col-12">
        <user-list user-type="admin" :users="admins"></user-list>
      </div>
    </div>

    <div
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
              @click="deleteMember()"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Toast from '../../../packs/toast'
import Utilities from '../../../packs/utilities'
import UserList from '../../components/user_list.vue'

export default {
  components: {
    UserList,
  },
  data: () => ({
    admins: [],
    ensembles: [],
    members: [],
    userToDelete: {},
  }),
  mounted: function () {
    this.getMembers()
    this.getAdmins()
  },
  methods: {
    getMembers() {
      const self = this
      $.getJSON(`/admin/users?user_type=member`, {
        jwt: Utilities.getJWT(),
      })
        .done(function (response) {
          self.members = response.users
          self.ensembles = [...new Set(self.members.map(u => u.ensemble))]
        })
        .fail(function (err) {
          self.error = err
          Toast.showToast(
            'Whoops!',
            'An error occurred getting user info',
            'danger'
          )
          console.log(err)
        })
    },
    getAdmins() {
      const self = this
      $.getJSON(`/admin/users?user_type=admin`, {
        jwt: Utilities.getJWT(),
      })
        .done(function (response) {
          self.admins = response.users
        })
        .fail(function (err) {
          self.error = err
          Toast.showToast(
            'Whoops!',
            'An error occurred getting user info',
            'danger'
          )
          console.log(err)
        })
    },
    membersIn(ensemble) {
      return this.members.filter(u => u.ensemble == ensemble)
    },
    showDelete(user) {
      this.userToDelete = user
      $('#delete-modal').modal('show')
    },
    deleteMember() {
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
          self.members = self.members.filter(u => u.id !== self.userToDelete.id)
          self.userToDelete = {}
        })
        .fail(function () {
          Toast.showToast(
            'Whoops!',
            `Unable to delete ${self.userToDelete.first_name}.`,
            'danger'
          )
        })
    },
  },
}
</script>