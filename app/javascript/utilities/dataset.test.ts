import { describe, it, expect } from 'vitest'

/**
 * Regression guard for a silent mount failure.
 *
 * `data-member-360` does NOT become `dataset.member360`. The dataset
 * camel-casing rule only uppercases the character after a hyphen when it's a
 * letter; `-3` stays `-3`, so the key keeps its hyphens and is only reachable
 * via bracket access. An entrypoint guarded on `el.dataset.member360` reads
 * `undefined`, bails, and renders nothing — with no console error.
 *
 * The fix is to keep digits out of data attribute names. This test pins the
 * behaviour so nobody reintroduces one.
 */
describe('dataset key conversion', () => {
  it('does not camel-case a hyphen followed by a digit', () => {
    const el = document.createElement('div')
    el.setAttribute('data-member-360', 'payload')

    expect(el.dataset.member360).toBeUndefined()
    expect(el.dataset['member-360']).toBe('payload')
  })

  it('camel-cases a hyphen followed by a letter, as expected', () => {
    const el = document.createElement('div')
    el.setAttribute('data-just-created', '42')
    el.setAttribute('data-member-detail', 'payload')

    expect(el.dataset.justCreated).toBe('42')
    expect(el.dataset.memberDetail).toBe('payload')
  })

  it('every data attribute this app mounts on resolves via dot access', () => {
    const el = document.createElement('div')
    const names = [
      'data-stats',
      'data-burndown',
      'data-behind-members',
      'data-recent-payments',
      'data-blank-schedule-members',
      'data-conflicts-to-review',
      'data-season-label',
      'data-payment-types',
      'data-just-created',
      'data-members',
      'data-initial',
      'data-server-errors',
      'data-preselected-user-id',
      'data-member-detail',
      'data-editor',
    ]
    names.forEach((n) => el.setAttribute(n, 'x'))

    const camel = (n: string) =>
      n.replace(/^data-/, '').replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())

    names.forEach((n) => {
      expect(el.dataset[camel(n)], `${n} should be reachable as dataset.${camel(n)}`).toBe('x')
    })
  })
})
