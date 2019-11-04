<template>
  <div class="card">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5>Payments Made</h5>
      <a v-bind:href="`/admin/payments/new?user_id=${userId}`" class="btn btn-sm btn-outline-secondary">
        <i class="fa fa-plus"></i>
      </a>
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

export default {
  data: () => ({}),
  props: ['payments', 'userId'],
  methods: {
    formatMoney(number) {
      return (number / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    },
    formatDate(date) {
      return moment(date).format('MMM Do, YYYY');
    }
  }
}
</script>
