<template>
  <div class="card">
    <div class="card-body">
      <h4 class="mb-0">Behind Members</h4>
    </div>
    <ul class="list-group list-group-flush">
      <a
        v-for="member in members"
        v-bind:key="member.id"
        v-bind:href="`/admin/users/${member.id}`"
        class="list-group-item list-group-item-action"
      >
        {{ member.name }}
        <small class="text-secondary"
          >(${{ member.owed - member.paid }} behind)</small
        >
        <small class="float-right text-danger"
          >${{ member.paid }} / ${{ member.owed }}</small
        >
      </a>
    </ul>
  </div>
</template>

<script>
import Utilities from '../packs/utilities'
import Toast from '../packs/toast'

export default {
  data: function () {
    return {
      members: {},
      error: [],
    }
  },
  mounted: function () {
    const self = this
    $.getJSON('/admin/payments/behind-members', { jwt: Utilities.getJWT() })
      .done(function (response) {
        self.members = response.members
      })
      .fail(function (err) {
        self.error = err
        Toast.showToast(
          'Whoops!',
          `Unable to get details on behind members.`,
          'danger'
        )
        console.log(err)
      })
  },
}
</script>
