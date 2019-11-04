<template>
  <div class="card">
    <h4 class="card-header d-flex justify-content-between align-items-center">
      Payments
      <div class="btn-group btn-group-sm">
        <button class="btn btn-info" id="paid-toggle">Toggle Fully-Paid</button>
        <a href="/admin/payments/new" class="btn btn-outline-secondary">
          <span class="d-none d-md-inline">New Payment</span>
          <span class="d-md-none"><i class="fas fa-plus"></i></span>
        </a>
      </div>
    </h4>
    <div class="list-group list-group-flush" v-if="readyToDisplay">
      <template v-for="user in fullUsers">
        <a v-bind:key="user.id" v-bind:href="`#member-${user.id}-info`" class="list-group-item list-group-item-action" data-toggle="collapse">
          <div class="row">
            <div class="col-6 col-md-4 col-lg-3">
              <h5 class="mb-0">{{ user.first_name + ' ' + user.last_name }}</h5>
            </div>

            <div class="col-6 col-md-2 order-md-12">
              <p class="mb-0 font-weight-light text-right">{{ formatMoney(user.total_dues) }}</p>
            </div>

            <div class="col-11 col-md-6 mt-1 order-md-1">
              <div class="progress">
                <div class="progress-bar" v-bind:class="statusBarColorFor(user)" v-bind:style="{ width: statusBarWidthFor(user) + '%' }">
                  {{ formatMoney(user.amount_paid) }}
                </div>
              </div>
            </div>
            <div class="col-1 order-md-2 text-center" v-bind:class="batteryColorFor(user)">
              <i class="fas fa-battery-full fa-rotate-270 fa-lg"></i>
            </div>
          </div>
        </a>

        <div v-bind:key="`${user.id}-info`" v-bind:id="`member-${user.id}-info`" class="collapse white">
          <div class="row mx-3">
            <div class="col-md-6 my-3">
              <payments-made-card v-bind:payments="user.payments" v-bind:user-id="user.id" v-bind:nine-volts="user.nine_volts"></payments-made-card>
            </div>

            <div class="col-md-6 my-3">
              <payment-schedule-card v-bind:schedule="user.payment_schedule" v-bind:schedule-id="user.payment_schedule_id"></payment-schedule-card>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="card-body text-center" v-else>
      <div class="spinner-border" role="status">
        <span class="sr-only">Loading...</span>
      </div>
      <p class="lead">Getting user payment info...</p>
    </div>
  </div>
</template>

<script>
import moment from 'moment/moment';
import PaymentsMadeCard from './payments_made_card';
import PaymentScheduleCard from './payment_schedule_card';

export default {
  data: () => ({
    fullUsers: []
  }),
  props: ['users', 'nineVolts', 'payments', 'schedules'],
  computed: {
    readyToDisplay() {
      return this.users.length > 0 && this.nineVolts.length > 0
        && this.payments.length > 0 && this.schedules.length > 0;
    }
  },
  components: {
    PaymentsMadeCard,
    PaymentScheduleCard
  },
  methods: {
    batteryColorFor(user) {
      if (user.nine_volts && user.nine_volts.turned_in) {
        return 'text-success';
      } else {
        return 'text-muted';
      }
    },
    formatMoney(number) {
      return (number / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    },
    statusBarColorFor(user) {
      if (user.amount_paid >= user.scheduled_to_date) {
        return 'green';
      } else {
        return 'red';
      }
    },
    statusBarWidthFor(user) {
      return user.amount_paid * 100 / user.total_dues;
    },
    updatefullUsers() {
      this.fullUsers = this.users.slice();
      this.fullUsers.forEach(user => {
        // Set up payment schedules
        const schedule = this.schedules.find(schedule => schedule.user_id === user.id);
        if (schedule !== undefined) {
          user.payment_schedule = schedule.payment_schedule_entries.map(e => ({
            amount: e.amount,
            pay_date: e.pay_date
          }));
        } else {
          user.payment_schedule = [];
        }

        // Set up payments
        user.payments = this.payments
          .filter(payment => payment.user_id === user.id)
          .map(p => ({
            amount: p.amount,
            date_paid: p.date_paid,
            notes: p.notes,
            payment_type: p.payment_type.name,
          }));

        // Set up nine-volts
        user.nine_volts = this.nineVolts.filter(nineVolt => nineVolt.user_id === user.id)[0];

        // Set up calculated/misc values
        user.payment_schedule_id = schedule.id;
        user.total_dues = user.payment_schedule.reduce((sum, entry) => sum + entry.amount, 0);
        user.amount_paid = user.payments.reduce((sum, payment) => sum + payment.amount, 0)
        user.scheduled_to_date = user
          .payment_schedule
          .filter(e => moment(e.pay_date).isSameOrBefore(moment()))
          .reduce((sum, entry) => sum + entry.amount, 0);
      });

      this.fullUsers = this.fullUsers.sort((a, b) => {
        if (a.first_name > b.first_name) {
          return 1;
        } else {
          return -1;
        }
      });
    }
  },
  watch: {
    // These need to be watchers instead of computed because Vue tries to evaluate
    // computed values before the prop data is established in this instance
    users: function() { if (this.readyToDisplay) this.updatefullUsers(); },
    payments: function() { if (this.readyToDisplay) this.updatefullUsers(); },
    schedules: function() { if (this.readyToDisplay) this.updatefullUsers(); }
  }
}
</script>
