<template>
  <div class="wrapper">
    <h1>Calendar Fundraiser</h1>
    <p>First, choose a Cap City member to support.</p>

    <div class="input-wrapper">
      <div class="custom-select-wrapper" data-text="Choose Member">
        <select
          class="custom-select"
          @change="updateSelectedMember"
        >
          <option value="null">Choose Member</option>
          <option v-for="member in members" :key="member.id" :value="member.id">
            {{ member.first_name + ' ' + member.last_name }}
          </option>
        </select>
      </div>
    </div>

    <p>
      Then, pick one or more calendar dates to help your member support Cap City for the total day amount (e.g. March 3rd = $3, 17th = $17, for a total donation of $20).
    </p>

    <div id="calendar-wrapper">
      <h2 id="month">March</h2>
      <div class="calendar">
        <div v-for="day in days" :key="day.dayOfWeek" class="day-of-week">
          <div class="day-header">{{ day.dayOfWeek }}</div>
          <template v-for="(date, index) in day.dates">
            <div
              :key="index"
              class="date"
              :class="classFor(date)"
              @click="updateSelectedDates($event, date)"
            >{{ date == null ? '&nbsp;' : date }}</div>
          </template>
        </div>
      </div>
    </div>

    <div id="total-wrapper">
      <h2>Total Donation: <span id="donation-amount">${{totalDonation}}.00</span></h2>
    </div>

    <div id="card-payment-wrapper">
      <stripe-element-card
        ref="stripeRef"
        :elementStyle="stripeStyle"
        :pk="pk"
        @element-change="updateSubmittable()"
        @token="tokenCreated"
      />
    </div>

    <div id="name-wrapper">
      <div class="form-group">
        <label for="donor_name">Your name (leave blank to stay anonymous)</label>
        <input type="text" name="donor_name" id="donor_name" class="form-control" />
      </div>
    </div>

    <div id="submit-wrapper">
      <button
        id="submit-button"
        :disabled="submittable == false"
        @click="handlePay()"
      >
        DONATE
      </button>
    </div>
  </div>
</template>

<script>
import { StripeElementCard } from '@vue-stripe/vue-stripe'
import Utilities from '../../packs/utilities'

