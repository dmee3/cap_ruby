import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import StatBlock from './StatBlock'
import DuesMeter from './DuesMeter'

const meta = {
  title: 'Components/Metrics',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const StatBlocks: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatBlock kicker="Expected by today" metric="$39,870" context="of $57,600 this season" />
      <StatBlock kicker="Collected so far" metric="$36,120" context="$3,750 short of the plan" trend="−9%" tone="warning" />
      <StatBlock kicker="Members behind" metric="0" context="of 42" threshold={0} />
      <StatBlock kicker="Members behind" metric="7" context="of 42" threshold={7} />
    </div>
  ),
}

const meter = (state: React.ComponentProps<typeof DuesMeter>['state'], paid: number, extra = {}) => (
  <div className="card flex flex-col gap-2">
    <span className="text-label uppercase text-secondary">{state}</span>
    <DuesMeter state={state} paidCents={paid} totalCents={140_000} expectedCents={70_000} showLabel {...extra} />
  </div>
)

export const DuesMeterStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {meter('on-track', 70_000)}
      {meter('ahead', 105_000)}
      {meter('behind', 40_000, { committedCents: 30_000, committedKind: 'past-due' })}
      {meter('pending', 70_000, { committedCents: 35_000, committedKind: 'pending' })}
      {meter('paid-in-full', 140_000)}
      {meter('no-schedule', 0)}
    </div>
  ),
}
