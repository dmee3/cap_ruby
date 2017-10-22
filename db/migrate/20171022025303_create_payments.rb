class CreatePayments < ActiveRecord::Migration[5.1]
  def change
    create_table :payments do |t|
      t.belongs_to :user
      t.belongs_to :payment_type

      t.integer :amount
      t.date :date_paid
      t.string :notes

      t.timestamps
    end
  end
end
