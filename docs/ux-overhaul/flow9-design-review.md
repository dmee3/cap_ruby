# Flow 9 — Supporting screens: design review

Verified against `d9c231b` (level with `origin/main`) before planning the build.
Canvas: **Flow 9 - Supporting screens.dc.html**, Claude Design project
`535a10bc-3e9d-4a90-be44-e7e6322ef3d0` ("App design system"). No sibling
`<dc-import>` files — the canvas is self-contained.

Four screens (auth, whistleblower, files, settings) plus the two shell bugs
`cap_ruby-b3a.14` and `.34`. This is the last screen-level flow.

The short version: the canvas is the most self-aware one of the overhaul — it
independently flags both stale audit claims, proposes only two new components
and rejects a third, and leaves its open questions written down rather than
buried. Most of it holds up. **One decision in it does not survive contact with
the data (§4), and it is the one on the screen that matters most.** Two smaller
findings beyond the original scope: an anonymity leak into Rollbar (§5) and
recipient addresses exposed to each other over CC (§6).

---

## 0. The two stale audit claims, confirmed

Both are real, and the canvas caught both without being told.

**Login is not "a bare form on a background image."** Flow 1 replaced it.
`app/views/layouts/auth.html.erb` is a centered `card w-full max-w-sm` on
`bg-page text-primary`, with the logo at top, `color-scheme: light dark`, and
the flash partial. No background image anywhere. The audit's Public row is
describing a screen that stopped existing at PR #221.

**The Flow 9 scope line is stale.** It still lists "Staff & coordinator
dashboards." The coordinator dashboard shipped in Flow 5; the staff dashboard is
`cap_ruby-b3a.35` (Flow 10). Neither belongs here.

Both lines are corrected in `01-screen-audit.md` as part of this flow.

---

## 1. Auth — what is actually left to do

Flow 1 gave these screens the card, the tokens and dark mode, so the remaining
work is narrower than the audit implies: **recovery prominence and the states
that don't exist.**

`app/views/devise/` holds three views (`sessions/new`, `passwords/new`,
`passwords/edit`) plus `shared/_links` and `shared/_error_messages`. Findings:

- **`sessions/new` renders no error partial at all.** Unlike the two password
  views, it never renders `devise/shared/error_messages`, so a failed login
  shows only Devise's own flash. The canvas's "That email and password don't
  match." card state has nothing to render into today.
- **`_links.html.erb` has six branches, of which four are dead.**
  `registerable?`, `confirmable?`, `lockable?` and `omniauthable?` are all false
  for this app (`devise :database_authenticatable, :recoverable, :rememberable,
  :validatable`). Only "Back to log in" and "Forgot your password?" can ever
  render. This confirms the canvas's "no sign-up link, admins create accounts"
  decision against the code rather than against an assumption.
- **There is no "check your email" screen and no expired-link screen.** Both
  paths are a Devise redirect plus a flash today. The canvas turns both into
  real screens; neither exists to modify, so both are new views.

### The two Devise settings the canvas left to the implementer

Both are answered, so neither blocks:

| Setting | Actual value | What the copy becomes |
|---|---|---|
| `reset_password_within` | **`24.hours`** (`devise.rb:227`) | The canvas's expired-link line "don't last forever" should become the real number. The canvas's own flag asked for exactly this. |
| `sign_in_after_reset_password` | commented out → Devise default **`true`** (`devise.rb:231`) | "Save and log in" is correct as drawn. No change. |

### Password floor: eight, and the canvas is right

The task brief and the `User` model comment disagree with
`config/initializers/devise.rb:181`, so this was worth settling empirically
rather than by reading:

```
len 5: Password is too short (minimum is 8 characters)
len 6: Password is too short (minimum is 8 characters)
len 7: Password is too short (minimum is 8 characters)
len 8: OK
```

**The effective floor is 8.** The `devise` call on `User` passes
`password_length: 8..128` inline, which shadows the initializer's
`config.password_length = 6..128`. So:

