# Flow 10 — Staff dashboard: design review

Canvas: **Flow 10 - Staff dashboard.dc.html** (Claude Design project `535a10bc-3e9d-4a90-be44-e7e6322ef3d0`),
four artboards: desktop populated, mobile, empty & loading, and an annotation artboard
arguing the content question.

Issue: `cap_ruby-b3a.35`. Scope: one screen, `/staff`.

## The content question, and the canvas's answer

The annotation artboard asks whether the thinnest screen in the app needs more content
or just better treatment, and answers **treatment, plus one grouping**:

> Staff have one question and the two existing cards answer it. Nothing was added: no stat
> row, no activity feed, no announcements. A thin screen for the thinnest role is the
> correct outcome, not a gap to fill.

The one real change is ordering: the flat 14-day list becomes a list **grouped by calendar
date** with a count per date, because "an instructor plans a rehearsal, not a fortnight."

This review verifies the canvas's eight decisions against the code. All eight check out;
three of them turn out to be cheaper than the canvas assumed, because Flow 5 already built
the machinery.

## Established facts, confirmed

### `@next_event` is fetched and never rendered — confirmed

`Staff::DashboardController#index` (`app/controllers/staff/dashboard_controller.rb:7`)
assigns `@next_event = EventService.next_event(current_season['id'])`. Nothing in
`app/views/staff/dashboard/index.html.erb` references it. The query runs on every page
load and its result is discarded.

**Canvas decision: drop the card *and* the query.** The reasoning is the same call Flow 4
and Flow 5 made — there is no event data for a season to design against, so a card reading
"Spring Premiere, Sat 3/28" would be a mockup of data that doesn't exist. Grouping by date
gives staff the dates they care about anyway.

