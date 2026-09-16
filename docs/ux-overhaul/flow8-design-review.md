# Flow 8 — Inventory: design review

Verified against `79c5626` (level with `origin/main`) before planning the build.
Canvas: **Flow 8 - Inventory.dc.html**, Claude Design project
`535a10bc-3e9d-4a90-be44-e7e6322ef3d0` ("App design system"). No sibling
`<dc-import>` files — unlike Flow 4, this canvas is self-contained.

This flow ships as **two PRs**: a backend prerequisite (PR 1) that the UI needs
in order to show who changed what and to delete anything at all, then the UI
itself (PR 2).

The short version: the premises the flow was scoped on all held up, the data is
clean enough that both of PR 1's open data questions answer themselves, and
there are **two findings beyond the original scope** — one of them a real
authorization hole (§2).

---

## 0. How inventory actually works today

Ten categories, 132 items, 752 transactions spanning 2021-03-08 → 2025-04-06,
written by 9 distinct users. One email rule exists, and it is `eq 0` — "tell me
when this hits zero".

```
Inventory::Category  has_many :items
Inventory::Item      belongs_to :category, has_many :transactions
                     validates :name, :quantity, presence: true
Inventory::Transaction  belongs_to :item          # and nothing else — see §1
Inventory::EmailRule    belongs_to :user (mail_to_user_id), :inventory_item
```

Two separate front ends sit on top of this:

- **HTML** (`Inventory::CategoriesController`, `ItemsController`,
  `EmailRulesController`) — guarded by `InventoryController`, which admits
  admin, coordinator, or `current_user.quartermaster?`.
- **JSON** (`Api::Inventory::CategoriesController`, `ItemsController`) — the
  React list's read and write path, and **guarded by nothing**. See §2.

The stock list itself (`/inventory/categories`) is a React widget
(`InventoryList` → `InventoryListHeading` → `InventoryListItem`) mounted into an
otherwise empty ERB view. Item history (`/inventory/categories/:cid/items/:id`)
and every form are server-rendered ERB on the pre-overhaul `.custom-table` /
`grid grid-cols-5` vocabulary.

Nav is already wired (`application_helper.rb`): admin and coordinator navs carry
both **Inventory** and **Emails**; `member_nav` appends **Inventory** only when
`current_user&.quartermaster?`. Two small pre-existing nits: `staff_nav` has no
quartermaster branch, so a quartermaster *staff* member can reach inventory (the
controller allows it, and `spec/requests/inventory_spec.rb` asserts it) but has
no nav link to it; and the **Emails** item carries no `match:`, so it never
highlights as active.

---

## 1. The backend prerequisite, confirmed

`Inventory::Transaction` declares only `belongs_to :item` — despite
`user_id` being written on **every** row by the API path:

```ruby
# app/controllers/api/inventory/items_controller.rb
::Inventory::Transaction.create(
  change: @item.quantity - old_quantity,
  performed_on: Date.today,
  previous_quantity: old_quantity,
  inventory_item_id: @item.id,
  user_id: current_user.id
)
```

So the accountability data has been collected for four years and never shown.
`app/views/inventory/items/show.html.erb` renders resulting quantity, date, and
a delta pill — no name anywhere. (It also prints a positive change as `10`
rather than `+10`, which the audit-trail row should fix.)

**Data check — is the association safe to make non-optional?**

| Check | Result |
|---|---|
| `inventory_transactions` total | 752 |
| … with `user_id IS NULL` | **0** |
| … pointing at a missing user | **0** |
| … whose user is soft-deleted | 0 |

So a required `belongs_to :user` is safe *on the data*. Two things still argue
for care:

1. `spec/models/inventory/transaction_spec.rb` creates transactions with **no
   `user_id`** in four separate examples. A non-optional association fails them
   all. They need a user, which is the right fix — those rows are not
   representative of anything the app produces.
2. `User` is `acts_as_paranoid`. A plain `belongs_to :user` resolves to `nil`
   the moment a quartermaster is soft-deleted, silently blanking the audit trail
   this flow exists to surface. `Conflict` already solved this:

