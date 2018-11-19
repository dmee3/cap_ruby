new Vue({
  el: '#upcoming-payments',
  data: {
    entries: {},
    error: [],
    start_date: moment().format('YYYY-MM-DD'),
    end_date: moment().add(2, 'weeks').format('YYYY-MM-DD')
  },
  mounted: function() {
    this.filter();
  },
  methods: {
    filter: function(event) {
      var self = this;
      $.getJSON('/payments/upcoming',
        {
          jwt: getJWT(),
          start_date: self.start_date,
          end_date: self.end_date
        })
        .done(function(response) {
          self.entries = response.payments;
        })
        .fail(function(err) {
          self.error = err;
          $('.flash-bar').html('<div class="alert alert-dismissible alert-danger" role="alert"><div class="container">An error has been encountered getting upcoming payment info.<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div></div>');
          console.log(err);
        });
    }
  }
});
