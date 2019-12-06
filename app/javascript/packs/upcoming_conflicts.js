import Vue from 'vue/dist/vue.esm'
import UpcomingConflicts from '../upcoming_conflicts.vue'

document.addEventListener('DOMContentLoaded', () => {
  const upcoming_conflicts = new Vue({
    el: '#upcoming-conflicts',
    data: {},
    components: { UpcomingConflicts }
  })
})