```ruby
# app/models/conflict.rb — the precedent to copy
belongs_to :user, -> { with_deleted }
```

**Decision:** `belongs_to :user, -> { with_deleted }`, required (not
`optional: true`), and update the four spec examples to pass a user. The data
supports the constraint and the constraint is what makes "who" trustworthy going
forward.

---

## 2. *(Beyond the original scope)* The inventory JSON API has no authorization

`ApiController` is bare:

```ruby
class ApiController < ApplicationController
  respond_to :json
end
```

`ApplicationController` supplies `protect_from_forgery` and Devise helpers, but
**no `authenticate_user!` and no role check**. Every other API namespace adds its
own guard:

| Controller | Guard |
|---|---|
| `Api::AdminController` | `authenticate_user!` + `redirect_if_not('admin')` |
| `Api::ConflictsController` | `authenticate_user!` + `redirect_if_not('admin','coordinator')` |
| `Api::MembersController` | `authenticate_user!` + `redirect_if_not('member')` |
| `Api::FilesController` | `authenticate_user!` |
| **`Api::Inventory::CategoriesController`** | **none** |
| **`Api::Inventory::ItemsController`** | **none** |

The HTML screens are correctly gated by `InventoryController`, but the endpoints
that actually *mutate stock* are not. Any authenticated user — including a plain
member with `inventory_access: false`, who is redirected away from
`/inventory/categories` — can `PUT
/api/inventory/categories/:cid/items/:id` and change a quantity, writing a
transaction under their own name.

It went unnoticed because `spec/requests/inventory_spec.rb` is thorough about
roles but only exercises **HTML** routes; no spec hits `/api/inventory/*` as a
non-privileged user.

**Decision:** fold the fix into PR 1 — it sits in the same file as the error
handling rewrite, and shipping a delete API on top of an unguarded namespace
would be worse. The API guard mirrors `InventoryController` (admin /
coordinator / quartermaster), with `redirect_if_not`'s `format.json { head
:unauthorized }` branch giving the right JSON response. Specs for the boundary
land alongside the destroy-permission specs.

---

## 3. Error handling is worse than "a black hole"

The known problem — `update_item` rescues `StandardError`, reports to Rollbar,
returns a bare `head 422` with no body, and the React client only
`console.error`s it — is real. But the rescue is not the only bug in that
method:

```ruby
def update_item
  ActiveRecord::Base.transaction do
    old_quantity = @item.quantity
    @item.update(item_params)          # <- return value discarded
    if @item.quantity != old_quantity
      ::Inventory::Transaction.create(...)
      run_emails
    end
  end
  true                                  # <- unconditional
rescue StandardError => e
  Rollbar.error(e)
  false
end
```

`@item.update` returns `false` on a validation failure and the result is thrown
away; the method then returns `true` unconditionally. So a rejected update
currently responds **200 with the unchanged item**, and — because
`@item.quantity` is the *assigned-but-unsaved* attribute — can still write a
transaction row and fire low-stock emails for a change that was never persisted.

Today `Item` only validates presence, so this is mostly latent. **The moment PR 1
adds the non-negative validation it becomes live**, which makes fixing it a
prerequisite rather than a nicety.

**Decision:** rewrite the action to use `update!`/explicit failure, return
`unprocessable_entity` with `{ errors: [...] }` that the UI renders inline, keep
`Rollbar` for genuine exceptions (rescuing `StandardError` only around the
non-validation path), and keep the transaction + email side effects strictly
behind a successful save.

---

## 4. Quantity validation — zero is valid, negatives are not

`Inventory::Item` validates `:name, :quantity, presence: true` only, so `-5`
saves happily.

| Check | Result |
|---|---|
| items total | 132 |
| `quantity < 0` | **0** |
| `quantity = 0` | **10** |
| `quantity IS NULL` | 0 |

No existing row fails a `greater_than_or_equal_to: 0` rule, so **no backfill is
needed** and the validation cannot break unrelated updates.

Zero is clearly a real, meaningful state rather than an accident: ten items sit
at zero, and the single live email rule is `operator: eq, threshold: 0` — a rule
whose entire purpose is to fire when something runs out. (The canvas's "Gloves 0"
sample agrees.)

**Decision:** `validates :quantity, numericality: { only_integer: true,
greater_than_or_equal_to: 0 }`, keeping the existing presence validation.

---

## 5. Destroy — nothing can be deleted today

Confirmed across routes:

```ruby
namespace :inventory do
  resources :categories, only: %i[index new create] do
    resources :items, only: %i[new create show]
  end
  resources :email_rules, except: %i[show destroy]
