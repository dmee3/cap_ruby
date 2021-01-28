class AddDonorNameToCalendarDonations < ActiveRecord::Migration[6.0]
  def change
    add_column :calendar_donations, :donor_name, :string
  end
end
