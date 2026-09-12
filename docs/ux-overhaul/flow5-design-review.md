# Flow 5 — Conflict triage: design review

Review of the Claude Design canvas (`Flow 5 - Conflict triage.dc.html`, ~219KB /
1,779 lines, no `<dc-import>` siblings) synced 2026-09-11, against the Rails
codebase at `main` (`9f98f0c`). This is the step-4 "verify assumptions before
planning the build" pass, the same one that caught 4 latent bugs in Flow 2 and
three design errors in Flow 4.

Mock context: "today" is **Tue 3/10/26**, season **Spring 2026**, **24 members**,
viewer **Sam Ortiz** (a coordinator).

**Decisions taken with the user before planning:**
1. **Collapse strategy — shared API + shared widget, both URLs kept.** One
   `/api/conflicts` gated on `redirect_if_not('admin', 'coordinator')` (the
   helper already takes a splat), one React widget parameterized by `basePath`
   + capability flags, one shared `_form` partial. `/admin/conflicts` and
   `/coordinators/conflicts` stay as thin shells. No URL moves.
2. **The date-filter bug is fixed in this flow**, in the backend phase, together
   with the range-operator correction and a regression spec.
3. **No approve/deny email is built in this flow.** The canvas's copy assumes
   one throughout (see #18 below); the copy gets rewritten and the email is
   filed as a followup bead.

---

## The headline findings

1. **The API date-range filter is dead code — proven, not inferred.**
   `Api::Admin::ConflictsController#start_param` / `#end_param` (and their
   byte-identical `Api::Coordinators` twins) parse `params[:start]` / `params[:end]`
   on one line, *discard the result*, and unconditionally return a hardcoded
   `DateTime.parse('2000-01-01')` / `'2030-01-01'` on the next:

   ```ruby
   def start_param
     DateTime.parse(params[:start]) if params[:start]   # result thrown away
     DateTime.parse('2000-01-01')                       # always this
   end
   ```

   Verified by probe request spec: requesting a **one-week** window returned a
   conflict **~300 days out**. Any date-scoped queue or calendar filtering the
   design assumes **does not filter today**. The params are accepted and
   silently ignored, which is worse than a 400.

2. **Admin and coordinator conflict code is duplicated end to end — and the
   role gate is an exact match, not a hierarchy.** `redirect_if_not` does
   `Array.wrap(roles).include?(current_user_role)` where `current_user_role` is
   the single `role_for(season)` string. So an **admin is redirected away from
   `/coordinators/conflicts`**, and a coordinator away from `/admin/conflicts`.
   The two copies are not stylistic drift; each role can only reach its own.
   Measured duplication:

   | Layer | Difference between the admin and coordinator copies |
   |---|---|
   | `Api::{Admin,Coordinators}::ConflictsController` | module name + one `render(json:)` paren style. Otherwise identical, bug included. |
   | `{Admin,Coordinators}::ConflictsController` | module name, `render('<ns>/conflicts/…')` paths, redirect target. Otherwise identical. |
   | `app/views/{admin,coordinators}/conflicts/_form.html.erb` | **byte-identical** (`diff` exits 0). |
   | `entrypoints/{admin,coordinators}/conflicts/index.tsx` | a component name + **five URL slugs**. Nothing else. |
   | `ConflictCalendar.tsx` | already one component; branches on a `coordinator: boolean` prop solely to pick the slug. |

   See "Open decision 1" below — this is the flow's main architectural call.

3. **There is no approve/deny email today.** The only conflict email is
   `EmailService.send_conflict_submitted_email`, which fires when a *member
   submits* and notifies **coordinators + admins** (`User.with_role_for_season`).
   Nothing notifies the member when their conflict is approved or denied. If the
   canvas copy implies "they'll be told", that is **new build**, not wiring.

4. **A decision audit trail already exists and is unused by the UI.**
   `ActivityLogger.log_conflict` (called from every update action) writes an
   `Activity` row: `"Conflict for Fri, 3/14 06:30 PM marked approved"`, with
   `created_by_id` = the deciding user and `activity_type: 'conflict'`. A
   "decided by X on Y" line needs **no new columns** — only a read path.

---

## Verified against the codebase

### Confirmed — the design's assumption matches reality

| # | Assumption | Finding |
|---|---|---|
| 1 | **No hard delete on conflicts** | Confirmed twice over: `Conflict` is `acts_as_paranoid`, and both HTML routes are `resources :conflicts, except: %i[show destroy]` (`routes.rb:62,80`) — there is no `show` action either. "Getting rid of" a conflict means setting status to **Resolved**; the existing UI already does exactly that (an `ArchiveBoxXMarkIcon` button wired to `resolveConflict`). The design must not imply a delete. |
| 2 | **`PUT /api/{admin,coordinators}/conflicts/:id` is sufficient for inline decisions** | Confirmed — it already permits `status_id` and is already used this way. The current entrypoint's `approveConflict` / `denyConflict` / `resolveConflict` each look up the status id by name from `/api/conflict_statuses` and `PUT` `{ conflict: { status_id } }`. **No new endpoint is needed.** A lighter dedicated endpoint is *not* worth adding (see "Open decision 2"). |
| 3 | **Inline approve/deny is an evolution, not net-new plumbing** | The pending queue with inline approve/deny/resolve **already exists** — `ConflictList` with an `actions` array of icon-only buttons, above the calendar. The redesign improves its presentation, grouping and feedback, and does not have to invent the mechanism. |
| 4 | **Status vocabulary is Pending / Approved / Denied / Resolved** | Confirmed in `db/seeds.rb:92–95`. `ConflictStatus` is a bare `id`/`name` table with no code constants, read via `GET /api/conflict_statuses`. `StatusPill` (Flow 1) already maps all four to tones (warning / success / danger / neutral), and falls back to neutral on an unknown string — the vocabulary can grow safely. `utilities/status_color.ts` maps the same four for the calendar (yellow / green / red / grey). |
| 5 | **`ConflictPresenter.rows_for` produces the §4.19 row shape** | Confirmed — `{ id, date_range_label, time_range_label, status, relative_subline, reason }`, with the "reason only on Denied or the next upcoming" rule baked in server-side. |
| 6 | **Statuses/labels are derived, not stored** | `conflicts` has only `user_id, start_date, end_date, reason, status_id, season_id, deleted_at, timestamps`. No reviewer, decided-at, priority, or notes column. Every label the design shows beyond those is derived or new. |

### Needs a decision or new code

| # | Assumption | Finding / action |
|---|---|---|
| 7 | **Date-scoped queue/calendar filtering works** | **Wrong — see headline #1.** Fix is small (return the parsed value, fall back only when the param is absent/unparseable), but note the comparisons are also **strict and one-sided**: `where('start_date > ?', start).where('end_date < ?', end)` excludes any conflict *straddling* a boundary — a conflict spanning the whole visible month disappears from that month's view. Correct range overlap is `start_date <= range_end AND end_date >= range_start`. Fixing the discard without fixing the operators produces a *new*, subtler bug. |
| 8 | **A "grouped by member" queue can reuse `ConflictPresenter.rows_for`** | Nearly — `rows_for` carries **no member name or section**, because Flow 3 built it for a single member's own list. Two existing callers already bolt the name on: `Admin::DashboardController#conflicts_to_review` does `row.merge(member: conflicts[i].user.full_name)` (note: a fragile index-based `map.with_index` pairing), and `Admin::Member360Presenter#conflict_rows` reshapes the subline. **Recommendation:** fold an optional `member:` / `section:` into `ConflictPresenter` itself (opt-in arg), and collapse the index-paired merge. Four callers exist today (`members/dashboard`, `members/conflicts`, `admin/dashboard`, `member360`) — all must keep their current output. |
| 9 | **Flow 4 already shipped a "needs a decision" queue on the admin dashboard** | `Admin::DashboardController#conflicts_to_review` — future Pending conflicts, oldest start first, rendered from `ConflictPresenter` rows + member name, surfaced as `data-conflicts-to-review` on the dashboard. Flow 5's queue must **reconcile with this**, not duplicate it: ideally the dashboard card and the full triage queue render the same component from the same shape. |
| 10 | **The calendar shows all conflicts** | It does not. `ConflictCalendar` **silently drops Denied and Resolved** (`.filter(c => c.status.name !== 'Denied' && c.status.name !== 'Resolved')`) with no legend or toggle saying so. If the redesign presents the calendar as "the same dataset, a different view", this hidden filter must become an explicit, visible control. |
| 11 | **The coordinator dashboard shows an upcoming-conflicts list** | It renders a **whole second `FullCalendar`** inside a card titled "UPCOMING CONFLICTS" (`entrypoints/coordinators/index.tsx` mounts `ConflictCalendar` into `#upcoming-conflicts`). So `/coordinators` fetches the entire conflict set and draws a month grid in a dashboard card. The coordinator dashboard rebuild replaces this outright. |
| 12 | **Empty states exist** | They do not. `ConflictList` does `if (conflicts.length === 0) return null` — an empty queue renders **literally nothing**, no heading, no "nothing to review". Its test suite pins this (`'returns null when no conflicts'`), so that spec changes when the empty state lands. |
| 13 | **Conflict creation returns you to the list** | It does not. Both `#create` actions `redirect_to(root_url)` on success — create a conflict from `/coordinators/conflicts/new` and you land on the **dashboard**, not back on the list you came from. Small existing wart worth fixing while in here. |
| 14 | **Tooltips are accessible** | No. `displayTooltip` builds a `<div>` imperatively and `prepend`s it into the FullCalendar event element on `eventMouseEnter` — **mouse-only**, no keyboard or screen-reader path, no `role="tooltip"`, and it only works in `dayGridMonth`. The audit already flags this; any hover-reveal in the design needs a real focus-reachable treatment. |
| 15 | **Season scoping** | `for_season(current_season['id'])` throughout, where `current_season` is `ApplicationController`'s cookie-backed season (**`Season.current` does not exist** — `cap_ruby-w9r`, despite CLAUDE.md). Triage screens must stay season-scoped and follow the shell's switcher. |
| 16 | **`skip_future_date_validation`** | `Conflict` validates `future_dates_only` **on create only**; admin/coordinator `#create` sets `skip_future_date_validation = true` so staff can backfill past conflicts. Updates never run it. Relevant if the design offers date editing inline: editing dates into the past is already permitted server-side. |
| 17 | **Rehearsal dates can be shown behind the conflicts** (if the calendar implies it) | **Flow 3's constraint still holds.** `Event` exists as a model and table (`id, season_id, name, start_date, end_date` — no location, no type, no ensemble scoping), but the **only** query against it in the entire app is `EventService.next_event`, which returns a single row for the dashboards. There is no listing, no admin CRUD, no seed path, and no way for staff to populate it. A calendar that shades rehearsal days is therefore **new build on a table nobody fills** — treat it as out of scope for this flow unless the user says otherwise. |

---

## Existing test coverage (the bar to match)

| File | Covers |
|---|---|
| `spec/requests/conflicts_spec.rb` (298 lines) | member submit incl. the flat `conflict[start_date_date]` browser param shape, past-date rejection, form repopulation, submissions-closed state + direct-POST rejection, coordinator approve (HTML + API), admin index/edit/API update, past-date creation |
| `spec/services/conflict_presenter_spec.rb` | the row shape and label rules |
| `spec/models/conflict_spec.rb` | validations |
| `ConflictList.test.tsx`, `ConflictListItem.test.tsx`, `ConflictContextRow.test.tsx` | list rendering, filtering, show-past toggle, row shape |

**Gap that let the bug live:** nothing asserts the API's `start`/`end` params do
anything. Any fix ships with a spec that requests a narrow window and asserts a
row outside it is absent.

---

## Open decisions for the user

### 1. How the admin/coordinator duplication collapses

Three viable shapes, in increasing order of blast radius:

- **A — Shared concern + shared partial, keep both namespaces.** Extract the
  controller body into a `ConflictTriage` concern included by both; use one
  shared `_form` partial; parameterize the React entrypoint by `basePath` and
  mount it from both views. Routes and URLs unchanged. *Lowest risk, keeps the
  URL surface, leaves two thin controllers.*
- **B — One `/conflicts` namespace for both roles.** A single controller gated
  on `redirect_if_not('admin', 'coordinator')` (the helper already accepts a
  splat of roles, so this works today), one API endpoint, one entrypoint, with
  role differences expressed as capabilities in the payload. *Cleanest end
  state; changes URLs, so every inbound link, the nav, and any bookmark/email
  link moves; also merges the admin-only ensemble/section view with the
  coordinator one.*
- **C — Shared API only.** Collapse `Api::{Admin,Coordinators}::ConflictsController`
  into one role-gated endpoint, leave the HTML screens as-is. *Fixes the
  date-filter bug in exactly one place; leaves the screen duplication.*

**Recommendation: B for the API and React layer, A for the HTML routes** — i.e.
one `/api/conflicts` endpoint gated on both roles, one React widget taking
`basePath` + capability flags, and both `/admin/conflicts` and
`/coordinators/conflicts` kept as thin shells rendering it. That removes every
real copy (the bug-bearing one included) without moving URLs users have
bookmarked. Needs the user's call before the plan hard-codes it.

### 2. Fix the date-filter bug in this flow, or spin it out?

**Recommendation: fix it in this flow, in the backend phase.** The design's
queue/calendar-as-two-views premise depends on date scoping actually working; a
followup bead would leave the flow's central interaction built on a filter that
silently returns everything. The fix is a few lines plus the overlap-operator
correction (#7) and a regression spec. If the user prefers to keep the flow
purely presentational, it spins out as its own bead — but then the calendar
keeps fetching the entire season on every view change.

---

## What's in the canvas

Nineteen artboards in six sections plus a component sheet and an assumptions
footer, all in one `.dc.html` (static divs/spans — no real `<table>`, `<input>`
or `<button>` semantics, same as Flow 4's canvas).

| Section | Screen | Artboards |
|---|---|---|
| 01 | Triage queue — `/coordinators/conflicts` + `/admin/conflicts` | desktop light (pending, one row expanded, 1360×1020); desktop dark (all-season scope) |
| 02 | Queue async states | loading / empty / error, light + dark (6 × 460px cards) |
| 03 | Triage calendar | desktop light (detail popover open, March 2026); desktop dark (April, denied+resolved shown) |
| 04 | Narrow screens | mobile 390px agenda light; tablet 820px agenda dark (decision-confirm + undo) |
| 05 | Edit & add in place | coordinator/admin edit (900px light); coordinator/admin add (dark); member edit + locked-row (light) |
| 06 | Coordinator dashboard `/coordinators` | desktop light (backlog); desktop dark (caught up) |
| 07 | Component sheet | light + dark |
| — | Footer | "What this flow decides" — 7 assumption cards |

**The flow's premise**, in the canvas's own words: "one dataset with two views, a
queue and a calendar, where every decision happens inline and the coordinator and
admin screens stop being two near-identical pages." Principles: queue is the
default view · decide inline, never a separate page · optimistic with a real undo
· one screen for coordinators and admins.

**Where the canvas is right about the app** (it did its homework):
- It keeps FullCalendar as the grid engine and preserves the "denied and resolved
  hidden by default" behavior — but makes it an explicit toggle, which is the
  correct resolution of finding #10.
- "No row offers a delete, because the routes have none" — it correctly derived
  the `except: %i[show destroy]` constraint and treats **Resolved as the archive**.
- "The queue reads from the same presenter" — it correctly targets
  `ConflictPresenter.rows_for` and states that grouping + per-member pending
  counts "are the only additions the endpoint needs."
- It **drops the next-event card** from the coordinator dashboard for the same
  reason Flow 4 did: no event data exists to design against (finding #17).
- "Nothing on this screen is admin-only, so the second controller is a route and
  a shell, not a second design" — exactly the collapse decision taken above.

---

## Design-vs-codebase conflicts (the corrections this pass exists to catch)

| # | Canvas assumption | Finding / action |
|---|---|---|
| 18 | **Approve and deny email the member** — pervasive: "Either way, Marcus gets an email with your decision.", "Approved. Marcus will get an email.", "Marcus gets an email either way.", "Changing the status here emails Wes, same as the buttons.", and the error state's "Nothing was sent to Marcus." The denial email is said to carry the denial note ("Jordan got this in the denial email"), and a member editing their own conflict is said to email coordinators. | **No such email exists** (headline #3). Per the user's decision, **this flow does not build it**: every one of these strings is rewritten to drop the email promise, and member-facing approve/deny notification is filed as a followup bead. Shipping the copy without the mailer would promise members something the app does not do. |
| 19 | **The confirm card's delayed-email job** — "the email is sent by a job that waits out the minute and reads the row's final status, so navigating away, closing the tab or changing your mind twice all end in one correct email." | Moot for this flow given #18, but note the design is *architecturally right*: a delayed job re-reading status at execution time is the correct way to reconcile an undo window with a notification. Carry this note onto the followup bead — Sidekiq is already in the stack. |
| 20 | **A denial note ("Why you denied it")** rendered on denied rows and carried into the email. | **No such column.** `conflicts` has `reason` only — that's the *member's* reason. A denial note is a new field. Compounded by the canvas contradicting itself: the footer says "Deny takes one click with no note required," yet no artboard shows where a note is ever entered. **Action: cut the denial note from this flow** (it has no capture path, no column, and no email to carry it). Defer with the email bead. |
| 21 | **Decision attribution — "you approved it 52 days ago", "You denied it 6 days ago"** | Derivable **without new columns**: `ActivityLogger.log_conflict` already writes an `Activity` with `created_by_id` and `activity_type: 'conflict'` (headline #4). Needs only a read path, and the "you" phrasing compares `created_by_id` to `current_user`. Cheaper than the canvas assumes — worth building. |
| 22 | **An `all_day` toggle** on the edit forms | **Not a column.** All-day is *derived* today — `ConflictPresenter.all_day?` tests `start_date.seconds_since_midnight.zero? && end_date.seconds_since_midnight >= 86_340`. A toggle is fine as a UI affordance that writes 00:00 / 23:59, but it must not imply a stored flag. Note the canvas omits the toggle from the **add** form while showing it on both edit forms — an inconsistency; include it consistently or not at all. |
| 23 | **Member self-edit of a pending conflict** (dates + reason, locked once decided) | **New build, and out of this flow's scope.** Members' routes are `only: %i[index new create]` (`routes.rb:93`) — there is no member `edit`/`update` action at all. The canvas footer admits this ("Today members can only add"). It is also a *member* screen, i.e. Flow 3 territory, not coordinator triage. **Action: cut from Flow 5, file as a bead.** The two member artboards (edit + locked row) are design work banked for later. |
| 24 | **A persisted per-user view preference** (Queue vs Calendar, "the choice persists per user") | No user-preference storage of any kind exists on `User`. **Action: `localStorage`**, not a column — it's a per-device display preference, and a migration for it is disproportionate. |
| 25 | **Server-side filters: status, when (upcoming/past/all season), date range, ensemble** | Only the (broken) date range exists. `status`, `when` and `ensemble` are all new params. Ensemble/section come from `seasons_users` via `user.ensemble_for(season_id)` — already loaded by the API's `includes(user: :seasons_users)`, so grouping and filtering by them is cheap. Allowlist every filter param; no interpolation. |
| 26 | **Per-scope counts on the filter pills** ("Pending · 5", "All · 9") | New — the endpoint must return counts for *unselected* scopes too, not just the filtered rows. One grouped count query. |
| 27 | **Per-member season counts** ("2 this season", "one other approved conflict this season") | New, and easy from the same season-scoped set already being fetched. |
| 28 | **Bulk "Approve both"** when a member has ≥2 pending, "confirms as one undoable action" | New. The current API is one-conflict-per-`PUT`. Either a bulk endpoint or N parallel `PUT`s; the "one undoable action" framing argues for a bulk endpoint so the undo is atomic. **No artboard shows the bulk confirm/undo state** despite the footer promising one — a designed-state gap. |
| 29 | **Component numbers §4.20–§4.24** | **Collide with Flow 4.** The doc's §4.20–§4.25 are already AlertBanner, FilterBar, SortableTh+LoadMore, deleted-row treatment, projection panel, and schedule timeline. **Flow 5's components renumber to §4.26+.** |
| 30 | **Status filter as custom clickable `<span>` pills**, status picker as four `<span>`s, toggles as styled `<span>`s | **Reverts a documented Flow 4 decision.** §4.21 records the divergence explicitly: the status scope became a native `<select>` because "A native control is keyboard- and screen-reader-accessible for free; the popover is presentation with a custom focus trap to maintain." Build the status scope as a real control (native `<select>`, or a proper radio group with roving focus), the status picker as a radio group, and the toggles as real `<input type="checkbox">`. §5 of the design doc requires this. |
| 31 | **No pagination or sort anywhere on the queue** | §4.22 established load-more as the one app-wide pager. An all-season queue across 24 members is unbounded. **Action: apply §4.22's load-more** to the queue, per group or per list. Also note the canvas's own ordering is ambiguous — the queue runs by conflict date (3/20 → 3/21 → 3/29 → 4/3) while the header emphasizes the oldest *submitted* and the dashboard list leads with Elena. **Pick one: group by member, order groups by oldest-pending-submission, rows by conflict date.** |
| 32 | **The reason expands on every row** | Deliberately abandons §4.19's "reason only on Denied and the next upcoming row, to keep the list scannable" rule. Reasonable for a triage screen (deciding *requires* the reason) but it must be recorded as an explicit exception in §4.19 rather than a silent divergence — the presenter's `reason_for` gate is server-side, so the triage endpoint needs its own shaping. |
| 33 | **Far-out dates without a year** ("3/29 · 2–6 PM", "1/24 · 9 AM–1 PM") | §4.19 / `ConflictPresenter` renders these as `%-m/%-d/%y` → "3/29/26". **The presenter wins** (it's shipped and spec'd); the canvas mock is simply missing the year. |
| 34 | **Sticky member group header** | Asserted in the sheet blurb, never drawn — and the group card is `overflow:hidden`, which breaks `position:sticky` on a descendant. Implement without `overflow:hidden` on the card, or drop the stickiness. |
| 35 | **Calendar chips carry status by color only** | Chip label is time + name; status is fill/border/dot. The legend is per-calendar, not per-chip. §5 requires status never be color-only — add a textual or shape cue (the denied/resolved chips especially). |
| 36 | **Undo window vs. the pending count** | The design saves immediately, keeps the confirm card in place for ~60s, then collapses it out of the Pending filter. The tablet artboard shows the count already decremented ("4 waiting on you") while the confirmed row is still visible. That ordering is the sensible one — **count updates immediately, row lingers** — but it should be stated, since it's the kind of detail that otherwise gets implemented three different ways. |

### Designed-state gaps to fill in the build

No hover state on triage rows or calendar cells; no focus rings except one Ends-time
field; no disabled/in-flight state on Approve/Deny during the save; **no empty state
for the calendar view** (only the queue has one); no popover loading/error state and
no popover variant for approved/denied/resolved events; no validation-error state on
either edit form (§4.18's validation summary card never appears); no mobile rendering
of the edit form; no "+2 more" overflow treatment for a day with more events than
fit; no bulk-approve confirm/undo artboard. The mobile artboard also drops the
When/Range/Ensemble filters entirely, so **narrow-screen filtering is undesigned** —
decide whether they collapse into a sheet (§4.21's original idea) or are simply
unavailable on phones.

### Accessibility gaps to close in the build

- Everything is `<div>`/`<span>`. Build real `<button>`, `<input>`, `<select>`,
  and a real radio group for the status picker — do not carry the mock's markup.
- The popover needs the behavior its own blurb promises: click to open, Escape and
  outside-click to close, **focus lands on Approve**, focus returns to the trigger
  on close, `role="dialog"` + label. The thing it replaces (an imperatively
  `prepend`ed div on `eventMouseEnter`) is mouse-only, so this is a real a11y win.
- The undo window is a **60-second time limit on an action** — WCAG 2.2.1 territory.
  The countdown must not be the only way to notice it, and Undo must stay reachable
  by keyboard for the full window.
- Status must never be color-only (#35). Count pills and staleness flags need
  accessible names, not just tinted text.
- The nav count badge needs an accessible name ("5 conflicts waiting"), not a bare "5".

---

## Scope cuts (design work banked, not built in Flow 5)

Each of these is real design work that shouldn't be lost — but none belongs in
this flow. Filed as beads rather than built:

| Cut | Why |
|---|---|
| **Member approve/deny notification email** | No mailer exists; user's call is to flag not build (#18). Carry the delayed-job-re-reads-status design note (#19) onto the bead. |
| **Denial note ("Why you denied it")** | New column, no capture path designed, and the canvas contradicts itself on whether deny takes a note at all (#20). |
| **Member self-edit of a pending conflict** | No member `edit`/`update` route exists, and it's a member screen (Flow 3 territory), not coordinator triage (#23). |
| **Rehearsal dates behind the calendar** | `Event` is populated by nothing (#17). The canvas independently reached the same conclusion and dropped its next-event card. |

## Suggested build phasing (for the plan file)

1. **Backend** — collapse to one `/api/conflicts` gated on both roles; **fix the
   date-range filter** (return the parsed value; correct the strict one-sided
   operators to real overlap; regression spec); add `status` / `when` /
   `ensemble` filter params with an allowlist; per-scope and per-member counts;
   member grouping; extend `ConflictPresenter` with an opt-in `member:` /
   `section:` and collapse the two ad-hoc merges; decision attribution read from
   `Activity`; bulk-approve endpoint.
2. **Primitives** — triage row (§4.26, extending §4.19), member group header,
   view switcher, conflict detail popover, decision confirm + undo. Real
   semantics throughout (#30), real focus management on the popover.
3. **Screen: triage queue** — grouped queue, filter bar, load-more (#31),
   empty / loading / error states.
4. **Screen: triage calendar + agenda** — FullCalendar with status-token colors,
   the show-denied-and-resolved toggle made explicit (#10), popover replacing the
   imperative tooltip, and the <900px agenda.
5. **Screen: inline edit + add** — one shared form partial replacing the two
   byte-identical copies; past dates allowed on add; fix `#create` redirecting to
   `root_url` instead of back to the list (#13).
6. **Screen: coordinator dashboard** — hero + "clear a few from here" list +
   month widget, replacing the second FullCalendar currently mounted there (#11).
7. **Polish** — a11y pass (#30, #35, the undo time limit), dark mode, the
   designed-state gaps above, "needs a human visual pass" callout on the PR.