end
```

No `destroy` on any of the three, and no `edit`/`update` on categories or items
on the HTML side either (the React list edits them through the API). All three
need `destroy` in PR 1.

**The schema has already decided the cascade question.** `inventory_items` has a
real foreign key to `inventory_categories`:

```ruby
add_foreign_key "inventory_items", "inventory_categories"
```

A hard `destroy` on a non-empty category raises `ActiveRecord::InvalidForeignKey`
at the database. Refusing to delete a non-empty category isn't merely the safer
policy — it is what the schema already enforces. (One of the ten categories,
"Drumset Implements", is empty, so a refusal rule still leaves something
deletable.)

For items, 108 of 132 carry transaction history. Destroying an item would take
the audit trail with it — the very thing PR 1 makes visible. `acts_as_paranoid`
(0.11.0) is already in the Gemfile and used by `Payment`, `Conflict`, and
`User`, and no inventory table has a `deleted_at` column yet.

**Decisions** (both confirmed with the user before building):

| Target | Policy |
|---|---|
| **Category** | Refuse while it has items. Message names the count and links to the items. Hard `destroy` once empty. |
| **Item** | **Soft-delete** (`acts_as_paranoid` + a `deleted_at` migration). History survives, the item leaves the list, and it is recoverable. |
| **Email rule** | Hard `destroy`. A rule is pure configuration with no history worth keeping. |

Permissions follow each screen's existing rule, preserving the asymmetry:
category and item destroy admit admin / coordinator / quartermaster (matching
`InventoryController`); email-rule destroy is admin / coordinator only (matching
`EmailRulesController`'s extra `redirect_if_not`).

---

## 6. *(Beyond the original scope)* An operator-vocabulary slip in the specs

`EmailRule#notify_if_applicable` switches on symbols — `:eq`, `:lt`, `:lt_eq`,
`:gt`, `:gt_eq` — and the form's `select` writes exactly those. But
`spec/requests/api/inventory/items_spec.rb` builds its rule with `operator: '<'`:

```ruby
rule = Inventory::EmailRule.create(operator: '<', threshold: 55, ...)
```

`'<'.to_sym` matches no `when` branch, so a real rule stored that way would
silently never notify. The example still passes only because it stubs
`notify_if_applicable` entirely. `spec/models/inventory/email_rule_spec.rb` uses
`'lt'` correctly, so this is an isolated slip in one spec rather than a
production bug — but it means that request spec proves less than it appears to.
Worth correcting while touching the file; no user impact, so no bead.

---

## 7. Out of scope, confirmed: email rules fire on every qualifying update

`run_emails` runs on every quantity change and `notify_if_applicable` has no
memory of having fired:

```ruby
rules.each { |rule| rule.notify_if_applicable(@item.quantity) }
```

So an item repeatedly edited below its threshold re-emails on each save. Per the
flow's scope this is **left exactly as-is**. A bead is filed instead.

---

## 8. Smaller confirmed notes

- **`flash.now[:error]` gets an array.** Both `Inventory::ItemsController#create`
  and `CategoriesController#create` assign `@x.errors.full_messages` (an Array)
  where the flash partial expects a sentence. `EmailRulesController` does it in
  both `create` and `update`. The rebuild routes these through
  `ValidationSummaryCard` (§4.18) instead.
