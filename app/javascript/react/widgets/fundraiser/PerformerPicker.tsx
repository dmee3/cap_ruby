import React, { useMemo, useState } from 'react'
import PerformerCard, { Performer } from '../../components/PerformerCard'
import Button from '../../components/Button'
import Field, { TextInput } from '../../components/Field'

type PerformerPickerProps = {
  performers: Performer[]
}

/**
 * "Who are you supporting?" — the list a donor lands on when they didn't
 * arrive by someone's share link.
 *
 * Completed performers stay in the list, muted and non-tappable: a finished
 * calendar should read as good news, and filtering them out would hide almost
 * nobody anyway (a completed fundraiser immediately reopens as a fresh one).
 */
const PerformerPicker = ({ performers }: PerformerPickerProps) => {
  const [query, setQuery] = useState('')

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle === '') return performers

    // Name, ensemble or section — a donor may only remember "the snare kid".
    return performers.filter((p) =>
      [p.name, p.ensemble, p.section]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [performers, query])

  return (
    <div className="flex flex-col gap-[18px]">
      <h2 className="m-0 text-[24px] font-bold leading-[30px] tracking-tight text-primary">
        Who are you supporting?
      </h2>

      {/* A real labelled input: the canvas drew a styled div, which nothing can
          type into and no screen reader can name. */}
      <div className="max-w-[420px]">
        <Field label="Search performers by name or section" id="performer-search" hideLabel>
          <TextInput
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or section"
            className="w-full"
          />
        </Field>
      </div>

      {matches.length > 0 ? (
        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
          {matches.map((performer) => (
            <PerformerCard key={performer.token} performer={performer} />
          ))}
        </div>
      ) : (
        // The canvas never drew a no-results state, but a search box without
        // one leaves a donor staring at an empty page.
        <div className="card flex flex-col gap-2">
          <span className="text-h3 text-primary">No performers match "{query}"</span>
          <p className="m-0 text-body text-secondary">
            Try a first name, or clear the search to see everyone.
          </p>
          <Button variant="secondary" className="self-start" onClick={() => setQuery('')}>
            Show everyone
          </Button>
        </div>
      )}
    </div>
  )
}

export default PerformerPicker
