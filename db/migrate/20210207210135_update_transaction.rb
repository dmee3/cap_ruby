# frozen_string_literal: true

class UpdateTransaction < ActiveRecord::Migration[6.0]
  def change
    change_table :inventory_transactions do |t|
      t.belongs_to :inventory_item
    end

    drop_table :inventory_items_transactions
  end
end
