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
  context 'validations' do
    subject { create(:payment_intent) }

    it { is_expected.to be_valid }

    it 'has an amount' do
      expect(subject.amount).to be_present
    end

    it 'has a stripe_pi_id' do
      expect(subject.stripe_pi_id).to be_present
    end
  end

  context 'associations' do
    it 'belongs to user' do
      expect(subject).to respond_to(:user)
    end
  end
end
