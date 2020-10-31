import Vue from 'vue/dist/vue.esm'
import PendingConflicts from '../vue/pending_conflicts.vue'
import ConflictChart from '../vue/conflict_chart.vue'
import Utilities from './utilities'
import Toast from './toast'

document.addEventListener('DOMContentLoaded', () => {
  new Vue({
    el: '#main-content',
    components: {
      PendingConflicts,
      ConflictChart,
    },
    data: {
      conflicts: [],
    },
    mounted: function () {
      this.getConflicts()
    },
    methods: {
      getConflicts() {
        const self = this
        $.getJSON('/admin/conflicts', {
          jwt: Utilities.getJWT(),
        })
          .done((response) => {
            self.conflicts = response.conflicts
          })
          .fail((err) => {
            self.error = err
            Toast.showToast(
              'Whoops!',
              'An error occurred getting conflicts',
              'danger'
            )
            console.log(err)
          })
      },
    },
  })
})
