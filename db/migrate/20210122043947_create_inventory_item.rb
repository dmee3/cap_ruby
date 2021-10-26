# frozen_string_literal: true

class CreateInventoryItem < ActiveRecord::Migration[6.0]
  def change
    create_table :inventory_items do |t|
      t.string :name
      t.integer :quantity
      t.references :inventory_categories, index: true, foreign_key: true
      t.timestamps
    end
  end
end
