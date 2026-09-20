import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import SeasonRoleBlock, { SeasonRow } from './SeasonRoleBlock'

const season = { id: 7, year: '2026', current: true, vet: false }
const props = {
  season,
  ordinal: 1,
  roles: ['member', 'staff', 'coordinator', 'admin'],
  ensembles: ['World', 'CC2'],
  sections: ['Snare', 'Visual'],
  wasOn: false,
  onChange: vi.fn(),
}

const memberRow: SeasonRow = { season_id: 7, role: 'member', ensemble: 'World', section: 'Snare' }

describe('SeasonRoleBlock removal', () => {
  const removedRow: SeasonRow = {
    id: 3, season_id: 7, role: 'removed', ensemble: 'World', section: 'Snare', removed: true,
  }

  it('says dues stop here when a season is staged for removal', () => {
    render(<SeasonRoleBlock {...props} row={null} wasOn />)

    expect(screen.getByText(/Will be removed on save/i)).toBeTruthy()
    expect(screen.getByText(/cut to what they have already paid/i)).toBeTruthy()
  })

  it('marks a season they were already removed from', () => {
    render(<SeasonRoleBlock {...props} row={removedRow} wasOn />)

    expect(screen.getByText('Removed')).toBeTruthy()
    expect(screen.queryByText(/Will be removed on save/i)).toBeNull()
  })

  // Restoring gives back the membership, not the schedule — there is no honest
  // way to guess what someone returning mid-season now owes.
  it('warns that the schedule needs rebuilding when restoring someone', () => {
    render(
      <SeasonRoleBlock {...props} row={{ ...removedRow, role: 'member' }} wasOn />
    )

    expect(screen.getByText(/rebuild it after saving/i)).toBeTruthy()
  })
})

describe('SeasonRoleBlock', () => {
  it('collapses to a single row when the season is off', () => {
    render(<SeasonRoleBlock {...props} row={null} />)

    expect(screen.getByText(/in the org that season/i)).toBeTruthy()
    expect(screen.queryByText('Role this season')).toBeNull()
  })

  // Guards the blank-role seasons_users row the old form allowed.
  it('preselects Member when a season is toggled on', () => {
    const onChange = vi.fn()
    render(<SeasonRoleBlock {...props} row={null} onChange={onChange} />)

    fireEvent.click(screen.getByRole('switch'))

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ season_id: 7, role: 'member' })
    )
  })

  it('shows ensemble and section only for members', () => {
    const { rerender } = render(<SeasonRoleBlock {...props} row={memberRow} />)
    expect(screen.getByText('Ensemble')).toBeTruthy()

    rerender(<SeasonRoleBlock {...props} row={{ ...memberRow, role: 'staff' }} />)
    expect(screen.queryByText('Ensemble')).toBeNull()
    expect(screen.getByText(/apply to staff/i)).toBeTruthy()
  })

  // A disabled select submits nothing, so the old values would otherwise stay
  // in the database when someone moves from member to staff.
  it('clears ensemble and section when the role leaves member', () => {
    const onChange = vi.fn()
    render(<SeasonRoleBlock {...props} row={memberRow} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'staff' }))

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'staff', ensemble: '', section: '' })
    )
  })

  it('stages a removal rather than dropping the block outright', () => {
    render(<SeasonRoleBlock {...props} row={null} wasOn />)

    expect(screen.getByText('Will be removed on save')).toBeTruthy()
    expect(screen.getByRole('button', { name: /keep them on the roster/i })).toBeTruthy()
  })

  it('names the season ordinal and vet status without a pronoun', () => {
    render(<SeasonRoleBlock {...props} season={{ ...season, vet: true }} ordinal={3} row={memberRow} />)

    expect(screen.getByText('3rd season · Vet')).toBeTruthy()
  })
})
