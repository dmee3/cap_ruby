new Vue({
  el: '#payment-schedule',
  data: {
    schedule: [],
    error: []
  },
  mounted: function() {
    var self = this;
    $.getJSON('/payment_schedules/' + schedule_id, { jwt: getJWT() })
      .done(function(response) {
        self.schedule = { id: response.id };
        entries = response.payment_schedule_entries.map(function(e) {
          return {
            date: e.pay_date.substring(8, 10),
            month: e.pay_date.substring(5, 7),
            year: e.pay_date.substring(0, 4),
            amount: e.amount / 100,
            id: e.id
          }
        });
        Vue.set(self.schedule, 'entries', entries);
      })
      .fail(function(err) {
        self.error = err;
        console.log(err);
      });
  },
  methods: {
    addEntry: function() {
      var self = this;
      $.ajax({
        url: '/payment_schedules/add_entry',
        type: 'POST',
        data: {
          jwt: getJWT(),
          authenticity_token: getAuthToken(),
          payment_schedule_id: schedule_id
        }
      })
        .done(function(response) {
          self.schedule.entries.push({
            date: response.pay_date.substring(8, 10),
            month: response.pay_date.substring(5, 7),
            year: response.pay_date.substring(0, 4),
            amount: response.amount / 100,
            id: response.id
          });
        })
        .fail(function(err) {
          self.errors = err;
          $('.flash-bar').html('<div class="alert alert-dismissible alert-danger" role="alert"><div class="container">An error has been encountered<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div></div>');
          console.log(err);
        });
    },
    removeEntry: function(id, index) {
      var self = this;
      $.ajax({
        url: '/payment_schedules/remove_entry',
        type: 'DELETE',
        data: {
          jwt: getJWT(),
          authenticity_token: getAuthToken(),
          id: id
        }
      })
        .done(function(response) {
          self.schedule.entries.splice(index, 1);
        })
        .fail(function(err) {
          self.error = err;
          $('.flash-bar').html('<div class="alert alert-dismissible alert-danger" role="alert"><div class="container">An error has been encountered<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div></div>');
          console.log(err);
        });
    },
    saveSchedule: function() {
      var self = this;
      var schedule = { id: schedule_id };
      schedule.payment_schedule_entries_attributes = this.schedule.entries.map(function(e) {
        return {
          id: e.id,
          pay_date: e.year + '-' + e.month + '-' + e.date,
          amount: e.amount * 100,
        };
      });

      $.ajax({
        url: '/payment_schedules/' + schedule_id,
        type: 'PUT',
        data: {
          jwt: getJWT(),
          authenticity_token: getAuthToken(),
          payment_schedule: schedule
        }
      })
        .done(function(response) {
          debugger;
          $('.flash-bar').html('<div class="alert alert-dismissible alert-success" role="alert"><div class="container">Payment Schedule updated<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div></div>');
        })
        .fail(function(err) {
          self.error = err;
          $('.flash-bar').html('<div class="alert alert-dismissible alert-danger" role="alert"><div class="container">An error has been encountered<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div></div>');
          console.log(err);
        });
    }
  }
});