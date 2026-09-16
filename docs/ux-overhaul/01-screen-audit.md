# Screen Audit — Cap City Percussion Management System

Prepared as input for a full UX overhaul in Claude Design. This is the complete
inventory of user-facing screens, grouped by role and journey, with an assessment
of current UX friction and a recommended priority for redesign.

**Scope note:** The overhaul is not tied to the current structure, visual style, or
frontend framework. This audit describes *what exists* and *what job each screen
does*, so the redesign can start from the underlying user needs rather than the
current implementation.

**Task tracking:** live status for the overhaul lives in **beads** (`bd show cap_ruby-b3a`
for the epic; `bd ready` for the next flow). This doc is the reference for *what each
screen does* and the priority-ordered flow list — not a status board. The ✅/next
markers below are kept only as a rough at-a-glance; beads is authoritative.

---

## How the app is built today (context for the redesign)

| Layer | Current state | Implication for redesign |
|---|---|---|
| Layouts | *Was* 6 near-duplicate ERB layouts (`application`, `admin`, `members`, `coordinators`, `staff`, `calendar`). **Now three** — `application` / `auth` / `public` — after Flow 1 collapsed the role layouts, PR #229 added `PublicController`, and Flow 7 folded in the last `calendar` one | Done. One shell, role-driven nav; each remaining layout has a declared audience. |
| Navigation | Fixed 160px left sidebar (icon + label), separate mobile hamburger + slide-in, season dropdown + profile dropdown in a thin top bar | Nav model is sound but visually dated and the mobile/desktop split is fully duplicated markup |
| Rendering | Mix of server-rendered ERB and React "widgets" mounted into `<div id="...">` holes | Redesign can standardize on one interaction model per screen type |
| Styling | WindiCSS utilities + ~10 hand-written `@apply` component classes (`.card`, `.btn-primary`, `.custom-table`, `.input-text`, …) | These hand-rolled classes *are* the current design system — small, inconsistent, worth replacing wholesale |
| Color | Brand palette: `raspberry` (red), `ocean` (teal/blue), `moss` (green), `jet` (near-black), `flash` (near-white). In practice screens use generic Tailwind `green-*`, `red-*`, `gray-*` far more than the brand colors | Redesign should make the brand palette actually load-bearing |
| Dark mode | `darkMode: 'media'` — every component carries `dark:` variants | Keep, but define it once in tokens instead of per-element |
| Charts | Chart.js (dues burndown) | — |
| Date pickers | flatpickr | — |
| Calendar | FullCalendar (conflict calendar) | — |

### Cross-cutting problems observed

1. **Two navigation implementations per layout** (desktop sidebar + mobile menu) with fully copy-pasted season/profile dropdowns. Every role layout repeats this.
2. **Inconsistent stat/number treatment.** Dashboards show big numbers as `text-3xl font-extrabold font-mono` in some places, `text-2xl` in others, with ad-hoc color logic (`BehindMembers` hand-codes green/yellow/red thresholds inline).
3. **Card vocabulary is muddled.** Three card classes (`.card`, `.card-flat`, gradient cards) used interchangeably; borders color-coded by domain (green = payments, red = conflicts) but not consistently.
4. **Tables are desktop-only in feel.** `.custom-table` with `whitespace-nowrap` everywhere; on mobile these overflow. Members' payment/conflict data has no real mobile table pattern.
5. **Forms are a 5-column grid hack.** `grid grid-cols-5` with label in col 1, field in cols 2–5, repeated by hand in every form (conflict, whistleblower, payment, login). No shared form-row component on the ERB side.
6. **Empty states are literally the word "None"** in large mono text (member dashboard conflicts, staff dashboard).
7. **The public calendar fundraiser** uses a totally separate visual language (fixed background photo, centered 42rem column, its own CSS file, its own one-off `calendar` layout) and a date grid whose month heading (`"March 2025"`, a literal) and column offset (six hardcoded leading blanks) are set independently, so weekday alignment is wrong for any year but 2025. *(Corrected in Flow 7: an earlier version of this line described a `<canvas>` picker with hardcoded pixel coordinates. That was already gone — the `<canvas>` belongs to `Calendar::ImageService` on the member-facing page. The redesign drops weekday alignment entirely, which removes both hardcodings.)*
8. **Badges** are built with dynamic class strings (`bg-${color}-100`) — fragile, and the color set is tiny.
9. **No visible loading or error states** in most React widgets — they `console.error` and render nothing.
10. **Season switching** is a dropdown buried in the top-right. It's a primary context control (the whole app is season-scoped) but treated as a minor utility.

