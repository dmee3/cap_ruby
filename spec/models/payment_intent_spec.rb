# frozen_string_literal: true

# == Schema Information
#
# Table name: payment_intents
#
#  id           :integer          not null, primary key
#  amount       :integer
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  season_id    :integer
#  stripe_pi_id :string
#  user_id      :integer
#
# Indexes
#
#  index_payment_intents_on_season_id  (season_id)
#  index_payment_intents_on_user_id    (user_id)
#
require 'rails_helper'

RSpec.describe PaymentIntent, type: :model do
  pending "add some examples to (or delete) #{__FILE__}"
end
