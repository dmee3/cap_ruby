<template>
  <div class="card">
    <div class="card-header">
      <h4 class="mb-0">Payment schedule for {{ userName }}</h4>
    </div>
    <ul class="list-group list-group-flush">
      <li class="list-group-item" v-for="(entry, index) in schedule.entries" v-bind:key="entry.id">
        <div class="form-inline d-flex justify-content-between">
          <span>
            <select class="form-control" v-model="entry.year">
              <option value="2017">2017</option>
              <option value="2018">2018</option>
              <option value="2019">2019</option>
              <option value="2020">2020</option>
            </select>
            <select class="form-control" v-model="entry.month">
              <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
            <select class="form-control" v-model="entry.date">
              <option value="01">1</option>
              <option value="02">2</option>
              <option value="03">3</option>
              <option value="04">4</option>
              <option value="05">5</option>
              <option value="06">6</option>
              <option value="07">7</option>
              <option value="08">8</option>
              <option value="09">9</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
              <option value="13">13</option>
              <option value="14">14</option>
              <option value="15">15</option>
              <option value="16">16</option>
              <option value="17">17</option>
              <option value="18">18</option>
              <option value="19">19</option>
              <option value="20">20</option>
              <option value="21">21</option>
              <option value="22">22</option>
              <option value="23">23</option>
              <option value="24">24</option>
              <option value="25">25</option>
              <option value="26">26</option>
              <option value="27">27</option>
              <option value="28">28</option>
              <option value="29">29</option>
              <option value="30">30</option>
              <option value="31">31</option>
            </select>
          </span>
          <div class="input-group">
            <div class="input-group-prepend">
              <span class="input-group-text">$</span>
            </div>
            <input class="form-control" type="number" v-model="entry.amount">
          </div>
          <span @click="removeEntry(entry.id, index)"><i class="fas fa-trash icon-btn icon-btn-red dark-text"></i></span>
        </div>
      </li>
    </ul>
    <div class="card-body">
      <div class="row text-center">
        <div class="col-12">
          <h4><span class="text-muted font-weight-light">Total </span>${{ schedule.entries.reduce(function(sum, e) { return sum + +e.amount; }, 0) }}  </h4>
        </div>
      </div>
      <div class="row mt-2 text-center">
        <div class="col-6">
          <div class="btn btn-info" @click="addEntry()">Add Entry</div>
        </div>
        <div class="col-6">
          <div class="btn btn-success" @click="saveSchedule()">Save</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Utilities from '../packs/utilities';
import Vue from 'vue/dist/vue.esm';
import Toast from '../packs/toast';

export default {
  data: () => {
    return {
      schedule: { entries: [] },
      error: []
    }
  },
  props: {
    scheduleId: Number,
    userName: String
  },
  mounted: function() {
    const self = this;
    $.getJSON('/admin/payment_schedules/' + this.scheduleId, { jwt: Utilities.getJWT() })
      .done(function(response) {
        self.schedule.id = response.id;
        let entries = response.payment_schedule_entries.map(function(e) {
          return {
            date: e.pay_date.substring(8, 10),
            month: e.pay_date.substring(5, 7),
            year: e.pay_date.substring(0, 4),
            amount: e.amount / 100,
            id: e.id
          }
        });
        self.schedule.entries = entries;
        //Vue.set(self.schedule, 'entries', entries);
      })
      .fail(function(err) {
        self.error = err;
        console.log(err);
      });
  },
  methods: {
    addEntry: function() {
      const self = this;
      $.ajax({
        url: '/admin/payment_schedules/add-entry',
        type: 'POST',
        data: {
          jwt: Utilities.getJWT(),
          authenticity_token: Utilities.getAuthToken(),
          payment_schedule_id: this.scheduleId
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
          Toast.showToast('Whoops!', `Couldn't add entry to payment schedule.`, 'danger');
          console.log(err);
        });
    },
    removeEntry: function(id, index) {
      const self = this;
      $.ajax({
        url: '/admin/payment_schedules/remove-entry',
        type: 'DELETE',
        data: {
          jwt: Utilities.getJWT(),
          authenticity_token: Utilities.getAuthToken(),
          id: id
        }
      })
        .done(function(response) {
          self.schedule.entries.splice(index, 1);
        })
        .fail(function(err) {
          self.error = err;
          Toast.showToast('Whoops!', `Couldn't remove entry from payment schedule.`, 'danger');
          console.log(err);
        });
    },
    saveSchedule: function() {
      const self = this;
      let schedule = { id: this.scheduleId };
      schedule.payment_schedule_entries_attributes = this.schedule.entries.map(function(e) {
        return {
          id: e.id,
          pay_date: e.year + '-' + e.month + '-' + e.date,
          amount: e.amount * 100,
        };
      });

      $.ajax({
        url: '/admin/payment_schedules/' + this.scheduleId,
        type: 'PUT',
        data: {
          jwt: Utilities.getJWT(),
          authenticity_token: Utilities.getAuthToken(),
          payment_schedule: schedule
        }
      })
        .done(function(response) {
          Toast.showToast('Success!', `Payment schedule saved!`, 'success');
        })
        .fail(function(err) {
          self.error = err;
          Toast.showToast('Whoops!', `Unable to save payment schedule.`, 'danger');
          console.log(err);
        });
    }
  }
}
</script>