---

## Screen inventory by role

Legend for **Priority**: 🔴 High (painful + high traffic) · 🟡 Medium · ⚪ Low (works, or rarely used)

### Public / unauthenticated

| Screen | Route | Job to be done | Current friction | Priority |
|---|---|---|---|---|
| **Login** | `/login` | Member/staff signs in | Bare form on a background image; no branding story, no "forgot password" prominence | 🟡 |
| Forgot / reset password | `/password/new`, `/settings-password` etc. | Recover access | Devise default styling, minimal | ⚪ |
| **Calendar fundraiser — donate** | `/fundraiser`, `/fundraiser/:token` | A donor (often a parent/relative, not a member) picks a performer, selects calendar dates, pays via Stripe | ✅ rebuilt in Flow 7 as four routes on the `public` layout: picker, 31-tile date grid, checkout, confirmation. Replaced a separate visual world with its own layout and CSS file, a date grid misaligned for any year but 2025, a dead `POST /calendars` form carrying a pre-Payment-Intents `stripe_token`, and a checkout button whose disabled logic was inverted so it never disabled. Mobile is now a first-class layout, not an afterthought | ✅ |
| Fundraiser — confirmation / failed | `/fundraiser/thanks` | Confirm the donation, and get the next one | ✅ rebuilt in Flow 7: a real receipt, "support someone else", and a share link, which is the highest-leverage thing on the page. Reads the Stripe PaymentIntent rather than the webhook, so a donor who lands before the webhook fires still sees their receipt. Replaced a static "Success!" line linking off-site, plus an `error.html.erb` that had no route to it at all | ✅ |
| Auditions spreadsheet page | `/auditions-spreadsheet` | Staff triggers a Squarespace→Sheets sync | Utility page, ~6 weeks/year use. Low design value | ⚪ |

### Member

| Screen | Route | Job to be done | Current friction | Priority |
|---|---|---|---|---|
| **Member dashboard** | `/members` | "Am I paid up? Do I owe money soon? What's the status of my conflicts?" | Dense 3-column grid that reflows awkwardly; dues progress is a number-over-number string, not a visual; payment history and schedule are two separate lists that don't reconcile visually; conflicts list mixes date math inline | 🔴 |
| **Pay dues** | `/members/payments/new` | Pay some or all of what's owed, via card | Amount entry + auto-calculated CC fee + total, then Stripe element appears below on submit. Fee math is surprising ("why is my total $X?"). No indication of what's owed / suggested amount pre-filled | 🔴 |
| Payment post-processing | `/members/payments/post_processing` | Landing after Stripe redirect | Transient; needs a clear success/pending/failed state | 🟡 |
| **Submit a conflict** | `/members/conflicts/new` | Tell coordinators "I can't be at rehearsal on these dates" | 5-col grid form; start/end datetime via flatpickr; disclaimer text about "this is not approval"; no preview of existing conflicts or the rehearsal calendar while submitting | 🔴 |
| Conflict submission disabled | `/members/conflicts/new_disabled` | Explains why submissions are closed | Static message | ⚪ |
| **Personal calendar fundraiser** | `/members/calendars` | "How much have I raised? Which dates are sponsored? Download calendar images to share" | Total in a gradient card; donations list; a canvas-based calendar image builder + download; the "build/download" feature is powerful but hidden and clunky | 🟡 |
| Files | `/files` | Browse shared Google Drive files for the season | React list; fine but plain | ⚪ |
| Settings | `/settings` | Change username / email / password | Standard form | ⚪ |
| Whistleblower report | `/whistleblowers` | Anonymously (or not) report a concern to ≥3 admins | Long wall of explanatory text; admin picker is a hardcoded list of first names with checkboxes; client-side "pick 3" validation | 🟡 |
| Inventory (if quartermaster) | `/inventory/categories` | Manage equipment stock | Shared with coordinator/admin — see below | 🟡 |

