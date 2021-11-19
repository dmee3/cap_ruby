import { XIcon } from '@heroicons/react/outline'
import flatpickr from 'flatpickr'
import React, { useEffect } from 'react'
import InputNumber from '../../components/inputs/InputNumber'

type PaymentScheduleEditRowProps = {
  entry: any,
  index: number,
  amountChanged: any,
  dateChanged: any,
  deleteClicked: any,
}

const PaymentScheduleEditRow = ({
  entry,
  index,
  amountChanged,
  dateChanged,
  deleteClicked,
}: PaymentScheduleEditRowProps) => {

  useEffect(() => {
    flatpickr('.flatpickr', {
      altInput: true,
      altFormat: 'F j, Y',
      altInputClass: 'input-text',
      dateFormat: 'Y-m-d',
      disableMobile: true,
      onChange: (_selectedDates, dateStr, _instance) => dateChanged(entry, dateStr)
    })
  }, [])

  return(
    <>
      <div className="col-span-5 sm:col-span-1 -mb-2 sm:mb-0 flex items-center">
        <label htmlFor={`date_${entry.id}`} className="input-label">Payment #{index + 1}</label>
      </div>
      <div className="col-span-5 sm:col-span-2 -mb-2 sm:mb-0 flex items-center">
        <input
          name={`date_${entry.id}`}
          className="flatpickr input-select"
          type="text"
          value={entry.pay_date}
          readOnly
        />
      </div>
      <div className="col-span-5 sm:col-span-2 flex items-center space-x-4">
        <div className="flex flex-1 flex-row items-center">
          <span className="font-bold text-gray-500 mr-2">$</span>
          <InputNumber
            name={`amount_${entry.amount}`}
            step={1}
            value={entry.amount / 100}
            onChange={evt => amountChanged(evt)}
          />
        </div>
        <button className="btn-red btn-md self-stretch my-1" onClick={evt => deleteClicked(evt)}>
          <XIcon className="h-6 w-6" />
        </button>
      </div>
    </>
  )
}

export default PaymentScheduleEditRow