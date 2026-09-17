import React from 'react'
import { render } from 'react-dom'
import WhistleblowerForm, { WhistleblowerFormData } from '../../react/widgets/WhistleblowerForm'
import Utilities from '../../utilities/utilities'

const el = document.getElementById('whistleblower-form')

if (el && el.dataset.whistleblowerForm) {
  try {
    const data = JSON.parse(el.dataset.whistleblowerForm) as WhistleblowerFormData
    render(<WhistleblowerForm data={data} csrfToken={Utilities.getAuthToken()} />, el)
  } catch (e) {
    console.error('Whistleblower form failed to parse', e)
    el.innerHTML =
      '<p class="rounded-md border border-border-default bg-surface p-5 text-body-sm text-secondary">' +
      "We couldn't load this form. Refresh, or try again in a minute.</p>"
  }
}
