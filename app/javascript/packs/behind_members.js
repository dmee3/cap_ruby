import Vue from 'vue/dist/vue.esm'
import BehindMembers from '../behind_members.vue'

document.addEventListener('DOMContentLoaded', () => {
  const behind_members = new Vue({
    el: '#behind-members',
    data: {},
    components: { BehindMembers }
  })
})