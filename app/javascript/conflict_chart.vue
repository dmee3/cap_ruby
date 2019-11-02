<template>
  <div id="conflict-chart">
    <div class="card-header">
      <h4 class="mb-0">
        Upcoming Conflicts
        <span class="text-muted float-right show-hide-toggle"><i v-on:click="toggleShowHide" class="fa fa-angle-up"></i></span>
      </h4>
    </div>
    <div class="card-body">
      <div class="form col-sm-12">
        <div class="input-group col-12">
          <div class="input-group-prepend">
            <span class="input-group-text">Start</span>
          </div>
          <input v-model="start_date" type="date" class="form-control" name="start_date">
          <div class="input-group-prepend">
            <span class="input-group-text">End</span>
          </div>
          <input v-model="end_date" type="date" class="form-control" name="end_date">
          <div class="input-group-append">
            <a v-on:click="updateChart" class="btn btn-info white-text">Refresh</a>
          </div>
        </div>
      </div>

      <div class="col-sm-12 mt-2">
        <canvas id="conflict-chart-area"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js';
import ChartColor from './packs/chart_color';
import moment from 'moment/moment';
import Utilities from './packs/utilities';
import Vue from 'vue/dist/vue.esm';
import Toast from './packs/toast';

export default {
  data: function() {
    return {
      chart: null,
      start_date: moment().format('YYYY-MM-DD'),
      end_date: moment().add(2, 'weeks').format('YYYY-MM-DD'),
      error: [],
      hidden: false
    }
  },
  props: ['conflicts'],
  computed: {
    displayedConflicts: function() {
      return this.conflicts.filter(c => {
        return c.start_date.isSameOrAfter(this.start_date) && c.start_date.isSameOrBefore(this.end_date);
      });
    }
  },
  mounted: function() {
    const ctx = $('#conflict-chart-area');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: []
      },
      options: {
        legend: {
          display: false
        },
        scales: {
          xAxes: [{
            type: 'time',
            ticks: {
              maxRotation: 45,
              minRotation: 45
            },
            time: {
              displayFormats: {
                day: 'MMM D'
              },
              unit: 'day'
            }
          }],
          yAxes: [{
            ticks: {
              reverse: true,
              stepSize: 1,
              min: -1
            }
          }]
        },
        title: {
          display: false
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              return data.datasets[tooltipItem.datasetIndex].label;
            },
            title: function(tooltipItemArray, data) {
              return data.datasets[tooltipItemArray[0].datasetIndex].name;
            }
          },
          displayColors: false,
          intersect: false,
          mode: 'nearest'
        }
      }
    });
    this.updateChart();
  },
  methods: {
    updateChart: function() {
      const chartData = this.formatChartData();

      this.chart.options.scales.yAxes[0].ticks.max = chartData['people'].length;
      this.chart.options.scales.yAxes[0].ticks.callback = function(value) { return chartData['people'][value]; }

      this.chart.data = {
        datasets: chartData['datasets'],
        yLabels: chartData['people']
      };

      this.chart.update(0);
    },
    formatChartData: function() {
      let datasets = [];
      let people = [];

      this.displayedConflicts.forEach(conflict => {
        if (people.indexOf(conflict['name']) == -1) {
          people.push(conflict['name']);
        }

        const start = moment(conflict.start_date);
        const end = moment(conflict.end_date);
        const color = this.statusToColor(conflict.status.name);

        datasets.push({
          backgroundColor: color,
          borderColor: color,
          borderWidth: 10,
          data: [
            { x: start, y: people.indexOf(conflict.name) },
            { x: end, y: people.indexOf(conflict.name) },
          ],
          fill: false,
          label: start.format('M/D h:mm a') + ' - ' + end.format('M/D h:mm a'),
          name: conflict.name,
          pointRadius: 0
        });
      });

      return { datasets: datasets, people: people };
    },
    statusToColor: function(statusName) {
      let color = ChartColor.grey().rgbaString();
      switch (statusName) {
        case 'Approved':
          color = ChartColor.green().rgbaString();
          break;
        case 'Pending':
          color = ChartColor.yellow().rgbaString();
          break;
        case 'Denied':
          color = ChartColor.red().rgbaString();
          break;
      }

      return color;
    },
    toggleShowHide: function(event) {
      const $body = $('#' + this.$el.id + ' > .card-body');
      if (this.hidden) {
        $body.slideDown();
        $(event.target).removeClass('fa-angle-down').addClass('fa-angle-up');
      } else {
        $body.slideUp();
        $(event.target).removeClass('fa-angle-up').addClass('fa-angle-down');
      }
      this.hidden = !this.hidden;
    }
  },
  watch: {
    conflicts: function() {
      this.updateChart();
    }
  }
}
</script>