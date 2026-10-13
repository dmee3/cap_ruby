import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { Table, Td, Tr } from './Table'

const row = () =>
  render(
    <Table>
      <tbody>
        <Tr href="/admin/users/7">
          <Td>
            <a href="/admin/users/7">Ada Lovelace</a>
          </Td>
          <Td>World / Snare</Td>
          <Td>
            <button type="button">Copy email</button>
          </Td>
        </Tr>
      </tbody>
    </Table>
  )

describe('Tr with an href', () => {
  const assign = vi.fn()

  beforeEach(() => {
    assign.mockReset()
    vi.stubGlobal('location', { ...window.location, assign })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('opens the detail page from anywhere on the row', async () => {
    row()
    await userEvent.click(screen.getByText('World / Snare'))
    expect(assign).toHaveBeenCalledWith('/admin/users/7')
  })

  it('leaves a click on a control in the row to that control', async () => {
    row()
    await userEvent.click(screen.getByRole('button', { name: 'Copy email' }))
    await userEvent.click(screen.getByRole('link', { name: 'Ada Lovelace' }))
    expect(assign).not.toHaveBeenCalled()
  })

  it('lets a modified click through, so cmd-click can still open a tab via the link', () => {
    row()
    fireEvent.click(screen.getByText('World / Snare'), { metaKey: true })
    expect(assign).not.toHaveBeenCalled()
  })
})
