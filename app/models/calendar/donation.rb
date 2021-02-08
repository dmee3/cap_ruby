# == Schema Information
#
# Table name: calendar_donations
#
#  id            :integer          not null, primary key
#  amount        :integer
#  donation_date :integer
#  donor_name    :string
#  notes         :string
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  user_id       :integer
#
# Indexes
#
#  index_calendar_donations_on_user_id  (user_id)
#
class Calendar::Donation < ApplicationRecord
  belongs_to :user
  validates :amount, presence: true
end
