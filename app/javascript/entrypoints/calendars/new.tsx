/* eslint-disable no-undef */
import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import '~/stylesheets/application.css'
import '~/stylesheets/calendar.css'
import Utilities from '../../utilities/utilities'
import CheckoutForm from '../../react/widgets/calendars/CheckoutForm'
import InputSelect from '../../react/components/inputs/InputSelect'
import InputText from '../../react/components/inputs/InputText'

const stripePromise = loadStripe(stripePk) // Defined on erb page

const CalendarsNew = () => {
  const [members, setMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [dates, setDates] = useState([])
  const [submittable, setSubmittable] = useState(false)
  const [clientSecret, setClientSecret] = useState(null)
  const [donorName, setDonorName] = useState('')

  const daysOfWeek = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat']
  const days = [null, null,].concat(Array.from(Array(31).keys()).map(x => x + 1))

  const inputRef = useRef<HTMLInputElement>(null!)

  const selectedDates = (): number[] => {
    const selected = Array<number>()
    dates.forEach((date, index) => {
      if (date.selected && date.available) selected.push(index + 1)
    })

    return selected
  }

  const totalDonation = (): number => {
    const chosenDates = selectedDates()
    if (chosenDates.length === 0) return 0

    return chosenDates.reduce((acc, curr) => acc + curr)
  }

  const updateSelectedMember = (name) => {
    const member = members.find(m => `${m.first_name} ${m.last_name}` === name)
    if (!member) {
      setSelectedMember(null)
      return
    }

    setSelectedMember(member)
    getUnavailableDates(member.id)
    updateSubmittable()
  }

  const updateSubmittable = () => {
    if (selectedMember !== '' && selectedDates().length > 0) {
      setSubmittable(true)
    } else {
      setSubmittable(false)
    }
  }

  const updateSelectedDates = (event, date) => {
    if (date == null || dates[date - 1].available === false) return

    const localDates = [...dates]
    const pickedDate = localDates[date - 1]
    pickedDate.selected = !pickedDate.selected
    setDates(localDates)

    updateSubmittable()
  }

  const resetCalendar = () => {
    const datesArray = []
    for (let i = 0; i < 31; i++) {
      datesArray.push({ selected: false, available: true })
    }
    setDates(datesArray)
    setSubmittable(false)
  }

  const classFor = (index) => {
    if (index == null) return 'empty'

      const date = dates[index - 1]
      if (date == null) return ''

      if (!date.available) {
        return 'unavailable'
      } else {
        return  (date.selected ? 'selected' : '')
      }
  }

  const getUnavailableDates = (memberId) => {
    const self = this
    fetch(`/calendars?user_id=${memberId}`)
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => {
        resetCalendar()
        if (data.length === 0) return

        const localDates = [...dates]
        data.forEach((index) => {
          localDates[index - 1].available = false
        })
        setDates(localDates)
      })
      .catch(err => {
        console.error(err)
        resetCalendar()
      })
  }

  const createPaymentIntent = async () => {
    setSubmittable(false)

    fetch('/api/calendars/payment_intents', {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': Utilities.getAuthToken(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        total: totalDonation(),
        member_id: selectedMember.id,
        dates: selectedDates(),
        donor_name: inputRef.current.value
      }),
    })
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => {
        setClientSecret(data['clientSecret'])
      })
  }

  const elementsCard = () => {
    if (!clientSecret) return null

    const options = { clientSecret: clientSecret }
    return (
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm />
      </Elements>
    )
  }

  useEffect(() => {
    resetCalendar()
    fetch('/calendars/members')
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => setMembers(data))
  }, [])

  return (
    <div className="wrapper">
      <h1>Calendar Fundraiser</h1>
      
      {clientSecret && 
        <>
          <h3>Supporting {selectedMember.first_name} {selectedMember.last_name} with a donation of ${totalDonation()}</h3>
          {elementsCard()}
        </>
      }

      {!clientSecret &&
        <>
          <p>First, choose a Cap City member to support.</p>
          <div className="my-4">
            <InputSelect
              name={'member_select'}
              onChange={(event) => updateSelectedMember(event)}
              options={[''].concat(members.map(m => `${m.first_name} ${m.last_name}`))}
              value={selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : ''}
            />
          </div>
    
          <p>
            Then, pick one or more calendar dates to help your member support Cap City for the total day amount (e.g. March 3rd = $3, 17th = $17, for a total donation of $20).
          </p>
    
          <div className="mt-6">
            <h2 className="text-center">March 2022</h2>
            <div className="grid grid-cols-7 gap-1">
              {daysOfWeek.map(day => <div key={day} className="font-bold text-center p-1">{ day }</div>)}
              {days.map((day, index) =>
                <div
                  key={index}
                  className={"p-1 h-12 cursor-pointer flex justify-center items-center " + classFor(day)}
                  onClick={(event) => updateSelectedDates(event, day)}
                >
                  { day == null ? ' ' : day }
                </div>
              )}
            </div>
          </div>
    
          <div className="text-center my-4">
            <h2>
              Total Donation: <span className="font-bold">${totalDonation()}.00</span>
            </h2>
          </div>
    
          <div className="my-4">
            <label htmlFor="donor_name">
              Your name (leave blank to stay anonymous)
            </label>
            <InputText name={'donor_name'} value={donorName} ref={inputRef} />
          </div>
    
          <div className="my-4 flex justify-center">
            <button
              className="btn-lg btn-primary"
              disabled={submittable == false}
              onClick={() => createPaymentIntent()}
            >
              DONATE
            </button>
          </div>
        </>
      }
    </div>
  )
}


ReactDOM.render(
  <CalendarsNew />,
  document.getElementById('root')
)
