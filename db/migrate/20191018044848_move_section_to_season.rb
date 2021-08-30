# frozen_string_literal: true

class MoveSectionToSeason < ActiveRecord::Migration[5.2]
  def change
    add_column :seasons_users, :section, :string
    remove_column :users, :section
  end
end
