# frozen_string_literal: true

class AddColumnsToCalendarDonations < ActiveRecord::Migration[6.0]
  def change
    change_table :calendar_donations do |t|
      t.string :notes
      t.integer :donation_date
      t.timestamps
    end
  end
end
