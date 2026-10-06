# frozen_string_literal: true

# The status the member was last emailed about, so a decision that is undone
# and remade lands as one email, and a decision put back to what the member
# already knew lands as none.
#
# Backfilled to the current status: every decision made before this column
# existed was never emailed, and the first unrelated edit to one of those rows
# must not belatedly announce it.
class AddNotifiedStatusIdToConflicts < ActiveRecord::Migration[7.2]
  def up
    add_column :conflicts, :notified_status_id, :integer
    execute('UPDATE conflicts SET notified_status_id = status_id')
  end

  def down
    remove_column :conflicts, :notified_status_id
  end
end
