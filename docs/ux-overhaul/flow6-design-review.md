# Flow 6 — Admin roster & onboarding: design review

Reviewing the Claude Design canvas **"Flow 6 - Admin roster and onboarding"**
(project `535a10bc-3e9d-4a90-be44-e7e6322ef3d0`) against the code, before
building. Same job as `flow4-design-review.md` / `flow5-design-review.md`:
catch the places the design assumes behaviour the app doesn't have.

Everything below was checked against the code and, where noted, against the
live development database (513 users, seasons 2018–2027).

> Canvas note: the project also contains an empty stub file
> `Flow 6 - Admin roster & onboarding.dc.html` (ampersand spelling). The real
> canvas is the `and` spelling, ~184 KB. Ignore the stub.

---

## 1. The big one — the schedule preview describes behaviour that doesn't exist

The flow's scope line says "auto-generated payment schedule preview", and the
canvas draws a **§4.27 Schedule preview panel** listing six dated rows and a
`$1,775` total, captioned *"A forecast, not a record. It's created on save."*

**What actually happens on save** (`Admin::UsersController#create` →
`PaymentScheduleService.ensure_payment_schedules_for_user`):

```ruby
def ensure_payment_schedules_for_user(user)
  user.seasons_users.each do |su|
    next if su.role != 'member' || user.payment_schedule_for(su.season_id).present?

    PaymentSchedule.create(user_id: user.id, season_id: su.season_id)
  end
end
```

It creates an **empty** `PaymentSchedule` — a row with a `user_id` and a
`season_id` and no entries. It never reads `DEFAULT_PAYMENT_SCHEDULES`. So a
newly created member lands with a blank schedule, which is exactly the source of
the Flow 4 dashboard's *"N members have no payment schedule"* alert.

Confirmed in the dev DB: **7 of 815 payment schedules currently have zero
entries.**

Good news: the lookup and the apply logic already exist and are already spec'd.
`PaymentScheduleService.default_schedule_for(user, season)` returns the default
hash, and Flow 4 built `Admin::ScheduleDefault.preview/apply`, which diffs the
default against a live schedule, preserves entries already covered by a payment,
and returns `nil` when there is no default. The preview panel needs
`default_schedule_for`, not new logic.

**Decision for the user** (§7).

## 2. The default schedule runs out in 2026 — and 2027 already has 42 members

`DEFAULT_PAYMENT_SCHEDULES` is a hardcoded hash keyed
`year → ensemble → 'Visual' | 'Music' → 'Vet' | 'Rookie'`. Its keys are exactly:

```
["2023", "2024", "2025", "2026"]
```

The dev DB has seasons through **2027**, and the 2027 season already has **44
`seasons_users` rows, 42 of them members**.

So `default_schedule_for` returns `nil` for every 2027 member. The canvas's
"no default" state is not a hypothetical edge case — **it is the live state for
the newest season in the database**, and it will be the state the admin hits
first when onboarding for next season. The canvas is right to draw it; it should
be treated as a first-class state, not a fallback.

(`Api::Admin::PaymentSchedulesController#default_preview` already returns
`422 {errors: 'No default schedule for this member'}` for this case, so the
copy should agree with what Flow 4 already ships.)

## 3. The canvas's "battery or music" derivation is wrong

The designer's assumptions panel says:

> *"Battery or music is derived from section. Snare, Tenors, Bass and Cymbals
> read as battery, everything else as music, which is what the default-schedule
> lookup keys on."*

and the populated preview panel is labelled **"World · Battery · Vet"**.

The actual lookup is a **Visual/Music** split, not battery/music:

```ruby
section = role.section == 'Visual' ? 'Visual' : 'Music'
```

Every non-`Visual` section — Snare, Tenors, Bass, Cymbals, Woods, Metals,
Electronics, Auxiliary — keys to `'Music'`. There is no battery bucket anywhere
in the schedule lookup. **Use "Visual" / "Music" in the preview panel's context
line**, or the label will disagree with the amounts printed directly under it.

