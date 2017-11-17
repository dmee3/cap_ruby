new Vue({
  el: '#upcoming-list',
  data: {
    entries: {},
    error: []
  },
  mounted: function() {
    var self = this;
    $.getJSON('/payments/upcoming-payments', { jwt: getJWT() })
      .done(function(response) {
        self.entries = response.payments;
        self.renderList();
      })
      .fail(function(err) {
        self.error = err;
        $('.flash-bar').html('<div class="alert alert-dismissible alert-danger" role="alert"><div class="container">An error has been encountered getting upcoming payment info.<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div></div>');
        console.log(err);
      });
  }
});