# Flow 4 — Admin financial command center: design review

Review of the Claude Design canvas (`Flow 4 - Admin financial command center.dc.html`
+ `Burndown.dc.html`) synced 2026-09-09, against the Rails codebase. This is the
step-4 "verify assumptions before planning the build" pass. Components are already
folded into `02-design-system.md` §4.5, §4.12, §4.20–4.25.

Mock context: "today" is **Tue 3/10/26**, season **Spring 2026**, **24 members**.

**Three things the design gets wrong about the app, caught here:**
1. Fundraising does **not** net against dues owed — the two systems are fully
   decoupled (#16). Member 360 shows fundraiser total as its own stat, never
   folded into the DuesMeter.
2. "Reset to default" today **destroys every entry including paid ones** and
   rebuilds from a hardcoded per-year hash (#12). The design's preserve-paid +
   diff-preview behavior is all new build.
3. Schedule editor route is `/admin/payment_schedules/:id/edit`, not the canvas's
   `/admin/users/:id/payment_schedule/edit` (#9).

---

## What's in the canvas

Six sections of artboards, all in one `.dc.html` (static — divs/spans, no real
`<table>` or form controls), plus a `Burndown.dc.html` the canvas pulls in via
`<dc-import>`.

| Section | Screen | Artboards |
|---|---|---|
| 01 | Admin dashboard `/admin` | desktop light + dark; list fragment loading / empty / error, light + dark (no mobile) |
| 02 | Payments list `/admin/payments` | desktop light + dark (status-filter dropdown open, deleted row); tablet 900px card layout; mobile 390px dark; loading; empty-filtered; empty-season; error |
| 03 | Add manual payment `/admin/payments/new` | desktop light (member pre-filled); errors dark; success toast light + dark; save-failed toast (no mobile) |
| 04 | Member 360 `/admin/users/:id` | desktop light (on-track member); desktop dark (behind, no schedule) — no mobile / loading / error |
| 05 | Payment schedule editor | desktop light (custom schedule); desktop dark (new member + reset-to-default confirm); success toasts (no mobile / loading / error) |
| 06 | Component sheet | burndown spec; Member 360 header spec |
| — | Footer | "What I decided, so you can overrule it" — 9 assumption cards |

The burndown is a **hand-plotted SVG** (fixed polylines, no series binding):
dashed `ocean.light` scheduled line, solid `moss` collected line stopping at
today, `raspberry` area fill for the behind-schedule gap, a "Today" rule, and a
"$6,280 behind schedule" caption. Data + empty states, light + dark.

---

## Assumptions verified against the codebase

### Confirmed — design is right

| # | Assumption | Finding |
|---|---|---|
| 1 | Per-member "behind" query exists | `PaymentService.amount_owed_on_date(user, date, season_id)` already does exactly this (`owed − paid` from schedule entries ≤ date). The dashboard's `behind_members` currently uses `scheduled_to_date` with no date arg. |
| 2 | Amounts stored in cents, displayed in whole dollars | `Payment.amount` and `PaymentScheduleEntry.amount` are integer cents. Controllers `*100` / `/100` at the boundary. Schedule-editor inputs showing `600.00` is fine. |
| 3 | Soft-delete via paranoia; totals exclude deleted | `Payment` is `acts_as_paranoid`. `Payment.for_season(...).sum` excludes deleted by default scope, so `total_dues_paid_to_date` is already correct. Restore endpoint exists: `PUT /api/admin/payments/restore/:id`. |
| 4 | "Applies to" — payments credit oldest-unpaid first, not earmarked | `Payment` has **no FK to `PaymentScheduleEntry`**. "Paid" per entry is derived (running payment total vs. cumulative scheduled). The read-only "Applies to" field matches reality; a single payment covering multiple entries is just how the derivation works. |
| 5 | Conflicts on Member 360 are read-only | Matches CLAUDE.md — coordinators manage conflicts on their own calendar; members submit their own. Admin Member 360 showing them read-only is correct. |
| 6 | `seasons_users` stores role + ensemble + section per row | Confirmed (`user.rb` `role_for` / `ensemble_for` / `section_for` all read `seasons_users`). Roles-by-season list filtered to `role = 'member'` is a sound rule. |

### Needs a decision or new code

| # | Assumption | Finding / action |
|---|---|---|
| 7 | **Burndown cadence: weekly, season in context** | `DashboardUtilities.biweekly_scheduled` / `biweekly_actual` **hardcode `Season.last.id`** and sample every Sunday (already weekly despite the "biweekly" name). Flow 4 needs them season-scoped and probably renamed. Note `Season.current` **does not exist** (issue `cap_ruby-w9r`) — use whatever the shell's season switcher resolves to. |
| 8 | **`sleep 5` removed, real double-submit guard** | Confirmed at `app/controllers/admin/payments_controller.rb:54` — but it's in **`#update`**, not `#create` (the Add-payment flow the design covers). Still worth removing. The design wants a disabled spinner-button + a transaction on create. |
| 9 | **Schedule editor route** | Canvas section label says `/admin/users/:id/payment_schedule/edit`. Real route is `/admin/payment_schedules/:id/edit` (`routes.rb:71`, `resources :payment_schedules, only: %i[edit]`). Build to the real route; the prompt had it right. |
| 10 | **"Members behind" threshold banding** (0=ok, 1–4=warning, 5+=danger) | No such banding in code today. It's a §4.4 StatBlock `tone` prop — pure presentation, fine to add. |
| 11 | **"Average days late" metric** ("9 days · 6 days a month ago") | Does not exist. Feasible: iterate `PaymentScheduleEntry` with `pay_date < today`, diff against the covering payment date. The **month-ago comparison implies a historical snapshot or a recompute-as-of-past-date** — decide whether that's worth it or cut the comparison. |
| 12 | **"Reset to default" preserves paid entries** | Confirmed new behavior. `api/admin/payment_schedules#create_default` does `@schedule.entries.destroy_all` then rebuilds from `PaymentScheduleService::DEFAULT_PAYMENT_SCHEDULES` (hardcoded hash keyed `year → ensemble → section-bucket → Vet/Rookie`; section bucket is `Visual` vs `Music`, not per-section; **a new season needs a new hash entry**). The design's "only rewrites future/uncovered due dates" + the diff-preview + "Vet default" framing are all new. |
| 13 | **Payments list sorting + filtering server-side** | Current `/admin/payments` JSON action does `Payment.with_deleted.includes(:payment_type).for_season` with **no sort/filter params** and a client-side fuzzy name filter. Flow 4 needs: sort (date/member/type/amount — allowlisted columns), filter (name search, type, date range, deleted-scope). New controller work. |
| 14 | **Deleted-scope toggle + "excluded from totals" note** | The mock's own numbers contradict this: dark "Active + deleted" shows `19 payments · $10,620` which *includes* the $1,200 deleted row in the sum. §4.21 in the design doc says the note wins — totals are always of non-deleted rows. Build to the doc. |
| 15 | **Export endpoint honoring filters** | No CSV/export endpoint exists for admin payments. "Export N payments" is new. |
| 16 | **Fundraising nets against dues owed** | **Design is wrong.** The calendar fundraiser is fully decoupled from dues — `Calendar::Fundraiser` just tracks donation-date coverage (target 496); nothing in `PaymentService` / `PaymentSchedule` / `PaymentScheduleEntry` references it, and no linkage exists the other way. A member's dues owed is unaffected by their fundraiser. Member 360 should show fundraiser total as its own stat (as §4.12 already says), **not** fold it into the DuesMeter or "season total". |
| 17 | **Stripe fee handling** | Mock shows Stripe rows with "fee $17.70 covered by member" in free-text notes. Verify whether stored `Payment.amount` for Stripe is gross or net, and whether the fee is a field or just notes. Design assumes member-paid fees don't reduce credited dues. |
| 18 | **`dues_status_okay?` memoization bug** | `user.rb:95` memoizes into `@status` with **no season key** — calling it for two seasons on the same loaded object returns the first answer. Relevant if Member 360 ever shows dues status across seasons in one render. Latent bug; fix or avoid. |
| 19 | **Schedule entry statuses derived, not stored** | Confirmed no status columns on `PaymentScheduleEntry`. "Moved from 3/15" must be tracked client-side against the entry's original `pay_date` during editing. |
| 20 | **Season switcher can change season context** | Shell has a season switcher (Flow 1). Confirm it actually re-scopes admin dashboard / payments queries, or whether those are pinned to a "current" season. |

---

## Mock inconsistencies to ignore when building

- **Recent payments (dashboard)** lists the Elena Sokol $1,200 Check as a recent
  payment, but that exact payment is the **soft-deleted** one everywhere else.
  Mock oversight — recent payments must exclude deleted.
- **Schedule editor dark (Marcus)**: header says "Default new-member schedule,
  unedited" + "Total $3,600" but renders only 4 rows (= $2,400). The reset-diff
  panel then says 3/15 + 4/15 would be "added". Either the default has 6 entries
  (diff wrong) or 4 (total wrong). Build from the real default generator output.
- **Payments-list dark** "$10,620" total includes the deleted row — see #14.
- Dashboard "All conflicts" / "View all members" links point at `#01` / `#04`
  anchors — canvas placeholders, not real routing.

## Accessibility gaps to close in the build

- Everything is `<div>`/`<span>`; forms are fake. Build with real `<table>` /
  `<th scope>` / `<input>` / `<select>` / `<button>` — do not carry the mock's
  markup over.
- Burndown behind-schedule area is **color-only**. Add a pattern fill or explicit
  label (the mock's "Striped = past due" caption on the DuesMeter is the right
  instinct — apply it to the chart too).
- Sort headers need `aria-sort`; icon-only affordances (date `▤`, dropdown `▾`,
  search `⌕`) need labels.
- Member 360 header sheet's populated-dark variant drops the "Expected by today:
  $X" caption — keep it in all variants.

---

## Suggested build phasing (for the plan file)

1. **Backend** — season-scoped burndown series (rename `biweekly_*`); payments
   list sort/filter/scope params + allowlist; per-member behind query on the
   dashboard; remove `sleep 5`, add create transaction + (optional) export
   endpoint; "average days late" (decide on the month-ago comparison).
2. **Primitives** — Burndown chart component; Member 360 header; §4.20 alert
   banner; §4.21 filter bar; §4.22 sortable header + load-more pager; §4.23
   deleted-row treatment; §4.24 projection panel; §4.25 timeline + diff panel.
3. **Screen: admin dashboard** — burndown hero, 4 stat blocks, two load-more
   lists, blank-schedule alert.
4. **Screen: payments list + add manual payment** — table with filter bar,
   mobile card fallback, the form + projection panel.
5. **Screen: Member 360 + schedule editor** — header, roles-by-season, payment
   schedule / payments / conflicts sections; the timeline editor + reset-to-default.
6. **Polish** — a11y pass (real semantics, non-color cues), dark mode, empty /
   loading / error states the canvas skipped (Member 360, schedule editor,
   add-payment page-level), "needs a human visual pass" callout on the PR.
