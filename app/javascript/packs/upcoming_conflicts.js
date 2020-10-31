import Vue from 'vue/dist/vue.esm'
import UpcomingConflicts from '../vue/upcoming_conflicts.vue'

document.addEventListener('DOMContentLoaded', () => {
  new Vue({
    el: '#upcoming-conflicts',
    components: { UpcomingConflicts },
    data: {},
  })
})
