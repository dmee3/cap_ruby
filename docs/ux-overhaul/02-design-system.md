# Design System — Cap City Percussion (Proposed)

A fresh design system for the app overhaul. This is **not** an extraction of the
current styling — it's a proposal to load into Claude Design as the project's
design system before designing any screens. It reuses the one genuinely good
asset the app already has (the `raspberry / ocean / moss / jet / flash` brand
palette) and discards the rest.

Paste the **Tokens** and **Components** sections into Claude Design's
*"Set up your design system"* flow. The **Principles** and **Voice** sections are
guidance for how screens should feel.

---

## 1. Principles

1. **Season is the frame.** The whole app is scoped to one competitive season. The
   current season should always be visible and switchable without hunting. Treat
   it like a fiscal-year selector in an accounting app, not a settings toggle.
2. **One shell, many roles.** Members, staff, coordinators, and admins share one
   layout. Role changes *what's in the nav*, never the chrome around it.
3. **Answer the question on the card.** Every dashboard block should answer a
   specific question ("Am I paid up?", "Who's behind?", "What needs my decision?").
   Lead with the answer (a number, a status, a trend), then the supporting detail.
4. **Money is serious, and always in context.** Never show an amount owed without
   showing what it's against (total, schedule, due date). Never show a fee without
   explaining it in one plain sentence.
5. **Mobile is a primary target for members.** Members submit conflicts and pay
   dues from their phones at rehearsal. Member-facing screens are designed
   mobile-first; admin screens can be desktop-first but must not break on tablet.
6. **Status is a vocabulary, not a color guess.** A fixed set of status states
   (pending / approved / denied / current / behind / complete) with one
   consistent visual treatment each.
7. **Every async view has three states.** Loading, empty, and error are designed,
   not left to `console.error`.
8. **Dark mode is first-class.** Defined once in tokens. Not a per-component
   afterthought.

---

## 2. Voice & tone

- Warm, direct, a little bit drumline. This is a competitive performance group of
  mostly college-age members and volunteer staff — not a bank.
- Plain language for money and deadlines. "You owe $120, due Fri 3/14." not
  "Outstanding balance."
- Empty states are encouraging, not blank: "No conflicts submitted — you're clear
  for every rehearsal." not "None."
- Errors take responsibility and give a next step: "We couldn't load your
  payments. Refresh, or try again in a minute."

---

## 3. Tokens

### 3.1 Color — brand foundation

The existing brand palette, kept and made load-bearing:

| Token | Hex | Role |
|---|---|---|
| `raspberry.dark` | `#962231` | Danger pressed / emphasis |
| `raspberry.DEFAULT` | `#cc2f44` | Danger, "behind", denied, destructive actions |
| `raspberry.light` | `#d9596a` | Danger hover |
| `raspberry.lightest` | `#e89b86` | Danger subtle background (light mode) |
| `ocean.dark` | `#213b45` | Primary pressed |
| `ocean.DEFAULT` | `#386374` | **Primary brand** — primary buttons, links, focus rings, active nav |
| `ocean.light` | `#498197` | Primary hover |
| `ocean.lightest` | `#68a0b6` | Primary subtle background, link hover |
| `moss.dark` | `#60683c` | Success pressed |
| `moss.DEFAULT` | `#8b9556` | **Success / money-positive** — paid, collected, complete |
| `moss.light` | `#a3ad71` | Success hover |
| `moss.lightest` | `#c4cba4` | Success subtle background |
| `jet.DEFAULT` | `#1d1e20` | Darkest surface — nav, dark-mode page bg |
| `flash.DEFAULT` | `#e9ebec` | Lightest — light-mode page bg, dark-mode text |

> Note: today the app mostly uses generic `green-*` / `red-*`. The redesign should
> route **all** semantic color through `moss` (success/money) and `raspberry`
> (danger/behind), so screens actually look like Cap City.

### 3.2 Color — semantic tokens (theme-aware)

Define each as a light value and a dark value.

