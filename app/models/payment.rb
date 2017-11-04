class Payment < ApplicationRecord
  acts_as_paranoid
  belongs_to :user
  belongs_to :payment_type

  validates :amount, presence: true
  validates :user_id, presence: true
  validates :payment_type_id, presence: true
end
