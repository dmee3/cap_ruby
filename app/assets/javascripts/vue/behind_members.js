new Vue({
  el: '#behind-members',
  data: {
    members: {},
    error: []
  },
  mounted: function() {
    var self = this;
    $.getJSON('/payments/behind-members', { jwt: getJWT() })
      .done(function(response) {
        self.members = response.members;
      })
      .fail(function(err) {
        self.error = err;
        $('.flash-bar').html('<div class="alert alert-dismissible alert-danger" role="alert"><div class="container">An error has been encountered getting behind member info.<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div></div>');
        console.log(err);
      });
  }
});
