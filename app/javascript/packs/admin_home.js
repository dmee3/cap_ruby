import Vue from 'vue/dist/vue.esm'
import BehindMembers from '../vue/components/behind_members.vue'
import UpcomingConflicts from '../vue/components/upcoming_conflicts.vue'

document.addEventListener('DOMContentLoaded', () => {
  new Vue({
    el: '#main-content',
    components: {
      BehindMembers,
      UpcomingConflicts,
    },
  })
})