| Semantic token | Light | Dark | Use |
|---|---|---|---|
| `bg.page` | `flash` `#e9ebec` | `jet` `#1d1e20` | App background |
| `bg.surface` | `#ffffff` | `#26272a` | Cards, panels, table |
| `bg.surface-raised` | `#ffffff` + shadow | `#2f3033` | Menus, popovers, modals |
| `bg.sunken` | `#f1f2f3` | `#1a1b1d` | Inset areas, input fields at rest |
| `bg.nav` | `jet` `#1d1e20` | `jet` `#1d1e20` | Sidebar (dark in both themes — brand anchor) |
| `text.primary` | `#1d1e20` | `#e9ebec` | Body |
| `text.secondary` | `#5b6166` | `#9aa0a6` | Labels, metadata, captions |
| `text.on-brand` | `#ffffff` | `#ffffff` | Text on ocean/moss/raspberry fills |
| `border.default` | `#d7dade` | `#3a3c40` | Card borders, dividers, table rules |
| `border.strong` | `#b9bec4` | `#4c4f54` | Input borders, emphasis |
| `focus.ring` | `ocean` `#386374` | `ocean.light` `#498197` | Focus outline (2px, offset 2px) |
| `accent.primary` | `ocean` `#386374` | `ocean.light` `#498197` | Primary actions, links, active state |
| `status.success.fg` | `moss.dark` `#60683c` | `moss.light` `#a3ad71` | "Paid", "Approved", "Complete" text/icon |
| `status.success.bg` | `#eef1e4` | `#3a3f28` | Success pill background |
| `status.danger.fg` | `raspberry.dark` `#962231` | `raspberry.light` `#d9596a` | "Behind", "Denied" |
| `status.danger.bg` | `#fbe9ec` | `#42222a` | Danger pill background |
| `status.warning.fg` | `#8a6d1f` | `#d8b45a` | "Due soon", "Pending" |
| `status.warning.bg` | `#faf1dc` | `#3a3320` | Warning pill background |
| `status.neutral.fg` | `#5b6166` | `#9aa0a6` | "Draft", "Archived" |
| `status.neutral.bg` | `#eceef0` | `#33353a` | Neutral pill background |

### 3.3 Data-viz palette

For the dues burndown chart and any fundraiser charts. Keep it small and on-brand.

| Series role | Color |
|---|---|
| Scheduled / expected | `ocean.light` `#498197` |
| Actual / collected | `moss.DEFAULT` `#8b9556` |
| Behind / gap | `raspberry.light` `#d9596a` |
| Projection / reference line | `text.secondary`, dashed |
| Grid lines | `border.default` at 40% opacity |

(If a categorical set is ever needed — e.g. payment-type breakdown — extend with
`ocean.DEFAULT`, `moss.DEFAULT`, `raspberry.DEFAULT`, `#7a6ea3` (muted violet),
`#c9a24b` (ochre). Cap at 5; beyond that, group as "Other".)

### 3.4 Typography

