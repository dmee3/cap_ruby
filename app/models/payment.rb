class Payment < ApplicationRecord
  acts_as_paranoid
  belongs_to :user
  belongs_to :payment_type
end
