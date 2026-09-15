import React from 'react'
import ReactDOM from 'react-dom'

import DonationCheckout from '../../react/widgets/fundraiser/DonationCheckout'

const mount = document.getElementById('donation-checkout')

if (mount) {
  ReactDOM.render(
    <DonationCheckout
      performer={JSON.parse(mount.dataset.performer || '{}')}
      dates={JSON.parse(mount.dataset.dates || '[]')}
      totalCents={Number(mount.dataset.totalCents || 0)}
      stripeKey={mount.dataset.stripeKey || ''}
      datesPath={mount.dataset.datesPath || ''}
    />,
    mount,
  )
}
