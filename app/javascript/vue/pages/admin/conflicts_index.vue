<template>
  <div>
    <div class="row">
      <div id="pending-conflicts" class="col-12">
        <pending-conflicts :conflicts="conflicts" @conflict-changed="getConflicts"></pending-conflicts>
      </div>
    </div>

    <div class="row">
      <div  class="col-12">
        <div id="conflict-chart-wrapper" class="card">
          <conflict-chart :conflicts="conflicts"></conflict-chart>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PendingConflicts from '../../components/pending_conflicts.vue'
import ConflictChart from '../../components/conflict_chart.vue'
import Utilities from '../../../packs/utilities'
import Toast from '../../../packs/toast'

export default {
  components: {
    PendingConflicts,
    ConflictChart,
  },
  data: () => ({
    conflicts: [],
  }),
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
          Toast.failToast('An error occurred getting conflicts')
          console.log(err)
        })
    },
  },
}
</script>
