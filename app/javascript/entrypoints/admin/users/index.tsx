import React from 'react'
import { render } from 'react-dom'
import UserTable from '../../../react/widgets/admin/UserTable'

const el = document.getElementById('users')

if (el) {
  render(<UserTable seasonYear={el.dataset.seasonYear ?? ''} />, el)
}