| Token | Value | Use |
|---|---|---|
| Font family — UI | System stack: `-apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. *(Optional upgrade: a single geometric sans like "Inter" or "Figtree" for a more distinct feel — decide in Claude Design.)* | Everything |
| Font family — numeric | `"SF Mono", "Roboto Mono", ui-monospace, monospace` | Money amounts, counts, dates in tables — tabular alignment |
| `text.display` | 32 / 38, weight 700 | Page-level hero number (rare) |
| `text.h1` | 28 / 34, weight 700 | Page title |
| `text.h2` | 20 / 28, weight 600 | Section / card group title |
| `text.h3` | 16 / 24, weight 600 | Card title, subsection |
| `text.metric` | 28 / 32, weight 700, numeric font, tabular-nums | The big number on a stat block |
| `text.body` | 15 / 22, weight 400 | Default |
| `text.body-sm` | 13 / 18, weight 400 | Secondary, table cells |
| `text.label` | 12 / 16, weight 600, letter-spacing 0.04em, uppercase | Card kickers ("DUES PROGRESS"), table headers |
| `text.caption` | 12 / 16, weight 400 | Timestamps, helper text |

> Current app uses `font-mono font-extrabold` for big numbers — keep the *idea*
> (tabular numeric emphasis) but standardize on the `text.metric` token so every
> stat looks the same.

### 3.5 Spacing, radius, elevation

| Token | Value |
|---|---|
| Space scale | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 |
| `radius.sm` | 6px — inputs, badges, buttons |
| `radius.md` | 10px — cards |
| `radius.lg` | 16px — main content panel, modals |
| `radius.full` | 9999px — status pills, avatars |
| `elevation.0` | none — flat cards on `bg.page` get a 1px `border.default` instead |
| `elevation.1` | `0 1px 2px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.10)` — resting cards |
| `elevation.2` | `0 4px 12px rgba(0,0,0,.12)` — menus, popovers |
| `elevation.3` | `0 12px 32px rgba(0,0,0,.20)` — modals, toasts |

### 3.6 Layout

| Token | Value |
|---|---|
| Sidebar width (desktop) | 220px (up from 160 — room for labels + season switcher) |
| Sidebar collapsed | 64px (icon-only, optional) |
| Content max-width | 1200px for dashboards/tables; 640px for single-column forms |
| Content gutter | 24px mobile, 32px desktop |
| Breakpoints | `sm` 640, `md` 768, `lg` 1024, `xl` 1280 |
| Grid | 12-col on `lg+`, single-col below `md` |

---

## 4. Components

Each component below is what to build as reusable elements in Claude Design.
"Replaces" points at the current implementation it supersedes.

### 4.1 App shell
- **Sidebar** (`bg.nav`, always dark). Logo at top. Nav items = icon + label, 40px
  row, active item gets an `ocean` left-edge indicator + `ocean.lightest` text.
  Role determines the item set (see audit). Bottom-anchored: Whistleblower,
  Settings, Log out.
- **Season switcher** — a dedicated control at the top of the sidebar (or in the
  top bar), showing the current season year prominently with a dropdown of
  CURRENT / PAST seasons. This is a *primary* control, styled as such.
- **Top bar** — thin. Left: page title + optional breadcrumb. Right: profile menu.
  On mobile: hamburger + logo + season chip.
- **Mobile nav** — the *same* nav list in a slide-over sheet. One source of truth,
  not a separate markup block.
- Replaces: all 5 ERB layouts + both `_sidebar` partials + duplicated mobile menus.

### 4.2 Button
- Variants: `primary` (ocean fill), `success` (moss fill), `danger` (raspberry
  fill), `secondary` (surface + `border.strong`), `ghost` (text only), `link`.
- Sizes: `sm` (28px), `md` (36px), `lg` (44px — default for primary form actions
  and anything touched on mobile).
- States: hover (lighten one step), active (darken one step), disabled (40%
  opacity, no pointer), loading (spinner replaces label, width held).
- Full-width below `sm`, auto width above — keep this behavior from the current
  `.btn-base`.
- Replaces: `.btn-primary/.btn-green/.btn-red/.btn-gray/.btn-link` + `.btn-lg/md/sm`.

### 4.3 Card
- One card component. Props: `title` (uses `text.label` kicker), optional
  `action` (link/button top-right), `tone` (`neutral` default, or `success` /
  `danger` / `warning` — sets a subtle left accent + tinted title, not a full
  fill).
- Resting elevation `elevation.1` on `bg.surface`; on a `bg.page` context use a
  1px border instead of shadow (pick one globally in Claude Design).
- Replaces: `.card`, `.card-flat`, gradient cards, and the ad-hoc
  `border-green-500` / `border-red-500` domain coloring.

### 4.4 Stat block (metric)
- The single most-used dashboard element. Structure:
  `kicker` (label) → `metric` (big tabular number, `text.metric`) →
  `context` (one line: "of $600" / "3 behind" / "due Fri 3/14") →
  optional `trend` (sparkline or delta chip) → optional `detail list` below.
- Semantic color comes from `tone`, applied to the metric and kicker only.
- Threshold coloring (e.g. behind-members 0=success, 1–4=warning, 5+=danger) is a
  **prop on the component**, not hand-coded per screen.
- Replaces: the copy-pasted `text-3xl font-extrabold font-mono` blocks and
  `BehindMembers`' inline color logic.

### 4.5 Progress / burndown
- **Linear progress** — for "dues paid vs total" on the member dashboard. Track +
  fill (moss), a marker for "expected by today", label shows `$paid / $total`.
- **Burndown chart** — for admin dashboard. Two lines (scheduled vs actual) over
  the season, gap shaded raspberry when behind. This becomes the *hero* of the
  admin dashboard.

### 4.6 Table
- Desktop: standard rows, `text.body-sm`, `border.default` row rules, sticky
  header (`text.label`), hover = `bg.sunken`, whole row clickable where it links
  to a detail.
- **Mobile: card-list fallback.** Below `md`, each row renders as a stacked card
  with the primary field bold, secondary fields as label/value pairs, and the
  row action as a full-width button. Design both.
- Built-in: search/filter bar slot, sort affordance on headers, a designed empty
  state, a loading skeleton (3–5 shimmer rows).
- Pagination: one consistent pattern (prefer "load more" or a simple pager) —
  not the current per-widget chevron counters.
- Replaces: `.custom-table`, `.table-header`, `.table-cell`, and the four
  separate paginated list widgets on the admin dashboard.

### 4.7 Form row
- Horizontal on `sm+` (label column ~160px, field fills rest), stacked below.
- Parts: `label`, optional `hint` (below label), `field`, optional `error`
  (raspberry, replaces hint), optional `suffix`/`prefix` (e.g. `$`).
- Field types to style: text, textarea, number (with mask), select, date/datetime
  (flatpickr wrapper), checkbox, radio group, toggle, file upload, multi-select
  (for whistleblower admin picker).
- Focus: 2px `focus.ring`, offset. Disabled: `bg.sunken`, `text.secondary`.
- Replaces: the hand-rolled `grid grid-cols-5` form layout repeated in every ERB
  form, and `.input-text/.input-select/.input-checkbox/.input-toggle` etc.

### 4.8 Status pill / badge
- Fixed vocabulary, each with a fg/bg token pair from §3.2:
  `Pending` (warning) · `Approved` (success) · `Denied` (danger) ·
  `Resolved` (neutral) · `Current` (success) · `Behind` (danger) ·
  `Due soon` (warning) · `Complete` (success) · `Draft` (neutral).
- Optional leading icon (reuse the conflict-status / payment-type icon set).
- Fixed shape: `radius.full`, `text.label` sizing, 2px/8px padding.
- Replaces: `Badge.tsx` with its fragile `bg-${color}-100` dynamic classes and
  the `_conflict_status_icon` / `_payment_type_icon` partials (fold the icons in).

### 4.9 Empty state
- Icon or small illustration + one encouraging sentence + optional action button.
- Every list/table/dashboard card uses it. Replaces literal "None" text.

### 4.10 Loading state
- Skeleton shimmer for tables/cards; inline spinner for buttons; a top-bar
  progress sliver for full-page transitions. No blank screens.

### 4.11 Toast / flash
- Bottom-right stack (keep current position), `elevation.3`, `radius.md`.
- Variants: success (moss), error (raspberry), info (ocean), neutral.
- Solid tinted background, white text, icon, auto-dismiss with a pause-on-hover
  timer bar, manual close.
- Replaces: `.flash-success/.flash-error/.flash-info/.flash-default` gradient bars.

### 4.12 Member 360 header
- Reusable header block for `/admin/users/:id`: name, ensemble + section,
  member-type (vet/new), current-season role, and a row of stat blocks (dues
  status, conflicts count, fundraiser total). Used as the anchor for the detail
  page that payments and behind-members link into.

### 4.13 Public fundraiser components
- The donor flow gets its own lightweight theme layer (still on-brand: `ocean` /
  `moss`, `flash` background) but does **not** use the app shell.
- **Performer picker** — searchable list/grid of members with photo/initial,
  ensemble, and fundraiser progress.
- **Date selector** — replace the `<canvas>` + hardcoded-pixel picker with a real
  calendar-grid component: 100 numbered days, each showing available / taken /
  selected, keyboard accessible.
- **Checkout summary** — selected performer, selected dates as chips, subtotal,
  Stripe payment element, one plain-language fee line.
- **Confirmation** — receipt, "donate to someone else", social share.

### 4.14 DuesMeter *(added — Flow 2)*
- Horizontal bar. **Fill = paid ÷ total** in `moss`. A **jet tick** (flips to
  `flash` in dark) marks "expected by today" (`PaymentSchedule#scheduled_to_date`).