- The canvas's "eight characters or more" copy is correct everywhere.
- `@minimum_password_length` in `passwords/edit` already renders 8.
- **There is no second contradictory validation to reconcile.** Flow 6 already
  removed the `minimum: 6` rule from `User` — that is the "two contradictory
  password length rules" its audit entry mentions. What remains is a *stale
  comment* and *dead initializer config*, not a behaviour bug.

So the reconciliation is cosmetic: the initializer's `6..128` never applies to
the only Devise model, and the model comment that says "Devise's :validatable
already enforces password_length (8..128) above" is accurate. Aligning
`devise.rb:181` to `8..128` removes a trap for the next reader; it changes no
behaviour. Low priority, done in the polish phase.

---

## 2. Whistleblower — the current implementation, confirmed

Everything the brief describes is accurate.

`app/views/whistleblowers/index.html.erb` iterates a literal
`%w[aaron dan donnie juli kyle nikki tim]`, rendering `admin.capitalize` — first
names, no last names, no roles. `EmailService.send_whistleblower_email`
(`app/services/email_service.rb:64`) then does:

```ruby
emails = recipients.map { |name| ENV.fetch("EMAIL_#{name.upcase}", nil) }.compact
PostOffice.send_email(emails, subject, text)
```

**`.compact` is the bug.** An unset `EMAIL_<NAME>` silently drops that
recipient, so the "at least three" guarantee can deliver to two, one, or —
if none are set — call `PostOffice.send_email([], ...)`, which sets `to:` from
`recipients.first` (`nil`). The reporter sees the same success flash either way.

Validation is split badly: an inline `<script>` in the view counts checkboxes,
and `WhistleblowersController#create` re-checks
`params[:recipients].length < 3` and re-renders with `flash.now[:error]`. The
form is `form_tag`, not model-backed, so there is no `errors` object and no
per-field state — the §4.18 treatment the canvas draws needs one built.

One cosmetic defect while we are in here: the preamble's first paragraph opens
with a bare `<div>` and closes with a stray `</p>` that was never opened.

### The spec is already written against the new design

`spec/requests/whistleblowers_spec.rb` posts
`recipients: [admin1.id, admin2.id, admin3.id]` and creates real admin
`seasons_user` rows — user IDs, not first-name strings. It passes only because
`EmailService.send_whistleblower_email` is stubbed in every example. So the
production path (name → env var) and the tested path (user id) have already
diverged, and nothing catches it. The user-record direction is clearly the
intended one; the specs need real assertions rather than a stub.

---

## 3. Settings — confirmed, and the collapse is safer than it looks

`SettingsController#render_index` branches on `current_user_role` across four
templates. **All four files are byte-identical** (`diff` clean, three ways), so
the collapse to one view deletes three exact duplicates and cannot change what
any role sees. That removes most of the risk the sequencing worry was about —
though the request specs still cover all four roles, because the *controller*
render path is what changes.

Both error channels are HTML strings joined with `<br />`:

```ruby
@settings_errors = current_user.errors.full_messages.join('<br />')
@pw_errors = 'Old password was incorrect'
```

and **both are rendered with `raw()`** in the view:

```erb
<%= raw(@settings_errors) %>
<%= raw(@pw_errors) %>
```

**Is this exploitable today?** Not through any path I can construct. The strings
come from `errors.full_messages` (Rails' own message text plus a humanized
attribute name) and from two hardcoded literals. Rails' default validation
messages for `presence`, `uniqueness`, `confirmation` and `length` do not
interpolate the submitted *value*, so no user input reaches the `raw` call. It
is an XSS-adjacent pattern rather than a live XSS: the day someone adds a
validation with a `%{value}` message, or a custom message echoing input, `raw`
turns it into stored XSS with no other change. Replacing the joined strings with
per-field error structures removes the pattern along with the `<br />` hack,
which the flow is doing anyway.

Also confirmed for the canvas's settings artboard:

- `users.phone` **exists** (`schema.rb:204`), so "phone becomes member-editable"
  is buildable — it is simply absent from the current form.
