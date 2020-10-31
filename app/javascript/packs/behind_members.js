import Vue from 'vue/dist/vue.esm'
import BehindMembers from '../vue/behind_members.vue'

document.addEventListener('DOMContentLoaded', () => {
  new Vue({
    el: '#behind-members',
    components: { BehindMembers },
    data: {},
  })
})
