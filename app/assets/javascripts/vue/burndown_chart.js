new Vue({
  el: '#burndown-chart',
  data: {
    dates: {},
    error: []
  },
  mounted: function() {
    var self = this;
    $.getJSON('/payments/burndown-chart', { jwt: getJWT() })
      .done(function(response) {
        Vue.set(self.dates, 'scheduled', response.scheduled);
        Vue.set(self.dates, 'actual', response.actual);
        self.renderChart();
      })
      .fail(function(err) {
        self.error = err;
        $('.flash-bar').html('<div class="alert alert-dismissible alert-danger" role="alert"><div class="container">An error has been encountered getting burndown chart info.<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div></div>');
        console.log(err);
      });
  },
  methods: {
    renderChart: function() {
      var ctx = $('#burndown-chart-area');
      var chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.dates['scheduled'].map(function(point) {
            return moment(point[0]).format('MMM Do YYYY');
          }),
          datasets: [
            {
              label: 'Actual Amount',
              data: this.dates['actual'].map(function(point) {
                return point[1];
              }),
              backgroundColor: chartColor['orange'].rgbaString()
            },
            {
              label: 'Scheduled Amount',
              data: this.dates['scheduled'].map(function(point) {
                return point[1];
              }),
              backgroundColor: chartColor['blue'].rgbaString()
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
});