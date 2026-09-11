# Flow 5 — Conflict triage: design review

Review of the Claude Design canvas (`Flow 5 - Conflict triage.dc.html`, ~219KB /
1,779 lines, no `<dc-import>` siblings) synced 2026-09-11, against the Rails
codebase at `main` (`9f98f0c`). This is the step-4 "verify assumptions before
planning the build" pass, the same one that caught 4 latent bugs in Flow 2 and
three design errors in Flow 4.

> **Section status:** the codebase-verification sections below are complete and
> empirically checked. The canvas-side sections (artboard inventory, component
> specs, copy) are filled in from the canvas digest.

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

## Canvas-side sections

*(artboard inventory, new component specs, extensions to existing §4 entries,
sample data shapes, copy inventory, and canvas inconsistencies — from the
digest pass.)*
