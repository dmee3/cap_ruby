# frozen_string_literal: true

class AddInventoryFlagToUsers < ActiveRecord::Migration[6.0]
  def change
    add_column :users, :inventory_access, :boolean, default: false
  end
end