## 4. Vet is derived, not stored — confirmed, with one inconsistency

Confirmed: `seasons_users` has **no `member_type` column** (CLAUDE.md is wrong
about this; the columns are `season_id, user_id, section, ensemble, role`). The
design treats vet/new as computed context and never as a field, which is right.

Two derivations exist and they don't quite agree:

| | rule |
|---|---|
| `User#vet_in?(season_id)` | `su.season.year < role.season.year` — **string** compare |
| `PaymentScheduleService.default_schedule_for` | `su.season.year.to_i < role.season.year.to_i` — **integer** compare |

Both give the same answer for 4-digit years, so this is latent, not a live bug.
Worth collapsing to one method while the flow is in this code.

Also worth noting the designer's own open question — *"If the real rule is member
seasons only, the derived line changes"* — has a definite answer in the code:
**any earlier season of any role counts**, including a staff-only season. A
person who was staff in 2025 and becomes a member in 2026 is a **Vet** and gets
the cheaper schedule. That may or may not be intended, but it is what ships.

## 5. Failed update loses the form — the design requires the Flow 3 fix

The designer flagged this correctly:

> *"A failed update has to re-render with the submitted attributes instead of
> redirecting, or the repopulated form on artboard 04 can't exist."*

Confirmed:

```ruby
def update
  if @user.update(user_params)
    ...
  else
    flash[:error] = "Unable to update #{@user.first_name}"
    redirect_to("/admin/users/#{@user.id}/edit")   # <- everything typed is gone
  end
end
```

`create` already re-renders (`render :new`) but the React form is mounted from a
fetch, not from `@user`, so **neither path actually repopulates today**. Both
need the Flow 3 treatment: re-render, seed the island with the submitted
attributes, and drive §4.18 validation summary from `@user.errors`.

## 6. Delete: reachable route, unreachable UI, and real data loss

`DELETE /admin/users/:id` exists (`resources :users`), and `destroy` returns a
bare `head(200)`. Nothing in the UI calls it. The canvas adds a **§4.28
Destructive confirm** (typed-name gate, "removed" and "stays" lists) that would
make it reachable.

**Before shipping that, note what delete actually does.** Probed on a scratch
user inside a rolled-back transaction:

| record | result |
|---|---|
| `User` | soft-deleted (`acts_as_paranoid`) ✓ |
| `Payment` | soft-deleted — recoverable ✓ |
| `Conflict` | soft-deleted — recoverable ✓ |
| **`PaymentSchedule`** | **hard-destroyed** — `dependent: :destroy`, model is *not* paranoid |
| **`PaymentScheduleEntry`** | **hard-destroyed** with it |
| **`seasons_users`** | **left orphaned** — no `dependent:`, not paranoid |

So the canvas's "stays" list is half-true: payments and conflicts survive and can
be restored, but **the schedule and its entries are gone permanently**, and
restoring the user leaves them with no schedule at all. The orphaned
`seasons_users` rows are harmless to the roster (`User.for_season` joins through
the default non-deleted scope, so deleted users correctly drop out — verified: 14
soft-deleted users, 0 of them on the 2026 roster) but they do accumulate.

If delete ships this flow, the confirm copy has to say the schedule is
destroyed, or `PaymentSchedule` needs `acts_as_paranoid` first.

## 7. "Off all rosters" is real, and those people cannot log in

The designer flagged that this alert *"needs a users query that ignores the
season scope every other screen applies"*. It does, and it is worth having:

**17 users have no `seasons_users` rows at all.**

That is more consequential than the canvas suggests, because of:

```ruby
def active_for_authentication?
  super && seasons_users.any?
end
```

A user with no season rows **cannot sign in** — Devise rejects them. So this
alert isn't a tidiness nag; it's a list of 17 stranded accounts. The copy should
say so ("They can't sign in until they're on a roster") rather than the neutral
"3 people are off all rosters".

