# frozen_string_literal: true

class RemoveRole < ActiveRecord::Migration[6.1]
  def change
    remove_column :users, :role_id
    drop_table :roles
  end
end
