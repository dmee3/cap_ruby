# frozen_string_literal: true

class AddResetKeyToUsers < ActiveRecord::Migration[6.0]
  def change
    add_column :users, :reset_key, :string
  end
end