## 8. The welcome email sends, but it doesn't say what the form implies

Confirmed: `User#welcome` → `UserMailer.welcome_email.deliver_later`, called from
`create` only, never from `update`. The canvas's "Create and send welcome" /
plain "Save" split is correct.

But the email body is a **password-reset invitation**, not a credentials
handoff:

> *"You have a new account on our member site! To set up your account, please
> reset your password [here] using your email address."*

The form asks the admin to type a password, and then the email tells the new
member to go set their own. Those aren't contradictory, but the confirm copy
shouldn't promise "we sent them their password". Either soften the copy, or
reconsider whether the create form needs a password field at all (Devise would
be happy with a random one).

Related: the canvas's password row shows *"last reset 8/14/25"*. The column
`reset_password_sent_at` exists, but it is **NULL for all 513 users** — the
welcome email links to the reset form rather than calling
`send_reset_password_instructions`, so nothing ever sets it. The line can't be
populated as drawn without that change.

## 9. Already fixed — the duplicate behind-members implementation is gone

The brief flagged `Api::Admin::UsersController#index?behind=true` as still
carrying Flow 4's duplicate. **It doesn't** — `#index` is now just the roster
`members` mapping, and there is no `behind` reference anywhere under
`app/controllers/api/admin/`. Flow 4 already deleted it. Nothing to fold in.

`User#dues_status_okay?` **does** still have the season-key memoization bug
(`return @status unless @status.nil?` ignores `season_id`) — `cap_ruby-b3a.13`
stays open unless we take it in passing (§11).

## 10. Smaller notes

- **The per-season role params are shaped correctly.** `UserRoleRow` posts
  `user[seasons_users_attributes][][...]` as positional array entries. I checked
  the encoding through `Rack::Utils.parse_nested_query` for the awkward case (a
  staff row whose disabled ensemble/section submit nothing, between two member
  rows) and the rows do **not** de-align — a repeated key starts a new hash.
  The existing shape is safe to keep.
- **But a disabled select submits nothing**, so switching a member → staff
  leaves the old `ensemble`/`section` values in the database rather than
  clearing them. The new §4.26 block should post explicit empty values when the
  role isn't `member`.
- **A season toggled on with no role selected** creates a `seasons_users` row
  with `role = NULL` — `SeasonsUser` has no validations at all
  (`belongs_to :season, :user`, nothing else). Today's DB is clean (0 blank-role
  rows) but the form permits it. The §4.26 block preselecting "Member" on
  toggle-on, as the canvas describes, closes this.
- **No uniqueness constraint** on `(user_id, season_id)`, and every
  `role_for`/`section_for`/`ensemble_for` lookup silently takes `.first`. Clean
  today (0 duplicate groups). Cheap to guard.
- **Component numbering collides.** The canvas labels its additions §4.26–§4.28,
  but Flow 5 already shipped §4.26–§4.31. Ours become **§4.32–§4.34** — the same
  collision Flow 5 hit with Flow 4.
- `Season` has only `year` (a string) and `conflict_submission_open`. There are
  no season dates, so the canvas is right that no calendar belongs in this flow.
  Note the canvas renders seasons as **"Spring 2026"** while the app renders
  **"2026"** everywhere else; the shipped convention wins unless we change it
  globally.

## 10a. The password rules contradicted themselves

Found while checking the rendered validation summary. `User` carried a
6-character length validation *and* Devise's `:validatable` with
`password_length: 8..128`. The 6-character rule could never pass on its own, so
a short password produced two messages at once:

```
Password is too short (minimum is 8 characters)
Password must be at least 6 characters
```

The real minimum is 8 (verified at lengths 5/6/7/8). The redundant validation
is removed, and the form's hint says 8 — the canvas's "6 characters minimum.
This one has 5." copy would have been wrong on both counts.

## 11. Canvas-internal problems worth knowing before building

