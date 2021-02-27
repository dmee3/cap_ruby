# == Schema Information
#
# Table name: payments
#
#  id              :integer          not null, primary key
#  amount          :integer
#  date_paid       :date
#  deleted_at      :datetime
#  notes           :string
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  payment_type_id :integer
#  season_id       :integer
#  user_id         :integer
#
# Indexes
#
#  index_payments_on_deleted_at       (deleted_at)
#  index_payments_on_payment_type_id  (payment_type_id)
#  index_payments_on_season_id        (season_id)
#  index_payments_on_user_id          (user_id)
#
require 'rails_helper'

RSpec.describe Payment, type: :model do
  context 'validations' do
    subject { create(:payment) }

    it { is_expected.to be_valid }

    it 'requires an amount' do
      subject.amount = nil
      expect(subject).to_not be_valid
    end

    it 'requires a date paid' do
      subject.date_paid = nil
      expect(subject).to_not be_valid
    end

    it 'requires a payment type' do
      subject.payment_type_id = nil
      expect(subject).to_not be_valid
    end

    it 'requires a season' do
      subject.season_id = nil
      expect(subject).to_not be_valid
    end

    it 'requires a user' do
      subject.user_id = nil
      expect(subject).to_not be_valid
    end
  end

  context 'scopes' do
    let!(:season) { create(:season, year: '2019') }
    let!(:last_season) { create(:season, year: '2018') }
    let!(:current_payment) { create(:payment, season: season) }
    let!(:old_payment) { create(:payment, season: last_season) }

    context 'for_season' do
      it 'returns payments from the given season' do
        expect(Payment.for_season(season.id)).to eq([current_payment])
      end
    end
  end
end
