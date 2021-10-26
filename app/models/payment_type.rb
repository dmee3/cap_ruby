# frozen_string_literal: true

# == Schema Information
#
# Table name: payment_types
#
#  id         :integer          not null, primary key
#  name       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class PaymentType < ApplicationRecord
  has_many :payments

  class << self
    def cash
      find_by_name('Cash')
    end

    def stripe
      find_by_name('Stripe')
    end

    def check
      find_by_name('Check')
    end

    def pos
      find_by_name('Square - Pos')
    end

    def cash_app
      find_by_name('Square - Cash App')
    end

    def other
      find_by_name('Other')
    end

    def venmo
      find_by_name('Venmo')
    end
  end
end
