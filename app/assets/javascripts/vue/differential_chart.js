new Vue({
  el: '#differential-chart',
  data: {
    payments: {},
    error: []
  },
  mounted: function() {
    var self = this;
    $.getJSON('/payments/differential-chart', { jwt: getJWT() })
      .done(function(response) {
        Vue.set(self.payments, 'scheduled', response.scheduled);
        Vue.set(self.payments, 'actual', response.actual);
        self.renderChart();
      })
      .fail(function(err) {
        self.error = err;
        $('.flash-bar').html('<div class="alert alert-dismissible alert-danger" role="alert"><div class="container">An error has been encountered getting differential chart info.<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div></div>');
        console.log(err);
      });
  },
  methods: {
    renderChart: function() {
      var ctx = $('#differential-chart-area');
      var chart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'Actual Amount',
              data: this.payments['actual'].map(function(point) {
                return { x: moment(point[0]), y: point[1] };
              }),
              borderColor: chartColor['orange'].rgbaString(),
              backgroundColor: chartColor['orange'].rgbaString(0.5)
            },
            {
              label: 'Scheduled Amount',
              data: this.payments['scheduled'].map(function(point) {
                return { x: moment(point[0]), y: point[1] };
              }),
              borderColor: chartColor['blue'].rgbaString(),
              backgroundColor: chartColor['blue'].rgbaString(0.5)
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
  }
});