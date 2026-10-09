// Headers for requests to the app's own endpoints. Rails refuses a
// non-GET without the page's CSRF token.

export const csrfToken = (): string =>
  document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''

/** For a PUT or DELETE with no body. */
export const csrfHeaders = () => ({ 'X-CSRF-Token': csrfToken() })

/** For a request that sends JSON and expects JSON back. */
export const jsonHeaders = () => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  ...csrfHeaders(),
})
