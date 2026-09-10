import React from 'react'
import { render } from 'react-dom'
import AddPaymentForm, {
  AddPaymentMember,
  AddPaymentType,
} from '../../../react/widgets/admin/AddPaymentForm'
import Utilities from '../../../utilities/utilities'

const el = document.getElementById('edit-payment')

const parse = <T,>(raw: string | undefined, fallback: T): T => {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

if (el) {
  const d = el.dataset
  const editing = parse<{ id: number; originalAmountCents: number } | null>(d.editing, null)

  if (editing) {
    render(
      <AddPaymentForm
        members={parse<AddPaymentMember[]>(d.members, [])}
        paymentTypes={parse<AddPaymentType[]>(d.paymentTypes, [])}
        csrfToken={Utilities.getAuthToken()}
        serverErrors={parse<string[]>(d.serverErrors, [])}
        initial={parse<{
          userId?: number
          paymentTypeId?: number
          amountCents?: number | null
          datePaid?: string
          notes?: string
        }>(d.initial, {})}
        editing={editing}
      />,
      el,
    )
  }
}
