<template>
  <div class="card">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5>Payments Made</h5>
      <span>
        <form class="form-inline">
          <div class="custom-control custom-switch mr-4">
            <input type="checkbox" class="custom-control-input green" v-model="turnedIn" @click.prevent="updateNineVolt()" v-bind:id="`nine-volt-${userId}`">
            <label class="custom-control-label" :class="batteryColor()" v-bind:for="`nine-volt-${userId}`"><i class="fas fa-battery-full fa-rotate-270 fa-lg"></i></label>
          </div>
          <a v-bind:href="`/admin/payments/new?user_id=${userId}`" class="btn btn-sm btn-outline-secondary">
            <i class="fa fa-plus"></i>
          </a>
        </form>
      </span>
    </div>
    <ul class="list-group list-group-flush">
      <li class="list-group-item" v-for="payment in payments" v-bind:key="payment.id">
        <div class="d-flex justify-content-between">
          <span>
            <i v-if="payment.payment_type === 'Cash'" class="fas fa-money-bill text-muted mr-1"></i>
            <i v-else-if="payment.payment_type === 'Stripe'" class="fas fa-credit-card text-muted mr-1"></i>
            <i v-else-if="payment.payment_type === 'Check'" class="fas fa-money-check text-muted mr-1"></i>
            <i v-else-if="payment.payment_type === 'Square - Pos'" class="fas fa-square text-muted mr-1"></i>
            <i v-else-if="payment.payment_type === 'Square - Cash App'" class="fas fa-square text-muted mr-1"></i>
            <i v-else-if="payment.payment_type === 'Venmo'" class="fab fa-vimeo-square text-muted mr-1"></i>
            <i v-else class="fas fa-question text-muted mr-1"></i>
            {{ formatMoney(payment.amount) }}
          </span>

          <small class="float-right text-muted">{{ formatDate(payment.date_paid) }}
            <a v-if="payment.notes" data-toggle="collapse" v-bind:href="`#payment-notes-${payment.id}`">
              <i class="far fa-comment dark-text icon-btn icon-btn-blue"></i>
            </a>
          </small>
        </div>

          <div v-if="payment.notes" class="collapse px-3 py-1" v-bind:id="`payment-notes-${payment.id}`">
            <small class="text-muted">{{ payment.notes }}</small>
          </div>
      </li>
    </ul>
  </div>
</template>

<script>
import moment from 'moment/moment';
import Utilities from './packs/utilities';
import Toast from './packs/toast';

export default {
  data: () => ({
    turnedIn: false
  }),
  props: ['payments', 'userId', 'nineVolts'],
  mounted: function() {
    if (this.nineVolts) {
      this.turnedIn = !!this.nineVolts.turned_in;
    } else {
      this.turnedIn = false;
    }
  },
  methods: {
    batteryColor() {
      if (this.turnedIn) {
        return 'text-success';
      } else {
        return 'text-muted';
      }
    },
    formatMoney(number) {
      return (number / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    },
    formatDate(date) {
      return moment(date).format('MMM Do, YYYY');
    },
    updateNineVolt() {
      const self = this;
      if (this.turnedIn) {

        // Delete 9V
        $.ajax({
          url: `/admin/users/${this.userId}/nine_volts/${this.nineVolts.id}`,
          type: 'DELETE',
          data: { jwt: Utilities.getJWT(), authenticity_token: Utilities.getAuthToken() }
        })
          .done(response => {
            self.turnedIn = false;
            Toast.showToast('Success!', response.message, 'success');
          });
      } else {

        // Log 9V
        $.ajax({
          url: `/admin/users/${this.userId}/nine_volts`,
          type: 'POST',
          data: { jwt: Utilities.getJWT(), authenticity_token: Utilities.getAuthToken() }
        })
          .done(response => {
            self.turnedIn = true;
            Toast.showToast('Success!', response.message, 'success');
          });
      }
    }
  }
}
</script>
