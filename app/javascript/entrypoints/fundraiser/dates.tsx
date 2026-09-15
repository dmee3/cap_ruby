import React from 'react'
import ReactDOM from 'react-dom'

import DatePicker from '../../react/widgets/fundraiser/DatePicker'
import ProgressMeter from '../../react/components/ProgressMeter'

const progressMount = document.getElementById('performer-progress')

if (progressMount) {
  ReactDOM.render(
    <ProgressMeter
      raisedCents={Number(progressMount.dataset.raisedCents || 0)}
      goalCents={Number(progressMount.dataset.goalCents || 0)}
      onDark
    />,
    progressMount,
  )
}

const mount = document.getElementById('date-picker')

if (mount) {
  ReactDOM.render(
    <DatePicker
      performer={JSON.parse(mount.dataset.performer || '{}')}
      claimedDates={JSON.parse(mount.dataset.claimed || '[]')}
      checkoutPath={mount.dataset.checkoutPath || ''}
    />,
    mount,
  )
}
