class CreateInventoryTransaction < ActiveRecord::Migration[6.0]
  def change
    create_table :inventory_transactions do |t|
      t.timestamps
      t.belongs_to :user, index: true
    end

    create_table :inventory_items_transactions do |t|
      t.belongs_to :inventory_transactions, index: { name: 'index_inv_items_trans_on_inv_trans_id' }
      t.belongs_to :inventory_items, index: { name: 'index_inv_items_trans_on_inv_items_id' }
      t.timestamps
    end
  end
end
