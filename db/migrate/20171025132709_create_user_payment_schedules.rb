class CreateUserPaymentSchedules < ActiveRecord::Migration[5.1]
  def change
    create_table :user_payment_schedules do |t|
      t.belongs_to :user, index: true
      t.belongs_to :payment_schedule, index: true
      t.timestamps
    end
  end
end
