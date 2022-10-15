import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import addFlash from '../../../utilities/flashes'
import Utilities from '../../../utilities/utilities'
import { PlusSmIcon } from '@heroicons/react/outline'
import PaymentScheduleEditRow from '../../../react/widgets/admin/PaymentScheduleEditRow'

const AdminPaymentSchedulesEdit = () => {
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentSchedule>({})
  const [entries, setEntries] = useState([])
  const userId = window.userId
  const fullName = window.fullName
  const scheduleId = window.scheduleId

  const handleAmountChange = (event, entry) => {
    const newVal = +(event.target.value) * 100
    const indexToChange = entries.findIndex(e => e.id === entry.id)
    const newEntry = { ...entries[indexToChange], amount: newVal }

    const newArray = [
      ...entries.slice(0, indexToChange), 
      newEntry,
      ...entries.slice(indexToChange + 1)
    ]
    setEntries(newArray)
  }

  const handleDateChange = (event, entry) => {
    const newVal = event.target.value
    const indexToChange = entries.findIndex(e => e.id === entry.id)
    const newEntry = { ...entries[indexToChange], pay_date: newVal }

    const newArray = [
      ...entries.slice(0, indexToChange), 
      newEntry,
      ...entries.slice(indexToChange + 1)
    ]
    setEntries(newArray)
  }

  const addEntry = () => {
    fetch('/api/admin/payment_schedules/add-entry', {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': Utilities.getAuthToken(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment_schedule_id: paymentSchedule.id
      })
    })
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => {
        setEntries([...entries, data])
      })
      .catch(error => {
        console.error(error)
      })
  }

  const deleteEntry = (_event, entry) => {
    fetch('/api/admin/payment_schedules/remove-entry', {
      method: 'DELETE',
      headers: {
        'X-CSRF-TOKEN': Utilities.getAuthToken(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: entry.id,
      }),
    })
      .then(resp => {
        if (!resp.ok) {
          throw resp
        }
      })
      .then(() => {
        setEntries(entries.filter(e => e.id !== entry.id))
      })
      .catch(error => {
        console.error(error)
      })
  }

  const saveSchedule = () => {
    const schedule = {
      id: paymentSchedule.id,
      payment_schedule_entries_attributes: entries.map(
        (e) => ({
          id: e.id,
          pay_date: e.pay_date,
          amount: e.amount,
        })
      )
    }

    fetch(`/api/admin/payment_schedules/${schedule.id}`, {
      method: 'PUT',
      headers: {
        'X-CSRF-TOKEN': Utilities.getAuthToken(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment_schedule: schedule,
      }),
    })
    .then(resp => {
      if (!resp.ok) {
        throw resp
      }
    })
    .then(() => {
      window.location.href = `/admin/users/${userId}`
    })
    .catch(error => {
      addFlash('error', "Couldn't save payment schedule")
      console.error(error)
    })
  }

  useEffect(() => {
    fetch(`/api/admin/payment_schedules/${scheduleId}`)
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => {
        setPaymentSchedule(data)
        setEntries(data.payment_schedule_entries.sort((a, b) => Utilities.dateSorter(a.pay_date, b.pay_date)))
      })
      .catch(error => console.error(error))
  }, [])

  return(
    <div className="flex flex-col">
      <div className="flex flex-row items-center justify-between mt-4 mb-6">
        <h1>Edit Payment Schedule for {fullName}</h1>
        <div>
          <button className="btn-green btn-lg" onClick={() => addEntry()}>
            <PlusSmIcon className="mr-2 h-6 w-6" />
            New Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-x-6 gap-y-4">
        {entries.map((e, i) => (
            <PaymentScheduleEditRow
              key={e.id}
              entry={e}
              index={i}
              amountChanged={evt => handleAmountChange(evt, e)}
              dateChanged={evt => handleDateChange(evt, e)}
              deleteClicked={evt => deleteEntry(evt, e)}
            />
          ))
        }
      </div>

      <div className="mt-4 flex flex-row justify-end">
        {entries.length > 0 &&
          <button className="btn-green btn-lg mr-6" onClick={() => addEntry()}>
            <PlusSmIcon className="mr-2 h-6 w-6" />
            New Entry
          </button>
        }
        <button onClick={() => saveSchedule()} className="btn-primary btn-lg">
          Save
        </button>
      </div>
    </div>
  )
}

ReactDOM.render(
  <AdminPaymentSchedulesEdit />,
  document.getElementById('root')
)