- `seasons_users` has `section` and `ensemble` (`schema.rb:189-190`), so the
  read-only "Position — CCW – Snare" row is buildable.
- A password change already calls `sign_in(current_user, bypass: true)`, so the
  canvas's "Changing it keeps you logged in here" is true. Its rejection of the
  "signs out your other devices" claim is correct: nothing in the app does that.

---

## 4. **The canvas's recipient-source decision does not survive the data**

This is the one finding that changes the design, and it is worth stating
plainly because the screen it affects is the one with the least margin for
error.

The canvas decides: *"admin users on the current season, coordinators excluded
… That leaves four people in the pool against a minimum of three, which is
tight but workable."*

Admin counts per season, counted directly:

| Season | Admins on that season |
|---|---|
| 2025 | 5 |
| 2026 | **3** |
| 2027 | **1** |

(Counted in the local development database, so the individual names are seeded
rather than real. The *shape* — a pool that shrinks toward the newest season —
is a property of how `seasons_users` rows get created, not of the seed data.)

Three consequences:

1. **At exactly three admins, the picker offers no choice.** "Pick at least
   three people" against a pool of three is a checkbox ritual, not a decision,
   and the canvas's whole rationale for the minimum ("no one person can decide
   what happens to your report") is unaffected by whether the reporter picked
   them.
2. **At one admin, the screen cannot be submitted at all.** A member on the
   2027 season would face a form that can never satisfy its own validation.
   This is a hard lockout on the one screen in the app where being locked out
   is most harmful.
3. **The pool would follow the season switcher.** `current_season` is
   cookie-backed and user-switchable (`ApplicationController#current_season`
   reads `cookies[:cap_season_id]`). So *who can receive a report about you*
   would depend on a dropdown the reporter can change. That is the wrong
   coupling for this screen regardless of the counts.

The current hardcoded list sidesteps all three by not being season-scoped —
which is the one thing it gets right. Replacing it with a season-scoped query
introduces a failure mode the old code did not have.

**Decided with Dan (2026-09-16): option (c), an explicit
`whistleblower_recipient` flag on the user record.** Season-scoping is dropped
entirely — the pool is whoever carries the flag, regardless of role or season,
so none of the three consequences above apply. This is the option originally
noted as "most correct long-term"; the scope cost is a management UI, resolved
below.

The two rejected options, for the record: **(a) all admins, not season-scoped**
— closest to today's behaviour but leaves a departed admin selectable forever;
**(b) season-scoped with a fallback** — keeps the canvas's intent but the
fallback is invisible to the reporter.

**The minimum rule: "at least three, or everyone if fewer than three exist."**
The flat three is kept wherever it is meaningful and degrades honestly when the
pool is smaller, rather than presenting a choice that isn't one or a form that
cannot be submitted.

### Consequences of the flag decision

