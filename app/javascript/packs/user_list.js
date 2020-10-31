import Vue from 'vue/dist/vue.esm'
import UserList from '../vue/user_list.vue'

document.addEventListener('DOMContentLoaded', () => {
  // Member list
  new Vue({
    el: '#member-list',
    components: { UserList },
    data: {},
  })

  // Admin list
  new Vue({
    el: '#admin-list',
    components: { UserList },
    data: {},
  })
})
