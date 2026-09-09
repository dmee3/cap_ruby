import React from 'react'
import { render } from 'react-dom'
import Member360, { Member360Data } from '../../../react/widgets/admin/Member360'
import Utilities from '../../../utilities/utilities'

const el = document.getElementById('member-360')

if (el && el.dataset.member360) {
  try {
    const data = JSON.parse(el.dataset.member360) as Member360Data
    render(<Member360 data={data} csrfToken={Utilities.getAuthToken()} />, el)
  } catch (e) {
    // Leave the skeleton in place; the page is still navigable.
    console.error('Member 360 failed to parse', e)
  }
}
