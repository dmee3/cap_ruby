import Vue from 'vue/dist/vue.esm'
import UserList from '../user_list.vue'

document.addEventListener('DOMContentLoaded', () => {
  const user_list = new Vue({
    el: '#member-list',
    data: {},
    components: { UserList }
  });
  const admin_list = new Vue({
    el: '#admin-list',
    data: {},
    components: { UserList }
  })
});
