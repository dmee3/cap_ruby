<template>
  <div class="card">
    <div class="card-header">
      <h4 class="mb-0">Behind Members</h4>
    </div>
    <ul class="list-group list-group-flush">
      <li v-for="member in members" v-bind:key="member.id" class="list-group-item list-group-item-striped">
        {{ member.name }}
        <small class="text-secondary">(${{ -1 * (member.paid - member.owed) }})</small>
        <small class="float-right text-danger">${{ member.paid }} / ${{ member.owed }}</small>
      </li>
    </ul>
  </div>
</template>

<script>
import Utilities from './packs/utilities';
import Toast from './packs/toast';

export default {
  data: function() {
    return {
      members: {},
      error: []
    }
  },
  mounted: function() {
    const self = this;
    $.getJSON('/admin/payments/behind-members', { jwt: Utilities.getJWT() })
      .done(function(response) {
        self.members = response.members;
      })
      .fail(function(err) {
        self.error = err;
        Toast.showToast('Whoops!', `Unable to get details on behind members.`, 'danger');
        console.log(err);
      });
  }
}
</script>