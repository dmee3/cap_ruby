import React from 'react'
import { render } from 'react-dom'
import UserForm, { UserFormData } from '../../../react/widgets/admin/UserForm'
import Utilities from '../../../utilities/utilities'

const el = document.getElementById('user-form')

if (el && el.dataset.userForm) {
  try {
    const data = JSON.parse(el.dataset.userForm) as UserFormData
    render(<UserForm data={data} csrfToken={Utilities.getAuthToken()} />, el)
  } catch (e) {
    console.error('User form failed to parse', e)
    el.innerHTML =
      '<p class="rounded-md border border-border-default bg-surface p-5 text-body-sm text-secondary">' +
      "We couldn't load this form. Refresh, or try again in a minute.</p>"
  }
}
