import React from 'react'
import { render } from 'react-dom'
import AddPaymentForm, {
  AddPaymentMember,
  AddPaymentType,
} from '../../../react/widgets/admin/AddPaymentForm'
import Utilities from '../../../utilities/utilities'

const el = document.getElementById('add-payment')

const parse = <T,>(raw: string | undefined, fallback: T): T => {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

if (el) {
  const d = el.dataset
  const preselected = d.preselectedUserId ? Number(d.preselectedUserId) : undefined

  render(
    <AddPaymentForm
      members={parse<AddPaymentMember[]>(d.members, [])}
      paymentTypes={parse<AddPaymentType[]>(d.paymentTypes, [])}
      preselectedUserId={Number.isFinite(preselected) ? preselected : undefined}
      csrfToken={Utilities.getAuthToken()}
      serverErrors={parse<string[]>(d.serverErrors, [])}
      initial={parse<{
        paymentTypeId?: number
        amountCents?: number | null
        datePaid?: string
        notes?: string
      }>(d.initial, {})}
    />,
    el,
  )
}
