import React from 'react'
import ReactDOM from 'react-dom'

import Receipt from '../../react/components/Receipt'
import ShareCalendar from '../../react/widgets/fundraiser/ShareCalendar'

const receiptMount = document.getElementById('donation-receipt')

if (receiptMount) {
  const d = receiptMount.dataset

  ReactDOM.render(
    <Receipt
      dates={JSON.parse(d.dates || '[]')}
      totalCents={Number(d.totalCents || 0)}
      donorName={d.donorName || null}
      cardBrand={d.cardBrand || null}
      cardLast4={d.cardLast4 || null}
      email={d.email || null}
      chargedOn={d.chargedOn || null}
    />,
    receiptMount,
  )
}

const shareMount = document.getElementById('share-calendar')

if (shareMount) {
  ReactDOM.render(
    <ShareCalendar
      shareUrl={shareMount.dataset.shareUrl || ''}
      firstName={shareMount.dataset.firstName || 'them'}
    />,
    shareMount,
  )
}