- **Legacy input component.** `InputText.tsx` renders the pre-overhaul
  `.input-text` class; the rebuilt screens use the Flow 1+ component set.
- **Tailwind spacing is not extended.** `tailwind.config.js` extends colors,
  `fontSize`, and `borderRadius` but has **no `spacing` key**, so an off-scale
  utility silently emits no CSS. Touch targets must use arbitrary values —
  `min-h-[44px]`, as `DateTile`/`DateGrid` do, with tests asserting the class.
- **Available to build with:** `Card`, `Button`, `StatBlock`, `EmptyState`,
  `Skeleton`, `Toast` (has an `error` variant), `StatusPill`,
  `ValidationSummaryCard`, `DecisionConfirm` (inline confirm + undo window),
  `SortableTh`, `PaginatedList`, `FilterBar`.

---

## 9. Canvas review

The canvas is thorough: 25 labelled artboards across six sections plus a
component sheet, light and dark twins for most screens, and — unusually for this
project — **real mobile artboards that are treated as the primary layout**
("Phone layout is the real layout"). Its thesis:

> "A quartermaster stands in a storage room holding a box of sticks and needs to
> write down what changed. That is the job, so the design is built around a
> delta, not a text field: minus six, save, done."

Four principles run through it: *adjust is a delta, never an absolute*; *low
means the item's own alert rule*; *phone layout is the real layout*;
*`inventory_access`, not a role*.

### Artboards

| § | Screens | Widths |
|---|---|---|
| 01 Stock list | desktop light (full shell), desktop dark filtered | 1240 |
| 02 Phone | mobile light, mobile dark mid-adjust | **390×844** |
| 03 States | loading, error, empty, empty category | 600 crops |
| 04 Create/rename/delete | add-item drawer, drawer validation, inline add-category (light+dark), row menu, delete item, delete category, delete blocked | 400–720 |
| 05 Item history | desktop light, **mobile dark**, empty | 820 / **390×620** / 560 |
| 06 Alert rules | list, editing (dark), delete confirm, empty, loading, error | 420–760 |
| 07 Component sheet | stepper light, stepper dark, rule sentence + audit row | 480–620 |

**Mobile coverage is real but partial.** Stock list and item history have true
390px artboards. **Nothing else does** — no mobile for the add-item drawer, the
row menu, any delete dialog, or *the entire alert-rules screen*, whose wrapping
inline-sentence editor with four inline controls is the single most likely thing
to break at 390px. The §03 states are all 600px desktop crops. No breakpoint
number appears anywhere; the responsive guidance is behavioural prose.

### The two genuinely new components

The canvas grades its own additions: *"Two genuinely new: the quantity stepper
and the rule sentence. The audit trail row is not new, it is the §4.6 table row
with a person on the left and a status pill in the middle, so it ships as a
variant rather than a component."* That is the right call and the doc follows it.

**Quantity stepper** — `−` (U+2212, not a hyphen) and `+` flanking a mono count.
Five states: idle, adjusting, recount, committing, failed. Minus disables at
zero; the plus never does. Adjusting reveals a delta pill (`−6`), a
`42 → 36` before/after run, `Save −6` / `Cancel`, and a "Type a total instead"
escape hatch. Committing dims to `.75`, disables both buttons and spins — **no
optimistic update**. Success is a toast: "Saved. Snare sticks: 36, logged to
you." with Undo. Failure reverts: "Didn't save. Snare sticks is still 42."
Touch: 44×44 on mobile in the right-edge thumb zone, press-and-hold repeating
at 4/second.

**Rule sentence** — a rule rendered as one readable line with four editable
slots: *When **{item}** is **{operator} {threshold}**, email **{recipient}**.*
Operators are plain language only, never `eq`/`lt_eq`: "is exactly", "is below",
"is at or below", "is above", "is at or above".

### Confirmations of findings above

