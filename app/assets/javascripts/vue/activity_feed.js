new Vue({
  el: '#activity-feed',
  data: {
    days: []
  },
  mounted: function() {
    var self = this;
    $.getJSON('/feed', { jwt: getJWT() })
      .done(function(response) {
        days = response.reduce(function(hash, act) {
          key = moment(act.activity_date).format('MMMM Do');
          (hash[key] = hash[key] || []).push(act);
          return hash;
        }, {});
        self.days = days;
      });
  }
});

