<template>
  <canvas id="burndown-chart-area" height="100px"></canvas>
</template>

<script>
import Chart from 'chart.js';
import ChartColor from '../packs/chart_color';
import moment from 'moment/moment';
import Utilities from '../packs/utilities';
import Vue from 'vue/dist/vue.esm';
import Toast from '../packs/toast';

export default {
  data: function() {
    return {
      dates: {},
      error: []
    }
  },
  mounted: function() {
    const self = this;
    $.getJSON('/admin/payments/burndown-chart', { jwt: Utilities.getJWT() })
      .done(function(response) {
        Vue.set(self.dates, 'scheduled', response.scheduled);
        Vue.set(self.dates, 'actual', response.actual);
        self.renderChart();
      })
      .fail(function(err) {
        self.error = err;
        Toast.showToast('Whoops!', `Unable to get burndown chart data.`, 'danger');
        console.log(err);
      });
  },
  methods: {
    renderChart: function() {
      const ctx = $('#burndown-chart-area');
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.dates['scheduled'].map(function(point) {
            return moment(point[0]).format('MMM Do, YYYY');
          }),
          datasets: [
            {
              label: 'Actual Amount',
              data: this.dates['actual'].map(function(point) {
                return point[1];
              }),
              backgroundColor: ChartColor.orange().rgbaString()
            },
            {
              label: 'Scheduled Amount',
              data: this.dates['scheduled'].map(function(point) {
                return point[1];
              }),
              backgroundColor: ChartColor.blue().rgbaString()
            }
          ]
        },
        options: {
          scales: {
            xAxes: [{
              ticks: {
                maxRotation: 45,
                minRotation: 45
              }
            }],
            yAxes: [{
              ticks: {
                beginAtZero: true,
                callback: function(value, index, values) { return  '$' + value; }
              }
            }]
          },
          title: {
            display: true,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            fontColor: '#212529',
            fontSize: 30,
            fontStyle: 'bold',
            text: 'Payment Burndown'
          },
          tooltips: {
            callbacks: {
              label: function(tooltipItem, data) {
                return data.datasets[tooltipItem.datasetIndex].label +': $' + tooltipItem.yLabel;
              }
            }
          }
        }
      });
    }
  }
}
</script>
