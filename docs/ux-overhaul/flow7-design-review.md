# Flow 7 — Public fundraiser: design review

Reviewing the Claude Design canvas **"Flow 7 - Public fundraiser"**
(project `535a10bc-3e9d-4a90-be44-e7e6322ef3d0`) against the code, before
building. Same job as `flow4-` / `flow5-` / `flow6-design-review.md`: catch the
places the design assumes behaviour the app doesn't have, and correct the
places the *planning docs* are the ones that turned out to be stale.

This is the last P1 flow and the only screen an outsider ever sees, so the bar
on copy, mobile, and payment correctness is higher here than anywhere else.

Everything below was checked against the code at `origin/main` (c16e510) and,
where noted, against the local development database (513 users, seasons
2018–2027, 1,541 calendar donations).

---

## 0. How the fundraiser actually works

Worth stating plainly, because two of our own docs describe it wrongly.

**The donation amount is the date number.** Sponsoring March 3rd is a $3
donation; the 17th is $17. There are **31 dates** per performer (March 1–31),
each claimable exactly once. A performer whose all-31 dates are claimed has
raised **$496** (1+2+…+31), which is `Calendar::Fundraiser::TOTAL_MARCH_DATES`.

March is not a display choice, it's baked into the domain:
`CalendarMailer#calendar_email` formats the donated dates as `"3/#{d}"`.

```ruby
# app/mailers/calendar_mailer.rb
@donation_dates = params[:donation_dates].map { |d| "3/#{d}" }
```

The database agrees. Grouping every fundraiser by its summed `donation_date`,
the completed ones land on exactly 496 with exactly 31 donation rows:

| fundraiser | season | Σ donation_date | rows |
|---|---|---|---|
| 14 | 37 | 496 | 31 |
| 15 | 37 | 496 | 31 |
| 205 | 38 | 496 | 31 |

So "31 dates, $496, amount = date number" is confirmed from three independent
directions: the constant, the mailer, and the data.

---

## 1. Both planning docs describe a `<canvas>` picker that no longer exists

`01-screen-audit.md` (friction item 7, and the Public/unauthenticated row) and
the beads issue `cap_ruby-b3a.8` both say the donate page uses

> a `<canvas>`-based date picker with hardcoded pixel coordinates

**It doesn't, and hasn't for a while.** `app/javascript/entrypoints/calendars/new.tsx`
renders a CSS-grid month calendar — `grid grid-cols-7 gap-1` with one `<div>`
per day. There is no `<canvas>`, no pixel math, and no image-map hit testing
anywhere in the donate flow.

Where the canvas idea comes from: `Calendar::ImageService` still generates
*calendar images* for the **member-facing** page (`/members/calendars`), which
is a real feature and genuinely image-based — but that's Flow 9, not this flow,
and it's image *generation for download*, not a date picker.

**Action:** corrected in `01-screen-audit.md` (friction item 7 + the screen row)
and in §4.13 of `02-design-system.md` as part of this flow's doc sync. Do not
implement against the stale premise: there is nothing to "replace", only a
plain grid to redesign.

---

## 2. §4.13's "100 numbered days" is wrong — and here's where the 100 came from

`02-design-system.md` §4.13 specs the date selector as

> a real calendar-grid component: **100 numbered days**, each showing available
> / taken / selected

It's **31**, not 100. The 100 is a real number in the codebase, but it belongs
to a different screen:

```ruby
# app/controllers/members/calendars_controller.rb  — Flow 9, not this flow
@images = (1..100).map { |x| ["calendar_#{x}_thumb.jpg"] }
```

Those are 100 **downloadable calendar images** a member can share to promote
their fundraiser. Unrelated to the 31 sponsorable dates. The doc conflated the
member-facing image gallery with the donor-facing date picker.

**Action:** §4.13 corrected in place (31 dates; the `<canvas>` sentence dropped).

---

## 3. Month and grid alignment are separately hardcoded, and disagree

