# frozen_string_literal: true

class CreatePaymentIntents < ActiveRecord::Migration[6.1]
  def change
    create_table :payment_intents do |t|
      t.integer :amount
      t.string :stripe_pi_id
      t.references :user
      t.references :season

      t.timestamps
    end
  end
end
