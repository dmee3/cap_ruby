# frozen_string_literal: true

# Most items carry transaction history, and a hard delete would take that audit
# trail with it. Soft delete instead, as Payment, Conflict, and User already do.
class AddDeletedAtToInventoryItems < ActiveRecord::Migration[7.2]
  def up
    add_column :inventory_items, :deleted_at, :datetime
    add_index :inventory_items, :deleted_at
  end

  def down
    remove_index :inventory_items, :deleted_at
    remove_column :inventory_items, :deleted_at
  end
end