The canvas independently reached several of §1–§8's conclusions: per-field
errors "replace the flash array the controllers pass today" (§8); email-rule
`destroy` "needs routes added" (§5); attribution is already stored and just needs
showing (§1); quantity "cannot go negative in the UI" while "the DB stays
permissive for old rows" (§4 — note this differs from our decision, see below).

### Canvas-internal problems worth knowing before building

1. **"Under alert" is 2 in the stats and 3 everywhere else.** The stat row reads
   `UNDER ALERT 2` / `OUT OF STOCK 1` as disjoint, but the banner, the mobile
   chip, and the filtered dark artboard all say **3**, counting Gloves. Gloves
   has **no alert rule** — so by the screen's own definition it cannot be "at or
   under its alert", and the dark footnote ("10 items have no alert rule, so they
   can never appear in this filter") contradicts the artboard that displays it.
   **Resolution: "needs attention" = under-alert ∪ out-of-stock.** Keep the stat
   tiles disjoint (2 and 1), and let the banner and filter speak to the union of
   3. Out-of-stock is a rule-independent condition; an item at zero deserves
   attention whether or not anyone wrote a rule for it.
2. **The banner prints `6 (< 8)` for an "at or below 8" rule.** Wrong operator
   glyph, and it hard-codes one operator where five exist. Render the rule's own
   operator, or drop the parenthetical.
3. **Five desktop stepper sizes.** The doc card says 36px, the component sheet
   draws 40px, and live artboards use 36/38/34/42. **Resolution: 36px desktop,
   44px touch**, per the doc card, which is also what the actual list rows use.
4. **Does creating an item write a "First count" transaction?** Both answers are
   drawn: Snare sticks' trail opens with a `0 → 24` row labelled "First count",
   while the empty-history artboard shows an item created at 24 with *zero*
   history rows and the copy "Nothing has changed yet". **Resolution: yes, write
   it.** A trail whose opening balance is invisible is the gap this flow exists
   to close, and `previous_quantity: 0` makes the arithmetic self-consistent.
