# frozen_string_literal: true

# Flow 8 makes an item's transaction history visible, and 108 of the 132 items
# carry some. A hard delete would take that audit trail with it, so items are
# soft-deleted instead — the same treatment Payment, Conflict, and User already
# get. The item leaves the stock list, its history survives, and it can be
# restored.
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
