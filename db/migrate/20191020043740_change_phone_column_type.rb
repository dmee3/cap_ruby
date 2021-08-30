# frozen_string_literal: true

class ChangePhoneColumnType < ActiveRecord::Migration[5.2]
  def change
    change_column :users, :phone, :string
  end
end