- A **striped segment** = money committed but not counted toward `paid`: past-due
  (raspberry hatch) or a pending charge (warning hatch). Sits between the fill and
  the tick.
- **Tone comes from paid vs. expected, never the raw percentage** — a prop, same
  pattern as StatBlock (§4.4): `on-track` / `ahead` / `behind` / `pending` /
  `paid-in-full` / `no-schedule`.
- Label line above: `$paid / $total · exp $expected` (Roboto Mono, tabular).
- Empty-schedule state (`no-schedule`): no bar, a neutral line "No dues schedule
  set yet — a director will add one."
- Reuses `status.*` tokens; no new colors.

### 4.15 PaymentRow *(added — Flow 2)*
- One row shape for both halves of the "Dues timeline" (paid history + upcoming
  schedule), so the two reconcile visually into one column.
- Left: a 26px rounded square — a method badge (`CD`/`VE`/`CA`/`CK` for
  Card/Venmo/Cash/Check) on paid rows, a day-number chip on schedule rows.
- Middle: date (M/D/YY, weekday added within 14 days) + a subline
  (`Card · $4.01 fee on top` / `no fee` on paid; `Due in 4 days · installment 4
  of 5` on upcoming).
- Right: amount in Roboto Mono — `moss` on paid, `text.secondary` on future,
  `danger.fg` on past-due.
