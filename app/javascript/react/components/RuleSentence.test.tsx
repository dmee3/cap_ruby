import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import RuleSentence, { RuleSentenceText, operatorLabel } from './RuleSentence'

const items = [
  { id: 1, name: 'Keyboard mallets' },
  { id: 2, name: 'Tenor heads' },
]
const recipients = [{ id: 9, name: 'Dana Reyes' }]

const setup = () => {
  const onChange = vi.fn()
  render(
    <RuleSentence
      items={items}
      recipients={recipients}
      itemId={1}
      operator="lt_eq"
      threshold={8}
      recipientId={9}
      onChange={onChange}
    />,
  )
  return { onChange }
}

describe('RuleSentence', () => {
  // The standing rule: native controls, not styled spans with a chevron.
  it('uses real form controls for every slot', () => {
    setup()

    expect(screen.getByRole('combobox', { name: 'Item' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Condition' })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Threshold' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Who to email' })).toBeInTheDocument()
  })

  it('offers the five operators in plain language, never as enum names', () => {
    setup()

    const options = screen
      .getAllByRole('option')
      .map((o) => o.textContent)
      .filter(Boolean)

    expect(options).toEqual(expect.arrayContaining([
      'is exactly',
      'is below',
      'is at or below',
      'is above',
      'is at or above',
    ]))
    expect(options).not.toEqual(expect.arrayContaining(['lt_eq', 'gt_eq', 'eq']))
  })

  it('reports the stored enum value when the wording is chosen', async () => {
    const { onChange } = setup()

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Condition' }), 'gt')

    expect(onChange).toHaveBeenCalledWith({ operator: 'gt' })
  })

  it('reports a numeric threshold', async () => {
    const { onChange } = setup()

    await userEvent.type(screen.getByRole('spinbutton', { name: 'Threshold' }), '2')

    expect(onChange).toHaveBeenCalledWith({ threshold: 82 })
  })
})

describe('RuleSentenceText', () => {
  it('reads as a sentence', () => {
    render(
      <RuleSentenceText
        itemName="Keyboard mallets"
        operator="lt_eq"
        threshold={8}
        recipientName="Dana Reyes"
      />,
    )

    expect(screen.getByText(/When/)).toBeInTheDocument()
    expect(screen.getByText('Keyboard mallets')).toBeInTheDocument()
    expect(screen.getByText('is at or below 8')).toBeInTheDocument()
    expect(screen.getByText('Dana Reyes')).toBeInTheDocument()
  })
})

describe('operatorLabel', () => {
  it('translates every stored operator', () => {
    expect(operatorLabel('eq')).toBe('is exactly')
    expect(operatorLabel('lt')).toBe('is below')
    expect(operatorLabel('lt_eq')).toBe('is at or below')
    expect(operatorLabel('gt')).toBe('is above')
    expect(operatorLabel('gt_eq')).toBe('is at or above')
  })
})
