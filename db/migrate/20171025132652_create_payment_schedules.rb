# frozen_string_literal: true

class CreatePaymentSchedules < ActiveRecord::Migration[5.1]
  def change
    create_table :payment_schedules do |t|
      t.belongs_to :user
    end
  end
end