Two independent hardcodings in `new.tsx`:

```tsx
const days = [null, null, null, null, null, null].concat(
  Array.from(Array(31).keys()).map(x => x + 1)
)          // ← six leading blanks, always
...
<h2 className="text-center">March 2025</h2>   // ← literal, always
```

Six leading blanks puts the 1st in the **7th column (Saturday)**. That is
correct for March 2025 — and for no other nearby year:

| Year | March 1 falls on | Leading blanks needed | Hardcoded | Correct? |
|---|---|---|---|---|
| 2025 | Saturday | 6 | 6 | ✅ |
| 2026 | Sunday | 0 | 6 | ❌ off by 6 |
| 2027 | Monday | 1 | 6 | ❌ off by 5 |

So on today's data the grid is wrong twice over: the heading says "March 2025"
during the 2026/2027 seasons, and every date sits under the wrong weekday.

Note the alignment bug is *invisible to the money*: the amount is the date
number, so a misaligned tile still charges correctly. It's purely a
comprehension bug — but on the one page outsiders see.

**The design decision this raises:** whether the redesign keeps weekday
alignment at all. Weekday columns cost 0–6 dead cells and a year-correct
calculation, and buy a donor essentially nothing — nobody sponsors "the second
Saturday", they sponsor "the 17th, that's her birthday". The canvas's own
framing pill says **"31 tiles, $496 when complete"**, which reads as a decision
for tiles over a calendar. Confirmed against the artboards in §12 below.

If tiles win, both hardcodings simply disappear, along with the bug class.
If alignment is kept, it must be computed, and the year must come from the
season rather than a literal.

---

## 4. `CalendarsController` is the last controller outside the layout consolidation

The layout set collapsed to three in PR #229 — `application` / `auth` /
`public` — with public controllers inheriting `PublicController`. This one
didn't come along:

```ruby
class CalendarsController < ApplicationController   # ← should be PublicController
  layout 'calendar'                                  # ← the last stray layout
```

`ApplicationController` even documents the exception:

```ruby
# Public, unauthenticated routes opt out by inheriting from PublicController
# (layout 'public'); CalendarsController sets 'calendar' explicitly.
```

`app/views/layouts/calendar.html.erb` is a pre-overhaul layout: a fixed 400px
background photo (`background-attachment: fixed`), a 42rem centered column, its
own `calendar.css`, and no dark mode, no `page_title`, no flash rendering, no
`vite_client_tag`.

`calendar.css` is imported by exactly one file (`entrypoints/calendars/new.tsx`),
so it dies with the rebuild:

```
app/javascript/entrypoints/calendars/new.tsx:7:import '~/stylesheets/calendar.css'
```

**Action (Phase 1):** inherit `PublicController`, delete the `layout` line,
delete `layouts/calendar.html.erb` and `stylesheets/calendar.css`, and drop the
`calendar` mention from the `app_or_auth_layout` comment. This completes the
consolidation — noted in §4.1 of the design-system doc.

One thing to preserve: the `public` layout renders a "Back to Cap City" link
when `current_user` is present, and `spec/requests/public_pages_spec.rb` guards
that the shell never renders for a logged-out visitor. The fundraiser pages
join that shared-example list.

---

## 5. `POST /calendars` routes to an action that doesn't exist

```ruby
# config/routes.rb
resources :calendars, only: %i[index new create]   # ← create
```

`CalendarsController` has `index`, `members`, `new`, `confirm_payment`. **No
`create`.** The form in `new.html.erb` posts to it anyway:

```erb
<%= form_with model: @donation, url: '/calendars', method: :post, html: { id: 'calendar-form' } do |f| %>
  <%= f.hidden_field :user_id %> ... <%= f.hidden_field :stripe_token %>
<% end %>
```

Five hidden fields including a `stripe_token`, which is the **pre-Payment-Intents
Stripe API** — the current flow uses `confirmPayment` + a webhook and never
touches a token. Nothing reads this form; the React app submits via `fetch`. A
`donation_params` private method sits unused alongside it.

