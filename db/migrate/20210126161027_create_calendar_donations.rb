class CreateCalendarDonations < ActiveRecord::Migration[6.0]
  def change
    create_table :calendar_donations do |t|
      t.belongs_to :user, index: true
      t.integer :amount
    end
  end
end
