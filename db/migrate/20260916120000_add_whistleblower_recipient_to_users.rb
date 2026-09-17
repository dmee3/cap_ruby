# frozen_string_literal: true

# Who can receive a whistleblower report is its own grant, not a role and not a
# season. Deriving it from "admins on the current season" looked obvious and is
# wrong twice over: current_season is cookie-backed, so the pool would follow
# whatever the reporter picked in the season switcher, and the newest season
# routinely has one or two admins, which makes a three-recipient minimum
# unsatisfiable on the one screen where being locked out matters most.
#
# Deliberately not backfilled. Who reads these reports is a decision to make
# person by person, so the pool starts empty and the screen says so.
class AddWhistleblowerRecipientToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :whistleblower_recipient, :boolean, default: false, null: false
  end
end