### Staff

| Screen | Route | Job to be done | Current friction | Priority |
|---|---|---|---|---|
| **Staff dashboard** | `/staff` | See next event + upcoming conflicts (read-only) | Two cards; "Files" card hidden on mobile; conflicts list; overall very sparse — staff is the thinnest role and the dashboard feels unfinished | 🟡 |
| Files, Settings, Whistleblower | as above | | | ⚪ |

### Coordinator

| Screen | Route | Job to be done | Current friction | Priority |
|---|---|---|---|---|
| **Coordinator dashboard** | `/coordinators` | Overview: files + upcoming conflicts | ✅ rebuilt in Flow 5 around the backlog — a hero naming what's waiting and the oldest of it, plus inline approve/deny. Replaced a card that mounted a *second* full FullCalendar | ✅ |
| **Conflict calendar + triage** | `/coordinators/conflicts` | See all conflicts on a calendar, approve/deny/edit | ✅ rebuilt in Flow 5 as a queue + calendar over one dataset, with inline decisions, a real popover replacing the hover-only tooltip, and an explicit "show denied and resolved" toggle | ✅ |
| Conflict new / edit | `/coordinators/conflicts/new`, `/:id/edit` | Create or modify a conflict for a member | ✅ rebuilt in Flow 5 on the shared member form with triage-only fields; one partial now serves both namespaces | ✅ |
| **Inventory** | `/inventory/categories` | View categories/items, edit quantities, add items, manage low-stock email rules | React list of collapsible category tables; inline quantity edit; separate pages for new category / new item / email rules | 🟡 |
| Inventory email rules | `/inventory/email_rules` | Configure "email X when item Y drops below Z" | List + form pages; functional, unpolished | ⚪ |
| Files, Settings, Whistleblower | as above | | | ⚪ |

### Admin

Admin inherits coordinator + staff, plus:

| Screen | Route | Job to be done | Current friction | Priority |
|---|---|---|---|---|
| **Admin dashboard** | `/admin` | Financial + operational health of the season at a glance: expected vs collected dues, upcoming payments, members behind, upcoming conflicts | Best-developed screen, but: 4 independent React widgets each doing their own fetch/paginate; "Dues owed / collected" is two stacked numbers with no chart; each list widget has its own 5-per-page chevron pager; no date/season controls; the whole thing is information-dense but not *insight*-dense | 🔴 |
| **Payments list** | `/admin/payments` | Find a member, see their payment status, add a manual (cash/Venmo/check) payment | One big `.custom-table`, fuzzy name filter, per-row "New" button. `whitespace-nowrap` everywhere → horizontal scroll. No sorting, no status filter, no "show only behind" | 🔴 |
| **Add manual payment** | `/admin/payments/new` | Record a manual payment (amount, date, type, notes) | ✅ rebuilt in Flow 4 | ✅ |
| **Edit payment** | `/admin/payments/:id/edit` | Correct an existing payment | ✅ rebuilt in Flow 4 on the same `AddPaymentForm` as `new`, seeded from the payment; the projection panel nets out the original amount so it shows the *change*. Fixed two live bugs found here: cents truncation on update, and a 404 on validation failure | ✅ |
| Payment detail | `/admin/payments/:id` | View one payment, delete/restore (soft-delete) | Minimal, pre-overhaul, and now largely redundant — rows are editable and deletable from the payments list and Member 360. Decide whether it survives rather than porting it. `bd show cap_ruby-b3a.15` | ⚪ |
| **Payment schedule editor** | `/admin/payment_schedules/:id/edit` | Adjust a member's due-date/amount plan; generate a default schedule by member type (vet/new) | React edit rows; add/remove entry; "create default" action. Powerful, but the relationship between schedule, payments made, and what's owed is not visualized | 🟡 |
| **Users list** | `/admin/users` | Find/manage members; see roster | React table (`UserTable`); fine, plain | 🟡 |
| New / edit user | `/admin/users/new`, `/:id/edit` | Create a member, assign season/role/ensemble/section/member-type; auto-creates a payment schedule | `UserForm` + `UserRoleRow` — the most complex form in the app (per-season role assignment). Deserves careful redesign | 🔴 |
| User detail | `/admin/users/:id` | Everything about one member: roles by season, payment schedule, payments, conflicts | Landing target from many places (payments table, behind-members). Central "member 360" view — high value, currently a plain stacked page | 🔴 |
| **Admin conflicts** | `/admin/conflicts` | Same as coordinator conflict calendar + date-range filtering + ensemble/section data | ✅ the *same screen* as the coordinator one after Flow 5 — one API, one widget, two thin shells | ✅ |
| Conflict new / edit (admin) | `/admin/conflicts/new`, `/:id/edit` | | Same `_form` pattern | 🟡 |
| **Admin calendar fundraiser** | `/admin/calendars` | Ensemble-wide fundraiser: totals by member, completed vs in-progress | Overview page; needs a leaderboard / progress visualization | 🟡 |
| Admin settings | `/admin/settings` | | Standard | ⚪ |
| Sub-pages: upcoming payments, behind members, burndown chart, recent payments | `/admin/payments/*` | Standalone versions of dashboard widgets | Redundant with dashboard; consolidate | ⚪ |

