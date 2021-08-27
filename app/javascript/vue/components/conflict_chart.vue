<template>
  <div id="conflict-chart">
    <div class="card-header">
      <h4 class="mb-0">
        All Conflicts
        <span class="text-muted float-right show-hide-toggle"
          ><i class="fa fa-angle-up" @click="toggleShowHide"></i
        ></span>
      </h4>
    </div>
    <div v-if="!hidden" class="card-body">
      <div class="col-sm-12 mt-2">
        <div id="calendar"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { Calendar, formatDate } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import ChartColor from '../../utilities/chart_color'
import 'bootstrap/js/dist/popover'

export default {
  props: {
    conflicts: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      hidden: false,
      calendar: null,
    }
  },
  watch: {
    conflicts: function () {
      if (this.calendar == null) {
        return
      }
      this.calendar.refetchEvents()
    },
  },
  mounted: function () {
    const calendarEl = document.getElementById('calendar')

    const that = this
    this.calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
      initialView: 'dayGridMonth',
      headerToolbar: {
        start: 'title',
        center: '',
        end: 'dayGridMonth,timeGridWeek,listMonth today prev,next',
      },
      events: function (info, successCallback) {
        const data = that.conflicts.map((c) => {
          const color = that.statusColor(c.status.name)
          return {
            id: c.id,
            start: c.start_date,
            end: c.end_date,
            title: c.name,
            url: `/admin/conflicts/${c.id}/edit`,
            backgroundColor: color,
            borderColor: color,
            extendedProps: { reason: c.reason },
          }
        })
        successCallback(data)
      },
      eventMouseEnter: function (info) {
        const start = formatDate(info.event.start, {
          dateStyle: 'short',
          timeStyle: 'short',
        })
        const end = formatDate(info.event.end, {
          dateStyle: 'short',
          timeStyle: 'short',
        })
        $(info.el).popover({
          title: `${start} - ${end}`,
          content: info.event.extendedProps.reason,
          trigger: 'hover',
          placement: 'top',
          container: 'body',
        })
      },
    })

    this.calendar.render()
  },
  methods: {
    toggleShowHide() {
      this.hidden = !this.hidden
    },
    statusColor(status) {
      if (status == 'Pending') {
        return ChartColor.yellow().rgbString()
      } else if (status == 'Approved') {
        return ChartColor.green().rgbString()
      } else if (status == 'Denied') {
        return ChartColor.red().rgbString()
      }

      return ChartColor.grey().rgbString()
    },
  },
}

</script>

<style lang="scss">
.popover {
  max-width: 350px !important;
}
</style>