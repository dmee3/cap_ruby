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
| Layouts | 5 separate ERB layouts (`application`, `admin`, `members`, `coordinators`, `staff`, `calendar`) that are near-duplicates of each other | One shell, role-driven nav. Huge consolidation opportunity. |
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
7. **The public calendar fundraiser** uses a totally separate visual language (fixed background photo, centered 42rem column, its own CSS file) and a `<canvas>`-based date picker with hardcoded pixel coordinates.
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
| **Calendar fundraiser — donate** | `/calendars/new` | A donor (often a parent/relative, not a member) picks a performer, selects calendar dates, pays via Stripe | Separate visual world; canvas date-picker with pixel math; multi-step flow (choose member → choose dates → pay) with weak progress indication; mobile experience questionable | 🔴 |
| Fundraiser — success / error | `/calendars/success`, `/calendars/error` | Confirm the donation | Minimal confirmation; no "share" or "donate again" | 🟡 |
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
| **Coordinator dashboard** | `/coordinators` | Overview: files + upcoming conflicts | Very thin (2 cards). Coordinators' real work is conflict triage — the dashboard doesn't reflect that | 🟡 |
| **Conflict calendar + triage** | `/coordinators/conflicts` | See all conflicts on a calendar, approve/deny/edit | FullCalendar month/list view; tooltip is a manually-constructed div; editing a conflict is a separate form page (`/conflicts/:id/edit`); no inline approve/deny; no queue view of "pending, needs my decision" | 🔴 |
| Conflict new / edit | `/coordinators/conflicts/new`, `/:id/edit` | Create or modify a conflict for a member | 5-col grid form with `_form` partial; member select; status select | 🟡 |
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
| **Admin conflicts** | `/admin/conflicts` | Same as coordinator conflict calendar + date-range filtering + ensemble/section data | React calendar widget; date filtering | 🟡 |
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

**Progress:** Flows 1–4 merged (PR #221 shell/tokens, #226 member dues,
#230 member conflicts, #234 admin financial command center). Flow 5 (conflict
triage) is designed and reviewed, build next. (Authoritative status: `bd ready`.)

Along the way, the layout set collapsed to three — `application` / `auth` /
`public`, with public controllers inheriting `PublicController` (PR #229) — which
is the groundwork Flow 7 builds on (see `02-design-system.md` §4.1). The
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

### Flow 5 — Conflict triage (coordinator/admin) 🔴 *(designed + reviewed — build next)*
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
- Cut and filed as beads: member approve/deny email (none exists today), the
  denial note (no column, no capture path), and member self-edit of a pending
  conflict (no member edit route; Flow 3 territory).

### Flow 6 — Admin: roster & onboarding 🟡
- Users list
- Create/edit user with per-season role assignment
- Auto-generated payment schedule preview

### Flow 7 — Public fundraiser 🔴 *(distinct audience — external donors)*
- Landing / pick a performer
- Select dates (replace canvas picker)
- Checkout
- Confirmation + "donate again / share"

### Flow 8 — Inventory 🟡
- Category + item list with inline quantity edit
- Add category / add item
- Low-stock email rules

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