5. **Hardware is simultaneously empty and holding 2 items** across artboards
   (`2 items` in the list; "The category is empty" in the delete dialog; "Nothing
   in Hardware yet" in the empty state). Sample-data drift, not a design
   question.
6. **"Move or delete its 3 items first"** prescribes a move operation that
   exists nowhere in the flow. Either add "Move to category" to the row menu or
   reword to "Delete its 3 items first". **Resolution: reword** — moving items
   between categories is a new capability and out of scope.
7. **Undo has no stated semantics** — no duration, and no answer to whether it
   deletes the transaction or writes a compensating one. Deleting it would
   contradict the accountability premise. **Resolution: a compensating delta**,
   visible in the trail, offered for the life of the toast only.
8. **A below-zero correction is silently rewritten.** "A correction that would go
   below zero becomes a recount to 0 instead" means pressing minus six times at
   4 on hand saves `−4`, with no copy telling the user. Since the minus button
   disables at zero, this case is only reachable by typing; the recount path
   already shows "Recount of 4 · saved as −4", so it is self-explaining there.
9. **The alert-delete light dialog is nested inside the canvas's `showDark`
   block**, so a light-only view hides it. Canvas bug, no design impact.
10. **Relative date format.** "Last change 2 days ago" is a third format
    alongside the stated rule (weekday inside 14 days, `M/D/YY` beyond). Keep
    the two-format rule; render this one as a weekday too.
11. **Accessibility — the standing native-control rule applies throughout.**
    Every dropdown is a `<span>` with a `⌄` glyph (category filter, drawer
    category, and all three rule-sentence slots); the operator chooser is a row
    of custom pill chips; "Under alert only" is a custom 32×18 pill switch; and
    "Keep the drawer open to add another" is a fake checkbox with no input.
    These ship as native `<select>`, a native radio group (or just the select —
    drawing both is redundant), and real `<input type="checkbox">`, exactly as
    §4.21 resolved for Flow 4's status scope. **No focus or hover state is drawn
    for any control in the entire canvas**, including the stepper, which is the
    most-used control in the flow — focus rings come from the token set.

### Copy implying backend behaviour we are not building

- **"…so saving this sends Dana an email today"** implies a daily dedupe, and
  **"Firing now"** implies a continuously-evaluated condition rather than an
  event. The real system emails on *every* qualifying update, which this flow is
  explicitly not changing (§7, bead `cap_ruby-b3a.33`). The "Firing now" pill is
  still accurate as drawn — it describes the condition, not a send — so it
  ships; the "today" clause is reworded to avoid promising a cadence.
- **"They're still running in the background. Refresh to see them."** asserts a
  background evaluator decoupled from the request. Rules are evaluated inline on
  save. Reword.
- **"Nothing you counted was lost"** on a *list-load* error implies a local draft
  store that nothing in the design provides. Reword.

### What the canvas needs that the app doesn't have

- A **delta-based write path**. Today's API takes an absolute `quantity`; the
  design's entire premise is "minus six, save, done", including for typed
  recounts. Sending the computed absolute is the smaller change and keeps the
  existing endpoint honest, but the *client* must own the arithmetic and the
  **server must reject a stale base** — two quartermasters counting the same
  shelf is exactly the scenario the mobile commit bar invites. PR 2 sends both
  the delta and the expected previous quantity, and the API rejects a mismatch.
- **Index-time aggregates**: "Last change 2 days ago by Dana Reyes", the four
  stat counts, and the per-row alert threshold all need the rule and
  most-recent-transaction joins the current `to_json(include: :items)` doesn't
  provide.
- **Empty categories sort last** ("so they never sit between two stocked ones").
- **Rename UI is never drawn** for either items or categories despite living in
  both row menus, and the "set an alert from an item row" drawer — a Decided item
  — is never drawn either.

---

## 10. Decisions

### Settled by the code or the data — building on these

1. `belongs_to :user, -> { with_deleted }`, **required**; update the four
   userless examples in `transaction_spec.rb` (§1).
2. `numericality: { only_integer: true, greater_than_or_equal_to: 0 }`; zero
   stays valid, no backfill needed (§4).
3. Fix `update_item`'s discarded return value and return real JSON errors —
   a prerequisite for #2, not a nicety (§3).
4. Guard the `api/inventory/*` namespace to match `InventoryController` (§2).
5. Category delete refuses while non-empty — the FK already enforces it (§5).

### Taken with the user

6. **Items soft-delete** (`acts_as_paranoid` + a `deleted_at` migration),
   matching `Payment` / `Conflict` / `User`. The item leaves the stock list, its
   transaction history survives intact, and it is recoverable. Refusing to
   delete anything with history was the alternative and would have left 108 of
   132 items permanently undeletable.
7. **Delete permissions mirror each screen's existing rule.** Items and
   categories: admin / coordinator / quartermaster, matching
   `InventoryController`. Email rules: admin / coordinator only, matching
   `EmailRulesController`'s extra guard. Whoever can add and adjust stock can
   also remove it; the email-rule asymmetry is preserved.
8. **Soft-delete overrides the canvas's hard cascade.** The canvas specifies
   *"No soft delete: this isn't critical data, so an item takes its transaction
   history with it"*, with dialog copy to match ("This removes the item, its
   count of 42, and all 3 changes in its history. It can't be undone."). That
   is the one place the canvas reverses its own accountability thesis, and its
   own review flags it as such. **Decision #6 stands and the copy is rewritten**:
   "This removes it from the stock list. Its 3 recorded changes are kept, and an
   admin can restore it."
9. **Stale writes are rejected, not merged.** The mobile commit bar invites two
   quartermasters to count one shelf at once. The client sends the delta *and*
   the quantity it was computed against; a mismatch returns **409** naming the
   current value rather than writing ("Someone else counted this. It's 38 now.
   Retry −6?"). The commit bar holds one pending change, matching the canvas's
   own "one card adjusts at a time" rule.

### Filed as beads rather than built

- Email rules fire on every qualifying update (§7).
