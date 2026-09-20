# frozen_string_literal: true

# Deleting a user soft-deletes the user, their payments and their conflicts, but
# hard-destroyed the payment schedule and its entries — so restoring the user
# left them owing nothing, with no record of what they had been billed.
class AddDeletedAtToPaymentSchedules < ActiveRecord::Migration[7.2]
  def up
    add_column :payment_schedules, :deleted_at, :datetime
    add_index :payment_schedules, :deleted_at
    add_column :payment_schedule_entries, :deleted_at, :datetime
    add_index :payment_schedule_entries, :deleted_at
  end

  def down
    remove_index :payment_schedule_entries, :deleted_at
    remove_column :payment_schedule_entries, :deleted_at
    remove_index :payment_schedules, :deleted_at
    remove_column :payment_schedules, :deleted_at
  end
end
