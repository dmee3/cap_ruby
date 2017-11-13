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

var chartColor = {
  red: new Color(255, 99, 132),
  orange: new Color(255, 159, 64),
  yellow: new Color(255, 205, 86),
  green: new Color(75, 192, 192),
  blue: new Color(54, 162, 235),
  purple: new Color(153, 102, 255),
  grey: new Color(201, 203, 207)
};

function Color(r, g, b) {
  this.r = r;
  this.g = g;
  this.b = b;
}

Color.prototype.rgb = function() {
  return this.r + ',' + this.g + ',' + this.b;
};

Color.prototype.rgbaString = function(a) {
  a = typeof a !== 'undefined' ? a : 1;
  return 'rgba(' + this.rgb() + ',' + a + ')';
};