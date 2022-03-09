class AddDonationsToFundraisers < ActiveRecord::Migration[6.1]
  def change
    add_reference :calendar_donations, :calendar_fundraiser, index: true
    add_foreign_key :calendar_donations, :calendar_fundraisers
  end
end
