/* eslint-disable no-undef */
// import Vue from 'vue/dist/vue.esm'
import { DaySeriesModel } from '@fullcalendar/react'
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'

import '~/stylesheets/calendar.css'

const CalendarsNew = () => {
  const [members, setMembers] = React.useState([])
  const [totalDonation, setTotalDonation] = React.useState(0)
  const [submittable, setSubmittable] = React.useState(false)

  const days = [
    { dayOfWeek: 'Sunday', dates: [6, 13, 20, 27, null] },
    { dayOfWeek: 'Monday', dates: [null, 7, 14, 21, 28] },
    { dayOfWeek: 'Tuesday', dates: [1, 8, 15, 22, 29] },
    { dayOfWeek: 'Wednesday', dates: [2, 9, 16, 23, 30] },
    { dayOfWeek: 'Thursday', dates: [3, 10, 17, 24, 31] },
    { dayOfWeek: 'Friday', dates: [4, 11, 18, 25, null] },
    { dayOfWeek: 'Saturday', dates: [5, 12, 19, 26, null] }
  ]

  const updateSelectedMember = () => {};

  const updateSelectedDates = (evt, date) => {};

  const classFor = (date) => {};

  const handlePay = () => {};

  return (
    <div className="wrapper">
      <h1>Calendar Fundraiser</h1>
      <p>First, choose a Cap City member to support.</p>
      <div className="input-wrapper">
        <div className="custom-select-wrapper" data-text="Choose Member">
          <select
            className="custom-select"
            onChange={() => updateSelectedMember() }
          >
            <option value="null">Choose Member</option>
            {members.map(member => {
              return <option key={member.id} value={member.id}>
              { member.first_name + ' ' + member.last_name }
            </option>
            })}
          </select>
        </div>
      </div>

      <p>
        Then, pick one or more calendar dates to help your member support Cap City for the total day amount (e.g. March 3rd = $3, 17th = $17, for a total donation of $20).
      </p>

      <div id="calendar-wrapper">
        <h2 id="month">March</h2>
        <div className="calendar">
          {days.map(day => {
            return <div key={day.dayOfWeek} className="day-of-week">
            <div className="day-header">{ day.dayOfWeek }</div>
            {day.dates.map((date, index) => {
              return <div
                key="index"
                className={"date " + classFor(date)}
                onClick={() => updateSelectedDates(event, date)}
              >{ date == null ? '&nbsp;' : date }</div>
            })}
          </div>
          })}
        </div>
      </div>

      <div id="total-wrapper">
        <h2>Total Donation: <span id="donation-amount">${totalDonation}.00</span></h2>
      </div>

      <div id="card-payment-wrapper">
        {/* <stripe-element-card
          ref="stripeRef"
          :element-style="stripeStyle"
          :pk="pk"
          @element-change="updateSubmittable()"
          @token="tokenCreated"
        /> */}
      </div>

      <div id="name-wrapper">
        <div className="form-group">
          <label htmlFor="donor_name">Your name (leave blank to stay anonymous)</label>
          <input type="text" id="donor_name" name="donor_name" className="form-control" />
        </div>
      </div>

      <div id="submit-wrapper">
        <button
          id="submit-button"
          disabled={submittable == false}
          onClick={() => handlePay()}
        >
          DONATE
        </button>
      </div>
    </div>
  )
}


ReactDOM.render(
  <CalendarsNew />,
  document.getElementById('root')
)