- **Past-due** is the only variant with a fill: 3px `raspberry` left accent +
  tinted body.
- **Pending** row: spinner in the badge slot, warning subline.
- All four `payment_type` values share the row shape — method differs by badge +
  subline only.

### 4.16 MoneyField + fee breakdown *(added — Flow 2)*
- **MoneyField**: sunken `$` prefix, Roboto Mono value, 48px tall (thumb-clear).
  States: default (placeholder `0.00` in `border.default`), focused-valid (2px
  `focus.ring` + a `success.fg` helper line), error (raspberry border + raspberry
  helper, e.g. "That's more than the $240.00 left this season").
- **Fee breakdown**: always three lines in the same order — `Toward dues`,
  `Card fee (3% + 30¢)`, `Total charged` (bold, dashed top rule). Renders `–`
  dashes, not `$0.00`, before an amount is entered.
- The fee math is the real formula: `total = amount / 0.97 + 0.30` (see the
  implementation notes — this PR extracts it to a shared constant, recomputes it
  server-side, and fixes a cents-truncation bug). Copy says "3% + 30¢" because
  that's what members recognize.
- "Toward dues" quick-fill buttons above the field: `Pay $X owed` (the current
  installment) and `All $Y` (everything left this season). Partial payments apply
  **oldest-installment-first**.

---

## 5. Accessibility baseline

- Contrast: body text ≥ 4.5:1, large text/UI ≥ 3:1 in both themes. (Check
  `moss` and `raspberry` fills against white text — may need the `.dark`
  variants for text-on-fill.)
- Every interactive element has a visible `focus.ring`.
- Status is never color-only — always paired with text and/or icon.
- Tables use real `<th scope>`; the mobile card fallback keeps label/value pairing.
- Forms: label tied to field, errors announced, `required` marked in text not
  just color.
- Hit targets ≥ 44px on member-facing (mobile) screens.

---

## 6. What to hand Claude Design

1. This document → *Set up your design system* (tokens + components).
2. `01-screen-audit.md` → reference for what each screen does.
3. Per flow, ask me for the **real data shape** of those screens (actual field
   names and types the controllers pass), so mockups use real content.
4. Design **Flow 1 (design system + shell)** first and get it right — it's the
   foundation every other flow builds on.

---

## Appendix — current → new mapping (quick reference for implementation later)

| Current | New |
|---|---|
| `.btn-primary` etc. | Button `primary` variant |
| `.card` / `.card-flat` / gradient cards | Card component + `tone` prop |
| `text-3xl font-extrabold font-mono` blocks | Stat block / `text.metric` token |
| `.custom-table` + `.table-*` | Table component (+ mobile card fallback) |
| `grid grid-cols-5` form layout | Form row component |
| `Badge.tsx` (`bg-${color}-100`) | Status pill (fixed vocabulary) |
| `_conflict_status_icon`, `_payment_type_icon` | Icons folded into Status pill / row meta |
| `.flash-*` gradient bars | Toast component |
| 5 ERB layouts + 2 `_sidebar` partials + mobile menus | One App shell |
| Generic `green-*` / `red-*` | `moss` / `raspberry` semantic tokens |
| Season dropdown in top bar | Season switcher (primary control) |
| `console.error`, render nothing | Loading + empty + error states |