### System / shared partials

| Element | Where | Notes |
|---|---|---|
| Flash messages | `_flashes` | Gradient bars, bottom-right, 4 variants (success/error/info/default) |
| Conflict status icon | `_conflict_status_icon` | Small icon keyed to status |
| Payment type icon | `_payment_type_icon` | Icon per payment type (stripe/venmo/cash/check/other) |
| Badge | React `Badge.tsx` | `green\|red\|yellow\|gray`, pill shape, dynamic classes |
| Mailer templates | `*_mailer/*` | Welcome, calendar receipt, download link, inventory low-stock, Devise. Out of scope for a web-UX overhaul but should inherit the new brand |

---

## Recommended redesign order (by journey)

Design in **flows**, not isolated screens — shared components carry across a flow so
each one is faster than the last.

**Progress:** Flows 1–7 merged (PR #221 shell/tokens, #226 member dues,
#230 member conflicts, #234 admin financial command center, #240 conflict
triage, #241 admin roster & onboarding, #242 public fundraiser). Flow 7 was the
last 🔴 P1 flow. **Flow 8 (inventory) is in progress**, shipping as two PRs — a
backend prerequisite then the UI — which leaves Flow 9 (supporting screens) as
the last one. (Authoritative status: `bd ready`.)

Along the way, the layout set collapsed to three — `application` / `auth` /
`public`, with public controllers inheriting `PublicController` (PR #229), and
**Flow 7 finished the job** by folding in the last one-off `calendar` layout
(see `02-design-system.md` §4.1). The
conflict-submission toggle added in Flow 3 (`Season#conflict_submission_open`,
editable at `/admin/season/edit`) is the seasonal on/off switch coordinators use.

### Flow 1 — Design system + app shell 🔴 *(do first, everything depends on it)* ✅ shipped
- Token set (color, type, spacing, radius, elevation, dark mode)
- The one unified app shell: sidebar/nav, season switcher as a first-class control, profile menu, mobile pattern
- Core components: button, card, stat/metric block, table (with a real mobile pattern), form row, badge/status pill, empty state, loading state, flash/toast
- Artboards: shell (desktop + mobile), component sheet, light + dark

### Flow 2 — Member core: dues & payments 🔴 ✅ shipped
- Member dashboard (redesigned around "where do I stand")
- Pay dues (with owed amount in context, clearer fee explanation)
- Payment confirmation states
- Member "my fundraiser" (optional stretch in this flow)

### Flow 3 — Member core: conflicts 🔴 ✅ shipped
- Submit a conflict — native date/time pickers, own-conflicts context list,
  a real "submissions closed" page state (not a flash), inline + summary
  validation. *(The rehearsal-calendar context the original scope imagined was
  dropped — no `Event` listing exists; own-conflicts context only.)*
- Conflict status on the dashboard — status-pill summary, a "next one is still
  pending after N days" nudge, the shared `ConflictContextRow` shape
- (row shape + status vocabulary built to be reused by Flow 5)

### Flow 4 — Admin financial command center ✅ shipped *(PR #234, merged)*
- Admin dashboard (insight-focused: dues burndown as the hero, not two numbers)
- Payments list (filter/sort/status, mobile card fallback)
- Add manual payment (projection panel, validation summary, disable-on-submit)
- Edit payment (`/admin/payments/:id/edit`) — *added mid-flow*: the same form
  as `new`, seeded from the payment. It wasn't in the original scope, but the
  flow put Edit links into it from three screens, so leaving it on Bootstrap
  would have made the seam worse than before the flow started
- Member 360 (`/admin/users/:id`) — the shared detail view, phone layout
- Payment schedule editor (`/admin/payment_schedules/:id/edit` — built to the
  real route; the canvas's `/admin/users/:id/payment_schedule/edit` label was wrong)
- New components in `02-design-system.md`, all built this flow: §4.5 burndown,
  §4.12 Member 360 header, §4.4 StatBlock (a Flow 1 spec that never shipped),
  §4.20–4.25 (alert-with-action-list, filter bar, sortable header + load-more,
  deleted-row treatment, projection panel, plan-vs-reality timeline + schedule
  diff), plus `PaginatedList` (client-side load-more).
- Three design errors caught and corrected: fundraiser is its own figure and
  never nets against dues; "reset to default" preserves paid entries (was
  `destroy_all`); the schedule-editor route above.

### Flow 5 — Conflict triage (coordinator/admin) ✅ shipped *(visual pass pending)*
- Conflict queue ("pending, needs a decision") + calendar as two views of one dataset
- Inline approve/deny/edit
- Coordinator dashboard rebuilt around this
- Canvas reviewed against the code in `flow5-design-review.md`. **The API's
  date-range filter is dead code** — `start`/`end` are parsed, discarded, and
  replaced by a hardcoded 2000–2030 window (proven: a one-week request returned
  a conflict ~300 days out). Fixed in this flow.
- Admin and coordinator conflict code is duplicated at every layer (the `_form`
  partials are byte-identical; the entrypoints differ by five URL slugs), and
  `redirect_if_not` is an **exact role match**, so each role can only reach its
  own copy. Collapsing to one API + one widget, keeping both URLs.
- New components: §4.26–§4.31, plus §4.19 extended in place. *(The canvas
  claimed §4.20–§4.24, which collide with Flow 4's entries.)*
- Cut and filed as beads: member approve/deny email (`cap_ruby-b3a.17`), the
  denial note (`.18`), member self-edit (`.19`), and the narrow-screen filter
  sheet (`.20`).
- **Built:** one `/api/conflicts` for both roles, a `ConflictTriage` concern
  behind two thin controllers, six conflict views collapsed to three, one
  entrypoint in place of two, and the coordinator dashboard rebuilt around the
  backlog. The date-filter bug is fixed with regression specs covering the
  straddling case. The calendar's silent denied/resolved filter is now a visible
  toggle, and the empty/loading/error states the screens never had now exist.

### Flow 6 — Admin: roster & onboarding 🟡 *(in progress)*
- Roster (`/admin/users`) — one table with a Members/Staff switch, grouped by
  ensemble · section, with the loading / empty / filtered-empty / error states
  the page has never had, and a card fallback under 720px
- Off all rosters (`/admin/users?roster=none`) — the 17 accounts with no
  `seasons_users` rows at all. They **cannot sign in**
  (`active_for_authentication?` requires `seasons_users.any?`) and are currently
  reachable only from the Rails console
- Create/edit user with per-season role assignment — `UserRoleRow`'s table of
  mutually-disabling selects becomes one §4.32 block per season
- Payment schedule preview (§4.33) — and the backend change that makes it true:
  creation now **populates** entries from the default instead of creating an
  empty schedule. See `flow6-design-review.md` §1
- Member 360 (`/admin/users/:id`) is **not** in this flow — Flow 4 already built it
- Delete/deactivate is **deferred** to `cap_ruby-b3a.21`; a user delete currently
  hard-destroys the payment schedule while soft-deleting everything else
- Canvas reviewed against the code in `flow6-design-review.md` (12 findings,
  3 decisions taken)
- **Built:** the roster with its four missing states and a card fallback, the
  off-all-rosters view, one `SeasonRoleBlock` per season in place of
  `UserRoleRow`, a live schedule forecast, and the re-render fix that makes a
  failed save keep what was typed. Four real bugs fixed on the way: a nested
  update without the row id created a duplicate `seasons_users` row; the
  `dues_status_okay?` season-key memoization (`.13`); two contradictory password
  length rules; and new members landing with an empty payment schedule.

### Flow 7 — Public fundraiser ✅ shipped *(distinct audience — external donors)*
- Landing / pick a performer — initials avatar, ensemble, section, and progress
  per performer. Completed performers stay listed, muted and non-tappable, since
  a finished calendar should read as good news rather than a dead end
- Select dates — **31 numbered tiles, 7 wide, no weekday alignment and no month
  name**. Seven columns keep the calendar shape the fundraiser is named for, but
  tile 1 is always top-left: the tiles are prices, not appointments. That also
  deleted the alignment bug, since the hardcoded month and the hardcoded column
  offset could no longer drift apart. *(The original scope said "replace canvas
  picker" — see the corrected friction note above; there was no canvas.)*
- Checkout — the performer, the date chips and the total stay on screen while
  the card form sits beside or under them. No fee: a donor pays exactly the sum
  of the dates they picked
- Confirmation + share — a real receipt, "support someone else", and a share
  link, reading the Stripe PaymentIntent so the receipt renders even when the
  webhook hasn't landed yet
- **Completed the layout consolidation**: folded away the last one-off
  `calendar` layout, so the app is finally three layouts
  (`application` / `auth` / `public`)
- Public URLs use an **opaque per-performer token** (`/f/k7m2xq`) rather than the
  name slug the canvas drew, so a link forwarded through a group text doesn't
  publish a minor's full name
- Fixed on the way: a `POST /calendars` route pointing at an action that didn't
  exist (behind a dead form carrying a pre-Payment-Intents `stripe_token`); a
  checkout button whose `disabled={!stripe && !submitting}` was inverted so it
  never disabled; and a payment-intent endpoint that trusted a client-supplied
  total, so a crafted request could charge $1 and credit $31

### Flow 8 — Inventory 🟡 *(in progress — two PRs)*
- Category + item list, with **adjustment as a delta** (`−` / `+` stepper), not
  an absolute retyped into a text field. The phone layout is the primary one:
  this screen is used standing in a storage room, one-handed.
- Add category (inline row) / add item (drawer); rename and delete behind a row
  menu, off the counting surface
- Item history as a real **audit trail** — the four years of `user_id` the app
  already stores but has never shown
- Low-stock email rules rewritten as **sentences** ("When Keyboard mallets is at
  or below 8, email Dana Reyes"), admin/coordinator only
- **PR 1 (backend prerequisite):** transaction→user association, item
  soft-delete, non-negative quantities, destroy for items/categories/rules, real
  API error responses, and an authorization guard the `api/inventory/*`
  namespace never had. See `flow8-design-review.md`.

### Flow 9 — Supporting screens 🟡 / ⚪
- Login + password recovery
- Whistleblower report (better admin picker, less wall-of-text)
- Files browser
- Settings
- Staff & coordinator dashboards (if not fully covered by Flows 2/5)

---

## What to pull into Claude Design for each flow

For every flow, seed Claude Design with:
1. The **design system doc** (`02-design-system.md`) — load once as the project's design system.
2. The relevant rows from this audit (job-to-be-done + friction).
3. Real data shape — I can extract the actual fields each screen renders (e.g. the
   member dashboard needs: `paid`, `total_dues`, `next_payment_amount`,
   `next_payment_date`, a list of `payments` with type/amount/date/notes, a
   `payment_schedule` of date/amount entries, and a `conflicts` list with
   start/end/status/submitted-date). Ask me per flow.