Worth noting the asymmetry this leaves: `Coordinators::DashboardController` also assigns
`@next_event`, and its view *does* render it, inline in the subheader ("2026 season · Next:
…"). So the staff screen is not diverging from a pattern every other dashboard follows —
it's declining to add a renderer for a value that was never rendered here. The coordinator
line stays as-is; it's out of scope.

### The files card is `hidden lg:block` — confirmed

`index.html.erb:6`. Below the `lg` breakpoint the card is removed from the layout entirely,
so a staff member on a phone sees exactly one card. The `md:col-span-3 lg:order-2` wrapper
around it stays in flow, which is why the remaining conflicts card doesn't reflow to fill
the space.

It mounts `entrypoints/files/index.tsx`, the same widget `/files` mounts, with `expanded`
hardcoded true and no row limit.

**Canvas decision:** the hidden class goes, the card becomes the last block on a phone, and
the peek is capped at three rows with an "All files" link out. Deleting the card was
considered and rejected — "music and the rehearsal schedule are the second thing an
instructor opens, and a three-row peek with All files costs almost nothing."

### The conflict list bypasses `ConflictPresenter` — confirmed

The view hand-formats dates inline (`index.html.erb:25-29`) with its own same-day /
multi-day branching, and renders `_conflict_status_icon` rather than §4.8's status pill.

`ConflictPresenter.rows_for` (`app/services/conflict_presenter.rb`) already produces the
§4.19 row shape and is used by the member dashboard and the submit form.

**But it is member-centric**, and that matters for what this flow can reuse directly:

- it carries `editable` and `edit_path`, and `edit_path_for` builds
  `edit_members_conflict_path` — a member-scoped route a staff member cannot use;
- it carries `reason`, gated to Denied plus the next-upcoming row;
- it carries **no member name**, because on a member's own list every row is theirs.

The staff screen needs the name and must not carry the edit affordance. Calling
`rows_for` raw would put a member edit path onto a read-only screen.

**The precedent to follow is `ConflictTriagePresenter`** (`app/services/conflict_triage_presenter.rb`,
Flow 5), which wraps `ConflictPresenter.rows_for` and remaps rather than reimplementing its
label rules. `Admin::Member360Presenter` does the same. That is the established way to get
§4.19 labels in a non-member context.

### `ConflictTriagePresenter.date_groups_for` already does the canvas's "one real change"

This is the significant finding of the review. The canvas describes grouping by date with a
count per date and a proximity-aware heading, and calls it "an ordered group-by on the
existing query." Flow 5 already shipped exactly that:

`date_groups_for(conflicts, season_id, viewer)` groups by `start_date.to_date`, sorts
soonest first, and emits per group a `date`, a `date_label`, a `pending_count`, and `rows`
each carrying `member`, `section` and `initials` alongside the §4.19 labels. Its
`date_heading` uses "Today" / "Tomorrow" / weekday / bare date on the same proximity rule
`ConflictPresenter` uses for the rows, so a heading and its rows agree.

It is currently used by `Api::ConflictsController#index` only.

Two things it attaches that the staff screen must not show:

1. **`reason` on every row.** Deliberate for triage — deciding requires the reason. Staff
   decide nothing, and the canvas's rows show no reason.
2. **Attribution sublines** ("you approved it 52 days ago"), read from the `Activity` trail.
   This is decision context, and it costs an extra `Activity` query per page load.

So the staff screen wants `date_groups_for`'s grouping with those two omitted. Handled by a
thin staff presenter that wraps it, in the same spirit as Flow 5 wrapping `ConflictPresenter`.

### The empty state is the word "None" in `text-metric font-mono` — confirmed

`index.html.erb:39`. 28px numeral styling applied to a word. §4.9 explicitly calls this out:
"Replaces literal 'None' text."

**Canvas copy**, which reads it as the good news it is:
- hero: "Everyone's in" / "Nobody's out in the next two weeks. Full roster at every rehearsal."
- list card: "Nobody's out in the next two weeks." / "If someone submits a conflict, it shows
  up here as soon as they do, before a coordinator has decided on it."

### The 14-day window is hardcoded — confirmed, and kept

`where('end_date <= ?', 14.days.from_now)` combined with `future_conflicts`. No documented
reasoning. The canvas keeps it (hero label "Next two weeks", range caption "Mar 16 – Mar 30")
and gives no instruction to change it, so it stays.

The looser lower bound is real: `future_conflicts` is `where('end_date > ?', Date.yesterday)`
(`app/models/conflict.rb:46`), so a conflict that ended yesterday still matches. On a
screen headed "Next two weeks" that is mildly wrong — a past absence can appear in a list
of who's out. It is pre-existing, shared with every other caller of the scope, and changing
it would alter what the coordinator and admin screens show too. **Out of scope; filed as a
bead rather than fixed here.**

### Staff are read-only on conflicts — confirmed

`StaffController` is `authenticate_user!` plus `redirect_if_not('staff')`. There is no
`Staff::ConflictsController`; approve/deny/edit live in `Coordinators::ConflictsController`
and the admin equivalent. Staff reach conflicts only through this dashboard card and the
shared conflicts view.

The canvas is explicit that nothing borrowed from Flow 5 may carry a decision:

> Borrowed: the layout and the rail-accented hero. Not borrowed: Approve, Deny, Edit, bulk
> actions, the reason expander and the queue link. Staff see status, never change it, and
> the copy says so once in the hero instead of putting a disabled button on every row.

`TriageRow.tsx` degrades to exactly this: with no `onApprove` / `onDeny` / `onResolve` /
`editHref` it renders member, section, date, pill and subline with an empty action cluster.
The one thing that survives is the reason expander, which is driven by `row.reason` — and a
staff presenter that doesn't attach `reason` switches it off at the data layer, which is
where §4.19 says that decision belongs ("a data-shaping decision made server-side").

## Two things the canvas shows that the fact list didn't mention

1. **The `card--danger` treatment goes.** The current card is `card-flat card--danger` with
   a `text-danger-fg` title. The annotation artboard argues: "An approved absence is not a
   failure, and a screen that is red on a normal Tuesday teaches people to ignore red. Tone
   lives on the status pill now." The card becomes neutral.

2. **A small "Something feels wrong?" card** sat at the bottom of the desktop right rail,
   linking to the whistleblower report. *Built, then removed at Dan's request after merge:
   the report is already a nav item on every screen, so the card restated it rather than
   adding a way in.* The mobile artboard had omitted it anyway.

## Design-system sync

**Zero new components.** The canvas says so and the check holds:

| Canvas element | §  | Existing implementation |
|---|---|---|
| Conflict row | §4.19 / §4.26 | `TriageRow.tsx`, controls omitted |
| Status pill | §4.8 | `StatusPill.tsx` |
| Empty state | §4.9 | `EmptyState.tsx` |
| Files skeleton + error | §4.10 | `FilesList.tsx` (Flow 9) |
| Date group header | §4.27 variant | Flow 5's group header, date in place of person |
| Hero | Flow 5's coordinator hero | same, minus its button |
| Shell | §4.1 | unchanged |

Nothing gets an *(added — Flow 10)* tag.

This flow also **retires `_conflict_status_icon`**. The staff dashboard is its last
remaining caller (`grep` finds exactly one reference, `index.html.erb:21`), so the partial
is deleted, completing a §4.8 migration the design system called for back in Flow 3.

## One place the canvas outran the app

The canvas draws an **"All conflicts" link** on the card header, and a **Conflicts item** in
the sidebar. Neither exists for this role:

- `config/routes.rb` routes conflicts under `admin`, `coordinators` and `members` only.
  `namespace :staff` contains exactly one route, the dashboard.
- `ApplicationHelper#staff_nav` is `Home` + `Files`, plus `Inventory` when the quartermaster
  grant is set. There is no Conflicts item to highlight.

So a staff member's *entire* view of conflicts is this card. Adding a staff conflicts index
would be new surface, on the one flow whose finding was that this role needs none — so the
link came out and the window the card shows is the window that exists. Noted in the widget,
since the absence is the kind of thing a later reader would otherwise "fix" back in.

This is the failure mode the per-flow memory warns about: verify the design's assumptions
about app behaviour before building, rather than carrying them in.

## Deferred, with beads

- **`cap_ruby-b3a.38`** — the `future_conflicts` lower bound (`end_date > Date.yesterday`)
  letting a just-ended conflict appear under a "next two weeks" heading. Shared with every
  other caller, so out of scope for a staff touch-up.
- **`cap_ruby-b3a.39`** — `Coordinators::DashboardController` still renders `@next_event`
  inline while staff drops it. Revisit if event data ever lands.

## What shipped

Two commits.

1. **Controller view-model.** `@next_event` and its `EventService` call removed;
   `StaffConflictPresenter` added, wrapping `ConflictTriagePresenter.date_groups_for`;
   `date_groups_for` gained `attribution: false` so the `Activity` lookup is skipped at the
   source rather than computed and discarded. Nine presenter specs.
2. **Screen rebuild.** `StaffConflicts` widget (hero, date groups, read-only `TriageRow`,
   §4.9 empty state); `FilesList` gained a `limit` prop and the card lost `hidden lg:block`;
   `card--danger` dropped; `_conflict_status_icon` deleted. Eight request specs, five widget
   specs, one `FilesList` spec.

Gates at each commit: `bundle exec rspec` (929 examples), `yarn test:run` (719),
`bin/vite build`, `bundle exec rubocop` bare (231 files) — all clean, and the suite runs in
a worktree with no `.env`, which is the condition CI runs under.

## What this means for the build

Three phases:

1. **Controller view-model** — drop `@next_event` and its query; add a staff conflict
   presenter wrapping `date_groups_for` without `reason` or attribution; specs.
2. **Screen rebuild** — hero, grouped list with §4.19 rows and §4.8 pills, §4.9 empty
   states, files card at every width capped at three; delete `_conflict_status_icon`;
   request spec for populated and empty.
3. **Polish** — docs sync, mobile pass, gates.