So this is dead weight that would 500 (`AbstractController::ActionNotFound`) if
anything ever posted to it. **Action:** delete the form, the `create` route, and
`donation_params`.

---

## 6. Donations are written only by the webhook — which the confirmation page can outrun

The real write path, `StripeController#process_calendar`: one
`Calendar::Donation` row per date, idempotent on the notes key.

```ruby
return if Calendar::Donation.exists?(notes: "Stripe: #{pi_id}")

fundraiser = Calendar::Fundraiser.find_or_create_incomplete_for_user(metadata.member_id)
metadata.dates.split(',').each do |date|
  Calendar::Donation.create(
    user_id: metadata.member_id, amount: date.to_i * 100,
    notes: "Stripe: #{pi_id}", donation_date: date.to_i,
    donor_name: metadata.donor_name, season_id: Season.last.id,
    calendar_fundraiser_id: fundraiser.id
  )
end
```

then `CalendarMailer#calendar_email` notifies the performer (rescued, so a mail
failure can't lose the donation).

Stripe redirects the donor to `return_url = /calendars/payment-confirmed`
(`CheckoutForm.tsx`), which renders `:success` — a static "Success!" page. The
webhook is a **separate, asynchronous** request. The donor can easily land on
the confirmation page before any donation row exists, so a confirmation page
that tries to show "you sponsored the 3rd, 11th and 17th for Ava" will
sometimes have nothing to show.

**Precedent to follow — Flow 2's `members/payments/post_processing`.** It
handles exactly this race with three states, and it's the right shape here:

1. `succeeded` **and** the row exists → full confirmed receipt.
2. `succeeded` but no row yet → "Your card went through, we're still recording
   it", plus a self-refreshing `<meta http-equiv="refresh" content="4; url=…?t=N">`
   that gives up after 5 tries and tells the donor it'll land shortly.
3. anything else → "didn't go through, nothing was charged".

Stripe supplies `?payment_intent=pi_…&redirect_status=succeeded|failed` on the
redirect, and `"Stripe: #{pi_id}"` is the lookup key — the same key the webhook
writes — so the confirmation page can find its own donations with no new
plumbing. `confirm_payment` currently reads neither param.

Being honest about the timing is the requirement; inventing a receipt for rows
that may not exist is the failure mode to avoid.

---

## 7. `Season.last` — right answer, wrong reason, and it needs a guard

`Season.last` appears in `find_calendar_members`, in the webhook's `season_id`,
and throughout `Calendar::Fundraiser`'s scopes. Note first that **there is no
`Season.current`** (CLAUDE.md describes one; it doesn't exist — `cap_ruby-w9r`).
The authenticated equivalent is `ApplicationController#current_season`, which is
cookie-based and derived from `current_user.seasons.last`:

```ruby
def current_season
  return nil unless current_user
  cookies[:cap_season_id] = current_user.seasons.last.id if cookies[:cap_season_id].nil?
  Season.find(cookies[:cap_season_id])
end
```

It returns `nil` without a `current_user`, so a **donor has no season context at
all** and `current_season` is simply unavailable on this flow. `Season.last` is
therefore the only option, and it's *semantically* what we want: donations
should land in the newest season.

Two caveats worth making deliberate rather than incidental:

- **`Season.last` is `ORDER BY id`, not by year.** It's correct today only
  because id order happens to match year order (id 79 = 2027, 73 = 2026,
  40 = 2025). A back-filled historical season would quietly redirect every
  public donation into the wrong year. `Season.order(:year).last` would say what
  we mean. Low risk, easy to get right while we're here.
- **The newest season may have no members yet.** Season 79 (2027) has 43 members
  and **zero** calendar fundraisers today. The page must degrade to a real empty
  state, not a broken picker.

**Decision for the plan:** keep `Season.last` semantics (newest season) for the
public flow, ordered by year, resolved **once** in the controller rather than
re-queried in three places. Out of scope to change `Calendar::Fundraiser`'s
scopes, which the member/admin screens (Flow 9) also depend on.

---

## 8. The commented-out "people who quit" filter is dead code, and re-enabling it would do nothing

```ruby
def find_calendar_members
  User.members_for_season(Season.last.id).select(:id, :first_name, :last_name).order(:first_name)

  # Filter people who quit
  # members.reject do |u|
  #   [196, 202, 265, 277, 281, 282, 289].include?(u.id)
  # end
end
```

(Note it's also written as a no-op even if uncommented — the `User…` query's
value is returned, and the commented block references an undefined `members`.)

Those seven ids are real users, but their `member` rows are only in **seasons 34
and 36**:

| user | member seasons |
|---|---|
| 196, 202 | 34, 36 |
| 265, 277, 281, 282, 289 | 36 |

Since `find_calendar_members` scopes to `Season.last` (79/2027), **none of them
can ever appear** — the filter could not match anything today. It's a
2019-era hardcoded patch that the season scoping already solved.

**The real answer to "who should be listed":** roster membership in the current
season, which `members_for_season` already does. Someone who quits is handled by
not being on next season's roster. No id list, ever.

**The related question — hide performers whose fundraiser is complete?** The
data says this is nearly a non-question, and implementing it would misfire:

| season | fundraisers | complete (496) | partial | empty |
|---|---|---|---|---|
| 37 | 162 | 4 | 48 | 110 |
| 38 | 96 | 5 | 42 | 49 |
| 39 | 97 | 2 | 31 | 64 |
| 40 | 98 | 1 | 18 | 79 |
| 73 | 52 | 0 | 0 | 52 |

Completion is 0–5% per season. Worse, `find_or_create_incomplete_for_user`
**opens a fresh fundraiser** the moment one completes, so a "hide completed"
filter would hide a performer only until their next donation arrived — they'd
reappear with 0/496. Filtering on `incomplete_for_user` would hide almost
nobody, never permanently, and would add an N+1 (`select(&:completed?)` loads
every donation for every member) to the one page that must be fast on a phone.

**Recommendation:** list every member on the current roster; show progress per
performer so a donor can *choose* to help someone who's behind, and let a fully
funded performer be visibly, satisfyingly complete rather than absent. Flagged
as an open decision in §11 in case the user wants them hidden.

---

## 9. Two real bugs in the payment path

### 9a. The submit button's disabled logic is inverted

```tsx
// CheckoutForm.tsx
<button className="btn-lg btn-primary" disabled={!stripe && !submitting}>Submit</button>
```

`!stripe && !submitting` is true only when Stripe hasn't loaded **and** we're
not submitting. Once `stripe` is non-null — i.e. always, by the time the form is
usable — it's `false`, so the button is **never disabled**. The intent was
plainly `!stripe || submitting`. Consequences: the donor can double-submit while
`confirmPayment` is in flight, and can click before Stripe.js is ready.

Compounding it, `handleSubmit` sets `submitting` and then returns early without
clearing it if Stripe isn't loaded:

```tsx
setSubmitting(true)
if (!stripe || !elements) { return }   // ← submitting stays true forever
```

Fix both as part of the checkout rebuild: `disabled={!stripe || submitting}`,
and don't set `submitting` before the guard.

### 9b. The payment intent trusts a client-supplied total — the browser sets the price

Not in the brief, found while verifying. `Api::Calendars::PaymentIntentsController`:

```ruby
def create
  total = params[:total] * 100
  payment_intent = Stripe::PaymentIntent.create(
    amount: total, currency: 'usd', payment_method_types: ['card'],
    metadata: { charge_type: 'calendar', dates: params[:dates].map(&:to_s).join(','),
                donor_name: params[:donor_name], member_id: params[:member_id] }
  )
```

`total` comes straight from the donor's browser and is never checked against
`dates`. A hand-rolled POST with `total: 1, dates: [31]` charges **$1** and the
webhook then credits the performer **$31** (it derives `amount` and
`donation_date` from `dates`, not from the charge). The endpoint is public and
unauthenticated, so anyone can call it.

It's low-stakes in practice — you'd be defrauding a youth music group of a few
dollars, and the books would show it — but the amount charged must be derived
server-side from `dates`, which is a two-line change:

```ruby
dates = Array(params[:dates]).map(&:to_i).uniq.select { |d| d.between?(1, 31) }
amount = dates.sum * 100
```

That also fixes the silent failure mode where `params[:total]` arrives as a
string (`"15" * 100` is a 200-character string, not 1500) and incidentally
validates the date range, which nothing does today. Worth doing here since
we're rebuilding this endpoint's only caller; it's a correctness fix on live
money movement, not scope creep.

### 9c. Dates aren't re-checked for availability at charge time

Two donors can sponsor the same date for the same performer if both have the
picker open: availability is read once (`GET /calendars?user_id=N`) when the
performer is chosen, and never re-validated. The webhook creates rows
unconditionally, so the performer ends up with two donations on the same
`donation_date` and a total above 496.

Rare, self-limiting (`completed?` is `== 496`, so an over-funded fundraiser
never reads complete and `find_or_create_incomplete_for_user` keeps returning
it), and arguably benign — the money is real either way. Worth a cheap
re-check when the intent is created; filing as a follow-up bead rather than
expanding this flow if it complicates the build.

---

## 10. The performers endpoint returns less than the design needs

```ruby
User.members_for_season(Season.last.id).select(:id, :first_name, :last_name).order(:first_name)
```

Three columns. The design wants ensemble/section and fundraiser progress per
performer. Both are available but not returned:

- `User#ensemble_for(season_id)` / `#section_for(season_id)` read from
  `seasons_users` (there is **no `member_type` column** — the
  ensemble/section/role combination is what distinguishes members).
- Progress = `Calendar::Fundraiser#total_donations`, i.e. `donations.sum(&:donation_date)`.

Two traps when building the payload:

**The unit mismatch.** `Calendar::Donation#amount` is **cents**
(`date.to_i * 100`) while `donation_date` is the **bare day number**, and
`total_donations` sums `donation_date` — so it yields **dollars**, compared
against `TOTAL_MARCH_DATES = 496` (also dollars). Progress must not be run
through `dollars()`/`exact()` from `utilities/money.ts`, which both expect
cents; 496 dollars would render as `$4.96`. Cleanest is to convert to cents at
the boundary and keep the money helpers honest everywhere.

**The N+1.** `total_donations` is `sum(&:donation_date)` in Ruby, so it loads
every donation row per member. With ~100 members that's 100 queries on the one
page that must be fast on a phone over cell data. Aggregate in SQL (one grouped
query keyed by user) rather than mapping over models. `Admin::CalendarsController`
already sidesteps it with `includes(calendar_fundraisers: :donations)` — the same
trick works, or a `GROUP BY` if we only need the sum.

Per-performer claimed dates stay where they are: `GET /calendars?user_id=N`
returns the taken `donation_date`s for the member's current incomplete
fundraiser. One caveat — that endpoint calls
`find_or_create_incomplete_for_user`, so a plain **GET creates a
`Calendar::Fundraiser` row** as a side effect. Harmless (it's the row the
donation will attach to anyway) but it means a crawler hitting the picker
creates empty fundraisers; that's the likely source of the 52 empty
fundraisers in season 73 and 110 in season 37.

---

## 11. What's already available to build with

Verified while reviewing, so the plan doesn't re-invent any of it.

**Reusable components** (all in `app/javascript/react/components/`, all with
tests): `Card`, `Button`, `StatusPill`, `Pill`, `EmptyState`, `Skeleton`,
`Toast`, `StatBlock`, `InputText`, `InputSearch`, `InputSelect`.

`MemberCombobox` is the strongest candidate for the performer picker if the
design wants search: an ARIA combobox over the roster, backed by a hidden input,
using `fuzzysort` so "esokol" finds "Elena Sokol" and a section name matches
too. Its `ComboboxMember` shape is `{ id, name, section }` — close to what the
performers endpoint should return anyway.

**Money formatting** — `app/javascript/utilities/money.ts`: `dollars(cents)`
for headline figures, `exact(cents)` when cents are the point. Both take
**cents**, which is the trap in §10.

**Tokens** — `stylesheets/tokens.css` defines every semantic color as a CSS
custom property (light in `:root`, dark under `prefers-color-scheme`), and
`tailwind.config.js` maps them, so `bg-surface` / `text-secondary` /
`border-default` / `success-fg` resolve per-theme with **no `dark:` prefixes**.
Figtree and Roboto Mono are vendored via `@fontsource` (the canvas pulls them
from Google Fonts; locally use the vendored import — the public layout must not
depend on a third-party font CDN).

**Component classes** — `.card`, `.card--success/danger/warning`, `.card-title`,
`.btn-primary/green/red/gray`, `.btn-lg/md/sm` (44/36/28px). `.btn-lg` is the
default for anything touched on mobile.

**The spacing-scale trap** (bit Flow 6 three times): `tailwind.config.js`
extends colors and typography but adds **no custom spacing scale**, so an
off-scale utility like `w-88` or `h-0.75` silently generates **no CSS** — no
error, no warning, just a dead class. Use arbitrary values (`w-[352px]`,
`h-[3px]`) for anything off-scale, and verify against the built CSS.

**Mobile precedent worth copying** — Flow 5's conflict calendar doesn't try to
shrink a 7-column month grid onto a phone; it switches to a list view below the
breakpoint. Relevant here: the fundraiser's `grid-cols-7` is the only one in the
app, and there is no hand-rolled month-grid helper anywhere to reuse (Flow 5
uses FullCalendar). So keeping weekday alignment means writing that date math
from scratch — a further point for 31 tiles.

**Layout/spec harness** — `spec/requests/public_pages_spec.rb` has a
`'a shell-free public page'` shared example asserting no `app-sidebar` /
`app-drawer` renders. The fundraiser routes should be added to it once they
move onto the `public` layout.

**Stripe in local/test is already safe.** `ApplicationController#set_stripe_secret_key`
and `#set_stripe_public_key` fall back to `STRIPE_SECRET_TEST_KEY` /
`STRIPE_PUBLIC_TEST_KEY` unless `Rails.env.production? && !ENV['STAGING']`, so
development and test cannot touch live keys through the app. The webhook path is
the only thing that persists a donation, and it's covered by request specs in
`spec/requests/calendars_spec.rb` (stubbing `Stripe::Webhook.construct_event`) —
extend those rather than testing by hand against Stripe.

---

## 12. Canvas review

*(Artboard inventory, per-screen specs, and the copy deck go here once the
canvas digest lands.)*

---

## 13. Open decisions for the user

1. **Calendar alignment vs. 31 tiles** — §3. Recommendation: 31 numbered tiles,
   no weekday columns, which deletes both hardcodings and the whole bug class.
   Pending confirmation against the artboards.
2. **Hide performers with a completed fundraiser?** — §8. Recommendation: no,
   show everyone with progress; completion is 0–5% and a hidden performer
   reappears at 0/496 on their next donation anyway.
3. **`Season.last` → `Season.order(:year).last`?** — §7. Recommendation: yes,
   resolved once in the controller. Public-flow only; leaves
   `Calendar::Fundraiser`'s scopes alone for Flow 9.
4. **Server-derive the charge amount from `dates`** — §9b. Recommendation: yes,
   in this flow. It's a correctness fix on the live payment path and its only
   caller is being rebuilt regardless.

### Decisions taken

*(Recorded here as the build proceeds.)*
