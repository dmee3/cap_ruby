class PaymentType < ApplicationRecord
  has_many :payments
end
