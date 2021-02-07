class UpdateInventoryTables < ActiveRecord::Migration[6.0]
  def change
    rename_column :inventory_items, :inventory_categories_id, :inventory_category_id

    rename_column :inventory_items_transactions, :inventory_transactions_id, :inventory_transaction_id
    rename_column :inventory_items_transactions, :inventory_items_id, :inventory_item_id
  end
end
