require 'rails_helper'

RSpec.describe Payment, type: :model do
  context 'validations' do
    subject { build(:payment) }

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