**Where it is managed:** a checkbox on the existing admin user create/edit form
(Flow 6's screen), directly alongside `inventory_access` — which is the same
kind of thing, a role-independent grant stored on the user rather than on
`seasons_users`. That keeps Flow 9 self-contained: the flag is manageable the
day it ships.

**No backfill.** Dan sets the flags manually. This is the right call for a
sensitive list — an automated guess at who should receive whistleblower reports
is exactly the kind of thing that should be deliberate — but it has a
consequence the build must handle:

> **On deploy, zero users carry the flag.** The pool is empty until Dan ticks
> the first boxes, so for that window the whistleblower form cannot be
> submitted by anyone.

This must be a designed state, not a broken picker. When the pool is empty (or
smaller than the copy can honestly describe), the screen says so in plain
language — that reports can't be routed yet and an admin needs to configure
recipients — rather than rendering an empty checkbox list above a submit button
that will always fail. The same state covers a future pool that drops to zero.
Specced as part of §4.43 and built in the whistleblower phase.

**Ordering:** the migration and the admin checkbox must ship *before or with*
the whistleblower rewrite, never after. The phase order in the plan reflects
this.

### Under-delivery must become loud, whichever option wins

Independent of the source decision, and required by the flow's brief: resolving
a recipient to an address must not silently drop anyone. With user records the
address comes from `user.email`, which is `presence: true` and uniquely indexed,
so a *blank* address is not reachable through validation. That leaves the
`.compact` behaviour with nothing to hide, but the guarantee should be enforced
rather than inferred — if the set of resolved addresses is smaller than the set
of picked recipients, the send fails loudly and tells the reporter, rather than
reporting success for a partial delivery.

### The role subtitles in the picker are not in the data model

The canvas draws each recipient as "Dana Reyes / Director", "Aaron Fisk /
Admin · runs dues". `seasons_users` carries `role`, `ensemble` and `section` and
nothing else — there is **no descriptor field**, and "runs dues" is not
derivable from anything stored. Either the subtitle becomes role plus
ensemble/section (buildable today), or it needs a new column (out of scope). The
design's *reason* for wanting it is sound — "so a reporter can choose on
something other than a first name they may not recognise" — and last names alone
already deliver most of that.

---

## 5. *(Beyond the original scope)* The report body can reach Rollbar

`WhistleblowersController#create` rescues `StandardError` with:

```ruby
Rails.logger.error(e)
Rollbar.error(e, user: nil)
```

`user: nil` is a deliberate anonymity measure, and the exception object itself
is unlikely to carry the report. But **Rollbar's Rails integration attaches
request parameters to every report**, and `config/initializers/rollbar.rb` sets
**no `scrub_fields`**. Rollbar falls back to `filter_parameters`, which is:

```ruby
%i[passw email secret token _key crypt salt certificate otp ssn]
```

`email` is there, so the submitter's contact address is scrubbed. **`report` is
not.** So a Mailgun failure in production — the most likely exception on this
path — sends the full body of an anonymous report to a third-party error
tracker, where it is retained and searchable.

The fix is one line (`config.scrub_fields |= [:report]`, or adding `report` to
`filter_parameters`), and it belongs in this flow given the brief's explicit
instruction to check exactly this. Note the `person_username_method =
'first_name'` line in the same initializer: `user: nil` correctly suppresses it
here, and any refactor of this rescue must keep that.

## 6. *(Beyond the original scope)* Recipients see each other's addresses

`PostOffice.format_email_args` sends to `recipients.first` and puts the rest in
**`cc:`**:

```ruby
args.merge!(to: recipients.first)
args.merge!(cc: recipients[1..].join(',')) if recipients.length > 1
```

So every recipient of a whistleblower report sees the full list of who else
received it, in their mail client. That is arguably *fine* here — the design
tells the reporter "goes to three people at once" and the confirmation names
them, so it is consistent rather than surprising. Worth a deliberate decision
rather than leaving it as an accident of a shared helper: `bcc:` would hide the
list, at the cost of making the "no one person can decide" promise invisible to
the recipients themselves. Recommend keeping `cc:` and noting it, since mutual
visibility is part of what makes the multi-recipient rule meaningful.

---

## 7. Files — the response shape, verified

`External::GoogleDriveApi#format` returns exactly:

```ruby
{ id: f.id, name: f.name, file_type: FILE_TYPES[f.mime_type] || f.mime_type }
```

**No modified time, no size.** The canvas's decision to drop the date column
rather than draw it on an assumption is confirmed correct, and nothing in the
flow may depend on metadata beyond name/id/type.

`file_type` is a **symbol** for the four mapped MIME types (`:document`,
`:folder`, `:audio`, `:pdf`) and the **raw MIME string** for everything else. A
`.xlsx` is `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
not `XLS`. So the canvas's "type chips are three letters from the MIME type"
needs a real mapping on the client, and its own sample data (`XLS`, `DOC`)
is drawn from types the backend does not currently label.

Two corrections to the brief's framing of the current state:

- **Folder drill-down already works.** Not via an HTML `show` route — the HTML
  side is `resources :files, only: %i[index]` — but recursively in React:
  `FilesListItem` renders a nested `FilesList` with the folder's id, which
  fetches `/api/files/:id`. The canvas's "the show endpoint takes an id, so
  drill-down is real" is right, and it is real *today*. The canvas draws it as
  breadcrumb navigation-in-place instead of nested expansion, which is a
  redesign of working behaviour, not new capability.
- **There is already a loading skeleton and an empty state.** Two shimmer rows,
  and the literal string "Nothing Here" in italic gray — which is exactly the
  audit's cross-cutting complaint #6 about empty states.

The real gap is narrower and confirmed: **there is no error state.**

```js
.catch(error => { console.error(error) })
```

`setLoading(false)` is only called on success, so **a failed fetch leaves the
skeleton shimmering forever.** The user waits on a spinner that will never
resolve. This is the single worst behaviour in the four screens and the canvas's
error card fixes it directly.

One more, not drawn by the canvas: `get_files` does
`ENV.fetch("BASE_DRIVE_FOLDER_ID_#{year}")` with no default, so **a season with
no configured Drive folder raises `KeyError` → 500**, not an empty state. The
canvas's "Nothing here for Spring 2026 yet" empty state cannot be reached for an
unconfigured season without handling this. Worth fixing while building the error
path, since it is the same code.

---

## 8. Chrome bugs — both confirmed, with one correction

### `cap_ruby-b3a.14` — dark sidebar has no edge

Confirmed exactly as the bead describes. `tokens.css` dark block:

```
line 78:  --bg-page: 29 30 32;   /* jet */
line 82:  --bg-nav:  29 30 32;
```

Identical, and `.app-sidebar` (`sidebar.css:3`) carries no border. The bead
offers three fixes and recommends (a), a border alone. **The canvas proposes a
fourth, better one:** in dark mode the nav takes `bg.sunken` (`26 27 29`) *and*
a 1px `border.default` right edge — separation by surface *and* border, with the
rationale that §3.2 reserves shadows for floating things. Light mode unchanged,
where jet-on-flash already separates. Taking the canvas's version over the
bead's (a).

### `cap_ruby-b3a.34` — two nav gaps

**Part 1 (quartermaster staff have no link) is exactly as described.**
`staff_nav` has no quartermaster branch; only `member_nav` appends Inventory on
`current_user&.quartermaster?`. `InventoryController` admits any quartermaster
regardless of role, and `spec/requests/inventory_spec.rb` asserts a
quartermaster *staff* user reaches `/inventory/categories` — with no nav link to
get there. The canvas's fix (Inventory appears on `inventory_access`
independent of role) is right.

**Part 2 is overstated by both the bead and the canvas.** The claim is that
`/inventory/email_rules` "highlights Inventory and leaves Emails inert." Checked
against the routes:

- `Inventory`'s `match: %r{\A/inventory/categor}` does **not** match
  `/inventory/email_rules`, so Inventory is *not* wrongly highlighted.
- `Emails` has no `match:`, so `active_nav?` falls through to
  `current_page?(inventory_email_rules_path)` — which **does** match
  `/inventory/email_rules` exactly.
- `inventory_email_rules` has only `index` and `create` (no `/new`, no
  `/:id/edit`), so **today there is no GET route where the item fails to
  highlight.**

So the bug is **latent, not live**: it bites the moment a nested email-rules
route is added. The canvas's fix — deepest-matching path prefix wins — is still
the right change, because it makes the rule uniform instead of leaving one item
relying on an exact match that happens to be sufficient. But it should be
described as hardening, and the "Emails never highlights" framing in the bead
is wrong and should be corrected on close.

---

## 9. Canvas review

Eight artboards plus a component sheet and two written sections
(`doc`, `flags`). Light and dark throughout; desktop and mobile for the screens
where it matters. Copy is careful and **contains no em-dashes**, consistent with
recent commits.

### What the canvas gets right that is worth calling out

- It flags both stale audit claims itself, unprompted.
- It proposes **two** new components and explicitly **rejects a third** (the
  file row, correctly identified as §4.6 with a chip in the avatar slot). Nine
  flows in, that ratio is the right one and matches the expectation that a late
  flow should mostly compose.
- It refuses a "my reports" history for the submitter, with the correct
  reasoning: a list of your own reports is a list linking you to them, on a
  screen someone else could open on your account.
- The confirmation deliberately does **not** echo the report body back —
  "someone may have sent this from a shared laptop in a band room."
- It moves the three preamble paragraphs into per-field help rather than
  deleting what they said.

### The two genuinely new components

**Recipient picker** (§4.43). Multi-select with a stated minimum, a live counter
("2 of 3 picked · one more"), 44px option rows, and a post-submit error state.
Verdict accepted: Flow 6 has single-select member lookups and a role select,
nothing with a floor. The counter *is* the constraint's UI, which is why the
rule reads as reassurance rather than a rejection.

**Auth card family** (§4.44). One 440px card, four contents (log in, request,
sent, set new), shared logo + single full-width primary + optional sunken footer
strip for the one secondary route out. Documented as a **layout over Card + form
row + Button**, not a new primitive — which is the honest classification.

### Canvas assumptions that need adjusting before building

1. **Recipient role subtitles** ("Admin · runs dues") are not in the data model
   — see §4.
2. **Type chips `XLS` / `DOC`** assume MIME labels the backend does not return
   — see §7.
3. **The expired-link copy** ("don't last forever") should carry the real
   24-hour window — the canvas's own flag asks for this.
4. **The "Send another report" affordance** on the confirmation must not
   reconstruct that screen from URL params. The confirmation names recipients
   and timing; if any of that is rebuildable from a query string, it becomes a
   shareable record of who reported what. Flash-backed state only, and no
   report content in it at all.
5. **The empty-state "Switch to Fall 2025" button** on Files assumes a
   known-good other season to offer. Needs a real rule for which season it
   names, or it becomes a dead button.

### The canvas's one open question

*"Needs a decision: where the no-retaliation promise lives."* The preamble is
gone from desktop, taking "nobody can retaliate against you for sending this"
with it; it survives as one line on mobile. The canvas recommends keeping that
one line on **both** layouts.

**Agreed, and recommending it be adopted without further discussion.** It is the
single most reassuring sentence on the page, it costs one line, and the
asymmetry where the phone gets a promise the desktop does not is not defensible.
Building it on both.

---

## 10. Decisions

### Settled by the code — building on these

1. **Password floor is 8**, verified empirically. All copy says eight. The
   initializer's dead `6..128` gets aligned in polish; no behaviour change.
2. **`reset_password_within` is 24 hours** — the expired-link and request copy
   name the real window.
3. **`sign_in_after_reset_password` is default `true`** — "Save and log in"
   stands as drawn.
4. **Files shows name and type only** — the API returns no modified time.
5. **The four settings views are byte-identical** — collapsing to one cannot
   change what any role sees.
6. **Dark nav gets `bg.sunken` + a 1px right border**, per the canvas, over the
   bead's border-only option (a).
7. **`b3a.34` part 2 is latent, not live** — fix it as hardening, and correct
   the bead's framing when closing.
8. **The no-retaliation line goes on both layouts.**

### Taken with Dan (2026-09-16)

9. **Whistleblower recipients come from an explicit `whistleblower_recipient`
   flag** on the user record — not from role, and not season-scoped. §4.
10. **The minimum is "at least three, or everyone if fewer than three exist."**
11. **The flag is toggled on the admin user create/edit form**, beside
    `inventory_access`, and ships in this flow.
12. **No backfill** — Dan sets the flags manually, so the empty-pool state is a
    designed screen, not an edge case. §4.

### Filed as beads rather than built

- Rollbar `scrub_fields` for `:report` (§5) — filed, but small enough and close
  enough to the brief's explicit anonymity instruction that it ships in this
  flow rather than waiting.
- `BASE_DRIVE_FOLDER_ID_<year>` raising `KeyError` for an unconfigured season
  (§7) — fixed alongside the Files error state, same code path.
- `cc:` vs `bcc:` for report delivery (§6) — keeping `cc:` deliberately;
  recorded rather than filed, since mutual visibility is part of what makes the
  multi-recipient rule mean anything.
