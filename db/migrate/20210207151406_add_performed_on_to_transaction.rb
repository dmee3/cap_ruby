# frozen_string_literal: true

class AddPerformedOnToTransaction < ActiveRecord::Migration[6.0]
  def change
    add_column :inventory_transactions, :performed_on, :date
  end
end
