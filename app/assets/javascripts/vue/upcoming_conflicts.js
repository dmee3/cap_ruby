new Vue({
  el: '#upcoming-conflicts',
  data: {
    conflicts: {},
    error: [],
    start_date: null,
    end_date: null
  },
  mounted: function() {
    this.filter();
  },
  methods: {
    filter: function(event) {
      var self = this;
      $.getJSON('/conflicts/upcoming',
        {
          jwt: getJWT(),
          start_date: self.start_date,
          end_date: self.end_date
        })
        .done(function(response) {
          self.conflicts = response.conflicts;
          for (i = 0; i < self.conflicts.length; i++) {
            c = self.conflicts[i];
            c.start_date = moment(c.start_date).format('MM/DD h:mm a');
            c.end_date = moment(c.end_date).format('MM/DD h:mm a');
          }
        })
        .fail(function(err) {
          self.error = err;
          $('.flash-bar').html('<div class="alert alert-dismissible alert-danger" role="alert"><div class="container">An error has been encountered getting upcoming conflict info.<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div></div>');
          console.log(err);
        });
    }
  }
});
