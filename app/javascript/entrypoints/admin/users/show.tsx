import React from 'react'
import { render } from 'react-dom'
import Member360, { Member360Data } from '../../../react/widgets/admin/Member360'
import Utilities from '../../../utilities/utilities'

const el = document.getElementById('member-360')

if (el && el.dataset.memberDetail) {
  try {
    const data = JSON.parse(el.dataset.memberDetail) as Member360Data
    render(<Member360 data={data} csrfToken={Utilities.getAuthToken()} />, el)
  } catch (e) {
    console.error('Member 360 failed to parse', e)
    el.innerHTML =
      '<p class="rounded-md border border-border-default bg-surface p-5 text-body-sm text-secondary">' +
      "We couldn't load this member's details. Refresh, or try again in a minute.</p>"
  }
}
