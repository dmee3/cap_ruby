<template>
  <div id="conflict-chart">
    <div class="card-header">
      <h4 class="mb-0">
        All Conflicts
        <span class="text-muted float-right show-hide-toggle"><i v-on:click="toggleShowHide" class="fa fa-angle-up"></i></span>
      </h4>
    </div>
    <div class="card-body" v-if="!hidden">
      <div class="col-sm-12 mt-2">
        <div id="calendar"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import ChartColor from '../packs/chart_color'
import 'bootstrap/js/dist/tooltip'

$(document).ready(function() {
  $('#calendar').tooltip({title: 'fuck'})
})
const component = {
  props: ['conflicts'],
  data() {
    return {
      hidden: false,
      calendar: null
    }
  },
  mounted: function() {
    const calendarEl = document.getElementById('calendar');

    const that = this;
    this.calendar = new Calendar(calendarEl, {
      plugins: [ dayGridPlugin, timeGridPlugin, listPlugin ],
      initialView: 'dayGridMonth',
      headerToolbar: {
        start: 'title',
        center: '',
        end: 'dayGridMonth,timeGridWeek,listMonth today prev,next'
      },
      events: function(info, successCallback, errorCallback) {
        const data = that.conflicts.map(c => {
          const color = that.statusColor(c.status.name)
          return {
            id: c.id,
            start: c.start_date,
            end: c.end_date,
            title: c.name,
            url: `/admin/conflicts/${c.id}/edit`,
            backgroundColor: color,
            borderColor: color,
            extendedProps: { reason: c.reason }
          }
        })
        successCallback(data)
      },
      eventMouseEnter: function(info) {
        $(info.el).tooltip({ title: info.event.extendedProps.reason })
      },
    })

    this.calendar.render()
  },
  methods: {
    toggleShowHide(_evt) {
      this.hidden = !this.hidden;
    },
    statusColor(status) {
      if (status == 'Pending') {
        return ChartColor.yellow().rgbaString()
      } else if (status == 'Approved') {
        return ChartColor.green().rgbaString()
      } else if (status == 'Denied') {
        return ChartColor.red().rgbaString()
      }

      return ChartColor.grey().rgbaString()
    },
    refresh() {
      if (this.calendar == null) {
        return
      }
      this.calendar.refetchEvents()
    }
  },
  watch: {
    conflicts: function(newConflicts) {
      this.refresh()
    }
  }
}

export default component
</script>