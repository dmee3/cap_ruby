class Calendar::Donation < ApplicationRecord
  belongs_to :user
  validates :amount, presence: true
end
