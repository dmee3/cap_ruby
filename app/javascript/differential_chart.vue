<template>
  <canvas id="differential-chart-area" height="75px"></canvas>
</template>

<script>
import Chart from 'chart.js';
import ChartColor from './packs/chart_color';
import moment from 'moment/moment';
import Utilities from './packs/utilities';
import Vue from 'vue/dist/vue.esm';
import Toast from './packs/toast';

export default {
  data: () => ({
    scheduleData: [],
    paymentData: []
  }),
  props: ['payments', 'schedules'],
  computed: {
    readyToDisplay() {
      return this.payments.length > 0 && this.schedules.length > 0;
    }
  },
  methods: {
    formatData() {
      this.schedules
        .flatMap(s => s.payment_schedule_entries)
        .filter(s => moment(s.pay_date).isSameOrBefore(moment()))
        .forEach(entry => {
          let day = this.scheduleData.find(s => s.day.isSame(moment(entry.pay_date)));
          if (day) {
            day.amount += entry.amount;
          } else {
            this.scheduleData.push({ day: moment(entry.pay_date), amount: entry.amount });
          }
        });

      this.payments
        .forEach(payment => {
          let day = this.paymentData.find(p => p.day.isSame(moment(payment.date_paid)));
          if (day) {
            day.amount += payment.amount;
          } else {
            this.paymentData.push({ day: moment(payment.date_paid), amount: payment.amount });
          }
        });

      this.scheduleData.sort((a, b) => {
        if (a.day.isAfter(b.day)) {
          return 1;
        } else {
          return -1;
        }
      });
      this.paymentData.sort((a, b) => {
        if (a.day.isAfter(b.day)) {
          return 1;
        } else {
          return -1;
        }
      });
    },
    renderChart() {
      const ctx = $('#differential-chart-area');
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'Actual Amount',
              data: this.paymentData.map(point => ({ x: point.day, y: point.amount / 100 })),
              borderColor: ChartColor.orange().rgbaString(),
              backgroundColor: ChartColor.orange().rgbaString(0.5)
            },
            {
              label: 'Scheduled Amount',
              data: this.scheduleData.map(point => ({ x: point.day, y: point.amount / 100 })),
              borderColor: ChartColor.blue().rgbaString(),
              backgroundColor: ChartColor.blue().rgbaString(0.5)
            }
          ]
        },
        options: {
          scales: {
            xAxes: [{
              type: 'time',
              distribution: 'linear',
              time: {
                displayFormats: { week: 'll' },
                tooltipFormat: 'll'
              },
              ticks: {
                maxRotation: 45,
                minRotation: 45
              }
            }],
            yAxes: [{
              ticks: {
                beginAtZero: true,
                callback: (value, index, values) => {
                    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                }
              }
            }]
          },
          title: {
            display: true,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            fontColor: '#212529',
            fontSize: 30,
            fontStyle: 'bold',
            text: 'Payment Differential'
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
  },
  watch: {
    payments: function() {
      if (this.readyToDisplay) {
        this.formatData();
        this.renderChart();
      }
    },
    schedules: function() {
      if (this.readyToDisplay) {
        this.formatData();
        this.renderChart();
      }
    }
  }
}
</script>
