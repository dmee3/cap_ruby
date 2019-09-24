import moment from 'moment/moment';
import Vue from 'vue/dist/vue.esm';
import ConflictList from '../conflict_list.vue';
import PendingConflicts from '../pending_conflicts.vue';
import ConflictChart from '../conflict_chart.vue';
import Utilities from './utilities';

document.addEventListener('DOMContentLoaded', () => {
  const vue = new Vue({
    el: '#main-content',
    data: {
      conflicts: []
    },
    components: {
      ConflictList,
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
            self.conflicts = response.conflicts.map(conflict => ({
              id: conflict.id,
              name: conflict.name,
              reason: conflict.reason,
              status: conflict.status,
              created_at: moment(conflict.created_at),
              start_date: moment(conflict.start_date),
              end_date: moment(conflict.end_date)
            }));
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