A full digest of the 23 artboards turned up these. They don't change the
architecture, but each one needs a call at build time.

**Copy that can't be implemented as drawn:**

- **Pronouns.** The canvas templates gendered copy throughout — *"he'd owe"*,
  *"she can change her own dates"*, *"Because he's a member"*. **There is no
  pronoun field on `User`** and no way to derive one. All such copy must become
  name-based or neutral (*"Because they're a member"*, *"what they'd owe"*).
  This is not a style preference; the gendered variants are unbuildable.
- **"Available." username hint** (artboard 13) implies an async availability
  endpoint that doesn't exist. Either build a small one or drop the hint.
- **"Last reset 8/14/25"** — see §8; the column exists but is never written.

**Mock-data contradictions** (cosmetic, but don't copy them into fixtures):
Kel Boone is under "World · Woods" with a Section cell reading "Metals"; the
World filter says "11 of 15" while group counts sum to 10 and 9 rows render;
the §4.27 dark excerpt totals three rows of $325+$325+$150 as **$1,775**; and
"CC2 · Battery · New" and "World · Battery · Vet" print byte-identical rows
despite the copy insisting vet and new differ.

**Spec gaps to settle while building:**

- §4.26 promises **four** states but the sheet renders three; the "past member
  season, on" case is drawn as a *collapsed row with no role segment* on
  artboard 17, contradicting the sheet. **Decide:** a past season that's on is
  editable (treat it like the current season, minus the accent) — anything else
  makes history uneditable, which the edit screen's whole premise contradicts.
- The **staged-removal** state (amber strip, "Will be removed on save" pill,
  revert link) is effectively a fifth state and isn't in the spec.
- **The toggle control itself is undocumented** anywhere in §4.1–§4.31, despite
  being this flow's signature control. Spec it as part of §4.32.
- §4.28's removed/stays lists are specced "side by side" but drawn stacked.
- The "Show Spring 2023" rule ("seasons before 2024 stay collapsed") is
  hardcoded against today = 2026; express it relative to the current season.
- The add-back confirm uses a **single combined** "CC2 / Snare" select where
  every other screen uses two. Keep two.

**Scope reality:** the deck says "three screens" but describes five routes —
`/admin/users`, `/admin/users?roster=none`, `/admin/users/new`,
`/admin/users/:id/edit`, plus the delete confirm. The `?roster=none` view is
worth building: it's the 17 stranded accounts from §7, and it's currently
reachable only from the Rails console.

## 12. Open decisions for the user

1. **Does Flow 6 populate the payment schedule on create?** (§1) Either
   (a) keep `ensure_payment_schedules_for_user` creating an empty schedule and
   have the preview panel say honestly "we'll create an empty schedule, set it
   up next", or (b) populate from the default when one exists, making the
   preview a real forecast and removing most of Flow 4's dashboard alert. (b) is
   the design's intent and the machinery already exists — but it changes money
   behaviour for every newly created member.
2. **Does delete/deactivate ship?** (§6) If yes, it needs the confirm copy to
   admit the schedule is destroyed, or `PaymentSchedule` needs `acts_as_paranoid`
   first.
3. **Fix `dues_status_okay?` in passing, or leave `cap_ruby-b3a.13` open?** (§9)

### Decisions taken

1. **Populate from the default.** On create, when a default exists for that
   year/ensemble/section/vet-status, write the entries; when none exists (every
   2027 member today), create the empty schedule and show the honest "no
   default" state. Creation must be idempotent so a double submit can't double
   someone's dues.
2. **Delete is deferred**, filed as its own bead covering `acts_as_paranoid` on
   `PaymentSchedule`, the orphaned `seasons_users` rows, and only then the
   §4.34 destructive confirm. Flow 6 ships roster + add + edit. The season
   toggle remains the everyday "deactivate", which is what the canvas says too.
3. **`dues_status_okay?` is fixed in passing**, closing `cap_ruby-b3a.13`.
