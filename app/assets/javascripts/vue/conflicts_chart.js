new Vue({
  el: '#conflicts-chart',
  data: {
    chart: null,
    conflicts: [],
    start_date: moment().format('YYYY-MM-DD'),
    end_date: moment().add(2, 'weeks').format('YYYY-MM-DD'),
    error: [],
    hidden: false
  },

  mounted: function() {
    var ctx = $('#conflicts-chart-area');
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
                'day': 'ddd M/D'
              }
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

    this.refreshChart();
  },

  methods: {
    refreshChart: function() {
      var self = this;
      $.getJSON('/conflicts/upcoming',
        {
          jwt: getJWT(),
          start_date: self.start_date,
          end_date: self.end_date
        })
        .done(function(response) {
          self.conflicts = response.conflicts;
          self.updateChart();
        })
        .fail(function(err) {
          self.error = err;
          $('.flash-bar').html('<div class="alert alert-dismissible alert-danger" role="alert"><div class="container">An error has been encountered getting conflict chart info.<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div></div>');
          console.log(err);
        });
    },

    updateChart: function() {
      var chartData = this.formatChartData();

      this.chart.options.scales.yAxes[0].ticks.max = chartData['people'].length;
      this.chart.options.scales.yAxes[0].ticks.callback = function(value) { return chartData['people'][value]; }

      this.chart.data = {
        datasets: chartData['datasets'],
        yLabels: chartData['people']
      };

      this.chart.update(0);
    },

    formatChartData: function() {
      var datasets = [];
      var people = [];

      for (var i = 0; i < this.conflicts.length; i++) {
        var conflict = this.conflicts[i];

        if (people.indexOf(conflict['name']) == -1) {
          people.push(conflict['name']);
        }

        var start = moment(conflict['start_date']);
        var end = moment(conflict['end_date']);
        var color = this.statusToColor(conflict['status']);

        datasets.push({
          backgroundColor: chartColors[color].rgbaString(),
          borderColor: chartColors[color].rgbaString(),
          borderWidth: 10,
          data: [
            { x: start, y: people.indexOf(conflict['name']) },
            { x: end, y: people.indexOf(conflict['name']) },
          ],
          fill: false,
          label: start.format('M/D h:mm a') + ' - ' + end.format('M/D h:mm a'),
          name: conflict['name'],
          pointRadius: 0
        });
      };

      return { datasets: datasets, people: people };
    },

    statusToColor: function(status) {
      var color = 'grey';
      switch (status) {
        case 'Approved':
          color = 'green';
          break;
        case 'Pending':
          color = 'yellow';
          break;
        case 'Denied':
          color = 'red';
          break;
      }

      return color;
    },

    toggleShowHide: function(event) {
      var $body = $('#' + this.$el.id + ' > .card-body');
      if (this.hidden) {
        $body.slideDown();
        $(event.target).removeClass('fa-angle-down').addClass('fa-angle-up');
      } else {
        $body.slideUp();
        $(event.target).removeClass('fa-angle-up').addClass('fa-angle-down');
      }
      this.hidden = !this.hidden;
    }
  }
});