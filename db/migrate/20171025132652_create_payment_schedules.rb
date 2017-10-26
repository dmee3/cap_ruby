class CreatePaymentSchedules < ActiveRecord::Migration[5.1]
  def change
    create_table :payment_schedules do |t|
      t.boolean :default
    end
  end
end
