# frozen_string_literal: true

class UpdateTransactionAgain < ActiveRecord::Migration[6.0]
  def change
    add_column :inventory_transactions, :previous_quantity, :integer
    add_column :inventory_transactions, :change, :integer
  end
end