export default {
  components: {
    StripeElementCard
  },
  props: {
    members: {
      type: Array,
      required: true
    },
    pk: {
      type: String,
      required: true
    }
  },
  data: () => {
    return {
      clickedPay: false,
      dates: [],
      days: [
        { dayOfWeek: 'Sunday', dates: [null, 7, 14, 21, 28] },
        { dayOfWeek: 'Monday', dates: [1, 8, 15, 22, 29] },
        { dayOfWeek: 'Tuesday', dates: [2, 9, 16, 23, 30] },
        { dayOfWeek: 'Wednesday', dates: [3, 10, 17, 24, 31] },
        { dayOfWeek: 'Thursday', dates: [4, 11, 18, 25, null] },
        { dayOfWeek: 'Friday', dates: [5, 12, 19, 26, null] },
        { dayOfWeek: 'Saturday', dates: [6, 13, 20, 27, null] }
      ],
      selectedMember: null,
      stripeStyle: {
        invalid: {
          iconColor: '#eb1c26',
          color: '#eb1c26',
        },
      },
      stripeToken: null,
      submittable: false
    }
  },
  computed: {
    selectedDates: function() {
      const selected = []
      this.dates.forEach((date, index) => {
        if (date.selected && date.available) selected.push(index + 1)
      })
      return selected
    },
    totalDonation: function() {
      if (this.selectedDates.length == 0) return 0
      return this.selectedDates.reduce((acc, curr) => acc + curr)
    }
  },
  watch: {
    clickedPay: function(newVal) {
      if (newVal === true && this.stripeToken != null) {
        this.submitForm()
      }
    },
    stripeToken: function(newVal) {
      if (newVal != null && this.clickedPay === true) {
        this.submitForm()
      }
    }
  },
  mounted: function() { this.resetCalendar() },
  methods: {
    classFor(index) {
      if (index == null) return ''

      const date = this.dates[index - 1]
      if (date == null) return ''

      if (!date.available) {
        return 'unavailable'
      } else {
        return  (date.selected ? 'selected' : '')
      }
    },
    getUnavailableDates: function() {
      const self = this
      $.getJSON('/calendars?user_id=' + this.selectedMember.id, {
        jwt: Utilities.getJWT(),
      })
        .done(function (response) {
          self.resetCalendar()
          response.forEach((index) => {
            self.dates[index - 1].available = false
          })
        })
        .fail(function (err) {
          console.log(err)
          self.resetCalendar()
        })
    },
    resetCalendar: function() {
      this.dates = []
      for (let i = 0; i < 31; i++) {
        this.dates.push({ selected: false, available: true })
      }
      this.submittable = false
    },
    updateSelectedMember: function(event) {
      const index = event.target.options.selectedIndex - 1
      if (index < 0) return

      const wrapper = document.querySelector('.custom-select-wrapper')
      this.selectedMember = this.members[index]
      wrapper.dataset.text = `${this.selectedMember.first_name} ${this.selectedMember.last_name}`
      this.getUnavailableDates()

      this.updateSubmittable()
    },
    updateSelectedDates: function(event, date) {
      if (date == null || this.dates[date - 1].available === false) return

      this.dates[date - 1].selected = !this.dates[date - 1].selected

      this.updateSubmittable()
    },
    updateSubmittable: function() {
      if (this.selectedMember != null && this.selectedDates.length > 0) {
        this.submittable = true
      } else {
        this.submittable = false
      }
    },
    tokenCreated(token) {
      this.stripeToken = token
    },
    handlePay() {
      if (this.stripeToken == null) {
        this.$refs.stripeRef.submit()
      }
      this.clickedPay = true
      this.submittable = false
    },
    submitForm() {
      const form = document.getElementById('calendar-form')
      const userIdInput = document.getElementById('donation_user_id')
      const datesInput = document.getElementById('donation_dates')
      const amountInput = document.getElementById('donation_amount')
      const nameInput = document.getElementById('donation_donor_name')
      const tokenInput = document.getElementById('donation_stripe_token')

      userIdInput.value = this.selectedMember.id
      datesInput.value = JSON.stringify(this.selectedDates)
      amountInput.value = this.totalDonation * 100
      nameInput.value = document.getElementById('donor_name').value
      tokenInput.value = this.stripeToken.id
      form.submit()
    }
  }
}
</script>

<style lang="scss" scoped>
.input-wrapper {
  display: inline-block;
  margin-left: 1rem;
  margin-right: 1rem;

  .custom-select-wrapper {
    margin: 1rem 0;
    border: 2px solid #ffffff;
    padding: .75rem 1.25rem;
    position: relative;
  
    &:before {
      content: attr(data-text);
      display: inline-block;
    }
  
    &:after {
      content: '\25BE';
      margin-left: 1em;
      font-family: sans-serif !important;
    }
  
    select {
      position: absolute;
      top: 0;
      right: 0;
      width: 100%;
      height: 100%;
      font-size: 12px;
      color: rgba(0,0,0,0) !important;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      border: 0;
      border-radius: 0;
      padding: 0;
      outline: 0;
      margin: 0;
      text-transform: none;
      background: transparent;

      &:focus {
        border: none;
        box-shadow: none;
      }
  
      option {
        color: #000 !important;
      }
    }
  }
}

#calendar-wrapper {
  margin-top: 2rem;

  #month {
    text-align: center;
  }

  .calendar {
    margin: 0 auto;
    width: 534px;
    display: flex;

    .day-of-week {
      div {
        padding: .25rem;
      }

      .day-header {
        font-weight: bold;
      }

      .date {
        text-align: center;
        cursor: pointer;

        &.unavailable {
          cursor: auto;
          color: #dbdbdb;
          background-color: #000000;
        }

        &.selected {
          background-color: #e7f1f0;
          color: #323337;
        }
      }
    }
  }
}

#total-wrapper {
  text-align: center;
  margin-top: 2rem;

  #donation-amount {
    font-weight: bold;
  }
}

#card-payment-wrapper {
  margin-top: 3rem;
  min-height: 88px;

  #stripe-element-errors {
    margin-top: .5rem;
  }
}

#name-wrapper {
  margin-top: 1rem;
  text-align: center;
}

#submit-wrapper {
  margin-top: 3rem;
  text-align: center;
}
</style>