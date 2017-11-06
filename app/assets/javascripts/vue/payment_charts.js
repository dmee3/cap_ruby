new Vue({
  el: '#payment-chart',
  data: {
    payments: {},
    error: []
  },
  mounted: function() {
    var self = this;
    $.getJSON('/payments', { jwt: getJWT() })
      .done(function(response) {
        Vue.set(self.payments, 'scheduled', response.scheduled);
        Vue.set(self.payments, 'actual', response.actual);
        self.renderChart();
      })
      .fail(function(err) {
        self.error = err;
        $('.flash-bar').html('<div class="alert alert-dismissible alert-danger" role="alert"><div class="container">An error has been encountered<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div></div>');
        console.log(err);
      });
  },
  methods: {
    renderChart: function() {
      var ctx = $('#payment-chart');
      var chart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'Scheduled Amount',
              data: this.payments['scheduled'].map(function(point) {
                return { x: moment(point[0]), y: point[1] };
              }),
              borderColor: chartColor['blue'].rgbaString(),
              backgroundColor: chartColor['blue'].rgbaString(0.5)
            },
            {
              label: 'Actual Amount',
              data: this.payments['actual'].map(function(point) {
                return { x: moment(point[0]), y: point[1] };
              }),
              borderColor: chartColor['orange'].rgbaString(),
              backgroundColor: chartColor['orange'].rgbaString(0.5)
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