<template>
  <div class="card">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5>Payments</h5>
      <a
        :href="`/admin/payments/new?user_id=${userId}`"
        class="btn btn-sm btn-outline-secondary"
      >
        <i class="fa fa-plus"></i>
      </a>
    </div>
    <ul class="list-group list-group-flush">
      <li
        v-for="payment in payments"
        :key="payment.id"
        class="list-group-item list-group-item-action"
      >
        <a
          :href="`/admin/payments/${payment.id}`"
          class="d-flex justify-content-between align-items-center"
        >
          <span class="text-body">
            <i
              v-if="payment.payment_type === 'Cash'"
              class="fas fa-money-bill text-muted mr-1"
            ></i>
            <i
              v-else-if="payment.payment_type === 'Stripe'"
              class="fas fa-credit-card text-muted mr-1"
            ></i>
            <i
              v-else-if="payment.payment_type === 'Check'"
              class="fas fa-money-check text-muted mr-1"
            ></i>
            <i
              v-else-if="payment.payment_type === 'Square - Pos'"
              class="fas fa-square text-muted mr-1"
            ></i>
            <i
              v-else-if="payment.payment_type === 'Square - Cash App'"
              class="fas fa-square text-muted mr-1"
            ></i>
            <i
              v-else-if="payment.payment_type === 'Venmo'"
              class="fab fa-vimeo-square text-muted mr-1"
            ></i>
            <i v-else class="fas fa-question text-muted mr-1"></i>
            {{ formatMoney(payment.amount) }}
          </span>

          <small class="text-muted"
            >{{ formatDate(payment.date_paid) }}
            <div class="dropdown d-inline-block ml-2">
              <button
                :id="`dropdown-${payment.id}`"
                class="btn btn-outline-secondary btn-xs"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <i class="fas fa-ellipsis-h"></i>
              </button>
              <div
                class="dropdown-menu dropdown-menu-right"
                :aria-labelledby="`dropdown-${payment.id}`"
              >
                <a
                  class="dropdown-item"
                  :href="`/admin/payments/${payment.id}`"
                  >View Details</a
                >
                <a
                  class="dropdown-item"
                  :href="`/admin/payments/${payment.id}/edit`"
                  >Edit Info</a
                >
              </div>
            </div>
          </small>
        </a>
      </li>
    </ul>
  </div>
</template>

<script>
import moment from 'moment/moment'

export default {
  props: {
    payments: {
      type: Array,
      required: true,
    },
    userId: {
      type: Number,
      required: true,
    },
  },
  data: () => ({ }),
  methods: {
    formatMoney(number) {
      return (number / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })
    },
    formatDate(date) {
      return moment(date).format('MMM Do, YYYY')
    },
  },
}
</script>
