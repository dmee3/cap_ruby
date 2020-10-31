import moment from 'moment/moment';
import Vue from 'vue/dist/vue.esm';
import PendingConflicts from '../vue/pending_conflicts.vue';
import ConflictChart from '../vue/conflict_chart.vue';
import Utilities from './utilities';

document.addEventListener('DOMContentLoaded', () => {
  const vue = new Vue({
    el: '#main-content',
    data: {
      conflicts: []
    },
    components: {
      PendingConflicts,
      ConflictChart
    },
    mounted: function() {
      this.getConflicts();
    },
    methods: {
      getConflicts() {
        const self = this;
        $.getJSON('/admin/conflicts', {
          jwt: Utilities.getJWT()
        })
          .done((response) => {
            self.conflicts = response.conflicts;
          })
          .fail((err) => {
            self.error = err;
            Toast.showToast('Whoops!', 'An error occurred getting conflicts', 'danger');
            console.log(err);
          });
      }
    }
  });
});
