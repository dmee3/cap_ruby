class CreatePaymentScheduleEntries < ActiveRecord::Migration[5.1]
  def change
    create_table :payment_schedule_entries do |t|
      t.belongs_to :payment_schedule, index: true

      t.integer :amount
      t.date :pay_date
    end
  end
end
