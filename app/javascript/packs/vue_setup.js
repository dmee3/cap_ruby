import Vue from 'vue/dist/vue.esm'

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('#omni-bar')) {
    new Vue({
      el: '#omni-bar',
      components: {
        OmniBar: require('../vue/components/omni_bar.vue').default
      },
      data: {},
    })
  }

  if (document.querySelector('#payment-schedule')) {
    new Vue({
      el: '#payment-schedule',
      components: {
        PaymentSchedule: require('../vue/components/payment_schedule.vue').default
      },
      data: {},
    })
  }

  // Member list
  if (document.querySelector('#member-list')) {
    new Vue({
      el: '#member-list',
      components: {
        UserList: require('../vue/components/user_list.vue').default
      },
      data: {},
    })
  }

  if (document.querySelector('#admin-list')) {
    new Vue({
      el: '#admin-list',
      components: {
        UserList: require('../vue/components/user_list.vue').default
      },
      data: {},
    })
  }
})