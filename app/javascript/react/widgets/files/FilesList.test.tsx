import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import FilesList from './FilesList'

const jsonResponse = (body: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response)

describe('FilesList', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lists folders before files, each alphabetical', async () => {
    vi.mocked(fetch).mockReturnValue(
      jsonResponse([
        { id: '2', name: 'Show Music.pdf', file_type: 'pdf' },
        { id: '3', name: 'Auxiliary', file_type: 'folder' },
        { id: '1', name: 'Drill Charts', file_type: 'folder' }
      ])
    )

    render(<FilesList expanded />)

    await waitFor(() => expect(screen.getByText('Drill Charts')).toBeInTheDocument())
    const names = screen.getAllByText(/Drill Charts|Auxiliary|Show Music\.pdf/)
    expect(names.map(n => n.textContent)).toEqual([
      'Auxiliary',
      'Drill Charts',
      'Show Music.pdf'
    ])
  })

  // The old handler only logged to the console and never cleared loading, so a
  // failed fetch left the skeleton shimmering for as long as the tab was open.
  it('shows a retry instead of shimmering forever when the call fails', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ error: 'drive_unavailable' }, 502))

    const { container } = render(<FilesList expanded />)

    await waitFor(() => expect(screen.getByText("Can't load")).toBeInTheDocument())
    expect(container.querySelector('.animate-pulse')).toBeNull()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('refetches when the retry is pressed', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(jsonResponse({ error: 'drive_unavailable' }, 502))
      .mockReturnValueOnce(jsonResponse([{ id: '1', name: 'Recovered.pdf', file_type: 'pdf' }]))

    render(<FilesList expanded />)

    await waitFor(() => expect(screen.getByText("Can't load")).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => expect(screen.getByText('Recovered.pdf')).toBeInTheDocument())
  })

  it('separates an unconfigured season from an empty one', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ error: 'unconfigured_season' }, 404))

    render(<FilesList expanded seasonLabel="the 2026 season" />)

    await waitFor(() =>
      expect(screen.getByText(/No files have been set up/)).toBeInTheDocument()
    )
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
  })

  it('names the season it found nothing for', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse([]))

    render(<FilesList expanded seasonLabel="the 2026 season" />)

    await waitFor(() =>
      expect(screen.getByText(/Nothing here for the 2026 season yet/)).toBeInTheDocument()
    )
  })

  it('never names Drive to the member', async () => {
    vi.mocked(fetch).mockReturnValue(
      jsonResponse([{ id: '1', name: 'Show Music.pdf', file_type: 'pdf' }])
    )

    const { container } = render(<FilesList expanded />)

    await waitFor(() => expect(screen.getByText('Show Music.pdf')).toBeInTheDocument())
    expect(container.textContent).not.toMatch(/Drive/i)
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('shows only the first few rows when a dashboard asks for a peek', async () => {
    vi.mocked(fetch).mockReturnValue(
      jsonResponse([
        { id: '1', name: 'Drill Charts', file_type: 'folder' },
        { id: '2', name: 'Show Music.pdf', file_type: 'pdf' },
        { id: '3', name: 'Rehearsal Schedule.xlsx', file_type: 'sheet' },
        { id: '4', name: 'Uniform Sizes.xlsx', file_type: 'sheet' }
      ])
    )

    render(<FilesList expanded limit={3} />)

    await waitFor(() => expect(screen.getByText('Drill Charts')).toBeInTheDocument())
    expect(screen.queryByText('Uniform Sizes.xlsx')).not.toBeInTheDocument()
  })
})
