# Flow 12 — Default payment schedules: design review

Canvas: **Flow 12 - Default payment schedules.dc.html** (Claude Design project
`535a10bc-3e9d-4a90-be44-e7e6322ef3d0`), nine artboard groups: 00 Season page card,
01 overview, 02 empty, 03 partly set up, 04 copy, 05 edit one default, 06 move all
dates, 07 link-in from the user form, and a notes artboard.

Issue: `cap_ruby-b3a.25`. Scope: a second card on `/admin/season`, four new admin
screens under `/admin/season/default-schedules`, and one link in the Flow 6 schedule
preview panel.

## What the canvas gets right, confirmed against the code

- **The data model fits.** One row per season × ensemble × section group × vet status ×
  date, amounts in cents (`default_schedule_entries`, built in this branch's first
  commit). The matrix's "union of every combination's dates, '–' where one doesn't pay"
  is exactly what the 2023 import needs: that year Visual paid on different days.
- **Member counts per combination are derivable.** `User.members_for_season`, then
  `ensemble_for`, `section_for` mapped through `DefaultScheduleEntry.section_group_for`,
  and `vet_in?`. No new columns.
- **"N members have no payment schedule"** is the admin dashboard's existing
  missing-schedule rule (a member whose schedule has no entries). It is extracted so the
  dashboard and this flow read one copy rather than two.
- **Music / Visual and Vet / Rookie** throughout, never "Battery". The canvas's note that
  Flow 6 "still says Battery" is about the Flow 6 *canvas*; the shipped code already says
  Music (`ScheduleForecast`). "New member" in Member 360 and the dashboard is a member-type
  label, not a combination name, and stays.
- **+52 weeks** keeps the weekday: Fri 10/17/25 → Fri 10/16/26.
- **Saving a default never rewrites a member's schedule.** True by construction: defaults
  are only read when a schedule is created (`ensure_payment_schedules_for_user`) or reset
  from Member 360 (`Admin::ScheduleDefault.apply`).

## Assumptions the code doesn't support, and what was decided

| # | Canvas | Reality | Decision |
|---|---|---|---|
| 1 | Notes: "Apply to members with an empty schedule" — flagged as an open call, not designed | The 42 empty 2027 schedules are the actual problem; new defaults only help people added afterwards. `PaymentScheduleService.populate_from_default` already refuses a schedule with any entries, so the safe version is nearly free. | **Built.** One action on the overview, shown when defaults exist and empty schedules remain. Fills only schedules with zero entries. |
| 2 | 4b/4c: when the target season already has defaults, a skip-or-**replace** radio; replace goes through a typed-year confirm (labelled §4.28 — actually §4.34, destructive confirm) | §4.34 has never been built (`cap_ruby-b3a.21`). | **Cut.** Copy only creates missing combinations; an existing one is changed by editing it. Filed as `cap_ruby-b3a.43`. |
| 3 | 5a: "last changed 9/28/26 by Dana Reyes"; 4c lists individual past edits | Nothing records who edited a default, and there is no edit history. | **Date only**: "Last changed 9/28/26" from the newest `updated_at` among the combination's rows. |
| 4 | 5a rail: "11 members in 2027 →" | `/admin/users` has no ensemble / section-group / vet filter. | **Plain count, no link.** |
| 5 | 5c: "Started blank" chip | Nothing stores how a combination came to be empty. | Dropped; an empty combination is simply "not set up". |
| 6 | 07: the panel "re-checks when you come back" | The user form fetches the forecast on field change only. | Refetch on window focus while the panel is in its no-default state. |

## Notes

- A combination with no rows is "not set up". "Start blank" therefore creates nothing:
  it opens the editor for the first combination, empty.
- Members with no ensemble yet don't belong to any combination; the overview's "cover N of
  42" counts only those who do.
