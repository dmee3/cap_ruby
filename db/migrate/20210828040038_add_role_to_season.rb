# frozen_string_literal: true

class AddRoleToSeason < ActiveRecord::Migration[6.1]
  def change
    add_column :seasons_users, :role, :string, default: 'member'
  end
end
