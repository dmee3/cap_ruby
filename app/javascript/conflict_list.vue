<template>
  <div class="card">
    <h4 class="card-header">{{ header }}</h4>
    <ul class="list-group list-group-flush" v-for="date in dates" v-bind:key="date.date.format('MMMM Do, YYYY')">
      <li class="list-group-item"><h5>{{ date.date.format('MMMM Do, YYYY') }}</h5></li>
      <li v-for="conflict in date.conflicts" v-bind:key="conflict.id" class="list-group-item list-group-item-action">
        <div class="row">
          <div class="col-6">
            <span class="badge white-text" v-bind:class="badgeClass(conflict.status.name)">{{ conflict.status.name }}</span>
            <span>{{ conflict.name }}</span>
          </div>
          <div class="col-6 text-right">
            <span class="font-weight-light mr-2">
              {{ conflict.start_date.format('M/D h:mm a') }} - {{ conflict.end_date.format('M/D h:mm a') }}
            </span>
            <a data-toggle="collapse" v-bind:href="`#conflict-reason-${conflict.id}`" class="mr-2">
              <i class="far fa-comment dark-text icon-btn icon-btn-blue"></i>
            </a>
            <a v-bind:href="`/admin/conflicts/${conflict.id}/edit`">
              <i class="far fa-edit icon-btn icon-btn-orange dark-text"></i>
            </a>
          </div>
        </div>
        <div class="px-3 collapse py-1" v-bind:id="`conflict-reason-${conflict.id}`">
          <small class="text-muted">{{ conflict.reason }} <span class="dark-text">(Submitted: {{ conflict.created_at.format('M/D h:mm a') }})</span></small>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import Utilities from './packs/utilities';
import moment from 'moment/moment';
import Toast from './packs/toast';

export default {
  data: () => { return {}; },
  props: ['conflicts', 'timeRange'],
  computed: {
    header() {
      if (this.timeRange === 'past') {
        return 'Past Conflicts';
      } else {
        return 'Upcoming Conflicts';
      }
    },
    dates() {
      let actualConflicts = [], dates = [];

      if (this.timeRange === 'past') {
        actualConflicts = this.conflicts.filter(c => {
          return c.start_date.isSameOrBefore(moment());
        });
      } else {
        actualConflicts = this.conflicts.filter(c => {
          return c.start_date.isSameOrAfter(moment());
        });
      }

      actualConflicts.forEach(c => {
        const idx = dates.findIndex(d => { return c.start_date.isSame(d.date, 'day'); });

        if (idx >= 0) {
          dates[idx].conflicts.push(c);
        } else {
          dates.push({ date: c.start_date, conflicts: [c] });
        }
      });

      return dates.sort((a, b) => {
        if (a.date.isBefore(b.date)) {
          return -1;
        } else if (a.date.isSame(b.date, 'day')) {
          return 0;
        } else {
          return 1;
        }
      });
    }
  },
  methods: {
    badgeClass(statusName) {
      switch (statusName) {
        case 'Approved':
          return 'badge-success';
        case 'Pending':
          return 'badge-warning';
        case 'Denied':
          return 'badge-danger';
        default:
          return 'badge-secondary';
      }
    }
  }
}
</script>
