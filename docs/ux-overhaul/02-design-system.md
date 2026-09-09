# Design System — Cap City Percussion

The design system for the app overhaul. Started as a proposal; now the living
reference — components below are updated as each flow builds them, and the
`*(added — Flow N)*` tags on §4.14+ mark what shipped when. It reuses the one
genuinely good asset the app already had (the `raspberry / ocean / moss / jet /
flash` brand palette) and replaced the rest.

The **Tokens** and **Components** sections are the Claude Design project's design
system. The **Principles** and **Voice** sections are guidance for how screens
should feel.

**Status:** Flows 1–3 merged (shell/tokens #221, member dues #226, member
conflicts #230). Layout set is now three — `application` / `auth` / `public`
(#229), + `calendar` until Flow 7 folds it in. Flow 4 (admin financial command
center) built — PR open, visual pass pending; §4.4 + §4.5 + §4.12 + §4.20–4.25
all shipped this flow. Full flow list: `01-screen-audit.md`. Live task status:
**beads** — `bd show cap_ruby-b3a`.

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
- Empty states are encouraging, not blank: "Nothing on the books — you haven't
  told anyone you'll miss a rehearsal this season. When you know, say so early."
  not "None."
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

The reusable elements. §4.1–4.13 were the Flow 1 spec; §4.14+ carry an
`*(added — Flow N)*` tag and describe what actually shipped in that flow (so
where the built component diverged from its canvas, this is the source of
truth, not the canvas). "Replaces" points at the pre-overhaul implementation
each one superseded.

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
- **Layout set (post-overhaul target): three.** `application` — the shell, every
  authenticated screen. `auth` — Devise (login / password recovery), a centered
  card. `public` — the shell-free layout for pages with an external,
  unauthenticated audience (auditions spreadsheet, standalone tools, and — after
  Flow 7 — the calendar fundraiser, folding today's one-off `calendar` layout in).
  Public controllers inherit from `PublicController` (`layout 'public'`) so the
  category is *declared*, not inferred from whether someone's signed in. The
  shell partials (`_sidebar`, `_topbar`, `_drawer`, `_season_switcher`) carry a
  `return unless current_user` guard as defense-in-depth — a stray shell render
  degrades to no-chrome, never a 500. *(Established in the PublicController PR;
  see `01-screen-audit.md` "How the app is built today".)*

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

### 4.4 Stat block (metric) *(built — Flow 4)*
- The single most-used dashboard element. Structure:
  `kicker` (label) → `metric` (big tabular number, `text.metric`) →
  `context` (one line: "of $600" / "3 behind" / "due Fri 3/14") →
  optional `trend` (a delta chip).
- Semantic color comes from `tone`, applied to the metric and kicker only.
- Threshold coloring (behind-members 0=success, 1–4=warning, 5+=danger) is the
  `threshold` **prop** — pass the count, not a tone; it bands and overrides `tone`.
- Was a Flow 1 spec that never shipped (Flow 2 used inline ERB pills). Built as
  `StatBlock.tsx` in Flow 4. The canvas's sparkline/detail-list ideas were cut —
  a chip covers the only trend Flow 4 has, and no screen needed a detail list.
- Replaces: the copy-pasted `text-3xl font-extrabold font-mono` blocks and
  `BehindMembers`' inline color logic (both deleted in Flow 4).

### 4.5 Progress / burndown
- **Linear progress** — for "dues paid vs total" on the member dashboard. Track +
  fill (moss), a marker for "expected by today", label shows `$paid / $total`.
  *(Shipped as DuesMeter §4.14 in Flow 2.)*
- **Burndown chart** — the *hero* of the admin dashboard. *(Built — Flow 4, as
  `BurndownChart.tsx`.)*
  - Two cumulative series over the season, plotted as an inline `<svg>` (no chart
    lib): **Scheduled** — the `--viz-scheduled` token (`#498197` light /
    `#68a0b6` dark), **dashed** 2.5px, "it's a plan"; **Collected** — `--viz-actual`
    (`#8b9556` / `#a3ad71`), **solid** 3px with a dot at the last point, and the
    line **stops at today**, it does not return to zero.
  - *Colour-safety note (Flow 4 build):* the scheduled/collected pair is normal-
    vision ΔE 14.6 — just under the categorical floor. Kept because it is the
    documented token pair and the chart carries **four** non-colour cues (dash
    pattern, terminal dot, legend, hatched behind-schedule fill). Not a blocker;
    recorded here so a future flow doesn't "discover" it.
  - **Behind-schedule area**: the region between the two lines, filled with a
    **45° hatch pattern** in `--viz-gap` (not a flat tint — this closes the §5
    colour-only gap), shown **only when collected trails scheduled**. When ahead
    of plan, no fill.
  - A dashed vertical **"Today"** rule (jet in light, `text.secondary` in dark)
    with a "Today" label; y-axis `$0…$90k` in Roboto Mono, x-axis 3–4 month ticks.
  - **Caption line below** the chart: `$X behind schedule` in `danger.fg` + a plain
    sentence ("as of Tue 3/10. Collections have trailed the plan since
    mid-February.").
  - Card chrome on the dashboard: title **"Dues collected against plan"**, a
    subtitle naming the season + sampling ("every member's own schedule, summed
    weekly · through <today>"), and a **segmented range control**
    (Season to date / Full season / Last 30 days) that **filters the chart only,
    not the lists below it**.
  - **Data model.** The scheduled line is the sum of *every member's own*
    `PaymentSchedule` entries, cumulative — it ramps in many small steps, not 5–6
    org-wide dates. Sampled **weekly** (a Sunday point is accurate to the dollar
    for anything due earlier that week). This is a **cadence change** from the
    current `DashboardUtilities.biweekly_scheduled` / `biweekly_actual`, which
    sample every Sunday (already weekly despite the name) but hardcode
    `Season.last.id` — Flow 4 scopes them to the season in context.
  - `scheduled` / `actual` (`[iso, dollars][]`), `today`, `currency`, `setupHref`
    props. States: **data** / **no-data** — the empty state is a dashed-border
    panel, "No dues scheduled for this season yet / The burndown appears once
    members have payment schedules." + a "Set up payment schedules" link. Loading
    on the dashboard is the ERB skeleton (the data is inline, no fetch).
  - Min height 280px. `role="img"` + `aria-label` (which names the behind-schedule
    amount) on the `<svg>`. Non-colour cue for the behind-schedule area: the hatch
    pattern above. *(a11y gap from the review — closed.)*
  - `DashboardUtilities.biweekly_scheduled` / `biweekly_actual` were renamed to
    `season_scheduled_series` / `season_actual_series` (season-scoped, not
    `Season.last`); no callers besides the burndown action, no aliases kept.

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

### 4.12 Member 360 header *(built — Flow 4, as `Member360Header.tsx`)*
- Reusable header block for `/admin/users/:id`, the landing target of every money
  link on the admin side.
- **Layout**: a Card, `grid-template-columns: minmax(0,1fr) 380px`, the right
  column separated by a `border.default` left rule. Stacks under 900px.
- **Left (identity)**: circular avatar with initials (56px; `accent.primary`
  fill, `border.strong` for the "nothing on file" variant), name (`800 26px`),
  `@username` in Roboto Mono, then a **pill row** — section (`Front Ensemble /
  Vibes`), member-type (`Vet · 3rd season` on the page, bare `Vet` / `New member`
  on the component sheet), current-season role (`Section leader` / `Member`) —
  then contact lines (email · "<Season> season").
- **Right (money)**: a **DuesMeter (§4.14)** — `$X of $Y collected` headline, the
  bar with the expected-by-today tick, caption lines ("Expected by today: $X" /
  "$Y due later this season" — or "Striped = past due" on the past-due variant),
  a status pill (`On track` / `$X past due`), and a **Conflicts count** block
  ("2 this season" / "None this season").
- **Data bound**: name, username, email, current-season ensemble/section,
  member type, role, dues collected, season total, expected-by-today, past-due
  amount, season conflicts count.
- **Variants**: on-track; past-due (split bar — solid paid + `raspberry` hatch
  past-due); **minimal / no-schedule** — the meter is replaced by "No schedule
  yet / $0 collected. The meter waits for a payment schedule rather than showing
  a full bar." + a "Set up schedule" link.
- **Roles by season** (below the header, not part of it): one row per season the
  user was a **member** (`seasons_users` filtered to `role = 'member'` — a member
  who later became staff should not have their staff seasons listed here), the
  current season tagged with a `Current` pill, each showing that season's
  ensemble / section.

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
- Label line above: `$paid / $total` on the left, `Expected by today: $expected`
  on the right (Roboto Mono for the figures, tabular).
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

### 4.17 DateTimeField pair *(added — Flow 3)*
- Two adjacent controls per boundary (`Starts` / `Ends`): a date box (1.3fr) +
  time box (1fr) in one row, `border.strong` at rest, `raspberry` border + a
  `danger.fg` helper line in the error state (e.g. "Start date must be in the
  future. That was 2 days ago.").
- *(The canvas's "Friday evening, 3 hours." computed-duration subline was cut —
  it read as clutter next to native pickers that already show the values.)*
- **Native `<input type="date">` + `<input type="time">`** — the OS wheel
  picker on mobile, the browser's own calendar on desktop, accessible for free,
  no library. `min` is enforced on both (today for the start, the chosen start
  for the end). The picker's dropdown appearance (e.g. red weekends in Chrome)
  is the browser's and not styleable — an accepted trade for the mobile/a11y
  wins.
- Reason field pairs with it: textarea, `border.strong`, a live character count
  top-right, same error treatment.

### 4.18 Validation summary card *(added — Flow 3)*
- Appears above the form on failed submit (mobile: replaces where the form
  starts; desktop: can stay inline per-field instead — use judgment per screen).
- 3px `raspberry` left accent, `danger.fg` heading pluralized to the error
  count ("One thing to fix" / "3 things to fix" — never hardcoded), then each
  error as plain `danger.fg` text (no links — the same message also renders
  inline under its field).
- The form repopulates on a failed submit (fixing the current app's bug where
  validation resets it to blank) — but that's expected behaviour now, not
  something to call out with a reassurance line.

### 4.19 Conflict context row *(added — Flow 3)*
- The shape used both for "your existing conflicts" on the submit form and the
  dashboard "Your conflicts" card, so the two reconcile visually — and so a
  future triage queue (Flow 5) can reuse the same row grouped by member.
- Row: date range + time range where known, status pill (§4.8 vocabulary)
  top-right, a relative subline (`In 4 days · submitted 3 days ago`), and — only
  on Denied and the next upcoming row — a truncated `reason` subline. Other rows
  omit `reason` to keep the list scannable.
- Date-range formatting (`ConflictPresenter`, shared with the dashboard):
  same-day timed → `Fri 3/14 · 6:30–9:30 PM`; same-day full day → `Sat 3/22 ·
  all day`; spans days → `Sat 4/4 – Mon 4/6`; more than 14 days out → bare
  `10/5/26 · 6:00 PM` (no weekday — the same rule Flow 2 uses for due dates).
  Relative age always accompanies an absolute date, never replaces it.
- Dashboard card adds a pill-summary header line (`2 Pending` / `1 Approved` /
  `1 Denied`, counts only) plus one computed nudge sentence when something's
  waiting: "Next one is Fri 3/14, still pending after 3 days."
- A transient "just submitted" variant: a dismissible `success` band above the
  list ("Sent. Your coordinators see it now. Approval isn't automatic.") rather
  than a separate toast, so the confirmation and the new row are read together.

### 4.20 Alert banner with action list *(built — Flow 4, as `AlertBanner.tsx`)*
- Replaces the admin dashboard's `flash[:error]` array ("Member found with blank
  payment schedule: …") and the equivalent on Member 360.
- 3px `status.warning` left accent, a headline (`2 members have no payment
  schedule`), one plain explanatory line ("They're missing from the burndown and
  won't be flagged as behind."), a **`Dismiss` control**, and an **embedded
  mini-list** — one row per affected member (name · section) with a "Set up
  schedule" link straight to that member's schedule editor.
- On Member 360 it's the single-member form ("Marcus has no payment schedule /
  His $1,200 has been credited against the default new-member schedule. Set a
  real one so the due dates and the burndown include him.").

### 4.21 Filter bar *(built — Flow 4, as `FilterBar.tsx`)*
- *Build note:* the mobile "Filters button + sheet + removable chips" was
  simplified to a wrapping inline row of 44px controls — it holds at tablet
  width and the sheet/chips can be a follow-up if a phone pass wants them.
- For `/admin/payments` (and reusable by any admin table). A horizontal row:
  search field (`Search member name`), a type dropdown (`All types` +
  Card/Venmo/Cash/Check/Other), a **date-range** dropdown, a **status-scope**
  dropdown (`Active only` / `Active + deleted` / `Deleted only`), a **live result
  summary** (`18 payments · $9,420`, and `· 1 deleted` when the scope includes
  them), and a `Clear filters` link.
- The scope dropdown carries a fixed note: **"Deleted payments are excluded from
  every total on this page."** — the totals shown are always of non-deleted rows
  regardless of scope (see verification note below; the canvas mock has one
  number that contradicts this — the doc wins).
- All four controls are server-side params; the eventual controller must
  allowlist sort/filter columns (no interpolation).
- Mobile: collapses to a `Filters` button with a count badge that opens a sheet;
  active filters also show as removable chips above the list.

### 4.22 Sortable table header + "load more" pager *(built — Flow 4, as `SortableTh.tsx` + `LoadMoreButton.tsx`; `PaginatedList.tsx` wraps the pager for client-side lists)*
- **Sort**: column headers carry a sort affordance (`↕` idle, `▲`/`▼` active),
  `aria-sort` on the active one. Sortable columns on the payments table: date
  paid, member, type, amount.
- **Pager**: one pattern app-wide — a `Load N more` button under the list
  (`Load 10 more`, `Load 20 more`), disabled with `Showing all N` when exhausted.
  This is the §4.6 "one consistent pattern" decision, resolved to load-more.
  **Replaces all four chevron pagers** on the current admin dashboard widgets.

### 4.23 Deleted-row treatment *(built — Flow 4, as `deletedRow.tsx`: `deletedRowClass` + `DeletedPill` + `RestoreAction`)*
- How a soft-deleted `Payment` (paranoia gem) renders in a table row, a mobile
  card, and the Member 360 payments list: every cell struck through, an uppercase
  `Deleted` status pill (neutral), a faint body tint, and the row actions
  collapsed to a single **`Restore`** (maps to `PUT /api/admin/payments/restore/:id`
  → paranoia `restore`).
- Deleted rows appear only when the §4.21 scope includes them; they never count
  toward any total, meter, or burndown point.

### 4.24 "Where this leaves them" projection panel *(built — Flow 4, as `PaymentProjectionPanel.tsx`)*
- *Build note:* the add-payment form passes every member's projection numbers
  inline, so the panel updates on member-switch with no fetch.
- Side panel on `/admin/payments/new`, updates live as the form changes. A
  **DuesMeter (§4.14)** for the selected member plus a three-row ledger:
  `Paid before $X` / `This payment +$Y` / `Still owed $Z`, and a one-line verdict
  ("Fully paid up for the season after this."), then a deep link to that member's
  Member 360.
- Paired with a read-only **"Applies to"** field on the form itself: `Oldest
  unpaid due date first: 3/15, then 4/15` — helper "Not editable: payments credit
  against the schedule in order." Manual payments are **not** earmarked to a
  specific `PaymentScheduleEntry`; a single payment can satisfy several entries.
- No-member-selected state: placeholder copy + a flat grey bar.

### 4.25 Plan-vs-reality timeline + schedule-diff panel *(built — Flow 4, as `ScheduleTimeline.tsx` + `ScheduleDiffPanel.tsx`)*
- *Build note:* both are presentational; `ScheduleEditor.tsx` (the widget) owns
  the editable rows, the client-side "Moved from" tracking, and wires the diff
  panel to `#default_preview` / `#apply_default`.
- For `/admin/payment_schedules/:id/edit`. Distinct from the §4.5 burndown — this
  is **per-member and node-based**, not a line chart.
- **Timeline**: a horizontal track with a node dot per `PaymentScheduleEntry`
  positioned by date, each labelled with date + amount + a derived status color
  (covered by a payment / due next / not due yet / **late**), a dashed "Today"
  marker, a legend, and a `$X paid of $Y planned` headline. A caption appears
  when dates were moved past due ("Two due dates went by unpaid. Moving them
  forward doesn't erase them. It just changes when they're counted as late.").
- **Editable rows** below: date + amount (§4.16 MoneyField) per entry, add/remove,
  a per-row derived status pill (`Paid 11/10`, `Due in 5 days`, `54 days late`,
  `Moved from 3/15` — all derived, none stored; "Moved from" is tracked
  client-side against the entry's original date), an `Unsaved changes` indicator.
- **Diff panel**: `Differs from the vet default` / `Reset to default?` — a keyed
  `old → new` / `+ added` / `unchanged` list with an `Apply default` / `Keep
  mine` action and the caveat **"Resetting only rewrites future due dates. The
  ones already covered by payments stay as they are."** — a behaviour change from
  today's `PaymentScheduleService` default path (verify: it may currently replace
  all entries).
- Statuses (`Paid`, `Due in N days`, `N days late`, `Upcoming`, `Not due yet`)
  are all derived from schedule entries vs. the running payment total —
  confirm none become DB columns.

---

## 5. Accessibility baseline

- Contrast: body text ≥ 4.5:1, large text/UI ≥ 3:1 in both themes. (Check
  `moss` and `raspberry` fills against white text — may need the `.dark`
  variants for text-on-fill.)
- Every interactive element has a visible `focus.ring`.
- Status is never color-only — always paired with text and/or icon. *(Flow 4:
  the burndown's behind-schedule area is a 45° hatch pattern + the amount is
  named in the `aria-label`; the deleted-row treatment is strike-through + a
  "Deleted" pill; schedule-entry and timeline statuses all carry a text label.)*
- Tables use real `<th scope>` — the Flow 4 canvas mocked the payments and
  schedule tables as CSS-grid `<div>`s with fake form controls; the build uses
  real `<table>` / `<input>` / `<select>` / `<button>`, sortable headers with
  `aria-sort`, and a `<button>` in each sortable `<th>`.
- The mobile card fallback keeps label/value pairing.
- Forms: label tied to field, errors announced, `required` marked in text not
  just color.
- Hit targets ≥ 44px on member-facing (mobile) screens.

---

## 6. Per-flow process (what's worked so far)

1. This document is the Claude Design project's design system (tokens +
   components). `01-screen-audit.md` is the reference for what each screen does
   and the priority-ordered flow list.
2. Per flow: write a Claude Design prompt referencing the **real data shape** of
   those screens — actual field names and types the controllers pass — so
   mockups use real content, not lorem.
3. Pull the canvas via `DesignSync`, review it, and sync any new components back
   into §4 here (with an `*(added — Flow N)*` tag).
4. Where the design makes assumptions about app behaviour (fee math, data model,
   latent bugs), verify against the codebase **before** planning the build —
   this caught 4 real bugs in Flow 2 and the "no `Event` listing" constraint in
   Flow 3.
5. Implementation plan → `~/.claude/plans/`, one phase per layer (backend →
   primitives → screen → screen → polish), one commit per phase, green gate
   (`rspec` / `vitest` / `vite build` / `rubocop`) at each.
6. One PR per flow, off fresh `main`, with a "needs a human visual pass"
   callout. Expect a round or two of tweaks from the visual pass after the PR
   opens.

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
